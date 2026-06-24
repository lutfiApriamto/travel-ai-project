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
│   │   │   ├── admin.routes.js         ← Dashboard stats + manajemen user (admin only); dashboardLimiter 20req/menit
│   │   │   ├── admin.controller.js
│   │   │   └── admin.service.js
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
│   │   │   ├── notification.routes.js  ← List, unread count, mark as read, delete (user) + broadcast (admin)
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   └── notification.schema.js  ← broadcastSchema (title, message, targetUserIds?)
│   │   │
│   │   ├── wilayah/
│   │   │   ├── wilayah.routes.js       ← List provinsi, kab/kota, kecamatan, desa (public + admin CRUD)
│   │   │   ├── wilayah.controller.js
│   │   │   ├── wilayah.service.js
│   │   │   └── wilayah.schema.js
│   │   │
│   │   └── ai/
│   │       ├── ai.routes.js            ← POST /api/ai/chat (auth + aiLimiter 20req/15min + validate)
│   │       ├── ai.controller.js
│   │       ├── ai.service.js           ← Build system prompt + inject katalog → Gemini → validasi ID → return structured output
│   │       └── ai.schema.js            ← chatSchema: message (required) + conversationHistory (max 20 items)
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
│   │   ├── emailBase.js                ← Shared HTML wrapper + komponen (detailRow, ctaButton, statusBadge)
│   │   ├── forgotPassword.template.js
│   │   ├── resetPassword.template.js
│   │   ├── passwordChanged.template.js ← Email notifikasi ganti password berhasil
│   │   ├── orderConfirmed.template.js  ← Email konfirmasi order + ringkasan pesanan
│   │   ├── productCancelled.template.js ← Email notifikasi produk di-cancel admin (kirim ke semua pemesan paid)
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
  ├── type: 'order_confirmed' | 'ticket_generated' | 'order_cancelled' | 'refund_approved' | 'refund_rejected' | 'product_cancelled' | 'broadcast'
  ├── relatedId → orderId / refundId / ticketId (untuk tombol "Lihat Detail", opsional)
  ├── isRead: boolean
  ├── readAt: Date | null
  └── isDeleted: boolean (soft delete)

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

### Keputusan Desain AI Module
- Model: `gemini-2.0-flash` — cepat dan hemat token
- `responseMimeType: 'application/json'` — Gemini return JSON langsung, tidak perlu parsing manual
- History dipotong ke **maks 10 pesan terakhir** sebelum dikirim ke Gemini
- Katalog produk yang diinjek: `_id, name, categories, types, price, departureDate, destinations, shortDescription, availableSlots` (bukan full detail)
- Fallback jika Gemini error → return `{ showAll: true, recommendedProductIds: [] }` + pesan error — frontend tidak crash
- Jika semua ID dari Gemini hallucinated → paksa `showAll: true` agar grid tidak kosong
- System prompt enforce: (1) Bahasa Indonesia, (2) topik travel only, (3) gali kebutuhan dulu, (4) JSON output format

### Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| AI hallucinate product ID | Backend validasi semua ID ke DB — ID tidak valid dibuang sebelum dikirim ke frontend |
| Rate abuse / biaya token membengkak | `createRateLimiter` — maks 20 req/15 menit per IP (skip di development) |
| Response lambat (1-5 detik) | Frontend tampilkan loading state. Streaming bisa ditambahkan post-MVP |
| Token mahal karena katalog besar | Inject hanya field minimal produk (bukan full detail + itinerary) |
| Conversation history terlalu panjang | Potong ke maks 10 pesan terakhir + AJV validasi maxItems: 20 |
| AI bahas topik di luar travel | System prompt instruksikan tolak pertanyaan non-travel dengan sopan |
| API key Gemini terekspos | Tidak mungkin — Gemini dipanggil server-side. Key aman di `.env` backend |
| Gemini API down / timeout | Try-catch dengan fallback response — endpoint tidak throw error ke user |

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
GET    /api/notifications              ← list notifikasi user (cursor-based, filter ?isRead, ?category, ?search)
GET    /api/notifications/unread-count ← jumlah belum dibaca (untuk badge)
PATCH  /api/notifications/read-all     ← tandai semua sudah dibaca
PATCH  /api/notifications/:id/read     ← tandai satu sudah dibaca (set isRead=true, readAt=now)
DELETE /api/notifications/:id          ← soft delete notifikasi milik user
POST   /api/notifications/broadcast    ← admin kirim notifikasi ke semua user atau user tertentu (targetUserIds[])
```

### Query Params `GET /api/notifications`
| Param | Nilai | Keterangan |
|---|---|---|
| `cursor` | ObjectId string | Cursor dari batch sebelumnya (infinity scroll) |
| `limit` | number (default 20, max 50) | Jumlah item per batch |
| `isRead` | `true` / `false` | Filter status baca |
| `category` | `activity` / `announcement` | Filter tab kategori |
| `search` | string | Cari di title & message (regex case-insensitive) |

Response shape:
```json
{
  "notifications": [...],
  "nextCursor": "<ObjectId atau null>",
  "hasMore": true
}
```

### Trigger Notifikasi
| Trigger | Tipe | Category |
|---|---|---|
| Pembayaran sukses | `order_confirmed` | `activity` |
| Tiket digenerate | `ticket_generated` | `activity` |
| Order dibatalkan | `order_cancelled` | `activity` |
| Refund diapprove | `refund_approved` | `activity` |
| Refund direject | `refund_rejected` | `activity` |
| Produk di-cancel admin | `product_cancelled` | `announcement` |
| Admin broadcast | `broadcast` | `announcement` |

### Keputusan Desain Notifikasi
- **Pagination:** cursor-based (bukan offset) — konsisten saat item baru masuk, ideal untuk infinity scroll
- **Category:** auto-derive dari `type` di `notificationHelper.js` — tidak perlu dikirim di request
- **Search:** regex case-insensitive di `title` + `message` — cukup untuk portfolio scale
- Tidak real-time — user perlu refresh/buka halaman untuk melihat yang baru
- Soft delete (`isDeleted: true`) — data tetap tersimpan, tidak tampil ke user
- `readAt` field — catat kapan tepatnya notifikasi dibaca
- Admin tidak bisa melihat notifikasi user (tiap user hanya lihat milik sendiri)
- Broadcast ke semua user → `User.find({ role: 'user' })` + `Notification.insertMany()` (fan-out)
- Broadcast ke user tertentu → `targetUserIds[]` di request body (opsional)

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
| 22 | Product — image handling | Admin upload image terlebih dahulu via `/api/upload`, lalu kirim URL ke endpoint produk. Tidak ada multer di product routes — body selalu JSON. Saat update: diff gallery lama vs baru, URL yang dihapus otomatis di-delete dari Supabase. Thumbnail: jika URL berubah atau di-set null, URL lama dihapus dari Supabase. Saat delete produk: semua URL (thumbnail + gallery) dihapus dari Supabase |
| 23 | Product — duplicate | Clone semua field teks saja. Thumbnail dan gallery dikosongkan (null/[]) — tidak share URL dengan produk asal (mencegah broken image jika produk asal dihapus). Status selalu `draft`, bookedSlots/soldCount/viewCount di-reset ke 0. Slug di-generate dari "[nama] copy" |
| 24 | Product — soldCount & viewCount | `soldCount` auto-increment saat order confirmed (via payment module). `viewCount` auto-increment saat `GET /api/products/:id` atau `GET /api/products/slug/:slug` dipanggil oleh publik (non-admin). Admin tidak men-trigger increment viewCount |
| 25 | Product — filter & search | Full-text search via `?search=` mencakup name, shortDescription, destinations. Filter tersedia: `?status=` (admin only), `?category=`, `?type=`, `?tag=` (by ObjectId), `?departureCity=`, `?destination=` (partial match), `?minPrice=`, `?maxPrice=`. Bulk status update hanya bisa set status admin-settable: draft, active, cancelled (bukan full/expired yang auto) |
| 26 | User — change password email | Saat user ganti password via `PATCH /api/users/me/change-password`, sistem kirim email notifikasi plain text ke email user. Template: `passwordChanged.template.js` (sama polanya dengan `resetPassword.template.js`, `html: null`). `sendMail` di-wrap `.catch(() => {})` agar kegagalan email tidak membatalkan proses ganti password. Endpoint dilindungi `createRateLimiter` (max 5x per 15 menit) — sama seperti auth endpoints |
| 27 | User — suspend | Toggle `isActive` via `PATCH /api/users/:id/suspend` (admin only). Saat di-suspend, user tidak bisa login (dicek di `auth.service.js` login + refresh). Token yang sudah ada dibiarkan expired natural (15 menit) — tidak ada blacklist. Admin tidak bisa di-suspend (guard di service) |
| 28 | User — riwayat order | Tidak digabung di `GET /api/users/:id`. Riwayat order diambil terpisah dari module order via `GET /api/orders?userId=xxx` (admin) |
| 29 | Wishlist — filter & search | Filter diterapkan pada data produk bukan wishlist document. Strategi: (1) ambil semua productId dari wishlist user, (2) query Product dengan `_id: { $in: productIds }` + filter tambahan. Lebih efisien dari populate-then-filter di memory. Filter: `?search=` (name/shortDescription/destinations), `?category=`, `?type=`, `?tag=`, `?destination=`, `?minPrice=`, `?maxPrice=`, pagination |
| 30 | Wishlist — add idempotent | `POST /api/wishlist/:productId` bersifat idempotent — jika produk sudah ada di wishlist, return sukses tanpa error. Mencegah error saat user double-click tombol wishlist di frontend |
| 31 | Wishlist — check endpoint | `GET /api/wishlist/check/:productId` return `{ isWishlisted: true/false }` untuk satu produk. Digunakan frontend untuk tampilkan icon hati terisi/kosong di halaman listing & detail produk tanpa harus load seluruh wishlist. Diregister SEBELUM `/:productId` untuk hindari konflik route |
| 32 | Cart — add idempotent/upsert | `POST /api/cart/items` bersifat upsert — jika produk sudah ada di cart, item di-update (participants, addOns, note). Jika belum ada, di-push ke array items. Tidak ada 409 Conflict |
| 33 | Cart — addOns price dari DB | Request hanya kirim `name` untuk addOn yang dipilih. Service mencari addOn di `product.addOns` dan menggunakan price dari DB. Mencegah price manipulation dari frontend |
| 34 | Cart — validasi slot | Saat add/edit item, dicek: (1) `product.status === 'active'`, (2) `participants <= quota - bookedSlots`. Edit item hanya fetch product jika `participants` atau `addOns` berubah (efisiensi) |
| 35 | Cart — isAvailable flag | GET /api/cart menambahkan `isAvailable` di tiap item: `true` jika `product.status === 'active'` DAN `remainingSlots >= participants`. Frontend tampilkan warning untuk item yang tidak tersedia. Checkout di order module akan menolak item dengan `isAvailable: false` |
| 36 | Cart — search & filter | Sama seperti wishlist: filter diterapkan pada product data di antara productId yang ada di cart. Filter: `?search=`, `?category=`, `?type=`, `?tag=`, `?destination=`, `?minPrice=`, `?maxPrice=`, pagination |
| 37 | Order — checkout multi-item | `POST /api/orders` menerima `{ productIds: [] }` — user memilih item mana dari cart yang di-checkout. Sistem buat 1 order per productId. Semua validasi (product active, slot cukup) dilakukan DULU untuk semua item sebelum `Order.create()` dipanggil — agar tidak ada partial order jika validasi gagal di tengah |
| 38 | Order — totalPrice formula | `totalPrice = (product.price × participants) + sum(addOn.price)` — addOns dihitung sebagai flat fee per booking, bukan per orang |
| 39 | Order — productSnapshot | Saat checkout, field minimal produk di-snapshot ke `productSnapshot`: name, price, departureDate, returnDate, duration, departureCity, destinations, meetingPoint, thumbnail. Data order tetap akurat meski produk diedit/dihapus admin. `productId` tetap disimpan untuk populate detail jika produk masih ada |
| 40 | Order — bookedSlots | `bookedSlots` TIDAK di-increment saat checkout. Hanya di-increment saat payment confirmed via Midtrans webhook (di payment module). Cancel pending order tidak butuh rollback slot |
| 41 | Order — role-based list | `GET /api/orders` satu endpoint — user hanya lihat ordernya sendiri (`filter.userId = user._id`), admin bisa filter by `?userId=`. Tidak ada endpoint terpisah untuk admin vs user |
| 42 | Order — search & filter | Search by `productSnapshot.name` + `orderCode`. Filter: `?status=`, `?startDate=`, `?endDate=`, `?userId=` (admin only), `?productId=` (admin only), pagination |
| 43 | Payment — Midtrans Sandbox | `isProduction: false` di `midtrans.js`. Tidak ada uang sungguhan. Test card Midtrans tersedia di dashboard sandbox. Webhook URL dikonfigurasi di dashboard Midtrans: `https://<backend>.vercel.app/api/payment/webhook` |
| 44 | Payment — midtransOrderId | Format: `${order.orderCode}-${Date.now()}`. Unik per attempt — memungkinkan user generate snap token baru (re-payment) tanpa konflik di Midtrans |
| 45 | Payment — webhook sederhana | Hanya cek `transaction_status` dan `fraud_status`. Success: `settlement` OR `capture`+`accept`. Expire: order → `cancelled`. Cancel/deny: biarkan `pending_payment` (user bisa retry). Webhook controller selalu return 200 — error di-catch dan di-log, tidak di-throw (mencegah Midtrans retry loop) |
| 46 | Payment — idempotency | Guard pertama di `handleWebhook`: jika `order.status === 'paid'`, langsung return. Mencegah duplicate ticket, duplicate finance record, dsb jika Midtrans kirim webhook sama dua kali |
| 47 | Payment — efek samping sukses | Semua diproses di `handleWebhook`: (1) order paid+paidAt+paymentMethod, (2) product bookedSlots+1 soldCount+1 → auto full jika quota tercapai, (3) ticket generate, (4) finance income record, (5) email orderConfirmed, (6) in-app notification. Email dan notification di-wrap `.catch(() => {})` agar tidak abort flow utama |
| 48 | Payment — CoreApi | `core` (Midtrans.CoreApi) ditambahkan ke `midtrans.js` untuk endpoint `GET /api/payment/status/:orderId` yang hit Midtrans API langsung. `snap` tetap sebagai default export untuk kompatibilitas |
| 49 | Ticket — QR code | Package `qrcode` ditambahkan ke dependencies. `pdfHelper.js` diupdate menjadi `async` — generate QR code sebagai PNG buffer sebelum PDF stream dimulai, lalu embed via `doc.image()`. QR meng-encode `ticketCode` string. Pesan scan ditampilkan di bawah QR di PDF |
| 50 | Ticket — checkedIn vs isValid | Dua kondisi dipisah: `isValid: false` = tiket hangus karena refund/cancel. `checkedIn: true` = tiket sudah digunakan check-in. Field baru: `checkedIn` (boolean) + `checkedInAt` (Date) di ticket model. Computed field `canUse = isValid && !checkedIn` di setiap response |
| 51 | Ticket — check-in error informatif | Tiga jenis error check-in: (1) tiket tidak ditemukan, (2) `isValid: false` → pesan spesifik refund/cancel, (3) `checkedIn: true` → pesan berisi waktu check-in sebelumnya. Error 400 dengan pesan lengkap |
| 52 | Ticket — check-in response | Return data penumpang lengkap setelah check-in berhasil: ticketCode, checkedInAt, participants, passenger (name/email/phone), trip info (productName, departureDate, departureCity, destinations, duration, meetingPoint) |
| 53 | Ticket — route order | `/my`, `/my/:id`, `/my/:id/download` diregister SEBELUM `/:id` agar "my" tidak diinterpretasikan sebagai MongoDB ObjectId |
| 54 | Refund — kebijakan default | Policy diseed otomatis saat pertama kali `GET /api/refunds/policy` dipanggil (upsert). Default: H-14+ = 100%, H-7–13 = 50%, H-3–6 = 25%, H-0–2 = 0%. Admin bisa update via `PATCH /api/refunds/policy` |
| 55 | Refund — kalkulasi otomatis | Saat approve, sistem hitung `daysLeft = daysBetween(today, departureDate)`, cocokkan dengan rules policy, hitung `refundAmount = floor(totalPrice * percentage / 100)`. Admin tidak input manual — auto dari policy |
| 56 | Refund — simulasi Midtrans | Tidak call Midtrans refund API. Hanya update status di DB. `midtransRefundKey` di model dibiarkan null. Cukup untuk portfolio Sandbox |
| 57 | Refund — efek samping approve | (1) refund=approved+amount+percentage, (2) order=refunded, (3) ticket=isValid:false+invalidatedAt, (4) product.bookedSlots-1 jika belum expired/cancelled + status kembali active jika sebelumnya full, (5) finance outcome (hanya jika amount>0), (6) email+notifikasi |
| 58 | Refund — suggestedRefundAmount | Field tambahan di response `GET /api/refunds/:id` (admin only): kalkulasi refund berdasarkan policy saat ini. Hanya diisi jika status masih pending. Membantu admin tahu nominal sebelum approve |
| 59 | Refund — route order | `/policy`, `/my`, `/my/:id` diregister SEBELUM `/:id`. `GET /policy` tidak butuh auth (public) agar user bisa lihat kebijakan sebelum login |
| 60 | Finance — current balance | Diambil dari field `balanceAfter` record Finance terbaru (sorted by `createdAt: -1`). Jika belum ada transaksi → 0. Tidak dihitung ulang dari aggregate setiap request (lebih efisien) |
| 61 | Finance — balance period | `GET /api/finance/balance` menerima `?startDate=&endDate=` opsional. Tanpa filter → all-time summary saja. Dengan filter → all-time + period summary (income, outcome, net untuk rentang tanggal tersebut) via MongoDB aggregation |
| 62 | Finance — withdrawal validation | (1) `amount >= 10000` (min Rp 10.000, validasi AJV schema), (2) `amount <= currentBalance` (validasi di service, error 400 dengan pesan saldo saat ini) |
| 63 | Finance — export CSV | `GET /api/finance/export/csv` — sama filternya dengan transactions (type, category, startDate, endDate), tapi tanpa pagination (ambil semua). Sorted ascending (terlama ke terbaru) untuk laporan. Return string CSV dengan BOM via `generateFinanceCsv` dari `csvHelper.js` |
| 64 | Product cancelled — notify users | Saat admin set status produk → `cancelled` (via `update()` atau `bulkUpdateStatus()`), sistem otomatis kirim email + in-app notification ke semua user yang punya order `paid` untuk produk tersebut. Di `bulkUpdateStatus`, produk yang belum cancelled di-query SEBELUM `updateMany` agar bisa dibedakan yang baru di-cancel. Notif tidak memblokir response — dijalankan fire-and-forget dengan `.catch(() => {})` |
| 65 | Mailer — sender name | Fix `from` di `config/mailer.js` dari `"Travia"` → `"Travia"`. Berlaku untuk semua email yang dikirim sistem |
