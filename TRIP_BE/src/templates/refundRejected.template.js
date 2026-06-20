import { emailBase, detailRow, statusBadge, ctaButton } from './emailBase.js';

export const refundRejectedTemplate = ({ name, orderCode, productName, rejectionReason }) => ({
  subject: `Pengajuan Refund ${orderCode} Tidak Dapat Diproses`,

  text: `Halo ${name},\n\nMohon maaf, pengajuan refund untuk pesanan ${orderCode} tidak dapat kami setujui.\n\nDetail:\nProduk : ${productName}\nAlasan : ${rejectionReason}\n\nPesanan kamu tetap aktif dan berjalan sesuai jadwal. Jika ada pertanyaan, silakan hubungi tim kami melalui aplikasi Travia.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     `Pengajuan Refund Ditolak — ${orderCode}`,
    preheader: `Pengajuan refund untuk pesanan ${orderCode} tidak dapat disetujui. Pesananmu tetap aktif.`,
    body: `
      ${statusBadge({ text: '✕ Pengajuan Tidak Disetujui', type: 'danger' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Refund Tidak Dapat Diproses
      </h1>
      <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, mohon maaf kami tidak dapat menyetujui
        pengajuan refund kamu kali ini. Berikut detail dan alasannya.
      </p>

      <!-- Detail Box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;border-collapse:collapse;margin-bottom:24px;">
        ${detailRow({ label: 'Produk Perjalanan', value: productName })}
        ${detailRow({ label: 'Kode Pesanan', value: orderCode })}
        ${detailRow({ label: 'Alasan Penolakan', value: rejectionReason, isLast: true })}
      </table>

      <!-- Info Pesanan Tetap Aktif -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;border-collapse:collapse;margin-bottom:8px;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1A1510;">
              Pesanan kamu tetap berjalan
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3D3D3D;line-height:1.7;">
              Pembatalan tidak diproses, sehingga pesanan dan e-tiket kamu masih aktif sesuai jadwal keberangkatan.
              Jika kamu ingin mendiskusikan lebih lanjut, hubungi tim kami melalui aplikasi.
            </p>
          </td>
        </tr>
      </table>

      ${ctaButton({ text: 'Lihat Detail Pesanan', href: process.env.CLIENT_URL || '#' })}
    `,
  }),
});
