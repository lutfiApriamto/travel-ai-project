# Backend Plan — AI Travel Agent Platform
> Dokumen ini merangkum semua keputusan teknis backend sebelum eksekusi dimulai.

---

## Tech Stack

| Komponen | Pilihan |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| File Storage | Supabase Storage |
| Payment | Midtrans Sandbox |
| AI | Gemini API (`@google/genai`) |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel Serverless |

---

## Dependensi

### `dependencies`

| Package | Fungsi |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `dotenv` | Environment variables |
| `cors` | CORS handling |
| `helmet` | Security HTTP headers |
| `compression` | Gzip response compression |
| `cookie-parser` | Parse cookie (refresh token) |
| `morgan` | HTTP request logging (dev) |
| `bcrypt` | Hash password |
| `jsonwebtoken` | JWT access token |
| `express-rate-limit` | Rate limiting |
| `ajv` | JSON Schema validation |
| `xss` | XSS sanitization |
| `uuid` | Generate kode tiket unik |
| `nodemailer` | Kirim email |
| `midtrans-client` | Midtrans payment SDK |
| `@supabase/supabase-js` | File storage client |
| `@google/genai` | Gemini API SDK |
| `multer` | Handle multipart/form-data (upload foto) |
| `sharp` | Resize & compress gambar ke WebP sebelum upload ke Supabase |
| `node-cron` | Cron job harian (auto-expire produk) |
| `dayjs` | Kalkulasi tanggal (H- refund policy) |
| `pdfkit` | Generate e-tiket PDF |
| `json2csv` | Export laporan keuangan ke CSV |
| `ws` | WebSocket adapter untuk Supabase Realtime — wajib di Node.js < 22 |

### `devDependencies`

| Package | Fungsi |
|---|---|
| `nodemon` | Auto-restart dev server |

> **Catatan 1:** `express-mongo-sanitize` tidak dipakai karena tidak kompatibel dengan Express 5.
> Gantinya menggunakan custom sanitizer (strip `$`/`.` + xss filtering).
>
> **Catatan 2:** `uuid` terinstall tapi tidak dipakai — kode order dan tiket di-generate dengan `crypto.randomBytes` (built-in Node.js, lebih aman).
>
> **Catatan 3:** `ws` diperlukan karena `@supabase/supabase-js` menginisialisasi Realtime client (yang butuh WebSocket) saat `createClient()` dipanggil, meskipun kita hanya pakai Storage. Node.js < 22 tidak punya native WebSocket.

---

## Format Response

### Success
```json
{
    "errorStatus": false,
    "data": {
        "data": { } atau [ ],
        "message": "Berhasil",
        "totalData": 33,
        "totalPage": 4
    }
}
```
> `totalData` dan `totalPage` hanya muncul jika response menggunakan pagination.

### Error
```json
{
    "errorStatus": true,
    "errorType": "NotFound",
    "errors": [
        { "message": "Produk tidak ditemukan", "code": 404 }
    ]
}
```

### errorType Mapping (auto-derive dari status code)
| Status Code | errorType |
|---|---|
| 400 | `BadRequest` |
| 401 | `Unauthorized` |
| 403 | `Forbidden` |
| 404 | `NotFound` |
| 409 | `Conflict` |
| 410 | `Gone` |
| 422 | `UnprocessableEntity` |
| 429 | `TooManyRequests` |
| 500 | `InternalServerError` |

---

## Struktur Folder & File

