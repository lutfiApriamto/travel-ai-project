import { Parser } from 'json2csv';
import { formatDate }   from './dateHelper.js';
import { formatRupiah } from './currencyHelper.js';

// Konversi array transaksi Finance ke string CSV.
// Dipanggil dari finance.service.js saat admin request export laporan.
// Return: string CSV — dikirim ke client via res.send() dengan header 'text/csv'.
export const generateFinanceCsv = (transactions) => {
  const fields = [
    { label: 'Tanggal',    value: (row) => formatDate(row.createdAt) },
    { label: 'Tipe',       value: (row) => row.type === 'income' ? 'Pemasukan' : 'Pengeluaran' },
    { label: 'Kategori',   value: (row) => {
        const map = { order: 'Pembayaran Order', refund: 'Refund', withdrawal: 'Penarikan' };
        return map[row.category] || row.category;
      }
    },
    { label: 'Deskripsi',  value: 'description' },
    { label: 'Jumlah',     value: (row) => formatRupiah(row.amount) },
    { label: 'Saldo Akhir', value: (row) => formatRupiah(row.balanceAfter) },
  ];

  const parser = new Parser({ fields, withBOM: true });
  return parser.parse(transactions);
};
