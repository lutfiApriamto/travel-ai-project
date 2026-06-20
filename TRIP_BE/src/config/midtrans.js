import Midtrans from 'midtrans-client';

const config = {
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey:    process.env.MIDTRANS_SERVER_KEY,
  clientKey:    process.env.MIDTRANS_CLIENT_KEY,
};

// Snap: membuat payment token untuk Midtrans popup/redirect di frontend
export const snap = new Midtrans.Snap(config);

// CoreApi: server-to-server calls, digunakan untuk cek status transaksi
export const core = new Midtrans.CoreApi(config);

export default snap;
