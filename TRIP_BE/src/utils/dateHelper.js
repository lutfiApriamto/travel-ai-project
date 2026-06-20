// Hitung selisih hari antara dua tanggal (tanpa jam).
// Digunakan untuk menentukan persentase refund berdasarkan RefundPolicy.
export const daysBetween = (dateA, dateB) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / msPerDay);
};

// Hitung durasi trip dan return string "X Hari Y Malam"
export const calcDuration = (departureDate, returnDate) => {
  const days   = Math.round((new Date(returnDate) - new Date(departureDate)) / (1000 * 60 * 60 * 24));
  const nights = Math.max(0, days - 1);
  return `${days} Hari ${nights} Malam`;
};

// Format tanggal ke string "DD MMM YYYY" (contoh: "19 Jun 2026")
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
};
