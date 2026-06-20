import PDFDocument from 'pdfkit';
import QRCode      from 'qrcode';
import { formatDate }   from './dateHelper.js';
import { formatRupiah } from './currencyHelper.js';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const C = {
  orange:    '#FF6B35',
  orangeDark:'#E85D20',
  dark:      '#1A1510',
  card:      '#F0E8D8',
  bg:        '#FAF7F0',
  border:    '#E4DDD0',
  muted:     '#8B7355',
  body:      '#3D3D3D',
  white:     '#FFFFFF',
  success:   '#17B26A',
};

// ─── Layout Constants ─────────────────────────────────────────────────────────
const PX = 44;   // horizontal padding
const RX = 551;  // right edge (595 - 44)

// Helper: draw a section title with orange underline accent
const sectionTitle = (doc, text, y) => {
  doc
    .fontSize(13)
    .font('Times-Bold')
    .fillColor(C.dark)
    .text(text, PX, y, { lineBreak: false });

  doc
    .moveTo(PX, y + 20)
    .lineTo(PX + 100, y + 20)
    .lineWidth(2)
    .strokeColor(C.orange)
    .stroke();
};

// Helper: draw one detail row (label top, value bottom, separator line)
const detailRow = (doc, label, value, x, y, width) => {
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(C.muted)
    .text(label.toUpperCase(), x, y, { width, lineBreak: false });

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(C.dark)
    .text(value || '—', x, y + 11, { width, lineBreak: false });
};

// ─── PDF Generator ────────────────────────────────────────────────────────────