```
TRIP_BE/
├── api/
│   └── index.js                        ← Entry point (dev server + Vercel serverless)
│
├── src/
│   ├── app.js                          ← Express setup, global middleware, mount semua routes
│   │
│   ├── config/
│   │   ├── db.js                       ← Koneksi MongoDB (cached untuk serverless)
│   │   ├── mailer.js                   ← Nodemailer Gmail SMTP setup
│   │   ├── midtrans.js                 ← Midtrans SDK (Sandbox mode)
│   │   ├── supabase.js                 ← Supabase client (file storage)
│   │   └── gemini.js                   ← Gemini API client setup
│   │
│   ├── models/
│   │   ├── user.model.js               ← Data user (nama, email, password, role, foto, dll)
│   │   ├── category.model.js           ← Kategori trip (Open Trip, Honeymoon, dll)
│   │   ├── type.model.js               ← Tipe/vibe (Family, Romance, Religi, dll)
│   │   ├── tag.model.js                ← Tags marketing (Promo, Terlaris, New, dll)
│   │   ├── product.model.js            ← Produk paket wisata (inti platform)
│   │   ├── banner.model.js             ← Banner promo halaman beranda
│   │   ├── wishlist.model.js           ← Wishlist user per produk
│   │   ├── cart.model.js               ← Keranjang belanja user
│   │   ├── order.model.js              ← Data pesanan
│   │   ├── ticket.model.js             ← E-tiket per order
│   │   ├── refund.model.js             ← Pengajuan refund & pembatalan
│   │   ├── refundPolicy.model.js       ← Kebijakan refund H- (configurable admin)
│   │   ├── finance.model.js            ← Riwayat transaksi keuangan platform
│   │   ├── notification.model.js       ← In-app notification per user
│   │   ├── province.model.js           ← Data provinsi Indonesia
│   │   ├── regency.model.js            ← Data kabupaten/kota
│   │   ├── district.model.js           ← Data kecamatan
│   │   └── village.model.js            ← Data desa/kelurahan
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js          ← Register, Login, Logout, Forgot & Reset Password
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.schema.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.routes.js          ← Profil, edit profil, ganti password
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.schema.js
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.routes.js         ← Dashboard stats, manajemen user, refund policy
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.service.js
│   │   │   └── admin.schema.js
│   │   │
│   │   ├── category/
│   │   │   ├── category.routes.js      ← CRUD (admin), list (public)
│   │   │   ├── category.controller.js
│   │   │   ├── category.service.js
│   │   │   └── category.schema.js
│   │   │
│   │   ├── type/
│   │   │   ├── type.routes.js          ← CRUD (admin), list (public)
│   │   │   ├── type.controller.js
│   │   │   ├── type.service.js
│   │   │   └── type.schema.js
│   │   │
│   │   ├── tag/
│   │   │   ├── tag.routes.js           ← CRUD (admin), list (public)
│   │   │   ├── tag.controller.js
│   │   │   ├── tag.service.js
│   │   │   └── tag.schema.js
│   │   │
│   │   ├── banner/
│   │   │   ├── banner.routes.js        ← CRUD (admin), list aktif (public)
│   │   │   ├── banner.controller.js
│   │   │   ├── banner.service.js
│   │   │   └── banner.schema.js
│   │   │
│   │   ├── product/
│   │   │   ├── product.routes.js       ← CRUD + duplikasi + bulk update (admin), browse + filter + search (public)
│   │   │   ├── product.controller.js
│   │   │   ├── product.service.js
│   │   │   └── product.schema.js
│   │   │
│   │   ├── wishlist/
│   │   │   ├── wishlist.routes.js      ← Add, remove, list (user only)
│   │   │   ├── wishlist.controller.js
│   │   │   └── wishlist.service.js
│   │   │
│   │   ├── cart/
│   │   │   ├── cart.routes.js          ← Add, remove, edit, list (user only)
│   │   │   ├── cart.controller.js
│   │   │   ├── cart.service.js
│   │   │   └── cart.schema.js
│   │   │
│   │   ├── order/
│   │   │   ├── order.routes.js         ← Checkout, riwayat, detail (user) + list semua (admin)
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   └── order.schema.js
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.routes.js       ← Create transaction (auth), webhook handler (public/no-auth)
│   │   │   ├── payment.controller.js
│   │   │   └── payment.service.js
│   │   │
│   │   ├── ticket/
│   │   │   ├── ticket.routes.js        ← Lihat & download tiket (user), list semua (admin)
│   │   │   ├── ticket.controller.js
│   │   │   └── ticket.service.js
│   │   │
│   │   ├── refund/
│   │   │   ├── refund.routes.js        ← Ajukan refund (user), approve/reject (admin)
│   │   │   ├── refund.controller.js
│   │   │   ├── refund.service.js
│   │   │   └── refund.schema.js
│   │   │
│   │   ├── finance/
│   │   │   ├── finance.routes.js       ← Saldo, riwayat, withdrawal, export CSV/PDF (admin only)
│   │   │   ├── finance.controller.js
│   │   │   └── finance.service.js
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.routes.js  ← List, unread count, mark as read (user only)
│   │   │   ├── notification.controller.js
│   │   │   └── notification.service.js
│   │   │
│   │   ├── wilayah/
│   │   │   ├── wilayah.routes.js       ← List provinsi, kab/kota, kecamatan, desa (public + admin CRUD)
│   │   │   ├── wilayah.controller.js
│   │   │   ├── wilayah.service.js
│   │   │   └── wilayah.schema.js
│   │   │
│   │   └── ai/
│   │       ├── ai.routes.js            ← POST /api/ai/chat (auth required, rate limiter ketat)
│   │       ├── ai.controller.js
│   │       ├── ai.service.js           ← Inject system prompt + katalog produk → Gemini → validasi ID → return structured output
│   │       └── ai.schema.js            ← Validasi request body (message, conversationHistory)
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js                  ← Verifikasi JWT, set req.user, cek isActive
│   │   ├── admin.middleware.js                 ← Cek req.user.role === 'admin'
│   │   ├── optionalAuth.middleware.js          ← Auth tidak wajib — set req.user jika ada token, null jika tidak
│   │   ├── upload.middleware.js                ← Multer config terpusat (single & array variant)
│   │   ├── verifyMidtransWebhook.middleware.js ← Verifikasi SHA512 signature dari Midtrans (bukan JWT)
│   │   ├── validate.middleware.js              ← Ajv JSON Schema validation
│   │   ├── sanitizer.middleware.js             ← XSS + NoSQL injection prevention (custom, bukan library)
│   │   ├── rateLimiter.middleware.js           ← Rate limiter factory (reusable per endpoint)
│   │   ├── errorHandler.js                    ← Global error handler
│   │   └── notFound.middleware.js              ← 404 handler
│   │
│   ├── utils/
│   │   ├── apiResponse.js             ← sendSuccess / sendError (format response konsisten)
│   │   ├── asyncHandler.js            ← Wrapper async controller → forward error ke next()
│   │   ├── jwtHelper.js               ← signToken / verifyToken
│   │   ├── paginate.js                ← getPaginationParams / buildPaginationMeta
│   │   ├── uploadHelper.js            ← uploadImage (sharp → WebP → Supabase), deleteFile, extractStoragePath
│   │   ├── generateOrderCode.js       ← Generate kode order unik (format: ORD-YYYYMMDD-XXXX)
│   │   ├── generateTicketCode.js      ← Generate kode tiket unik (format: TRIP-XXXX-XXXX)
│   │   ├── generateSlug.js            ← Generate slug unik dari nama produk
│   │   ├── pdfHelper.js               ← generateTicketPdf(ticket) → Buffer PDF e-tiket
│   │   ├── csvHelper.js               ← generateFinanceCsv(transactions) → string CSV laporan keuangan
│   │   ├── dateHelper.js              ← daysBetween, formatDate
│   │   ├── currencyHelper.js          ← formatRupiah (Rp 1.500.000)
│   │   └── notificationHelper.js      ← createNotification() — dipanggil dari service lain
│   │
│   ├── jobs/
│   │   └── expireProducts.job.js      ← Cron job harian: auto-expire produk yang tanggalnya lewat
│   │
│   ├── templates/
│   │   ├── forgotPassword.template.js
│   │   ├── resetPassword.template.js
│   │   ├── orderConfirmed.template.js  ← Email konfirmasi order + ringkasan pesanan
│   │   ├── orderCancelled.template.js  ← Email notifikasi produk di-cancel admin
│   │   ├── refundApproved.template.js  ← Email refund disetujui + nominal refund
│   │   └── refundRejected.template.js  ← Email refund ditolak + alasan
│   │
│   └── seeds/
│       └── wilayah.seed.js            ← Baca JSON wilayah → insert ke MongoDB (sekali jalan)
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── vercel.json
```

