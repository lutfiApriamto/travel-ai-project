import { Router }              from 'express';
import auth                    from '../../middlewares/auth.middleware.js';
import verifyMidtransWebhook   from '../../middlewares/verifyMidtransWebhook.middleware.js';
import * as ctrl               from './payment.controller.js';

const router = Router();

// User — buat payment token untuk order milik sendiri
router.post('/create/:orderId', auth, ctrl.createPayment);

// Webhook — dipanggil oleh server Midtrans (bukan user/browser)
// Tidak pakai JWT — pakai verifyMidtransWebhook (SHA512 signature check)
// CORS tidak bermasalah — request dari server Midtrans, bukan browser
router.post('/webhook', verifyMidtransWebhook, ctrl.handleWebhook);

// User & Admin — cek status pembayaran real-time dari Midtrans
router.get('/status/:orderId', auth, ctrl.checkStatus);

export default router;
