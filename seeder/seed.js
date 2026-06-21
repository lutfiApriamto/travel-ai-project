/**
 * Travia Database Seeder
 * ─────────────────────
 * Standalone script untuk mengisi semua data dummy ke MongoDB.
 * Jalankan SEKALI saja — script ini akan menghapus isi koleksi yang ada
 * sebelum mengisinya kembali dengan data baru.
 *
 * Data wilayah (provinces, regencies, districts, villages) bersifat AMAN:
 * tidak akan dimasukkan jika koleksi sudah memiliki data (skip otomatis).
 *
 * Cara pakai:
 *   1. cp .env.example .env   → isi URI dengan MongoDB connection string
 *   2. npm install
 *   3. npm run seed
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt   from 'bcrypt';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';
import dns from 'dns';

// ─── Path Setup ───────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'asset produk', 'data dummy');

// ─── DNS Fix (sama seperti backend — hindari ECONNREFUSED di WSL/VPN) ────────

const isLoopback = (s) => s.startsWith('127.') || s === '::1';
const servers    = dns.getServers();
if (servers.length === 0 || servers.every(isLoopback)) {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

// ─── Konversi Helper ──────────────────────────────────────────────────────────

const { ObjectId } = mongoose.Types;
const OID_RE  = /^[0-9a-f]{24}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Rekursif — konversi semua string ObjectId → ObjectId
 * dan string ISO date → Date object, agar tersimpan dengan tipe yang benar di MongoDB.
 */
function convert(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    if (OID_RE.test(val))   return new ObjectId(val);
    if (DATE_RE.test(val))  return new Date(val);
    return val;
  }
  if (Array.isArray(val)) return val.map(convert);
  if (val instanceof ObjectId || val instanceof Date) return val;
  if (typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, convert(v)])
    );
  }
  return val;
}

