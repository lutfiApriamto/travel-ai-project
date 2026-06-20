# Feature List: AI Travel Agent Platform
> Destinasi: Indonesia only | Model Produk: 1 Produk = 1 Tanggal Keberangkatan

---

## SISI USER (Customer)

### Autentikasi
- Register akun
- Login / Logout
- Lupa password / reset password

### Browse & Discovery
- Halaman beranda (produk unggulan, kategori, banner promo, tags highlight)
- Browse semua produk
- Filter produk:
  - Berdasarkan Kategori (Open Trip, Private Trip, dll)
  - Berdasarkan Tipe (Family, Romance, Religi, Adventure, Kuliner, Alam, dll)
  - Berdasarkan Tags (Promo, Terlaris, New, Limited Seat, dll)
  - Berdasarkan Harga (range)
  - Berdasarkan Destinasi (kota/daerah di Indonesia)
- Search produk
- Halaman detail produk:
  - Foto utama & galeri
  - Nama, deskripsi singkat & lengkap
  - Kategori, Tipe, Tags
  - Destinasi & kota keberangkatan
  - Tanggal keberangkatan & kepulangan
  - Durasi (auto: X Hari Y Malam)
  - Meeting point
  - Harga per orang
  - Sisa slot / kuota
  - Itinerary per hari (judul hari, aktivitas, hotel, keterangan makan)
  - Include & Exclude
  - Add-on opsional (jika ada)
  - Syarat & ketentuan

### Wishlist
- Lihat daftar wishlist sendiri (populate data minimal produk: nama, slug, thumbnail, harga, status)
- Search wishlist by nama produk, deskripsi singkat, destinasi (`?search=`)
- Filter wishlist by kategori, tipe, tags, destinasi, range harga — sama seperti filter produk
- Pagination (`?page=`, `?limit=`)
- Cek status wishlist satu produk (`GET /api/wishlist/check/:productId`) — return `{ isWishlisted: true/false }`
- Tambah produk ke wishlist (idempotent — tidak error jika sudah ada)
- Hapus produk dari wishlist
- Wishlist otomatis terhapus jika produk dihapus admin (ditangani di product module)

### Keranjang (Cart)
- Lihat isi keranjang (populate data produk minimal + flag `isAvailable` per item)
- Search & filter item di keranjang — sama seperti filter produk (`?search=`, `?category=`, `?type=`, `?tag=`, dll)
- Tambah item ke keranjang (validasi: produk harus `active`, slot harus cukup; jika produk sudah ada → update otomatis)
- Edit item di keranjang (ubah jumlah peserta, add-on, catatan)
- Hapus satu item dari keranjang
- Kosongkan seluruh keranjang
- Add-on divalidasi dari data produk — price diambil dari DB, bukan dari request
- Keranjang otomatis bersih jika produk dihapus admin (ditangani di product module)

### Pemesanan & Pembayaran
- Checkout dari keranjang — pilih item mana yang di-checkout (bisa lebih dari satu sekaligus), sistem buat 1 order per produk
- Semua validasi (produk active, slot cukup) dilakukan sebelum order dibuat — tidak ada partial order
- Data produk di-snapshot ke order saat checkout (nama, harga, tanggal, dll) — akurat meski produk diedit kemudian
- Inisiasi pembayaran — buat Midtrans Snap token (`POST /api/payment/create/:orderId`), return `snapToken` + `paymentUrl` untuk frontend
- Generate ulang token jika expired — endpoint yang sama bisa dipanggil ulang untuk order `pending_payment`
- Pembayaran via Midtrans Sandbox — no real money, test card tersedia
- Cek status pembayaran real-time dari Midtrans (`GET /api/payment/status/:orderId`)
- Setelah pembayaran sukses (via webhook Midtrans):
  - Order status → `paid`, metode bayar tersimpan
  - E-tiket otomatis digenerate
  - Slot produk berkurang, produk jadi `full` jika kuota habis
  - Saldo keuangan platform otomatis bertambah
  - Email konfirmasi + in-app notification dikirim ke user
- Order expire (tidak bayar dalam 24 jam) → otomatis `cancelled`

