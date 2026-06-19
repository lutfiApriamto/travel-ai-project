import crypto    from 'crypto';
import { sendError } from '../utils/apiResponse.js';

// Verifikasi bahwa request webhook benar-benar berasal dari server Midtrans.
// Midtrans menyertakan signature_key di payload dengan formula:
//   SHA512(order_id + status_code + gross_amount + server_key)
// Jika signature tidak cocok → tolak 403, jangan proses apapun.
// Middleware ini TIDAK menggunakan JWT — endpoint webhook dipanggil server Midtrans, bukan user.
const verifyMidtransWebhook = (req, res, next) => {
  const { order_id, status_code, gross_amount, signature_key } = req.body;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return sendError(res, 'Payload webhook tidak lengkap', 400);
  }

  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  if (signature_key !== expectedSignature) {
    return sendError(res, 'Signature webhook tidak valid', 403);
  }

  next();
};

export default verifyMidtransWebhook;