---

## Daftar Model & Relasinya

```
User
  ├── role: 'user' | 'admin'
  └── foto profil (URL Supabase)

Category / Type / Tag
  └── Many-to-many ke Product (via array of ObjectId di Product)
  └── Dihapus → otomatis terhapus dari semua produk (produk tidak error)

Product
  ├── categories[]  → Category._id
  ├── types[]       → Type._id
  ├── tags[]        → Tag._id
  ├── destinations  → nama kota/daerah (string, Indonesia only)
  └── status: 'Draft' | 'Active' | 'Full' | 'Expired' | 'Cancelled'

Banner
  └── standalone (tidak berelasi ke model lain)

Wishlist
  ├── userId   → User._id
  └── productId → Product._id
  └── Auto-hapus jika produk dihapus

Cart
  ├── userId    → User._id
  └── items[]
        ├── productId → Product._id
        ├── quantity
        └── addons[]
  └── Auto-update jika produk dihapus

Order
  ├── userId    → User._id
  ├── productId → Product._id
  ├── paymentId (Midtrans transaction ID)
  └── status: 'pending_payment' | 'paid' | 'cancelled' | 'refunded'

Ticket
  ├── orderId   → Order._id
  ├── userId    → User._id
  └── isValid: true | false

Refund
  ├── orderId   → Order._id
  ├── userId    → User._id
  └── status: 'pending' | 'approved' | 'rejected'

RefundPolicy
  └── rules[] → { minDay, maxDay, percentage }
  └── Satu dokumen global, configurable oleh admin

Finance
  ├── type: 'income' | 'outcome'
  ├── category: 'order' | 'refund' | 'withdrawal'
  ├── relatedId → Order._id atau Refund._id (opsional)
  └── amount, description, createdAt

Notification
  ├── userId    → User._id
  ├── type: 'order_confirmed' | 'refund_approved' | 'refund_rejected' | 'product_cancelled'
  ├── relatedId → orderId atau refundId (untuk tombol "Lihat Detail")
  └── isRead: boolean

Province / Regency / District / Village
  └── Hierarki: Province → Regency → District → Village
  └── Relasi via id code (bukan ObjectId)
```

