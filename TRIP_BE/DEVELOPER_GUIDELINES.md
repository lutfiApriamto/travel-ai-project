# Developer Guidelines — Travia Backend

Panduan ini menjelaskan konvensi kode, struktur folder, dan pola implementasi yang digunakan di seluruh proyek. Baca dokumen ini sebelum menambahkan fitur baru agar codebase tetap konsisten.

---

## Filosofi Kode

1. **Satu module = satu fitur** — pisahkan logika per domain, jangan campur antar module
2. **Thin controller, fat service** — controller hanya menangani request/response, semua logika bisnis ada di service
3. **Tidak ada komentar untuk hal yang obvious** — nama fungsi dan variabel harus cukup jelas tanpa penjelasan
4. **Fail fast** — lempar error dengan `statusCode` sesegera mungkin, jangan biarkan proses berjalan dengan data tidak valid
5. **Fire-and-forget untuk side effect** — email dan notifikasi tidak boleh memblokir response utama, selalu wrap dengan `.catch(() => {})`

---

## Aturan ES Modules

Proyek ini menggunakan **ES Modules** (`"type": "module"` di `package.json`). Aturan wajib:

```js
// ✅ BENAR — ekstensi .js wajib di semua import
import Product from '../../models/product.model.js';
import { sendSuccess } from '../../utils/apiResponse.js';

// ❌ SALAH — tanpa ekstensi akan error di runtime
import Product from '../../models/product.model';
import { sendSuccess } from '../../utils/apiResponse';
```

Tidak ada `require()`. Semua import menggunakan sintaks `import`.

---

## Struktur Module

Setiap fitur baru harus mengikuti pola **Routes → Controller → Service → Schema**.

```
src/modules/<nama-module>/
├── <nama>.routes.js      ← Definisi endpoint + middleware chain
├── <nama>.controller.js  ← Terima req, panggil service, kirim response
├── <nama>.service.js     ← Logika bisnis, query database, side effects
└── <nama>.schema.js      ← AJV schema untuk validasi request body
```

> Module yang tidak memiliki body input (tidak ada POST/PATCH) tidak perlu file `.schema.js`.

---

## Cara Membuat Module Baru

### Langkah 1 — Buat file schema (jika ada validasi body)

```js
// src/modules/example/example.schema.js
export const createExampleSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name:        { type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    price:       { type: 'number', minimum: 0 },
  },
};
```

**Aturan schema:**
- Selalu sertakan `additionalProperties: false` — tolak field yang tidak terdaftar
- Field opsional tidak perlu masuk array `required`
- Validasi email gunakan `pattern` bukan `format: 'email'` (AJV v8 tanpa plugin tidak support format)
  ```js
  email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
  ```
- Validasi hex color: `{ type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }`

---

### Langkah 2 — Buat service

```js
// src/modules/example/example.service.js
import Example from '../../models/example.model.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

export const getAll = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    Example.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Example.countDocuments(),
  ]);

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id) => {
  const item = await Example.findById(id).lean();

  if (!item) {
    const err = new Error('Data tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return item;
};

export const create = async (body) => {
  return Example.create(body);
};

export const update = async (id, body) => {
  const item = await Example.findById(id);

  if (!item) {
    const err = new Error('Data tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  Object.assign(item, body);
  return item.save();
};

export const remove = async (id) => {
  const item = await Example.findById(id);

  if (!item) {
    const err = new Error('Data tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  await item.deleteOne();
};
```

**Pola error di service:**
```js
// ✅ SELALU set statusCode di error object
const err = new Error('Pesan error yang jelas');
err.statusCode = 404; // 400, 401, 403, 404, 409, dll
throw err;

// ❌ JANGAN throw Error biasa tanpa statusCode — akan jadi 500
throw new Error('something went wrong');
```

---

### Langkah 3 — Buat controller

```js
// src/modules/example/example.controller.js
import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './example.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.getAll(req.query);
  sendSuccess(res, items, 'Data berhasil diambil', 200, meta);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id);
  sendSuccess(res, data, 'Detail berhasil diambil');
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body);
  sendSuccess(res, data, 'Data berhasil dibuat', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  sendSuccess(res, data, 'Data berhasil diupdate');
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  sendSuccess(res, null, 'Data berhasil dihapus');
});
```