/** Baca file JSON dari DATA_DIR */
function read(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

/**
 * Hapus field `_note` dari setiap dokumen.
 * Field tersebut hanya komentar developer, bukan bagian dari schema.
 */
function clean(docs) {
  return docs.map(({ _note, ...rest }) => rest);
}

/**
 * Drop koleksi yang ada (jika ada) lalu insertMany.
 * Jika koleksi belum pernah dibuat, drop-nya akan gagal dengan silent.
 */
async function seed(collectionName, docs) {
  const col = mongoose.connection.db.collection(collectionName);
  try { await col.drop(); } catch (_) { /* belum ada — skip */ }
  if (docs.length) await col.insertMany(docs);
  console.log(`  ✓  ${collectionName.padEnd(18)} ${docs.length} dokumen`);
}

/**
 * Insert hanya jika koleksi KOSONG — untuk data yang tidak boleh di-reset
 * (wilayah: provinces, regencies, districts, villages).
 * Insert dilakukan dalam chunk untuk menghindari timeout pada dataset besar.
 */
async function seedIfEmpty(collectionName, docs, chunkSize = 1000) {
  const col   = mongoose.connection.db.collection(collectionName);
  const count = await col.countDocuments();

  if (count > 0) {
    console.log(`  ⏭  ${collectionName.padEnd(18)} ${count} dokumen sudah ada — dilewati`);
    return;
  }

  let inserted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    try {
      const result = await col.insertMany(chunk, { ordered: false });
      inserted += result.insertedCount;
    } catch (err) {
      // kode 11000 = duplicate key — lewati yang duplikat, hitung yang berhasil
      if (err.code === 11000 || err.writeErrors?.every(e => e.code === 11000)) {
        inserted += err.result?.nInserted ?? 0;
      } else {
        throw err;
      }
    }
  }
  console.log(`  ✓  ${collectionName.padEnd(18)} ${inserted} dokumen dari ${docs.length}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const URI = process.env.URI;
  if (!URI) {
    console.error('\n❌  URI tidak ditemukan di file .env');
    console.error('    Salin .env.example → .env lalu isi URI dengan MongoDB connection string.\n');
    process.exit(1);
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     🌱  Travia Database Seeder         ║');
  console.log('╚════════════════════════════════════════╝\n');

  // ── Koneksi ────────────────────────────────────────────────────────────────
  process.stdout.write('⏳  Menghubungkan ke MongoDB... ');
  await mongoose.connect(URI, { bufferCommands: false });
  console.log('✅  Terhubung!\n');

  // ── Hash Password ──────────────────────────────────────────────────────────
  process.stdout.write('🔐  Hashing password... ');
  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash('Admin@123', 12),
    bcrypt.hash('User@123',  12),
  ]);
  console.log('✅  Selesai!\n');

  // ── Seeding ────────────────────────────────────────────────────────────────
  console.log('📦  Memasukkan data ke MongoDB...');
  console.log('────────────────────────────────────────');

  // 1. Categories — tidak ada dependensi
  await seed('categories', convert(clean(read('categories.json'))));

  // 2. Types — tidak ada dependensi
  await seed('types', convert(clean(read('types.json'))));

  // 3. Tags — tidak ada dependensi
  await seed('tags', convert(clean(read('tags.json'))));

  // 4. Banners — tidak ada dependensi
  await seed('banners', convert(clean(read('banners.json'))));

  // 5. Users — tidak ada dependensi (password di-hash di atas)
  const rawUsers = read('users.json');
  const users = convert(clean(
    rawUsers.map(u => ({
      ...u,
      password: u.role === 'admin' ? adminHash : userHash,
    }))
  ));
  await seed('users', users);

  // 6. Products — referensi ke categories, types, tags
  await seed('products', convert(clean(read('products.json'))));

  // 7. RefundPolicies — referensi ke users (updatedBy)
  await seed('refundpolicies', convert(clean(read('refundPolicies.json'))));

  // 8. Wishlists — referensi ke users, products
  await seed('wishlists', convert(clean(read('wishlists.json'))));

  // 9. Carts — referensi ke users, products
  await seed('carts', convert(clean(read('carts.json'))));

  // 10. Orders — referensi ke users, products
  await seed('orders', convert(clean(read('orders.json'))));

  // 11. Tickets — referensi ke orders, users, products
  await seed('tickets', convert(clean(read('tickets.json'))));

  // 12. Refunds — referensi ke orders, users
  await seed('refunds', convert(clean(read('refunds.json'))));

  // 13. Notifications — referensi ke orders, tickets, refunds, users
  await seed('notifications', convert(clean(read('notifications.json'))));

  // 14. Finances — referensi ke orders, refunds, users
  await seed('finances', convert(clean(read('finances.json'))));

  // ── Wilayah (skip jika sudah ada data — hindari duplikasi) ────────────────
  console.log('\n  Memeriksa data wilayah...');
  console.log('────────────────────────────────────────');

  // Beberapa file wilayah memiliki BOM (﻿) di awal — strip sebelum parse
  const readWilayah = (filename) => {
    const raw = readFileSync(join(DATA_DIR, filename), 'utf8');
    return JSON.parse(raw.replace(/^﻿/, ''));
  };

  await seedIfEmpty('provinces', readWilayah('provinces.json'));
  await seedIfEmpty('regencies', readWilayah('regencies.json'));
  await seedIfEmpty('districts', readWilayah('districts.json'));

  process.stdout.write('  ⏳  villages (8MB+, harap tunggu)...\n');
  await seedIfEmpty('villages',  readWilayah('villages.json'), 500);

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  console.log('────────────────────────────────────────');
  console.log('\n✅  Seeding selesai! Semua data berhasil masuk ke database.\n');

  console.log('👤  Akun yang tersedia:');
  console.log('┌─────────┬───────────────────────────────┬────────────┐');
  console.log('│ Role    │ Email                         │ Password   │');
  console.log('├─────────┼───────────────────────────────┼────────────┤');
  console.log('│ Admin   │ lutfi@travia.id               │ Admin@123  │');
  console.log('│ User    │ andi.pratama@gmail.com        │ User@123   │');
  console.log('│ User    │ siti.rahayu@yahoo.com         │ User@123   │');
  console.log('│ User    │ budi.santoso@outlook.com      │ User@123   │');
  console.log('│ User    │ dewi.kusuma@gmail.com         │ User@123   │');
  console.log('│ User    │ rizky.f@gmail.com             │ User@123   │');
  console.log('└─────────┴───────────────────────────────┴────────────┘\n');

  console.log('📊  Data yang sudah masuk:');
  console.log('    • 10 kategori  • 7 tipe  • 10 tag  • 3 banner');
  console.log('    • 15 produk wisata  • 6 user  • 1 kebijakan refund');
  console.log('    • 15 wishlist  • 5 cart  • 20 order  • 13 tiket');
  console.log('    • 5 refund  • 40 notifikasi  • 17 transaksi finance\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Seeding gagal:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('    Pastikan URI MongoDB sudah benar dan cluster aktif.');
  }
  process.exit(1);
});