---

## Modul AI — Detail Implementasi

### Konsep Halaman AI (Frontend)
```
┌─────────────────────────────────────────────┐
│  💬 Chat dengan AI Travel Agent             │
│                                             │
│  AI: Halo! Mau liburan seperti apa?        │
│  User: Mau healing bareng pasangan...       │
│  AI: Cocok nih buat Honeymoon Trip!        │
│                                             │
│  [input chat]                    [Kirim]    │
├─────────────────────────────────────────────┤
│  Produk (dinamis — dikontrol AI)            │
│  [sebelum chat → semua produk tampil]       │
│  [setelah AI reply → hanya rekomendasi]     │
└─────────────────────────────────────────────┘
```

### Endpoint
```
POST /api/ai/chat
Auth: required
Rate limit: ketat (lebih ketat dari endpoint biasa)

Request body:
{
  "message": "mau liburan bareng pasangan budget 3 juta",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "model", "content": "..." }
  ]
}

Response:
{
  "errorStatus": false,
  "data": {
    "data": {
      "message": "Wah, cocok banget buat Honeymoon Trip atau Staycation!...",
      "recommendedProductIds": ["id1", "id2", "id3"],
      "showAll": false
    },
    "message": "Berhasil"
  }
}
```

### Alur di `ai.service.js`
```
1. Ambil semua produk aktif dari DB
   (hanya field: _id, name, categories, types, price, departureDate, slots)

2. Susun system prompt:
   - Role AI sebagai travel agent sales yang conversational
   - Instruksi return JSON: { message, recommendedProductIds, showAll }
   - Inject katalog produk aktif
   - Aturan: jika belum cukup info → showAll: true, tanya balik dulu

3. Kirim ke Gemini API:
   - System prompt + conversationHistory + message baru

4. Parse response Gemini → extract JSON

5. Validasi recommendedProductIds:
   - Cek setiap ID exist di DB
   - Buang ID yang tidak valid (antisipasi hallucination)

6. Return { message, recommendedProductIds (tervalidasi), showAll }
```

