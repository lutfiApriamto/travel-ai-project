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

// Format tanggal ke string "DD MMM YYYY" (contoh: "19 Jun 2026")
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
};