**Aturan controller:**
- Selalu wrap dengan `asyncHandler` — error diteruskan ke `errorHandler` global secara otomatis
- Controller tidak boleh punya logika bisnis — hanya ambil data dari `req`, panggil service, kirim response
- Gunakan `sendSuccess` dan `sendError` dari `utils/apiResponse.js` — jangan pernah `res.json()` langsung

---

### Langkah 4 — Buat routes

```js
// src/modules/example/example.routes.js
import { Router }             from 'express';
import auth                   from '../../middlewares/auth.middleware.js';
import admin                  from '../../middlewares/admin.middleware.js';
import validate               from '../../middlewares/validate.middleware.js';
import { createRateLimiter }  from '../../middlewares/rateLimiter.middleware.js';
import * as schema            from './example.schema.js';
import * as ctrl              from './example.controller.js';

const router = Router();

// Public
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Admin only
router.post('/',    auth, admin, validate(schema.createExampleSchema), ctrl.create);
router.patch('/:id', auth, admin, validate(schema.updateExampleSchema), ctrl.update);
router.delete('/:id', auth, admin, ctrl.remove);

export default router;
```

**Aturan urutan route:**
- Route dengan path statis HARUS didaftarkan SEBELUM route dengan parameter
  ```js
  // ✅ BENAR
  router.get('/policy', ctrl.getPolicy);   // statis dulu
  router.get('/:id',   ctrl.getById);      // parameter belakangan

  // ❌ SALAH — "policy" akan ditangkap sebagai :id
  router.get('/:id',   ctrl.getById);
  router.get('/policy', ctrl.getPolicy);
  ```

---

### Langkah 5 — Daftarkan di app.js

```js
// src/app.js
import exampleRoutes from './modules/example/example.routes.js';

// Di bagian Routes:
app.use('/api/examples', exampleRoutes);
```

---

## Middleware Chain

Urutan middleware yang benar untuk setiap jenis route:

```js
// Public (tanpa auth)
router.get('/', ctrl.getAll);

// User login wajib
router.post('/', auth, validate(schema), ctrl.create);

// Admin only
router.delete('/:id', auth, admin, ctrl.remove);

// Admin + rate limit (endpoint berat)
const heavyLimiter = createRateLimiter({ windowMs: 60_000, max: 20, message: '...' });
router.get('/dashboard', auth, admin, heavyLimiter, ctrl.getDashboard);

// Public tapi context user berguna jika login (lihat wishlist, produk)
router.get('/', optionalAuth, ctrl.getAll);
```

**Middleware yang tersedia:**

| Middleware | Import dari | Fungsi |
|---|---|---|
| `auth` | `middlewares/auth.middleware.js` | Wajib login — set `req.user` |
| `admin` | `middlewares/admin.middleware.js` | Wajib role admin (selalu pakai setelah `auth`) |
| `optionalAuth` | `middlewares/optionalAuth.middleware.js` | Login opsional — `req.user` bisa null |
| `validate(schema)` | `middlewares/validate.middleware.js` | Validasi `req.body` dengan AJV schema |
| `createRateLimiter({})` | `middlewares/rateLimiter.middleware.js` | Rate limiting per IP (auto-skip di dev) |
| `upload.single('field')` | `middlewares/upload.middleware.js` | Upload satu file (multipart/form-data) |
| `upload.array('field', n)` | `middlewares/upload.middleware.js` | Upload banyak file |

---

## Pagination

Gunakan helper dari `utils/paginate.js` untuk semua endpoint yang return list:

```js
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// Di service:
const { page, limit, skip } = getPaginationParams(query);

const [items, total] = await Promise.all([
  Model.find(filter).skip(skip).limit(limit).lean(),
  Model.countDocuments(filter),
]);

return { items, meta: buildPaginationMeta(total, page, limit) };

// Di controller:
const { items, meta } = await svc.getAll(req.query);
sendSuccess(res, items, 'Berhasil', 200, meta);
// → Response otomatis menyertakan totalData dan totalPage
```

**Default:** `limit = 10`, `max limit = 100`, `page = 1`

---

## Error Handling

Error global ditangani oleh `middlewares/errorHandler.js`. Kasus yang sudah di-handle otomatis:

| Error | Status | Keterangan |
|---|---|---|
| `err.statusCode` ada | sesuai statusCode | Error dari service (throw manual) |
| `ValidationError` (Mongoose) | 400 | Schema validation gagal |
| `MongoServerError code 11000` | 409 | Duplicate key (email/slug/kode unik) |
| `CastError` (Mongoose) | 400 | ID params bukan ObjectId valid |
| `JsonWebTokenError` | 401 | Token invalid |
| `TokenExpiredError` | 401 | Token expired |
| Semua error lain | 500 | Internal server error |

**Di service, selalu set `statusCode` sebelum throw:**
```js
const err = new Error('Produk tidak ditemukan');
err.statusCode = 404;
throw err;
```

---

## Notifikasi

Gunakan `createNotification` dari `utils/notificationHelper.js` untuk membuat notifikasi in-app. **Category di-derive otomatis dari type** — tidak perlu dikirim manual.

```js
import { createNotification } from '../../utils/notificationHelper.js';

// Selalu wrap dengan .catch() — kegagalan notif tidak boleh abort flow utama
await createNotification({
  userId:    user._id,          // ObjectId user penerima
  title:     'Pembayaran Berhasil',
  message:   'Pesanan ORD-xxx dikonfirmasi.',
  type:      'order_confirmed', // lihat enum di notification.model.js
  relatedId: order._id,         // ObjectId terkait (opsional)
}).catch(() => {});
```

**Tipe notifikasi yang tersedia dan category-nya:**

| Type | Category | Trigger |
|---|---|---|
| `order_confirmed` | `activity` | Payment sukses |
| `ticket_generated` | `activity` | E-tiket digenerate |
| `order_cancelled` | `activity` | Order dibatalkan |
| `refund_approved` | `activity` | Refund disetujui |
| `refund_rejected` | `activity` | Refund ditolak |
| `product_cancelled` | `announcement` | Produk dibatalkan admin |
| `broadcast` | `announcement` | Admin kirim broadcast |

**Menambah type baru:** tambahkan ke array `enum` di `models/notification.model.js`. Jika category-nya `activity`, tambahkan juga ke Set `ACTIVITY_TYPES` di `utils/notificationHelper.js`.

---

## Email

Gunakan `sendMail` dari `config/mailer.js`. Template HTML dibangun dengan helper dari `templates/emailBase.js`.

```js
import { sendMail }        from '../../config/mailer.js';
import { myTemplate }      from '../../templates/my.template.js';

// Selalu wrap dengan .catch() — kegagalan email tidak boleh abort flow utama
const { subject, text, html } = myTemplate({ name: user.name, data });
await sendMail({ to: user.email, subject, text, html }).catch(() => {});
```

**Membuat template email baru:**

```js
// src/templates/namaFitur.template.js
import { emailBase, statusBadge, detailRow, ctaButton } from './emailBase.js';

export const namaFiturTemplate = ({ name, data }) => ({
  subject: 'Subjek email',

  // Plain text fallback — wajib ada untuk email client lama
  text: `Halo ${name},\n\n...teks polos...\n\nSalam,\nTim Travia`,

  html: emailBase({
    title:     'Judul Tab Browser',
    preheader: 'Teks preview 1-2 kalimat yang muncul di inbox sebelum email dibuka.',
    body: `
      ${statusBadge({ text: '✓ Status', type: 'success' })}
      <!-- type: 'success' | 'warning' | 'danger' -->

      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;
        font-weight:700;font-size:26px;color:#1A1510;line-height:1.3;">
        Judul Utama
      </h1>

      <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;
        color:#3D3D3D;line-height:1.7;">
        Halo <strong style="color:#1A1510;">${name}</strong>, teks paragraf pembuka.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background-color:#FAF7F0;border-radius:10px;border:1px solid #E4DDD0;
        border-collapse:collapse;margin-bottom:24px;">
        ${detailRow({ label: 'Label', value: data.value })}
        ${detailRow({ label: 'Label Terakhir', value: data.value2, isLast: true })}
        <!-- isLast: true → hapus border bawah pada baris terakhir -->
        <!-- highlight: true → value tampil italic orange (untuk nilai penting seperti nominal) -->
      </table>

      ${ctaButton({ text: 'Teks Tombol', href: process.env.CLIENT_URL || '#' })}
    `,
  }),
});
```