### Structured Output dari Gemini
```json
{
  "message": "Teks percakapan AI yang tampil di chat bubble",
  "recommendedProductIds": ["mongoObjectId1", "mongoObjectId2"],
  "showAll": false
}
```
- `showAll: true` → AI belum punya cukup info, tampilkan semua produk
- `showAll: false` → AI sudah rekomendasiin, filter grid ke `recommendedProductIds`

### Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| AI hallucinate product ID | Backend validasi semua ID ke DB — ID tidak valid dibuang sebelum dikirim ke frontend |
| Rate abuse / biaya token membengkak | Rate limiter ketat di endpoint `/api/ai/chat` |
| Response lambat (1-5 detik) | Frontend tampilkan loading state. Streaming bisa ditambahkan post-MVP |
| Token mahal karena katalog besar | Inject hanya field minimal produk (bukan full detail + itinerary) |
| Conversation history terlalu panjang | Batasi maksimal 10 pesan terakhir yang dikirim ke Gemini |
| API key Gemini terekspos | Tidak mungkin — Gemini dipanggil server-side. Key aman di `.env` backend |
| CORS | Tidak ada risiko — Gemini dipanggil dari backend, bukan dari browser |

---

## Behavior Otomatis Sistem

| Kondisi | Yang Terjadi |
|---|---|
| Payment sukses (Midtrans webhook) | Order → `paid`, Ticket auto-generate, Finance +income, Slot produk -1, Email + Notifikasi ke user |
| Slot produk = 0 | Status produk → `Full` otomatis |
| Tanggal keberangkatan terlewat | Status produk → `Expired` otomatis (cron job harian) |
| Refund diapprove admin | Midtrans refund triggered, Ticket → invalid, Slot +1 (jika belum expired), Finance +outcome, Email + Notifikasi ke user |
| Refund direject admin | Email + Notifikasi ke user, order tetap berjalan |
| Produk di-cancel admin | Semua pemesan dinotifikasi (email + in-app), refund massal bisa di-trigger |
| Produk dihapus admin | Wishlist & cart semua user otomatis bersih |
| Kategori/Tipe/Tags dihapus | Otomatis terhapus dari semua produk (produk tidak error) |

---

## Pola Autentikasi & Otorisasi

| Jenis Route | Middleware |
|---|---|
| Public (tanpa login) | — |
| Opsional auth (login opsional) | `optionalAuth` |
| User harus login | `auth` |
| Admin only | `auth` + `admin` |
| Payment webhook (Midtrans hit endpoint ini) | `verifyMidtransWebhook` — SHA512 signature check, bukan JWT |

### Token Strategy
- **Access Token:** JWT, expire 15 menit, dikirim via `Authorization: Bearer <token>`
- **Refresh Token:** Opaque (random bytes), expire 30 hari, disimpan hashed di DB, dikirim via HttpOnly cookie

---

## In-App Notification

Notifikasi **tidak real-time** — user perlu refresh/buka halaman notifikasi untuk melihat yang baru.
Dibuat dari dalam service lain via `notificationHelper.createNotification()`.

### Endpoint Notifikasi
```
GET   /api/notifications              ← list notifikasi user (paginated)
GET   /api/notifications/unread-count ← jumlah belum dibaca (untuk badge)
PATCH /api/notifications/:id/read     ← tandai satu sudah dibaca
PATCH /api/notifications/read-all     ← tandai semua sudah dibaca
```

