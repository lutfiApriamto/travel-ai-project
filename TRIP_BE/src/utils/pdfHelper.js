import PDFDocument from 'pdfkit';
import QRCode      from 'qrcode';
import { formatDate }   from './dateHelper.js';
import { formatRupiah } from './currencyHelper.js';

// ─── Brand Palette ────────────────────────────────────────────────────────────
const C = {
  orange:    '#FF6B35',
  dark:      '#1C1917',
  card:      '#FAF8F5',
  grayBg:    '#F4F4F5',
  border:    '#E4E4E7',
  muted:     '#71717A',
  body:      '#27272A',
  white:     '#FFFFFF',
  success:   '#16A34A',
  successBg: '#F0FDF4',
  error:     '#DC2626',
  errorBg:   '#FEF2F2',
  orangeFade:'#FFF4EE',
};

const W  = 595;   // A4 width (pt)
const PX = 40;    // horizontal padding
const RX = W - PX;

// ─── PDF Generator ────────────────────────────────────────────────────────────
export const generateTicketPdf = async (ticket) => {
  const qrBuffer = await QRCode.toBuffer(ticket.ticketCode, {
    type: 'png', width: 140, margin: 1,
    color: { dark: C.dark, light: C.white },
  });

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data', c  => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const {
      ticketCode,
      productSnapshot: snap = {},
      participants,
      totalPrice,
      userId,
      passenger,
    } = ticket;

    const isValid      = ticket.isValid !== false;
    const hasPassenger = passenger && (passenger.name || passenger.nik);

    // Full white background
    doc.rect(0, 0, W, doc.page.height).fill(C.white);

    // ── 1. ORANGE HEADER ──────────────────────────────────────────────────────
    const hH = 80;
    doc.rect(0, 0, W, hH).fill(C.orange);

    // "T" logo box (white rounded square)
    doc.roundedRect(PX, 21, 36, 36, 7).fill(C.white);
    doc.fontSize(21).font('Times-Bold').fillColor(C.orange)
       .text('T', PX, 27, { width: 36, align: 'center', lineBreak: false });

    // "Travia" wordmark
    doc.fontSize(24).font('Times-Bold').fillColor(C.white)
       .text('Travia', PX + 45, 25, { lineBreak: false });

    // Subtitle below wordmark
    doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.70)')
       .text('AI Travel Agent', PX + 45, 52, { lineBreak: false });

    // Right: issued date
    const issuedStr = ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : new Date().toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
    doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.70)')
       .text(`Diterbitkan ${issuedStr}`, RX - 180, 18, { width: 180, align: 'right', lineBreak: false });

    // Validity badge pill
    const badgeText = isValid ? '● VALID' : '● TIDAK VALID';
    const badgeW    = isValid ? 60 : 94;
    const badgeBg   = isValid ? C.successBg : C.errorBg;
    const badgeFg   = isValid ? C.success   : C.error;
    const badgeX    = RX - badgeW;
    doc.roundedRect(badgeX, 30, badgeW, 22, 11).fill(badgeBg);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(badgeFg)
       .text(badgeText, badgeX, 36, { width: badgeW, align: 'center', lineBreak: false });

    // ── 2. DARK TICKET-CODE STRIP ─────────────────────────────────────────────
    const stripY = hH;
    const stripH = 44;
    doc.rect(0, stripY, W, stripH).fill(C.dark);

    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
       .text('NO. TIKET', PX, stripY + 7, { lineBreak: false });
    doc.fontSize(15).font('Helvetica-Bold').fillColor(C.orange)
       .text(ticketCode, PX, stripY + 17, { lineBreak: false });

    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
       .text('E-TIKET PERJALANAN', RX - 160, stripY + 7, { width: 160, align: 'right', lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor('#A8A29E')
       .text('Travia · AI Travel Agent', RX - 160, stripY + 19, { width: 160, align: 'right', lineBreak: false });

    // ── 3. PRODUCT NAME + ROUTE (full width) ─────────────────────────────────
    let y = stripY + stripH + 24;

    // Pre-calc product name height for y tracking
    doc.fontSize(19).font('Times-Bold');
    const nameH = doc.heightOfString(snap.name || '—', { width: W - PX * 2 });

    doc.fillColor(C.dark)
       .text(snap.name || '—', PX, y, { width: W - PX * 2 });
    y += nameH + 6;

    // Route text
    const destinations = (snap.destinations || []).join(', ');
    const routeStr     = snap.departureCity
      ? `${snap.departureCity}  →  ${destinations || '—'}`
      : destinations || '—';

    doc.fontSize(10).font('Helvetica').fillColor(C.muted)
       .text(routeStr, PX, y, { lineBreak: false });
    y += 20;

    // Full-width divider
    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 18;

    // ── 4. DATE BOXES (Traveloka-style vertical orange accent) ───────────────
    const halfW   = (W - PX * 2 - 24) / 2;
    const accentH = 42;

    // Left: Tanggal Berangkat
    doc.moveTo(PX, y).lineTo(PX, y + accentH).lineWidth(3).strokeColor(C.orange).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
       .text('Tanggal Berangkat', PX + 12, y, { lineBreak: false });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.dark)
       .text(snap.departureDate ? formatDate(snap.departureDate) : '—', PX + 12, y + 13, { lineBreak: false });

    // Right: Tanggal Kembali
    const dateRightX = PX + halfW + 24;
    doc.moveTo(dateRightX, y).lineTo(dateRightX, y + accentH).lineWidth(3).strokeColor(C.orange).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
       .text('Tanggal Kembali', dateRightX + 12, y, { lineBreak: false });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.dark)
       .text(snap.returnDate ? formatDate(snap.returnDate) : '—', dateRightX + 12, y + 13, { lineBreak: false });

    y += accentH + 18;

    // Divider
    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 20;

    // ── 5. TWO-COLUMN: QR code (left) + Trip info (right) ────────────────────
    const qrPanelW = 155;
    const qrSize   = 120;
    const qrPanelH = qrSize + 58;
    const infoX    = PX + qrPanelW + 22;
    const infoW    = RX - infoX;

    // QR card (warm light bg, rounded)
    doc.roundedRect(PX, y, qrPanelW, qrPanelH, 10).fill(C.card);

    // QR image centered inside card
    const qrImgX = PX + (qrPanelW - qrSize) / 2;
    const qrImgY = y + 16;
    doc.image(qrBuffer, qrImgX, qrImgY, { width: qrSize, height: qrSize });

    // Inner divider
    doc.moveTo(PX + 12, qrImgY + qrSize + 10)
       .lineTo(PX + qrPanelW - 12, qrImgY + qrSize + 10)
       .lineWidth(0.5).strokeColor(C.border).stroke();

    doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
       .text('Scan QR Code untuk Check-in', PX, qrImgY + qrSize + 17, {
         width: qrPanelW, align: 'center', lineBreak: false,
       });

    const qrPanelBottom = y + qrPanelH;

    // Right column: trip info
    let ry = y;

    // Durasi
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
       .text('DURASI PERJALANAN', infoX, ry, { lineBreak: false });
    ry += 12;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.body)
       .text(snap.duration || '—', infoX, ry, { width: infoW, lineBreak: false });
    ry += 20;
    doc.moveTo(infoX, ry).lineTo(RX, ry).lineWidth(0.5).strokeColor(C.border).stroke();
    ry += 12;

    // Meeting Point
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
       .text('TITIK KUMPUL', infoX, ry, { lineBreak: false });
    ry += 12;
    doc.fontSize(11).font('Helvetica-Bold');
    const mpH = doc.heightOfString(snap.meetingPoint || '—', { width: infoW });
    doc.fillColor(C.body).text(snap.meetingPoint || '—', infoX, ry, { width: infoW });
    ry += mpH + 8;
    doc.moveTo(infoX, ry).lineTo(RX, ry).lineWidth(0.5).strokeColor(C.border).stroke();
    ry += 12;

    // Nama Pemesan
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
       .text('NAMA PEMESAN', infoX, ry, { lineBreak: false });
    ry += 12;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.body)
       .text(userId?.name || '—', infoX, ry, { width: infoW, lineBreak: false });
    ry += 20;
    doc.moveTo(infoX, ry).lineTo(RX, ry).lineWidth(0.5).strokeColor(C.border).stroke();
    ry += 12;

    // Jumlah Peserta
    doc.fontSize(7).font('Helvetica').fillColor(C.muted)
       .text('JUMLAH PESERTA', infoX, ry, { lineBreak: false });
    ry += 12;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.body)
       .text(`${participants || 1} Orang`, infoX, ry, { width: infoW, lineBreak: false });
    ry += 20;

    // Advance y past both columns
    y = Math.max(qrPanelBottom, ry) + 24;

    // Orange accent divider (full width)
    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(1.5).strokeColor(C.orange).stroke();
    y += 22;

    // ── 6. DATA PENUMPANG ────────────────────────────────────────────────────
    if (hasPassenger) {
      // Section header strip
      doc.rect(PX, y, W - PX * 2, 28).fill(C.orangeFade);
      doc.roundedRect(PX, y, 4, 28, 2).fill(C.orange);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.orange)
         .text('Data Penumpang', PX + 14, y + 9, { lineBreak: false });
      y += 38;

      // 4-column grid
      const pColW = (W - PX * 2) / 4;
      const pCols = [
        { label: 'NAMA PENUMPANG', val: passenger.name  || '—' },
        { label: 'NIK',            val: passenger.nik   || '—' },
        { label: 'UMUR',           val: passenger.age != null ? `${passenger.age} tahun` : '—' },
        { label: 'EMAIL',          val: passenger.email || '—' },
      ];
      pCols.forEach(({ label, val }, i) => {
        const cx = PX + i * pColW;
        doc.fontSize(7).font('Helvetica').fillColor(C.muted)
           .text(label, cx, y, { width: pColW - 8, lineBreak: false });
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.body)
           .text(val, cx, y + 11, { width: pColW - 8, lineBreak: false });
      });
      y += 34;

      doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
      y += 18;
    }

    // ── 7. TOTAL PAYMENT BOX ────────────────────────────────────────────────
    doc.roundedRect(PX, y, W - PX * 2, 56, 10).fill(C.dark);

    // Orange left accent strip
    doc.roundedRect(PX, y, 5, 56, 2).fill(C.orange);

    doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
       .text('TOTAL PEMBAYARAN', PX + 18, y + 10, { lineBreak: false });
    doc.fontSize(22).font('Times-Bold').fillColor(C.orange)
       .text(formatRupiah(totalPrice), PX + 18, y + 22, { lineBreak: false });

    // Right: payment method if available (from order, not ticket — show participants fallback)
    doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
       .text('PESERTA', RX - 100, y + 10, { width: 100, align: 'right', lineBreak: false });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.white)
       .text(`${participants || 1} Orang`, RX - 100, y + 22, { width: 100, align: 'right', lineBreak: false });

    y += 70;

    // ── 8. FOOTER ────────────────────────────────────────────────────────────
    doc.moveTo(PX, y).lineTo(RX, y).lineWidth(0.5).strokeColor(C.border).stroke();
    y += 14;

    doc.fontSize(7.5).font('Helvetica').fillColor(C.muted)
       .text(
         'Tiket ini adalah bukti pembayaran resmi Travia. Tunjukkan QR Code kepada pemandu wisata pada hari keberangkatan.',
         PX, y, { width: W - PX * 2, align: 'center' },
       );
    y += 18;

    doc.fontSize(13).font('Times-Bold').fillColor(C.orange)
       .text('Travia · AI Travel Agent', PX, y, {
         width: W - PX * 2, align: 'center', lineBreak: false,
       });

    doc.end();
  });
};
