# Travia Backend API

Backend REST API untuk **Travia — AI Travel Agent**, platform pemesanan paket wisata Indonesia berbasis AI. Dibangun sebagai portfolio project untuk posisi Fullstack Developer.

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js 20+ (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| File Storage | Supabase Storage |
| Payment | Midtrans Sandbox |
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Email | Nodemailer + Gmail SMTP |
| Deployment | Vercel Serverless |

---

## Prasyarat

- Node.js 20+
- Akun MongoDB Atlas
- Akun Supabase (Storage)
- Akun Midtrans (Sandbox)
- Google Gemini API Key
- Akun Gmail dengan App Password aktif

---

## Setup & Instalasi

**1. Clone dan install dependencies**
```bash
cd TRIP_BE
npm install
```

**2. Salin file environment**
```bash
cp .env.example .env
```

**3. Isi semua variabel di `.env`** (lihat tabel di bawah)

**4. Inisialisasi admin pertama** (sekali pakai setelah server jalan)
```bash
POST /api/auth/admin/register
```

**5. Seed data wilayah** (opsional — 80K+ data BPS Indonesia)
```bash
npm run seed:wilayah
```

---

## Environment Variables

| Variable | Keterangan | Contoh |
|---|---|---|
| `URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret JWT (min 32 karakter) | `random_hex_64_chars` |
| `PORT` | Port dev server | `5000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `CLIENT_URL` | URL frontend (CORS + link email) | `http://localhost:5173` |
| `EMAIL_USER` | Gmail pengirim | `travia@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (16 char) | `xxxx xxxx xxxx xxxx` |
| `EMAIL_ADMIN` | Email akun admin pertama | `admin@travia.com` |
| `EMAIL_ADMIN_PASS` | Password admin pertama | `min 8 karakter` |
| `MIDTRANS_SERVER_KEY` | Midtrans server key (Sandbox) | `SB-Mid-server-xxx` |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key (Sandbox) | `SB-Mid-client-xxx` |
| `MIDTRANS_IS_PRODUCTION` | Mode produksi Midtrans | `false` |
| `SUPABASE_URL` | URL project Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase | `eyJhbGci...` |
| `SUPABASE_BUCKET` | Nama bucket storage | `trip-assets` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

> **Generate JWT_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## Menjalankan Server

```bash
# Development (auto-restart + cron job aktif)
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:5000` (default).

---

## Deployment ke Vercel

```bash
vercel deploy
```

Konfigurasi sudah tersedia di `vercel.json` — semua request diarahkan ke `api/index.js`.

> **Catatan:** Cron job expire produk (`expireProducts.job.js`) hanya aktif di development.
> Di Vercel production, gunakan **Vercel Cron Jobs** yang memanggil endpoint dedicated.

**Webhook Midtrans** — set URL berikut di dashboard Midtrans Sandbox:
```
https://<your-backend>.vercel.app/api/payment/webhook
```

---

## API Endpoints

### Autentikasi — `/api/auth`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/register` | — | Daftar akun user baru |
| POST | `/admin/register` | — | Init akun admin (sekali pakai) |
| POST | `/login` | — | Login, return access token + set cookie |
| POST | `/forgot-password` | — | Kirim link reset password ke email |
| POST | `/reset-password/:token` | — | Reset password via token di link email |
| POST | `/refresh` | Cookie | Tukar refresh token → access token baru |
| POST | `/logout` | Cookie | Hapus refresh token |

### User — `/api/users`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/me` | User | Lihat profil sendiri |
| PATCH | `/me` | User | Edit profil (nama, nomor HP) |
| PATCH | `/me/avatar` | User | Ganti avatar (URL pre-uploaded) |
| PATCH | `/me/change-password` | User | Ganti password |

### Admin Dashboard — `/api/admin`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/dashboard` | Admin | Stats, recent activity, top produk, trend |
| GET | `/users` | Admin | Daftar semua user (search, filter isActive) |
| GET | `/users/:id` | Admin | Detail user + ringkasan aktivitas |
| PATCH | `/users/:id/suspend` | Admin | Toggle suspend/aktifkan user |

### Kategori — `/api/categories`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | Optional | List (admin: semua status, public: active) |
| GET | `/:id` | Optional | Detail by ID |
| GET | `/slug/:slug` | Optional | Detail by slug |
| POST | `/` | Admin | Tambah kategori baru |
| PATCH | `/:id` | Admin | Edit kategori |
| DELETE | `/:id` | Admin | Hapus (cascade ke produk) |

### Tipe — `/api/types`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | Optional | List tipe |
| GET | `/:id` | Optional | Detail by ID |
| GET | `/slug/:slug` | Optional | Detail by slug |
| POST | `/` | Admin | Tambah tipe |
| PATCH | `/:id` | Admin | Edit tipe |
| DELETE | `/:id` | Admin | Hapus (cascade ke produk) |

### Tags — `/api/tags`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | Optional | List tags |
| GET | `/:id` | Optional | Detail by ID |
| GET | `/slug/:slug` | Optional | Detail by slug |
| POST | `/` | Admin | Tambah tag |
| PATCH | `/:id` | Admin | Edit tag |
| DELETE | `/:id` | Admin | Hapus (cascade ke produk) |

### Banner — `/api/banners`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | — | List banner aktif (public) |
| GET | `/:id` | Admin | Detail by ID |
| POST | `/` | Admin | Upload banner baru |
| PATCH | `/:id` | Admin | Edit banner |
| DELETE | `/:id` | Admin | Hapus banner + file Supabase |

### Upload — `/api/upload`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/single` | Admin | Upload 1 gambar → return URL |
| POST | `/bulk` | Admin | Upload banyak gambar (max 10) → return URLs |
| DELETE | `/single` | Admin | Hapus 1 file dari Supabase |
| DELETE | `/bulk` | Admin | Hapus banyak file (max 50) |

> Query param `?folder=xxx` menentukan subfolder di Supabase bucket.

### Produk — `/api/products`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | Optional | Browse & filter produk |
| GET | `/:id` | Optional | Detail by ID (viewCount +1 jika bukan admin) |
| GET | `/slug/:slug` | Optional | Detail by slug |
| POST | `/` | Admin | Tambah produk baru |
| PATCH | `/:id` | Admin | Edit produk |
| DELETE | `/:id` | Admin | Hapus produk + file Supabase + cleanup wishlist/cart |
| POST | `/:id/duplicate` | Admin | Duplikat produk (teks saja, gambar dikosongkan) |
| PATCH | `/bulk-status` | Admin | Bulk update status (max 50 produk) |

**Query params GET `/`:**
`?search=`, `?category=`, `?type=`, `?tag=`, `?departureCity=`, `?destination=`, `?minPrice=`, `?maxPrice=`, `?status=` (admin), `?page=`, `?limit=`

### Wishlist — `/api/wishlist`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | User | Daftar wishlist sendiri |
| GET | `/check/:productId` | User | Cek status wishlist satu produk |
| POST | `/:productId` | User | Tambah ke wishlist (idempotent) |
| DELETE | `/:productId` | User | Hapus dari wishlist |

### Keranjang — `/api/cart`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | User | Isi keranjang + flag `isAvailable` per item |
| POST | `/items` | User | Tambah item (upsert jika sudah ada) |
| PATCH | `/items/:productId` | User | Edit item (peserta, add-on, catatan) |
| DELETE | `/items/:productId` | User | Hapus satu item |
| DELETE | `/` | User | Kosongkan seluruh keranjang |

### Pesanan — `/api/orders`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | User/Admin | Riwayat order (user: milik sendiri, admin: semua) |
| GET | `/:id` | User/Admin | Detail order |
| POST | `/` | User | Checkout dari cart (buat order per produk) |
| DELETE | `/:id` | User | Cancel order `pending_payment` |

### Pembayaran — `/api/payment`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/create/:orderId` | User | Buat/generate ulang Midtrans Snap token |
| POST | `/webhook` | Midtrans Sig | Webhook Midtrans (bukan JWT) |
| GET | `/status/:orderId` | User | Cek status pembayaran real-time dari Midtrans |

### E-Tiket — `/api/tickets`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/my` | User | Daftar tiket sendiri |
| GET | `/my/:id` | User | Detail tiket sendiri |
| GET | `/my/:id/download` | User | Download PDF e-tiket |
| GET | `/` | Admin | Semua tiket (search, filter) |
| GET | `/:id` | Admin | Detail tiket siapapun |
| POST | `/checkin` | Admin | Scan check-in tiket via `ticketCode` |

### Refund — `/api/refunds`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/policy` | — | Lihat kebijakan refund (public) |
| PATCH | `/policy` | Admin | Update kebijakan refund |
| GET | `/my` | User | Daftar pengajuan refund sendiri |
| GET | `/my/:id` | User | Detail pengajuan sendiri |
| POST | `/` | User | Ajukan refund (order `paid`, belum lewat) |
| GET | `/` | Admin | Semua pengajuan refund |
| GET | `/:id` | Admin | Detail + `suggestedRefundAmount` |
| PATCH | `/:id/approve` | Admin | Setujui refund (auto-kalkulasi dari policy) |
| PATCH | `/:id/reject` | Admin | Tolak refund (wajib isi alasan) |

### Keuangan — `/api/finance`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/balance` | Admin | Saldo + ringkasan all-time / per periode |
| GET | `/transactions` | Admin | Riwayat transaksi (filter, pagination) |
| POST | `/withdrawal` | Admin | Withdrawal dummy (min Rp 10.000) |
| GET | `/export/csv` | Admin | Export laporan CSV (dengan BOM) |

### Notifikasi — `/api/notifications`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/` | User | List notifikasi (cursor-based, filter, search) |
| GET | `/unread-count` | User | Jumlah belum dibaca (untuk badge) |
| PATCH | `/read-all` | User | Tandai semua sudah dibaca |
| PATCH | `/:id/read` | User | Tandai satu sudah dibaca |
| DELETE | `/:id` | User | Soft delete notifikasi |
| POST | `/broadcast` | Admin | Kirim ke semua / user tertentu |

### AI Agent — `/api/ai`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/chat` | User | Chat dengan AI (rate limit: 20 req/15 menit) |

**Request body:**
```json
{
  "message": "mau liburan bareng keluarga budget 5 juta",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "model", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "message": "Teks percakapan AI",
  "recommendedProductIds": ["id1", "id2"],
  "showAll": false
}
```

### Wilayah — `/api/wilayah`
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/provinces` | — | List provinsi |
| GET | `/regencies` | — | List kab/kota (`?province_id=`) |
| GET | `/districts` | — | List kecamatan (`?regency_id=`) |
| GET | `/villages` | — | List desa (wajib `?district_id=` atau `?search=`) |
| POST/PATCH/DELETE | `/:level/:id` | Admin | CRUD data wilayah |

---

## Format Response

### Sukses
```json
{
  "errorStatus": false,
  "data": {
    "data": {} ,
    "message": "Berhasil",
    "totalData": 33,
    "totalPage": 4
  }
}
```
> `totalData` dan `totalPage` hanya muncul jika response memiliki pagination.

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

---

## Behavior Otomatis Sistem

| Kondisi | Yang Terjadi |
|---|---|
| Payment sukses (webhook Midtrans) | Order → `paid`, tiket auto-generate, slot -1, finance +income, email + notif user |
| Slot produk = 0 | Status produk → `Full` otomatis |
| Tanggal keberangkatan terlewat | Status produk → `Expired` otomatis (cron job harian 00:00 WIB) |
| Produk di-cancel admin | Email + in-app notif ke semua pemesan dengan order `paid` |
| Refund diapprove | Tiket → invalid, slot +1, finance -outcome, email + notif user |
| Refund direject | Email + notif user, order tetap berjalan |
| Produk dihapus | Wishlist & cart semua user otomatis bersih, file Supabase terhapus |
| Kategori/Tipe/Tags dihapus | Otomatis terhapus dari semua produk (produk tidak error) |

---

## Autentikasi

- **Access Token:** JWT, expire 15 menit, dikirim via `Authorization: Bearer <token>`
- **Refresh Token:** Opaque random bytes, expire 30 hari, disimpan hashed di DB, dikirim via HttpOnly cookie (`trip_refresh`)
- **Webhook Midtrans:** Diverifikasi via SHA512 signature — bukan JWT

---

## Struktur Folder

```
TRIP_BE/
├── api/
│   └── index.js              ← Entry point (dev server + Vercel handler)
├── src/
│   ├── app.js                ← Express setup + semua routes
│   ├── config/               ← db, mailer, midtrans, supabase, gemini
│   ├── models/               ← Mongoose schema
│   ├── modules/              ← Feature modules (Routes → Controller → Service → Schema)
│   ├── middlewares/          ← auth, admin, validate, rateLimiter, dll
│   ├── utils/                ← Helper functions (apiResponse, paginate, dll)
│   ├── templates/            ← HTML email templates (emailBase + 7 templates)
│   ├── jobs/                 ← Cron job (expire produk)
│   └── seeds/                ← Seed data wilayah
├── .env.example
├── package.json
└── vercel.json
```