### Manajemen Pesanan
- Lihat riwayat pesanan sendiri (search by nama produk/kode order, filter by status & tanggal, pagination)
- Lihat status pesanan:
  - `pending_payment` — menunggu pembayaran
  - `paid` — pembayaran sukses, tiket terbit
  - `cancelled` — dibatalkan
  - `refunded` — refund disetujui & diproses
- Lihat detail pesanan per transaksi
- Batalkan order yang masih `pending_payment` (belum bayar) — langsung tanpa refund

### Pembatalan & Refund
- Ajukan refund (orderId + alasan min 10 karakter) — syarat: order `paid`, belum ada pengajuan pending, tanggal keberangkatan belum lewat
- Lihat daftar pengajuan refund sendiri (filter by status, pagination)
- Lihat detail pengajuan refund sendiri
- Setelah approved → email + in-app notification dengan nominal refund
- Setelah rejected → email + in-app notification dengan alasan penolakan

### E-Tiket
- Lihat daftar tiket sendiri (filter by status: valid / used / invalid, pagination)
- Lihat detail tiket sendiri (include info order & produk)
- Download e-tiket PDF — berisi QR code, detail perjalanan, detail pemesanan
- QR code meng-encode kode tiket untuk keperluan scan check-in
- Field `canUse` di setiap response — `true` jika tiket masih bisa digunakan
- Tiket otomatis tidak valid jika order di-refund atau dibatalkan (dihandle di refund module)

### Profil
- Lihat profil sendiri
- Edit profil (nama, nomor HP, avatar — URL pre-uploaded via `/api/upload`)
- Ganti password (wajib input password lama, sistem kirim notifikasi email plain text setelah berhasil)

### Notifikasi
- Lihat daftar notifikasi sendiri — **cursor-based / infinity scroll** (filter by `?isRead=`, `?category=activity/announcement`, `?search=`, `?cursor=`, `?limit=`)
- Lihat jumlah notifikasi belum dibaca — untuk badge/indikator di UI (`GET /api/notifications/unread-count`)
- Tandai satu notifikasi sebagai sudah dibaca — set `isRead=true` + catat `readAt`
- Tandai semua notifikasi sebagai sudah dibaca sekaligus
- Hapus notifikasi (soft delete — data tetap tersimpan di DB, tidak tampil lagi ke user)
- Notifikasi hanya milik user sendiri — admin tidak bisa melihat notifikasi user lain
- Notifikasi otomatis dibuat oleh sistem saat:
  - Pembayaran sukses (`order_confirmed`)
  - Tiket digenerate (`ticket_generated`)
  - Order dibatalkan (`order_cancelled`)
  - Refund disetujui admin (`refund_approved`) + nominal refund
  - Refund ditolak admin (`refund_rejected`) + alasan penolakan
  - Produk dibatalkan admin (`product_cancelled`)

### AI Sales Agent

**Layout Halaman AI:**
- Bagian atas: interface chat (seperti ChatGPT/Gemini)
- Bagian bawah: grid produk yang dinamis
- Sebelum chat dimulai → grid menampilkan **semua produk aktif**
- Setelah AI reply dengan rekomendasi → grid **otomatis difilter** hanya menampilkan produk yang direkomendasikan AI
- Jika sesi direset → grid kembali ke semua produk

**Fitur Chat:**
- User chat bebas (mood, budget, jumlah orang, preferensi, dll)
- AI menggali kebutuhan secara conversational — tidak langsung rekomendasiin
- AI merekomendasikan beberapa produk sekaligus beserta alasan yang spesifik
- AI bisa menjelaskan itinerary produk secara conversational jika ditanya
- Context percakapan hilang saat sesi berakhir (incognito per sesi — tidak disimpan di DB)
- History percakapan dikirim dari frontend tiap request (stateless di backend)

**Mekanisme Rekomendasi Produk (Structured Output):**
- AI tidak hanya return teks — return JSON terstruktur berisi pesan + daftar ID produk rekomendasi
- Frontend baca `recommendedProductIds` → filter grid otomatis
- Jika `showAll: true` → tampilkan semua produk (misal di awal sesi atau AI belum cukup info)
- Jika `showAll: false` → tampilkan hanya produk yang direkomendasikan