export const generateTicketPdf = async (ticket) => {
  const qrBuffer = await QRCode.toBuffer(ticket.ticketCode, {
    type:   'png',
    width:  160,
    margin: 2,
    color:  { dark: C.dark, light: C.white },
  });

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];

    doc.on('data',  (c)  => chunks.push(c));
    doc.on('end',   ()   => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;  // 595.28
    const { ticketCode, productSnapshot: snap = {}, participants, totalPrice, userId } = ticket;
    const isValid = ticket.isValid !== false;

    // ── 1. Background ivory ──────────────────────────────────────────────────
    doc.rect(0, 0, W, doc.page.height).fill(C.bg);

    // ── 2. Orange header ─────────────────────────────────────────────────────
    const headerH = 88;
    doc.rect(0, 0, W, headerH).fill(C.orange);

    // Logo: white rounded icon box
    const iconX = PX;
    const iconY = (headerH - 38) / 2;
    doc.roundedRect(iconX, iconY, 38, 38, 7).fill(C.white);
    doc
      .fontSize(20)
      .font('Times-Bold')
      .fillColor(C.orange)
      .text('T', iconX, iconY + 6, { width: 38, align: 'center', lineBreak: false });

    // Wordmark "Travia"
    doc
      .fontSize(27)
      .font('Times-Bold')
      .fillColor(C.white)
      .text('Travia', iconX + 46, iconY + 5, { lineBreak: false });

    // Right subtitle "E-Tiket Perjalanan"
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(C.card)
      .text('E-Tiket Perjalanan', RX - 130, iconY + 14, { width: 130, align: 'right', lineBreak: false });

    // ── 3. Dark ticket-code bar ──────────────────────────────────────────────
    const barY = headerH;
    const barH = 42;
    doc.rect(0, barY, W, barH).fill(C.dark);

    // Left: "KODE TIKET" label + code
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(C.muted)
      .text('KODE TIKET', PX, barY + 7, { lineBreak: false });

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(C.orange)
      .text(ticketCode, PX, barY + 18, { lineBreak: false });

    // Right: validity badge
    const badgeColor = isValid ? C.success : '#F04438';
    const badgeText  = isValid ? '● VALID' : '● TIDAK VALID';
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(badgeColor)
      .text(badgeText, RX - 100, barY + 15, { width: 100, align: 'right', lineBreak: false });

    // ── 4. QR Code section ───────────────────────────────────────────────────
    const qrSectionY = barY + barH + 20;
    const qrSize     = 128;
    const qrCardW    = 196;
    const qrCardH    = qrSize + 52;
    const qrCardX    = (W - qrCardW) / 2;

    // White card shadow effect (offset rect)
    doc.roundedRect(qrCardX + 3, qrSectionY + 3, qrCardW, qrCardH, 10).fill(C.border);
    // White card
    doc.roundedRect(qrCardX, qrSectionY, qrCardW, qrCardH, 10).fill(C.white);

    // QR code image
    const qrImgX = (W - qrSize) / 2;
    const qrImgY = qrSectionY + 14;
    doc.image(qrBuffer, qrImgX, qrImgY, { width: qrSize, height: qrSize });

    // Scan hint
    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor(C.muted)
      .text('Scan QR code ini untuk check-in', qrCardX, qrImgY + qrSize + 10, {
        width: qrCardW, align: 'center', lineBreak: false,
      });

    // ── 5. Perforated divider ────────────────────────────────────────────────
    const divY = qrSectionY + qrCardH + 26;

    // Circle cutouts at edges (simulating ticket perforation)
    doc.circle(0, divY, 16).fill(C.bg);
    doc.circle(W, divY, 16).fill(C.bg);

    // Dashed line
    doc
      .moveTo(18, divY)
      .lineTo(W - 18, divY)
      .dash(5, { space: 4 })
      .lineWidth(1)
      .strokeColor(C.border)
      .stroke();
    doc.undash();

    // ── 6. Trip Details ──────────────────────────────────────────────────────
    let y = divY + 22;

    sectionTitle(doc, 'Detail Perjalanan', y);
    y += 30;

    const colW  = (W - PX * 2 - 20) / 2;  // column width
    const col2X = PX + colW + 20;           // x of second column

    // Row 1: Nama Paket (full width)
    detailRow(doc, 'Nama Paket', snap.name, PX, y, W - PX * 2);
    y += 36;

    // Separator
    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 10;

    // Row 2: Kota Keberangkatan | Destinasi
    detailRow(doc, 'Kota Keberangkatan', snap.departureCity, PX, y, colW);
    detailRow(doc, 'Destinasi', (snap.destinations || []).join(', '), col2X, y, colW);
    y += 36;

    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 10;

    // Row 3: Tanggal Berangkat | Tanggal Kembali
    detailRow(doc, 'Tanggal Berangkat', snap.departureDate ? formatDate(snap.departureDate) : '—', PX, y, colW);
    detailRow(doc, 'Tanggal Kembali',   snap.returnDate    ? formatDate(snap.returnDate)    : '—', col2X, y, colW);
    y += 36;

    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 10;

    // Row 4: Durasi | Meeting Point
    detailRow(doc, 'Durasi', snap.duration, PX, y, colW);
    detailRow(doc, 'Meeting Point', snap.meetingPoint, col2X, y, colW);
    y += 44;

    // Section separator
    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(1).strokeColor(C.border).stroke();
    y += 18;

    // ── 7. Booking Details ───────────────────────────────────────────────────
    sectionTitle(doc, 'Detail Pemesanan', y);
    y += 30;

    // Row: Pemesan | Peserta
    detailRow(doc, 'Nama Pemesan',   userId?.name || '—',        PX,    y, colW);
    detailRow(doc, 'Jumlah Peserta', `${participants} Orang`,    col2X, y, colW);
    y += 42;

    // Total price — dark highlight box
    doc.roundedRect(PX, y, W - PX * 2, 46, 8).fill(C.dark);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(C.muted)
      .text('TOTAL PEMBAYARAN', PX + 16, y + 8, { lineBreak: false });

    doc
      .fontSize(19)
      .font('Times-Bold')
      .fillColor(C.orange)
      .text(formatRupiah(totalPrice), PX + 16, y + 19, { lineBreak: false });

    y += 62;

    // ── 8. Footer ────────────────────────────────────────────────────────────
    // Orange accent line
    doc
      .moveTo(PX, y)
      .lineTo(RX, y)
      .lineWidth(1.5)
      .strokeColor(C.orange)
      .stroke();

    y += 14;

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor(C.muted)
      .text(
        'Tiket ini adalah bukti pembayaran resmi. Tunjukkan QR code kepada pemandu wisata pada hari keberangkatan.',
        PX, y,
        { width: W - PX * 2, align: 'center' }
      );

    y += 18;

    doc
      .fontSize(12)
      .font('Times-Bold')
      .fillColor(C.dark)
      .text('Travia · AI Travel Agent', PX, y, { width: W - PX * 2, align: 'center' });

    doc.end();
  });
};
