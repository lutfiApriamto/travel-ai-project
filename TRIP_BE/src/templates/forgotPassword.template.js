export const forgotPasswordTemplate = ({ name, resetUrl }) => ({
  subject: 'Reset Password',
  text: `Halo ${name},\n\nKami menerima permintaan reset password untuk akun Anda.\nKlik link berikut untuk membuat password baru:\n\n${resetUrl}\n\nLink ini berlaku selama 1 jam.\n\nJika Anda tidak meminta reset password, abaikan email ini.\n\nSalam,\nTim TripSense`,
  html: null,
});
