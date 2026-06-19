import cron    from 'node-cron';
import Product from '../models/product.model.js';

// Jalankan setiap hari jam 00:00 WIB (Asia/Jakarta = UTC+7).
// Cari semua produk berstatus 'active' atau 'full' yang tanggal
// keberangkatannya sudah lewat, lalu ubah status → 'expired'.
//
// Catatan produksi: Vercel Serverless tidak mendukung long-running process.
// Job ini hanya aktif saat NODE_ENV !== 'production' (development/local).
// Untuk produksi, gunakan Vercel Cron Jobs yang memanggil endpoint dedicated.
const startExpireJob = () => {
  cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await Product.updateMany(
          {
            status:        { $in: ['active', 'full'] },
            departureDate: { $lt: today },
          },
          { $set: { status: 'expired' } }
        );

        if (result.modifiedCount > 0) {
          console.log(`[CRON] ${result.modifiedCount} produk diubah ke status 'expired'`);
        }
      } catch (err) {
        console.error('[CRON] Gagal menjalankan expire job:', err.message);
      }
    },
    { timezone: 'Asia/Jakarta' }
  );

  console.log('[CRON] Expire products job aktif — jalan setiap 00:00 WIB');
};

export default startExpireJob;
