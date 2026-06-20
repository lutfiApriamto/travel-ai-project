// Shared HTML wrapper untuk semua email template Travia.
// Gunakan: emailBase({ title, preheader, body }) → string HTML lengkap.
export const emailBase = ({ title, preheader = '', body }) => `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!--[if !gte mso 9]><!-->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#FAF7F0;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <!--<![endif]-->

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#FAF7F0;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;width:100%;border-collapse:collapse;">

          <!-- ── Header ─────────────────────────────── -->
          <tr>
            <td style="background-color:#FF6B35;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td style="width:36px;height:36px;background-color:#ffffff;border-radius:7px;text-align:center;vertical-align:middle;">
                    <span style="display:block;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:18px;color:#FF6B35;line-height:36px;">T</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:24px;color:#ffffff;letter-spacing:0.5px;">Travia</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Content Card ───────────────────────── -->
          <tr>
            <td style="background-color:#F0E8D8;padding:40px 40px 32px;border-left:1px solid #E4DDD0;border-right:1px solid #E4DDD0;">
              ${body}
            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────── -->
          <tr>
            <td style="background-color:#EDE0CC;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;border:1px solid #E4DDD0;border-top:none;">
              <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:14px;color:#1A1510;">Travia &middot; AI Travel Agent</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8B7355;line-height:1.7;">
                Email ini dikirim secara otomatis &mdash; mohon tidak membalas langsung.<br>
                Butuh bantuan? Buka aplikasi Travia dan hubungi tim kami.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

// ── Komponen reusable ─────────────────────────────────────────────────────────

// Baris detail (label + value) dalam tabel info
export const detailRow = ({ label, value, isLast = false, highlight = false }) => `
<tr>
  <td style="padding:16px 24px;${isLast ? '' : 'border-bottom:1px solid #E4DDD0;'}">
    <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.9px;margin-bottom:4px;">${label}</span>
    <span style="font-family:${highlight ? "Georgia,'Times New Roman',serif" : 'Arial,Helvetica,sans-serif'};font-size:${highlight ? '18px' : '15px'};font-weight:${highlight ? '700' : '600'};font-style:${highlight ? 'italic' : 'normal'};color:${highlight ? '#FF6B35' : '#1A1510'};">${value}</span>
  </td>
</tr>`;

// Tombol CTA oranye
export const ctaButton = ({ text, href }) => `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
  <tr>
    <td align="center" style="padding-top:28px;">
      <a href="${href}" target="_blank"
        style="display:inline-block;background-color:#FF6B35;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;mso-padding-alt:14px 40px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;

// Badge status (success / warning / info)
export const statusBadge = ({ text, type = 'success' }) => {
  const colors = {
    success: { bg: '#ECFDF3', text: '#17B26A', border: '#6CE9A6' },
    warning: { bg: '#FFFAEB', text: '#B54708', border: '#FEC84B' },
    danger:  { bg: '#FEF3F2', text: '#B42318', border: '#FDA29B' },
  };
  const c = colors[type] || colors.success;
  return `<div style="display:inline-block;background-color:${c.bg};border:1px solid ${c.border};border-radius:20px;padding:6px 16px;margin-bottom:20px;">
    <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:${c.text};">${text}</span>
  </div>`;
};
