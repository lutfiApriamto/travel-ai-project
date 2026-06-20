import { emailBase, statusBadge } from './emailBase.js';

export const resetPasswordTemplate = ({ name }) => ({
  subject: 'Password Akun Travia Berhasil Direset',

  text: `Halo ${name},\n\nPassword akun Travia kamu telah berhasil direset dan diubah.\n\nJika kamu tidak melakukan perubahan ini, segera hubungi tim kami melalui aplikasi Travia.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     'Password Berhasil Direset',
    preheader: 'Password akun Travia kamu berhasil direset. Sekarang kamu bisa login dengan password baru.',
    body: `
      ${statusBadge({ text: '✓ Password Berhasil Diubah', type: 'success' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Password Baru Sudah Aktif
      </h1>
      <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, password akun Travia kamu telah berhasil
        direset. Kamu sekarang bisa login menggunakan password baru yang sudah kamu buat.
      </p>

      <!-- Checklist Keamanan -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#1A1510;">Tips keamanan akun:</p>
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3D3D3D;line-height:1.6;">✓ &nbsp;Gunakan password yang kuat dan unik</p>
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3D3D3D;line-height:1.6;">✓ &nbsp;Jangan bagikan password ke siapapun</p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3D3D3D;line-height:1.6;">✓ &nbsp;Gunakan password berbeda di setiap platform</p>
          </td>
        </tr>
      </table>

      <!-- Peringatan -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FFFAEB;border-radius:10px;border:1px solid #FEC84B;border-collapse:collapse;">
        <tr>
          <td style="padding:16px 24px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#B54708;line-height:1.7;">
              Tidak merasa mereset password? Segera hubungi tim kami melalui aplikasi Travia
              karena akun kamu mungkin sedang dalam bahaya.
            </p>
          </td>
        </tr>
      </table>
    `,
  }),
});
