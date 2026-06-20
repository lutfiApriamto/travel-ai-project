import { formatRupiah }                     from '../utils/currencyHelper.js';
import { emailBase, detailRow, statusBadge } from './emailBase.js';

export const refundApprovedTemplate = ({ name, orderCode, productName, refundAmount, refundPercentage }) => ({
  subject: `Refund Disetujui — ${formatRupiah(refundAmount)} Akan Dikembalikan`,

  text: `Halo ${name},\n\nPengajuan refund untuk pesanan ${orderCode} telah disetujui.\n\nDetail Refund:\nProduk        : ${productName}\nPersentase    : ${refundPercentage}%\nJumlah Refund : ${formatRupiah(refundAmount)}\n\nDana akan dikembalikan melalui metode pembayaran asal dalam 3–7 hari kerja.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     `Refund Disetujui — ${orderCode}`,
    preheader: `Refund sebesar ${formatRupiah(refundAmount)} untuk pesanan ${orderCode} telah disetujui.`,
    body: `
      ${statusBadge({ text: '✓ Refund Disetujui', type: 'success' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Pengajuan Refund Disetujui
      </h1>
      <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, pengajuan pembatalan dan refund kamu
        untuk pesanan di bawah ini telah kami setujui. Dana akan segera diproses.
      </p>

      <!-- Detail Box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;border-collapse:collapse;margin-bottom:24px;">
        ${detailRow({ label: 'Produk Perjalanan', value: productName })}
        ${detailRow({ label: 'Kode Pesanan', value: orderCode })}
        ${detailRow({ label: 'Persentase Refund', value: `${refundPercentage}%` })}
        ${detailRow({ label: 'Jumlah yang Dikembalikan', value: formatRupiah(refundAmount), isLast: true, highlight: true })}
      </table>

      <!-- Info Proses -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#ECFDF3;border-radius:10px;border:1px solid #6CE9A6;border-collapse:collapse;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#027A48;line-height:1.7;">
              Dana akan dikembalikan ke metode pembayaran asal kamu dalam <strong>3–7 hari kerja</strong>.
              Jika lebih dari 7 hari belum diterima, hubungi tim kami melalui aplikasi Travia.
            </p>
          </td>
        </tr>
      </table>
    `,
  }),
});
