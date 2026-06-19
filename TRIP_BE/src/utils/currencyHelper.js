// Format angka ke format Rupiah (contoh: 1500000 → "Rp 1.500.000")
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style:    'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};
