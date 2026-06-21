import Order    from '../../models/order.model.js';
import Product  from '../../models/product.model.js';
import Ticket   from '../../models/ticket.model.js';
import Finance  from '../../models/finance.model.js';
import User     from '../../models/user.model.js';
import { snap, core }              from '../../config/midtrans.js';
import { generateTicketCode }      from '../../utils/generateTicketCode.js';
import { createNotification }      from '../../utils/notificationHelper.js';
import { sendMail }                from '../../config/mailer.js';
import { orderConfirmedTemplate }  from '../../templates/orderConfirmed.template.js';

// ─── Create Payment ───────────────────────────────────────────────────────────

export const createPayment = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const err = new Error('Order tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (order.userId.toString() !== userId.toString()) {
    const err = new Error('Anda tidak memiliki akses ke order ini');
    err.statusCode = 403;
    throw err;
  }

  if (order.status !== 'pending_payment') {
    const err = new Error('Hanya order dengan status pending_payment yang bisa dibayar');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).select('name email phone');

  // midtransOrderId harus unik di Midtrans — tambahkan timestamp untuk re-payment
  const midtransOrderId = `${order.orderCode}-${Date.now()}`;

  // Bangun item_details — total harus sama persis dengan gross_amount
  const itemDetails = [
    {
      id:       order.productId.toString(),
      price:    order.productSnapshot.price,
      quantity: order.participants,
      name:     order.productSnapshot.name.substring(0, 50),
    },
    ...order.addOns.map((addon, idx) => ({
      id:       `addon-${idx}`,
      price:    addon.price,
      quantity: 1,
      name:     addon.name.substring(0, 50),
    })),
  ];

  const parameter = {
    transaction_details: {
      order_id:     midtransOrderId,
      gross_amount: order.totalPrice,
    },
    customer_details: {
      first_name: user.name,
      email:      user.email,
      phone:      user.phone || '',
    },
    item_details: itemDetails,
  };

  const transaction = await snap.createTransaction(parameter);

  // Simpan token dan URL ke order (overwrite jika generate ulang)
  order.midtransOrderId = midtransOrderId;
  order.paymentToken    = transaction.token;
  order.paymentUrl      = transaction.redirect_url;
  await order.save();

  return {
    snapToken:  transaction.token,
    paymentUrl: transaction.redirect_url,
  };
};

// ─── Handle Webhook ───────────────────────────────────────────────────────────

export const handleWebhook = async (body) => {
  const { order_id, transaction_status, fraud_status, payment_type } = body;

  const order = await Order.findOne({ midtransOrderId: order_id });
  if (!order) return; // order tidak dikenal, abaikan

  // Idempotency — jika sudah diproses, abaikan webhook duplikat
  if (order.status === 'paid') return;

  const isSuccess =
    transaction_status === 'settlement' ||
    (transaction_status === 'capture' && fraud_status === 'accept');

  const isExpired = transaction_status === 'expire';

  if (isSuccess) {
    // 1. Update order
    order.status        = 'paid';
    order.paidAt        = new Date();
    order.paymentMethod = payment_type || null;
    await order.save();

    // 2. Update product: bookedSlots +1, soldCount +1, cek full
    const updatedProduct = await Product.findByIdAndUpdate(
      order.productId,
      { $inc: { bookedSlots: 1, soldCount: 1 } },
      { new: true }
    );

    if (updatedProduct && updatedProduct.status === 'active' &&
        updatedProduct.bookedSlots >= updatedProduct.quota) {
      await Product.findByIdAndUpdate(order.productId, { status: 'full' });
    }

    // 3. Generate e-tiket
    await Ticket.create({
      ticketCode:      generateTicketCode(),
      orderId:         order._id,
      userId:          order.userId,
      productId:       order.productId,
      productSnapshot: order.productSnapshot,
      participants:    order.participants,
      totalPrice:      order.totalPrice,
    });

    // 4. Catat pemasukan di finance
    const lastFinance = await Finance.findOne().sort({ createdAt: -1 }).lean();
    const prevBalance = lastFinance?.balanceAfter ?? 0;
    await Finance.create({
      type:         'income',
      category:     'order',
      amount:       order.totalPrice,
      description:  `Pembayaran order ${order.orderCode}`,
      relatedId:    order._id,
      relatedModel: 'Order',
      balanceAfter: prevBalance + order.totalPrice,
    });

    // 5. Email + in-app notification
    const user = await User.findById(order.userId).select('name email');
    if (user) {
      const { subject, text, html } = orderConfirmedTemplate({
        name:        user.name,
        orderCode:   order.orderCode,
        productName: order.productSnapshot.name,
        totalPrice:  order.totalPrice,
      });
      await sendMail({ to: user.email, subject, text, html }).catch(() => {});

      await createNotification({
        userId:    order.userId,
        title:     'Pembayaran Berhasil',
        message:   `Pesanan ${order.orderCode} untuk ${order.productSnapshot.name} telah dikonfirmasi. E-tiket sudah tersedia.`,
        type:      'order_confirmed',
        relatedId: order._id,
      }).catch(() => {});
    }
  }

  if (isExpired) {
    order.status = 'cancelled';
    await order.save();
  }

  // cancel / deny → biarkan pending, user bisa generate token baru dan coba bayar ulang
};

// ─── Check Status ─────────────────────────────────────────────────────────────
// Selain mengecek status, juga auto-sync ke DB jika Midtrans sudah sukses
// tapi webhook belum diterima (misal backend di localhost saat development).

export const checkStatus = async (orderId, user) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const err = new Error('Order tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'admin' && order.userId.toString() !== user._id.toString()) {
    const err = new Error('Anda tidak memiliki akses ke order ini');
    err.statusCode = 403;
    throw err;
  }

  if (!order.midtransOrderId) {
    return { orderStatus: order.status, midtransStatus: null, message: 'Pembayaran belum diinisiasi' };
  }

  const midtransData = await core.transaction.status(order.midtransOrderId);
  const { transaction_status, fraud_status, payment_type } = midtransData;

  // Auto-sync: jika Midtrans sudah sukses tapi DB masih pending (webhook belum diterima)
  if (order.status === 'pending_payment') {
    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      try {
        await handleWebhook({
          order_id:           order.midtransOrderId,
          transaction_status,
          fraud_status,
          payment_type,
        });
      } catch (syncErr) {
        // Jangan lempar error — tetap return status walau sync gagal
        console.error('[Payment] Auto-sync gagal:', syncErr.message);
      }
    }
  }

  // Reload order untuk mendapatkan status terbaru setelah sync
  const updated = await Order.findById(orderId).lean();

  return {
    orderStatus:    updated.status,
    midtransStatus: transaction_status,
    paymentMethod:  payment_type || null,
    fraudStatus:    fraud_status || null,
  };
};
