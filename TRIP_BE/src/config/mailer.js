import nodemailer from 'nodemailer';

// pool: true → koneksi SMTP di-reuse antar email — tidak buka koneksi baru setiap sendMail.
// maxConnections: 1 → cukup satu karena pengiriman dilakukan satu per satu.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool:    true,
  maxConnections: 1,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: `"Travia" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

export default transporter;
