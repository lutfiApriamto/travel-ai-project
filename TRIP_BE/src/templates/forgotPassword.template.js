import { emailBase, ctaButton, statusBadge } from './emailBase.js';

export const forgotPasswordTemplate = ({ name, resetUrl }) => ({
  subject: 'Reset Password Akun Travia Kamu',

  text: `Halo ${name},\n\nKami menerima permintaan reset password untuk akun Travia kamu.\n\nKlik link berikut untuk membuat password baru:\n${resetUrl}\n\nLink ini hanya berlaku selama 1 jam.\n\nJika kamu tidak meminta reset password, abaikan email ini — akun kamu tetap aman.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     'Reset Password Travia',
    preheader: 'Ada permintaan reset password untuk akunmu. Link berlaku 1 jam.',
    body: `
      ${statusBadge({ text: '🔑 Permintaan Reset Password', type: 'warning' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Reset Password
      </h1>
      <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, kami menerima permintaan untuk mereset
        password akun Travia kamu. Klik tombol di bawah untuk membuat password baru.
      </p>

      ${ctaButton({ text: 'Reset Password Sekarang', href: resetUrl })}

      <!-- Peringatan Waktu -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FFFAEB;border-radius:10px;border:1px solid #FEC84B;border-collapse:collapse;margin-top:24px;">
        <tr>
          <td style="padding:16px 24px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#B54708;line-height:1.7;">
              ⏱ Link reset password hanya berlaku selama <strong>1 jam</strong> sejak email ini dikirim.
              Setelah itu, kamu perlu mengajukan permintaan reset ulang.
            </p>
          </td>
        </tr>
      </table>

      <!-- Jika Bukan Kamu -->
      <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8B7355;line-height:1.7;text-align:center;">
        Tidak merasa meminta reset password? Abaikan email ini &mdash; akun kamu tetap aman.<br>
        Tidak ada perubahan yang terjadi jika link tidak diklik.
      </p>
    `,
  }),
});