### Trigger Notifikasi
| Trigger | Tipe | Pesan |
|---|---|---|
| Pembayaran sukses | `order_confirmed` | "Pesanan kamu untuk [nama produk] berhasil dikonfirmasi" |
| Refund diapprove | `refund_approved` | "Refund sebesar Rp X untuk [nama produk] telah diproses" |
| Refund direject | `refund_rejected` | "Pengajuan refund untuk [nama produk] ditolak" |
| Produk di-cancel admin | `product_cancelled` | "Paket [nama produk] dibatalkan. Silakan hubungi admin" |

---

## Cron Job

**`expireProducts.job.js`** — Jalan setiap hari jam 00:00 WIB

```
Cari semua produk dengan status 'Active' atau 'Full'
yang tanggal keberangkatannya < hari ini
  ↓
Update status → 'Expired'
```

---

## Wilayah

Data wilayah administratif Indonesia (BPS):
- 34 Provinsi
- 514 Kabupaten/Kota
- 7.215 Kecamatan
- 80.534 Desa/Kelurahan

File JSON tersedia di folder `wilayah/`. Di-seed ke MongoDB sekali saat setup via `seeds/wilayah.seed.js`.

Untuk filtering destinasi produk, yang dipakai user/admin adalah level **Provinsi** dan **Kabupaten/Kota**. Level Kecamatan dan Desa tersedia untuk keperluan data yang lebih detail jika dibutuhkan.

---

## Catatan Scope MVP

- Destinasi: **Indonesia only**
- Model produk: **1 Produk = 1 Tanggal Keberangkatan**
- Payment: **Midtrans Sandbox** (dummy, tidak menyedot saldo)
- AI: **Gemini API** + prompt engineering (tanpa model ML custom)
- Notifikasi: **REST only** (tidak real-time, tidak WebSocket)
- File storage: **Supabase Storage** (foto produk, avatar user)
- Target selesai: **Sprint 1 minggu (MVP)**

---

## Catatan Teknis Implementasi

> Dicatat seiring implementasi berjalan. Berisi keputusan teknis yang menyimpang atau memperjelas rencana awal.

