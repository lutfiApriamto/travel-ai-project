import PDFDocument from 'pdfkit';
import { formatDate }   from './dateHelper.js';
import { formatRupiah } from './currencyHelper.js';

// Generate buffer PDF e-tiket dari data tiket.
// Dipanggil dari ticket.service.js saat user request download tiket.
// Return: Buffer — dikirim ke client via res.send() dengan header 'application/pdf'.
export const generateTicketPdf = (ticket) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data',  (chunk) => chunks.push(chunk));
    doc.on('end',   ()      => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { ticketCode, productSnapshot, participants, totalPrice, userId } = ticket;
    const snap = productSnapshot || {};

    // ─── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('E-TIKET PERJALANAN', { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica')
      .text('TripSense', { align: 'center' })
      .moveDown(0.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(0.5);

    // ─── Kode Tiket ──────────────────────────────────────────────────────────
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Kode Tiket: ${ticketCode}`, { align: 'center' })
      .moveDown(1);

    // ─── Detail Produk ───────────────────────────────────────────────────────
    const row = (label, value) => {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(label, { continued: true, width: 180 })
        .font('Helvetica')
        .text(`: ${value}`)
        .moveDown(0.3);
    };

    doc.fontSize(13).font('Helvetica-Bold').text('Detail Perjalanan').moveDown(0.5);

    row('Nama Paket',       snap.name          || '-');
    row('Kota Keberangkatan', snap.departureCity || '-');
    row('Destinasi',        (snap.destinations  || []).join(', ') || '-');
    row('Tanggal Berangkat', snap.departureDate ? formatDate(snap.departureDate) : '-');
    row('Tanggal Kembali',  snap.returnDate     ? formatDate(snap.returnDate)    : '-');
    row('Durasi',           snap.duration       || '-');
    row('Meeting Point',    snap.meetingPoint   || '-');

    doc.moveDown(0.5);

    // ─── Detail Pemesanan ────────────────────────────────────────────────────
    doc.fontSize(13).font('Helvetica-Bold').text('Detail Pemesanan').moveDown(0.5);

    row('Nama Pemesan',  (userId?.name) || '-');
    row('Jumlah Peserta', `${participants} orang`);
    row('Total Bayar',   formatRupiah(totalPrice));

    doc.moveDown(0.5);

    // ─── Footer ──────────────────────────────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('gray')
      .text(
        'Tiket ini adalah bukti pembayaran resmi. Tunjukkan kepada pemandu wisata saat hari keberangkatan.',
        { align: 'center' }
      );

    doc.end();
  });
};