**Batasan & Keamanan:**
- History percakapan dipotong ke maksimal 10 pesan terakhir sebelum dikirim ke Gemini (hemat token)
- AJV validasi `conversationHistory` — max 20 item, setiap item wajib punya `role` + `content`
- Rate limiter ketat: maks 20 request per 15 menit per IP (`createRateLimiter` dari rateLimiter.middleware.js)
- Backend validasi semua product ID dari Gemini ke DB sebelum dikirim ke frontend (antisipasi hallucination)
- AI enforce Bahasa Indonesia via system prompt — apapun bahasa yang dipakai user
- AI menolak pertanyaan di luar topik travel via system prompt
- Fallback jika Gemini API error — return `showAll: true` + pesan ramah, frontend tidak crash
- Jika semua ID dari Gemini hallucinated → paksa `showAll: true` agar grid tidak kosong

---

### Manajemen Banner
- Lihat semua banner aktif (public, sorted by urutan tampil)
- Lihat detail banner berdasarkan ID (admin)
- Upload banner baru (gambar wajib, judul wajib, link & urutan opsional)
- Edit banner (judul, gambar, link, urutan, toggle aktif/nonaktif)
- Hapus banner — hard delete, gambar di Supabase ikut terhapus otomatis

### Upload & Manajemen Gambar
- Upload gambar satuan (`POST /api/upload/single?folder=xxx`)
- Upload gambar sekaligus banyak — max 10 file (`POST /api/upload/bulk?folder=xxx`)
- Hapus gambar satuan dari Supabase (`DELETE /api/upload/single`)
- Hapus banyak gambar sekaligus dari Supabase (`DELETE /api/upload/bulk`)
- Semua endpoint upload/delete hanya untuk admin
- Setiap data yang memiliki gambar dan dihapus → gambar di Supabase ikut terhapus otomatis

---

## SISI ADMIN

### Autentikasi Admin
- Login / Logout admin

### Dashboard (`GET /api/admin/dashboard?days=30`)
- **Stats:** total pesanan, total pendapatan (paid orders), total user, produk aktif, refund pending, produk hampir expired (dalam 7 hari ke depan)
- **Recent Activity:** 5 pesanan terbaru + 5 user terbaru mendaftar
- **Top Products:** top 5 by `soldCount` + top 5 by `viewCount`
- **Trend:** data harian `{ date, orders, revenue }` — default 30 hari, customizable via `?days=N` (max 365)
- Tanggal tanpa transaksi tetap muncul dengan nilai 0 (skeleton fill)
- Semua query dashboard dijalankan paralel (`Promise.all`) untuk performa optimal
- Rate limiter pada endpoint dashboard: maks 20 request/menit per IP (`createRateLimiter`) — cegah spam aggregation query berat

### Manajemen Kategori
- Lihat semua kategori (admin: semua status | public: active saja)
- Search kategori berdasarkan nama (`?search=`)
- Lihat detail kategori berdasarkan ID atau slug
- Tambah kategori baru (nama, deskripsi, gambar opsional, urutan tampil)
- Edit kategori (nama, deskripsi, gambar, status, urutan tampil)
- Toggle status kategori (active ↔ inactive) tanpa hapus
- Hapus kategori — hard delete, otomatis terhapus dari semua produk terkait
- Slug otomatis di-generate dari nama, URL-friendly
- Urutan tampil kategori bisa diatur via field `sortOrder`

### Manajemen Tipe
- Lihat semua tipe (admin: semua status | public: active saja)
- Search tipe berdasarkan nama (`?search=`)
- Lihat detail tipe berdasarkan ID atau slug
- Tambah tipe baru (nama, deskripsi opsional)
- Edit tipe (nama, deskripsi, status)
- Toggle status tipe (active ↔ inactive) tanpa hapus
- Hapus tipe — hard delete, otomatis terhapus dari semua produk terkait
- Slug otomatis di-generate dari nama, URL-friendly
- Tanpa gambar dan urutan tampil (lebih simpel dari kategori — cukup label)

