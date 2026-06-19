import Midtrans from 'midtrans-client';

// Snap: digunakan untuk membuat payment token yang di-render oleh Midtrans.js di frontend.
// isProduction: false → selalu gunakan Sandbox environment untuk MVP ini.
// MIDTRANS_IS_PRODUCTION di .env dibiarkan false — tidak berubah sampai go-live.
const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey:    process.env.MIDTRANS_SERVER_KEY,
  clientKey:    process.env.MIDTRANS_CLIENT_KEY,
});

export default snap;
