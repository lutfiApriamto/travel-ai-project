import { emailBase, detailRow, ctaButton, statusBadge } from './emailBase.js';

export const productCancelledTemplate = ({ name, productName, orderCode }) => ({
  subject: `Pembaruan Penting: Paket ${productName} Telah Dibatalkan`,

  text: `Halo ${name},\n\nKami ingin menyampaikan bahwa paket perjalanan "${productName}" (pesanan ${orderCode}) telah dibatalkan oleh admin.\n\nKami memohon maaf atas ketidaknyamanan ini. Tim kami akan segera menghubungi kamu terkait proses selanjutnya.\n\nUntuk informasi lebih lanjut, silakan buka aplikasi Travia dan hubungi tim kami.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     `Paket ${productName} Dibatalkan`,
    preheader: `Paket perjalanan ${productName} (${orderCode}) yang kamu pesan telah dibatalkan. Kami mohon maaf atas ketidaknyamanan ini.`,
    body: `
      ${statusBadge({ text: '! Paket Perjalanan Dibatalkan', type: 'warning' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Paket Perjalananmu Dibatalkan
      </h1>
      <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, kami ingin menyampaikan bahwa
        paket perjalanan yang kamu pesan telah dibatalkan oleh admin. Kami memohon maaf atas
        ketidaknyamanan ini.
      </p>

      <!-- Detail Box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;border-collapse:collapse;margin-bottom:24px;">
        ${detailRow({ label: 'Paket Perjalanan', value: productName })}
        ${detailRow({ label: 'Kode Pesanan', value: orderCode, isLast: true })}
      </table>

      <!-- Info Refund -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FFFAEB;border-radius:10px;border:1px solid #FEC84B;border-collapse:collapse;margin-bottom:8px;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#B54708;">
              Apa yang terjadi selanjutnya?
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#B54708;line-height:1.7;">
              Tim kami akan segera menghubungi kamu mengenai proses pengembalian dana.
              Kamu juga bisa mengajukan refund secara mandiri melalui aplikasi Travia.
            </p>
          </td>
        </tr>
      </table>

      ${ctaButton({ text: 'Lihat Pesanan Saya', href: process.env.CLIENT_URL || '#' })}
    `,
  }),
});
