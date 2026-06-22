/**
 * Fix Ticket Index
 * ────────────────
 * Menghapus index unik lama `orderId_1` pada koleksi `tickets`.
 *
 * Latar belakang: model Ticket dulu punya `orderId: { unique: true }` sehingga
 * MongoDB membuat index unik. Sekarang satu order bisa punya BANYAK tiket
 * (satu per penumpang), tapi index unik lama masih ada di DB dan menolak
 * pembuatan tiket ke-2+ → hanya 1 tiket tercetak.
 *
 * Script ini drop index unik tersebut. Aman dijalankan berkali-kali.
 *
 * Cara pakai:
 *   1. pastikan .env berisi URI (sama seperti seeder)
 *   2. node fix-ticket-index.js
 *
 * Jalankan SEKALI di database lokal DAN production.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

const isLoopback = (s) => s.startsWith('127.') || s === '::1';
const servers    = dns.getServers();
if (servers.length === 0 || servers.every(isLoopback)) {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

async function main() {
  const URI = process.env.URI;
  if (!URI) {
    console.error('\n❌  URI tidak ditemukan di file .env\n');
    process.exit(1);
  }

  console.log('\n🔧  Fix Ticket Index — drop index unik lama orderId_1\n');

  process.stdout.write('⏳  Menghubungkan ke MongoDB... ');
  await mongoose.connect(URI, { bufferCommands: false });
  console.log('✅  Terhubung!\n');

  const col = mongoose.connection.db.collection('tickets');

  // Tampilkan index yang ada
  const indexes = await col.indexes();
  console.log('📋  Index saat ini di koleksi tickets:');
  indexes.forEach((idx) => {
    console.log(`    - ${idx.name}  ${idx.unique ? '(UNIQUE)' : ''}  keys: ${JSON.stringify(idx.key)}`);
  });
  console.log('');

  // Cari index pada field orderId yang bersifat unik
  const orderIdUnique = indexes.find(
    (idx) => idx.unique && idx.key && idx.key.orderId !== undefined
  );

  if (!orderIdUnique) {
    console.log('✅  Tidak ada index unik pada orderId. Tidak ada yang perlu dihapus.\n');
  } else {
    process.stdout.write(`🗑️   Menghapus index unik "${orderIdUnique.name}"... `);
    await col.dropIndex(orderIdUnique.name);
    console.log('✅  Berhasil dihapus!\n');
    console.log('    Sekarang satu order bisa punya banyak tiket (satu per penumpang).\n');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Gagal:', err.message, '\n');
  process.exit(1);
});