| # | Topik | Keputusan |
|---|---|---|
| 1 | Upload foto | Fungsi di `uploadHelper.js` bernama `uploadImage` (bukan `uploadFile`). Semua gambar dikompresi dengan `sharp` → WebP quality 82, max 1280px sebelum upload ke Supabase |
| 2 | Kode order | Di-generate di `utils/generateOrderCode.js` (format: `ORD-YYYYMMDD-XXXX`) — bukan inline di service |
| 3 | Kode tiket | Di-generate di `utils/generateTicketCode.js` (format: `TRIP-XXXX-XXXX`) menggunakan `crypto.randomBytes`, bukan package `uuid` |
| 4 | Supabase + Node.js 20 | `@supabase/supabase-js` menginisialisasi Realtime client saat `createClient()` — membutuhkan WebSocket yang tidak ada di Node.js < 22. Fix: pass `{ realtime: { transport: WebSocket } }` dari package `ws` |
| 5 | Gemini SDK | Package yang dipakai adalah `@google/genai` v1.x (bukan `@google/generative-ai`). Import: `{ GoogleGenAI }`. Init: `new GoogleGenAI({ apiKey })`. Generate: `genAI.models.generateContent({ model, contents, config })`. System instruction masuk di `config.systemInstruction`. JSON output via `config.responseMimeType: 'application/json'` |
| 6 | AJV email validation | AJV v8 tanpa `ajv-formats` tidak bisa validasi `format: 'email'`. Diganti dengan `pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'` di semua schema yang validasi email |
| 7 | Auth cookie name | Cookie refresh token menggunakan nama `trip_refresh` (bukan `jm_refresh` dari project referensi) |
| 8 | PDF tiket | `generateTicketPdf(ticket)` di `pdfHelper.js` return `Buffer`. Dikirim ke client via `res.send(buffer)` dengan header `Content-Type: application/pdf` dan `Content-Disposition: attachment` |
| 9 | CSV laporan | `generateFinanceCsv(transactions)` di `csvHelper.js` return string dengan BOM (`withBOM: true`) agar Excel di locale Indonesia membaca encoding dengan benar |
| 10 | Webhook Midtrans | Endpoint `POST /api/payment/webhook` menggunakan middleware `verifyMidtransWebhook` — bukan JWT. CORS tidak menghalangi karena Midtrans hit dari server mereka (bukan browser, tidak ada Origin header) |
| 11 | Wilayah module | Memiliki 4 file (termasuk `wilayah.schema.js` untuk validasi CRUD). Admin CRUD tersedia untuk semua level (provinsi, kab/kota, kecamatan, desa) — mendukung ekspansi data di luar BPS. GET villages wajib ada minimal satu filter (`district_id` atau `search`) karena data 80K+ record |
| 12 | Category — GET all | Menggunakan `optionalAuth` middleware. Jika admin → return semua status (active + inactive). Jika public/tidak login → return active saja. Satu endpoint, tidak ada duplikasi |
| 13 | Category — slug | Slug auto-generate dari `name` saat POST, re-generate saat PATCH jika nama berubah. Uniqueness dicek loop ke DB. Slug helper ditulis inline di `category.service.js` (tidak reuse `generateSlug.js` yang tied ke Product model) |
| 14 | Category — image | Opsional saat create. Upload via multer (`upload.single('image')`) + `uploadImage` helper (sharp → WebP → Supabase). Saat PATCH dengan file baru → gambar lama di Supabase dihapus dulu via `deleteFile`. Saat DELETE → gambar dihapus dari Supabase |
| 15 | Category — delete cascade | Hard delete. Saat kategori dihapus → `Product.updateMany({ categories: id }, { $pull: { categories: id } })` otomatis membersihkan referensi dari semua produk |
| 16 | AJV coerceTypes | `validate.middleware.js` diupdate dengan `coerceTypes: true` di AJV instance. Diperlukan karena multipart form-data (multer) mengirim semua field sebagai string, termasuk field integer seperti `sortOrder`. Aman untuk JSON request karena tipe sudah benar |
| 17 | Type vs Category | Module `type` lebih simpel dari `category` — tidak ada `image` dan `sortOrder`. Fields: `name`, `slug`, `description`, `status`. Request body dikirim sebagai JSON biasa (bukan multipart), tidak butuh multer. Pola GET all pakai `optionalAuth` sama seperti category |
| 18 | Tag — field color | Module `tag` paling simpel: fields `name`, `slug`, `color`, `status`. Tanpa `description`, `image`, `sortOrder`. Field `color` menyimpan hex color (contoh: `#FF5733`) untuk warna badge tag di frontend. Divalidasi dengan pattern `^#[0-9A-Fa-f]{6}$` di schema |
| 19 | Auto-delete Supabase | Setiap module yang memiliki field image wajib menghapus file dari Supabase saat: (1) data dihapus, (2) image diupdate dengan file baru. Gunakan `extractStoragePath(url)` + `deleteFile(path)` dari `uploadHelper.js`. Wrap dengan `.catch(() => {})` agar kegagalan hapus file tidak membatalkan operasi utama |
| 20 | Upload module | Module dedicated `/api/upload` untuk upload/delete gambar secara independen (admin only). Endpoint: `POST /single`, `POST /bulk` (max 10), `DELETE /single`, `DELETE /bulk` (max 50). Query param `?folder=xxx` menentukan subfolder Supabase (disanitasi, default: `uploads`). `DELETE /bulk` pakai `Promise.allSettled` agar satu kegagalan tidak menghentikan penghapusan lainnya |
| 21 | Banner model | Menggunakan `isActive` (boolean) dan `order` (number) — bukan `status` enum dan `sortOrder` seperti module lain. Ini sesuai model yang sudah dirancang sebelumnya, tidak diubah. Image **wajib** saat create |
