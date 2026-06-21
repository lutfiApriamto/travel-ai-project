// Format angka ke format Rupiah Indonesia.
// Contoh: 1500000 → "Rp 1.500.000"
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};