**Aturan email template:**
- Semua style menggunakan inline CSS — email client tidak mendukung `<style>` external
- Gunakan `Arial,Helvetica,sans-serif` untuk body text (bukan Inter)
- Gunakan `Georgia,'Times New Roman',serif` untuk heading (bukan font custom)
- Warna brand: orange `#FF6B35`, dark `#1A1510`, muted `#8B7355`, card `#F0E8D8`

---

## Upload Gambar

Alur upload gambar menggunakan dua langkah — **tidak ada multer di product/banner routes** kecuali endpoint `/api/upload`.

```
1. Admin upload gambar dulu → POST /api/upload/single (return URL Supabase)
2. Admin kirim URL ke endpoint produk/banner → body JSON biasa
```

Jika module perlu hapus gambar dari Supabase:

```js
import { extractStoragePath, deleteFile } from '../../utils/uploadHelper.js';

// Hapus satu file
const path = extractStoragePath(imageUrl);
if (path) await deleteFile(path).catch(() => {});

// Hapus banyak file
const removed = oldUrls.filter((url) => !newUrls.includes(url));
await Promise.allSettled(
  removed.map((url) => {
    const path = extractStoragePath(url);
    return path ? deleteFile(path).catch(() => {}) : Promise.resolve();
  })
);
```

---

## Konvensi Penamaan

| Entitas | Konvensi | Contoh |
|---|---|---|
| File module | `<nama>.<tipe>.js` | `product.service.js` |
| Model | `<Nama>.model.js` (PascalCase) | `Product.model.js` |
| Template email | `<namaFitur>.template.js` | `orderConfirmed.template.js` |
| Variabel / fungsi | camelCase | `getPaginationParams` |
| Konstanta | UPPER_SNAKE_CASE | `ACTIVITY_TYPES` |
| Route path | kebab-case | `/api/refund-policies` |
| MongoDB field | camelCase | `departureDate`, `bookedSlots` |

---

## Konvensi Database

```js
// ✅ Gunakan .lean() untuk query yang hanya baca — lebih cepat, return plain object
const products = await Product.find(filter).lean();

// ✅ Gunakan findById + .save() untuk update — Mongoose validation tetap berjalan
const product = await Product.findById(id);
Object.assign(product, body);
await product.save();

// ✅ Gunakan Promise.all untuk query paralel yang tidak bergantung satu sama lain
const [total, items] = await Promise.all([
  Model.countDocuments(filter),
  Model.find(filter).skip(skip).limit(limit).lean(),
]);

// ❌ JANGAN gunakan findByIdAndUpdate langsung untuk update — bypass Mongoose validation
await Product.findByIdAndUpdate(id, body); // hindari
```

---

## Rate Limiter

Gunakan `createRateLimiter` dari `middlewares/rateLimiter.middleware.js`. Limiter **otomatis di-skip saat `NODE_ENV !== 'production'`** — tidak perlu konfigurasi tambahan untuk development.

```js
import { createRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

// Buat limiter per route/grup endpoint
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  max:      10,              // max request per window
  message:  'Terlalu banyak percobaan. Coba lagi setelah 15 menit.',
});

router.post('/login', authLimiter, ctrl.login);
```

**Rekomendasi limit berdasarkan jenis endpoint:**

| Jenis | windowMs | max |
|---|---|---|
| Auth (login, register, forgot password) | 15 menit | 10 |
| AI chat | 15 menit | 20 |
| Dashboard admin (query berat) | 1 menit | 20 |
| Password change | 15 menit | 5 |

---

## Hal yang Tidak Perlu Dilakukan

- **Jangan** tambahkan `try-catch` di controller — sudah ditangani `asyncHandler` + `errorHandler` global
- **Jangan** gunakan `res.json()` langsung — gunakan `sendSuccess` / `sendError`
- **Jangan** buat logika bisnis di controller
- **Jangan** lupa ekstensi `.js` di semua import
- **Jangan** simpan file gambar di server — selalu upload ke Supabase Storage
- **Jangan** hardcode URL, secret, atau konfigurasi — semua harus dari `.env`
- **Jangan** buat response format baru — ikuti format `errorStatus/data` yang sudah ada