### Manajemen Tags
- Lihat semua tag (admin: semua status | public: active saja)
- Search tag berdasarkan nama (`?search=`)
- Lihat detail tag berdasarkan ID atau slug
- Tambah tag baru (nama, warna badge hex opsional)
- Edit tag (nama, warna, status)
- Toggle status tag (active ↔ inactive) tanpa hapus
- Hapus tag — hard delete, otomatis terhapus dari semua produk terkait
- Slug otomatis di-generate dari nama, URL-friendly
- Field `color` (hex, contoh: `#FF5733`) untuk warna badge tag di frontend

### Manajemen Produk
**CRUD Produk:**
- Tambah produk baru (body JSON — URL gambar dikirim setelah upload via `/api/upload`)
- Edit produk (URL gallery yang dihapus otomatis dihapus dari Supabase)
- Hapus produk (thumbnail + gallery dihapus dari Supabase, wishlist & cart semua user otomatis bersih)
- Duplikasi produk (clone teks saja, gambar dikosongkan, status selalu draft)
- Publish / unpublish produk (Draft ↔ Active via PATCH status)

**Field Produk:**
- Nama produk
- Slug (auto-generate dari nama, re-generate jika nama berubah)
- Kategori (many — array ObjectId)
- Tipe (many — array ObjectId)
- Tags (many — array ObjectId)
- Deskripsi singkat (max 300 karakter)
- Deskripsi lengkap
- Foto utama / thumbnail (URL Supabase, opsional)
- Galeri foto (array URL Supabase, max 20)
- Kota keberangkatan
- Destinasi (array kota, dalam Indonesia, max 20)
- Tanggal keberangkatan
- Tanggal kepulangan
- Durasi (auto-hitung: "X Hari Y Malam")
- Meeting point / assembly point
- Harga per orang
- Kuota maksimal peserta
- Minimum peserta (opsional)
- Itinerary per hari (day, judul, aktivitas, hotel, makan: breakfast/lunch/dinner)
- Include (list string)
- Exclude (list string)
- Add-on opsional (nama + harga tambahan)
- Syarat & ketentuan
- `soldCount` (auto-increment tiap order confirmed)
- `viewCount` (auto-increment tiap halaman detail dibuka oleh publik)

**Status Produk:**
| Status | Keterangan |
|---|---|
| `draft` | Belum dipublish, tidak terlihat user |
| `active` | Bisa dipesan, masih ada slot |
| `full` | Kuota habis, tidak bisa dipesan (auto) |
| `expired` | Tanggal keberangkatan sudah lewat (auto via cron) |
| `cancelled` | Dibatalkan admin |

**Browse & Filter (Public):**
- Search: nama, deskripsi singkat, destinasi (`?search=`)
- Filter by kategori, tipe, tags (ObjectId)
- Filter by kota keberangkatan, destinasi (partial match)
- Filter by range harga (`?minPrice=`, `?maxPrice=`)
- Pagination (`?page=`, `?limit=`)

**Fitur Admin Tambahan:**
- Filter by status (`?status=`) — admin only
- Bulk status update (max 50 produk, status: draft/active/cancelled)

### Manajemen Pesanan
- Lihat semua pesanan (search by nama produk/kode order, filter by status, tanggal, produk, user, pagination)
- Lihat detail pesanan per transaksi (include data user & produk lengkap)

### Manajemen Refund
- Lihat semua pengajuan refund (filter by status, userId, search by alasan, pagination)
- Lihat detail pengajuan (include data user, order, + `suggestedRefundAmount` kalkulasi otomatis dari policy)
- Approve → sistem auto-kalkulasi refund dari policy, update order+tiket+slot+finance, email+notifikasi user
- Reject (wajib isi alasan) → email+notifikasi user dengan alasan penolakan
- Refund disimulasi (tidak call Midtrans refund API — cukup untuk portfolio Sandbox)

### Kebijakan Refund (Configurable oleh Admin)
- Lihat kebijakan saat ini (public, tanpa login)
- Update kebijakan (admin only)
- Default kebijakan:
  - H-14 atau lebih → refund 100%
  - H-7 sampai H-13 → refund 50%
  - H-3 sampai H-6 → refund 25%
  - H-0 sampai H-2 → refund 0% (bisa ajukan tapi tidak ada pengembalian dana)

