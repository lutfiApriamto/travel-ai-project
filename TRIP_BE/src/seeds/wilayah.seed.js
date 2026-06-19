import 'dotenv/config';
import { readFileSync }  from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB  from '../config/db.js';
import Province   from '../models/province.model.js';
import Regency    from '../models/regency.model.js';
import District   from '../models/district.model.js';
import Village    from '../models/village.model.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const WILAYAH_DIR = join(__dirname, '../../../asset produk/wilayah');
const CHUNK_SIZE  = 1000; // insert per batch — hindari timeout di MongoDB Atlas

// ─── Helpers ─────────────────────────────────────────────────────────────────

const readJson = (filename) => {
  const raw = readFileSync(join(WILAYAH_DIR, filename), 'utf-8');
  // Strip BOM (﻿) — muncul di file yang dibuat dari Excel/Windows
  return JSON.parse(raw.replace(/^﻿/, ''));
};

// Insert array data dalam batch. Gunakan ordered: false agar batch berikutnya
// tetap jalan meski ada duplicate key (re-run seed tidak akan error).
const insertInChunks = async (Model, data) => {
  let inserted = 0;

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    try {
      const result = await Model.insertMany(chunk, { ordered: false });
      inserted += result.length;
    } catch (err) {
      // error code 11000 = duplicate key — data sudah ada, skip
      if (err.code === 11000 || err.writeErrors?.every((e) => e.code === 11000)) {
        inserted += err.insertedDocs?.length ?? 0;
      } else {
        throw err;
      }
    }
  }

  return inserted;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const seed = async () => {
  await connectDB();
  console.log('[SEED] Koneksi ke MongoDB berhasil\n');

  // ── Provinsi ───────────────────────────────────────────────────────────────
  console.log('[SEED] Memuat provinces.json...');
  const provinces = readJson('provinces.json');
  const provCount = await insertInChunks(Province, provinces);
  console.log(`[SEED] ✓ Provinsi   : ${provCount} / ${provinces.length} dokumen tersimpan`);

  // ── Kabupaten/Kota ─────────────────────────────────────────────────────────
  console.log('[SEED] Memuat regencies.json...');
  const regencies = readJson('regencies.json');
  const regCount  = await insertInChunks(Regency, regencies);
  console.log(`[SEED] ✓ Kab/Kota   : ${regCount} / ${regencies.length} dokumen tersimpan`);

  // ── Kecamatan ──────────────────────────────────────────────────────────────
  console.log('[SEED] Memuat districts.json...');
  const districts  = readJson('districts.json');
  const distCount  = await insertInChunks(District, districts);
  console.log(`[SEED] ✓ Kecamatan  : ${distCount} / ${districts.length} dokumen tersimpan`);

  // ── Desa/Kelurahan ─────────────────────────────────────────────────────────
  console.log('[SEED] Memuat villages.json... (80K+ data, harap tunggu)');
  const villages  = readJson('villages.json');
  const villCount = await insertInChunks(Village, villages);
  console.log(`[SEED] ✓ Desa/Kel   : ${villCount} / ${villages.length} dokumen tersimpan`);

  console.log('\n[SEED] Selesai.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[SEED] Error:', err.message);
  process.exit(1);
});
