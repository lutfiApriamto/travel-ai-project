import 'dotenv/config';
import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import compression   from 'compression';
import morgan        from 'morgan';
import cookieParser  from 'cookie-parser';
import connectDB     from './config/db.js';
import { sanitizer } from './middlewares/sanitizer.middleware.js';
import notFound      from './middlewares/notFound.middleware.js';
import errorHandler  from './middlewares/errorHandler.js';

// ─── Module Routes (tambahkan seiring module dibuat) ─────────────────────────
import authRoutes        from './modules/auth/auth.routes.js';
// import userRoutes        from './modules/user/user.routes.js';
import wilayahRoutes     from './modules/wilayah/wilayah.routes.js';
import categoryRoutes    from './modules/category/category.routes.js';
import typeRoutes        from './modules/type/type.routes.js';
import tagRoutes         from './modules/tag/tag.routes.js';
import bannerRoutes      from './modules/banner/banner.routes.js';
import uploadRoutes      from './modules/upload/upload.routes.js';
// import productRoutes     from './modules/product/product.routes.js';
// import wishlistRoutes    from './modules/wishlist/wishlist.routes.js';
// import cartRoutes        from './modules/cart/cart.routes.js';
// import orderRoutes       from './modules/order/order.routes.js';
// import paymentRoutes     from './modules/payment/payment.routes.js';
// import ticketRoutes      from './modules/ticket/ticket.routes.js';
// import refundRoutes      from './modules/refund/refund.routes.js';
// import financeRoutes     from './modules/finance/finance.routes.js';
// import notificationRoutes from './modules/notification/notification.routes.js';
// import adminRoutes       from './modules/admin/admin.routes.js';
// import aiRoutes          from './modules/ai/ai.routes.js';

const app = express();

// ─── Global Middlewares ───────────────────────────────────────────────────────

app.use(helmet());
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/api', cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sanitizer);

// ─── Database (per-request connection untuk serverless Vercel) ────────────────

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB] Koneksi gagal:', err.message);
    next(new Error('Koneksi database gagal'));
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',          authRoutes);
// app.use('/api/users',         userRoutes);
app.use('/api/wilayah',       wilayahRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/types',         typeRoutes);
app.use('/api/tags',          tagRoutes);
app.use('/api/banners',       bannerRoutes);
app.use('/api/upload',        uploadRoutes);
// app.use('/api/products',      productRoutes);
// app.use('/api/wishlist',      wishlistRoutes);
// app.use('/api/cart',          cartRoutes);
// app.use('/api/orders',        orderRoutes);
// app.use('/api/payment',       paymentRoutes);
// Catatan payment module:
//   POST /api/payment/create   → auth middleware (user login)
//   POST /api/payment/webhook  → verifyMidtransWebhook middleware (bukan JWT)
//   CORS bukan masalah untuk webhook — Midtrans hit dari server mereka (bukan browser),
//   sehingga cors() tidak memblokir meskipun origin tidak cocok dengan CLIENT_URL.
// app.use('/api/tickets',       ticketRoutes);
// app.use('/api/refunds',       refundRoutes);
// app.use('/api/finance',       financeRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/admin',         adminRoutes);
// app.use('/api/ai',            aiRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

export default app;