### Manajemen Tiket
- Lihat semua tiket yang diterbitkan (search by kode tiket / nama produk, filter by userId / isValid / checkedIn / tanggal, pagination)
- Lihat detail tiket siapapun (include data user, order, produk)
- Scan check-in tiket (`POST /api/tickets/checkin`, body: `{ ticketCode }`)
  - Validasi tiket: tidak ditemukan → 404, sudah refund/cancel → error informatif, sudah check-in → error + waktu check-in sebelumnya
  - Jika valid → `checkedIn: true`, return info penumpang & detail perjalanan lengkap
- Tiket otomatis invalid jika order di-refund / dibatalkan (dihandle di refund module)

### Manajemen User
- Lihat daftar semua user terdaftar (search by nama/email via `?search=`, filter by `?isActive=true/false`, pagination)
- Lihat profil detail user + ringkasan aktivitas (`totalOrders`, `totalSpent`, `totalRefunds`)
- Suspend / unsuspend user — toggle `isActive` (admin tidak bisa di-suspend, return 403)

### Broadcast Notifikasi (Admin)
- Kirim notifikasi ke **semua user** sekaligus (type: `broadcast`) — berguna untuk pengumuman, info perubahan trip, dll
- Kirim notifikasi ke **user tertentu** — via `targetUserIds[]` di request body (opsional)
- Sistem buat satu Notification document per user (fan-out via `insertMany`) — efisien untuk portfolio scale
- Response berisi jumlah user yang berhasil menerima broadcast (`sentTo: N`)

### Manajemen Keuangan
- Lihat saldo platform saat ini + ringkasan all-time (total income, total outcome, net)
- Ringkasan per periode opsional (`?startDate=&endDate=`) — income, outcome, net untuk rentang tanggal tersebut
- Riwayat transaksi (filter by type, category, startDate, endDate, pagination)
- Withdrawal dummy — admin input nominal (min Rp 10.000, tidak boleh melebihi saldo), tercatat di riwayat
- Export laporan CSV (`GET /api/finance/export/csv`) — filter by type, category, periode, sorted ascending

---

## SISTEM / BEHAVIOR OTOMATIS

| Kondisi | Behavior |
|---|---|
| Payment sukses via Midtrans | Order auto-confirmed + e-tiket auto-generated + saldo bertambah + slot berkurang |
| Slot tersisa = 0 | Status produk → `Full` otomatis |
| Tanggal keberangkatan terlewat | Status produk → `Expired` otomatis (cron job harian) |
| Refund approved | Midtrans Sandbox refund triggered + e-tiket invalid + saldo berkurang + slot +1 (jika belum expired) |
| Status produk → `Cancelled` | Semua pemesan dengan order `paid` otomatis dinotifikasi via email + in-app notification (`product_cancelled`). Dijalankan fire-and-forget — tidak memblokir response admin |
| Produk dihapus | Wishlist & cart semua user otomatis bersih |
| Kategori / Tipe / Tags dihapus | Otomatis terhapus dari semua produk terkait (produk tidak error) |
| Kategori / Tipe / Tags diedit | Perubahan otomatis reflect ke semua produk terkait |
| Midtrans webhook | Update status pembayaran real-time |

---

## Business Logic Refund

```
User ajukan pembatalan & refund (dengan alasan)
        ↓
Admin review request
        ↓
Admin tentukan jumlah refund (full / partial sesuai kebijakan H-)
        ↓
Admin Approve → sistem trigger refund Midtrans Sandbox
             → status order → "Refunded"
             → e-tiket otomatis tidak valid
             → slot produk +1 (jika belum expired)
             → saldo keuangan platform berkurang
             → user dinotifikasi

Admin Reject  → user dinotifikasi
             → order tetap berjalan
```

---

## Catatan Scope

- Destinasi: **Indonesia only** (tidak ada paket luar negeri)
- Model produk: **1 Produk = 1 Tanggal Keberangkatan** (Model A)
- Relasi Kategori / Tipe / Tags ke Produk: **Many-to-Many**
- Payment: **Midtrans Sandbox** (dummy, tidak menyedot saldo nyata)
- AI: **Gemini API** dengan prompt engineering (tanpa model ML custom)
- Fokus project: Applied AI Engineering + Fullstack Development
- Target: MVP demo dalam 1 minggu sprint
