import { emailBase, statusBadge } from './emailBase.js';

export const passwordChangedTemplate = ({ name }) => ({
  subject: 'Password Akun Travia Kamu Telah Diubah',

  text: `Halo ${name},\n\nPassword akun Travia kamu baru saja berhasil diubah.\n\nJika kamu tidak melakukan perubahan ini, segera lakukan reset password melalui halaman login atau hubungi tim kami.\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     'Password Akun Diubah',
    preheader: 'Password akun Travia kamu baru saja diubah. Bukan kamu? Segera amankan akunmu.',
    body: `
      ${statusBadge({ text: '🔒 Notifikasi Keamanan', type: 'warning' })}

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Password Berhasil Diubah
      </h1>
      <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, password akun Travia kamu baru saja berhasil diubah.
        Kamu sekarang bisa login menggunakan password baru.
      </p>

      <!-- Peringatan Keamanan -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FFFAEB;border-radius:10px;border:1px solid #FEC84B;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#B54708;">
              Bukan kamu yang mengubah password?
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#B54708;line-height:1.7;">
              Jika kamu tidak merasa mengubah password, segera amankan akunmu dengan melakukan
              reset password melalui halaman login Travia, atau hubungi tim kami secepatnya.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8B7355;line-height:1.7;text-align:center;">
        Email ini dikirim pada ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
      </p>
    `,
  }),
});
