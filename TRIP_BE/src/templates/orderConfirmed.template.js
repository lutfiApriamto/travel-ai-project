import { formatRupiah }                     from '../utils/currencyHelper.js';
import { emailBase, detailRow, ctaButton, statusBadge } from './emailBase.js';

export const orderConfirmedTemplate = ({ name, orderCode, productName, totalPrice }) => ({
  subject: `Pembayaran Berhasil — Pesanan ${orderCode}`,

  text: `Halo ${name},\n\nPembayaran untuk pesanan ${orderCode} berhasil dikonfirmasi!\n\nDetail Pesanan:\nProduk : ${productName}\nTotal  : ${formatRupiah(totalPrice)}\n\nE-tiket perjalanan kamu sudah tersedia. Silakan buka aplikasi Travia untuk melihat dan mengunduh e-tiket.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     `Pembayaran Berhasil — ${orderCode}`,
    preheader: `Pembayaran ${orderCode} berhasil! E-tiket kamu sudah siap diunduh.`,
    body: `
      ${statusBadge({ text: '✓ Pembayaran Dikonfirmasi', type: 'success' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        E-Tiket Kamu Sudah Siap!
      </h1>
      <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, pembayaran kamu sudah kami terima.
        E-tiket perjalanan sudah siap dan bisa langsung kamu unduh dari aplikasi Travia.
      </p>

      <!-- Detail Box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;border-collapse:collapse;margin-bottom:8px;">
        ${detailRow({ label: 'Produk Perjalanan', value: productName })}
        ${detailRow({ label: 'Kode Pesanan', value: orderCode, highlight: true })}
        ${detailRow({ label: 'Total Pembayaran', value: formatRupiah(totalPrice), isLast: true, highlight: true })}
      </table>

      ${ctaButton({ text: 'Lihat E-Tiket Saya', href: process.env.CLIENT_URL || '#' })}

      <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8B7355;line-height:1.7;text-align:center;">
        Tidak bisa klik tombol? Buka aplikasi Travia dan masuk ke menu <em>Tiket Saya</em>.
      </p>
    `,
  }),
});
