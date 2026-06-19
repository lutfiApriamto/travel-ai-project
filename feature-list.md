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
- Tambah / hapus produk dari wishlist
- Lihat daftar wishlist
- Wishlist otomatis terhapus jika produk dihapus admin

### Keranjang (Cart)
- Tambah / hapus / edit item di keranjang
- Keranjang otomatis bersih jika produk dihapus admin

### Pemesanan & Pembayaran
- Checkout dari keranjang
- Isi detail pemesanan (jumlah peserta, catatan khusus)
- Ringkasan order sebelum bayar
- Pembayaran via Midtrans Sandbox
- Setelah pembayaran sukses:
  - Order otomatis confirmed (tanpa approval manual admin)
  - E-tiket otomatis digenerate
  - Saldo keuangan platform otomatis bertambah
  - Slot produk otomatis berkurang

### Manajemen Pesanan
- Lihat riwayat pesanan
- Lihat status pesanan:
  - `Pending Payment` — menunggu pembayaran
  - `Paid & Confirmed` — pembayaran sukses, tiket terbit
  - `Cancelled` — dibatalkan
  - `Refunded` — refund disetujui & diproses
- Lihat detail pesanan per transaksi

### Pembatalan & Refund
- Ajukan pembatalan pesanan (dengan alasan)
- Lihat status pengajuan refund (Pending, Approved, Rejected)
- Setelah approved → refund otomatis diproses via Midtrans Sandbox
- Notifikasi hasil keputusan refund dari admin

### E-Tiket
- Lihat e-tiket setelah order confirmed
- Download tiket (PDF)
- Tiket otomatis tidak valid jika order dibatalkan / refunded

### Profil
- Lihat & edit profil (nama, foto, nomor HP)
- Ganti password

### AI Sales Agent
- Akses chat AI dari halaman khusus atau floating button
- AI menggali kebutuhan, mood, budget, preferensi user secara conversational
- AI merekomendasikan beberapa produk sekaligus beserta alasan
- AI memberikan link langsung ke halaman produk yang direkomendasikan
- AI bisa menjelaskan itinerary produk secara conversational
- Context percakapan hilang saat sesi berakhir (incognito per sesi)

---

## SISI ADMIN

### Autentikasi Admin
- Login / Logout admin

### Dashboard
- Total pesanan, total pendapatan, produk terlaris, user aktif
- Grafik tren pesanan & pendapatan
- Ringkasan refund request yang masih pending
- Produk yang akan segera expired (misal dalam 7 hari ke depan)

### Manajemen Kategori
- Lihat semua kategori
- Tambah kategori baru
- Edit kategori (perubahan otomatis reflect ke semua produk terkait)
- Hapus kategori (otomatis terhapus dari semua produk — produk tidak error)
- Info: berapa produk yang menggunakan kategori ini

### Manajemen Tipe
- Lihat semua tipe (Romance, Family, Religi, Adventure, Kuliner, Alam, dll)
- Tambah tipe baru
- Edit tipe (perubahan otomatis reflect ke semua produk terkait)
- Hapus tipe (otomatis terhapus dari semua produk — produk tidak error)
- Info: berapa produk yang menggunakan tipe ini

### Manajemen Tags
- Lihat semua tags (Promo, Terlaris, New, Limited Seat, Favorit, dll)
- Tambah tag baru
- Edit tag (perubahan otomatis reflect ke semua produk terkait)
- Hapus tag (otomatis terhapus dari semua produk — produk tidak error)
- Info: berapa produk yang menggunakan tag ini

### Manajemen Produk
**CRUD Produk:**
- Tambah produk baru
- Edit produk
- Hapus produk (otomatis bersihkan wishlist & cart semua user)
- Duplikasi produk (clone produk existing, tinggal ubah tanggal & kuota)
- Publish / unpublish produk (Draft ↔ Active)

**Field Produk:**
- Nama produk
- Kategori (many — search & pilih dari daftar)
- Tipe (many — search & pilih dari daftar)
- Tags (many — search & pilih dari daftar)
- Deskripsi singkat
- Deskripsi lengkap
- Foto utama / thumbnail
- Galeri foto (multiple)
- Kota keberangkatan
- Destinasi (bisa lebih dari satu, dalam Indonesia)
- Tanggal keberangkatan
- Tanggal kepulangan
- Durasi (auto-hitung)
- Meeting point / assembly point
- Harga per orang
- Kuota maksimal peserta
- Minimum peserta (opsional)
- Itinerary per hari (judul, aktivitas, hotel, makan)
- Include (list)
- Exclude (list)
- Add-on opsional (nama + harga tambahan)
- Syarat & ketentuan

**Status Produk:**
| Status | Keterangan |
|---|---|
| `Draft` | Belum dipublish, tidak terlihat user |
| `Active` | Bisa dipesan, masih ada slot |
| `Full` | Kuota habis, tidak bisa dipesan |
| `Expired` | Tanggal keberangkatan sudah lewat |
| `Cancelled` | Dibatalkan admin |

**Fitur Tambahan:**
- Filter produk by status (Draft, Active, Full, Expired, Cancelled)
- Bulk status update (update beberapa produk sekaligus)

### Manajemen Pesanan
- Lihat semua pesanan (sudah auto-confirmed via payment)
- Filter pesanan (by status, tanggal, produk, user)
- Lihat detail pesanan per transaksi

### Manajemen Refund
- Lihat semua pengajuan pembatalan & refund
- Review detail pengajuan (alasan user, tanggal pesan, tanggal keberangkatan)
- Tentukan jumlah refund (full / partial sesuai kebijakan)
- Approve → sistem trigger refund Midtrans Sandbox otomatis
- Reject → user dinotifikasi

### Kebijakan Refund (Configurable oleh Admin)
- Admin bisa set kebijakan refund berdasarkan H- keberangkatan
- Contoh default:
  - Batal H-30 atau lebih → refund 100%
  - Batal H-14 sampai H-29 → refund 75%
  - Batal H-7 sampai H-13 → refund 50%
  - Batal H-3 sampai H-6 → refund 25%
  - Batal H-0 sampai H-2 → no refund

### Manajemen Tiket
- Lihat semua tiket yang diterbitkan
- Tiket otomatis invalid jika order di-refund / dibatalkan

### Manajemen User
- Lihat daftar semua user terdaftar
- Lihat profil & riwayat pesanan per user
- Suspend / ban user (opsional)

### Manajemen Keuangan
- Lihat saldo platform (total pemasukan - refund - withdrawal)
- Riwayat transaksi keuangan:
  - Pemasukan: setiap order paid & confirmed
  - Pengeluaran: setiap refund approved
  - Pengeluaran: setiap withdrawal
- Fitur Withdrawal (dummy): admin input nominal → saldo berkurang → tercatat di riwayat
- Export laporan keuangan (CSV / PDF)
- Filter laporan by periode (harian, mingguan, bulanan, custom range)

---

## SISTEM / BEHAVIOR OTOMATIS

| Kondisi | Behavior |
|---|---|
| Payment sukses via Midtrans | Order auto-confirmed + e-tiket auto-generated + saldo bertambah + slot berkurang |
| Slot tersisa = 0 | Status produk → `Full` otomatis |
| Tanggal keberangkatan terlewat | Status produk → `Expired` otomatis (cron job harian) |
| Refund approved | Midtrans Sandbox refund triggered + e-tiket invalid + saldo berkurang + slot +1 (jika belum expired) |
| Status produk → `Cancelled` | Semua pemesan dinotifikasi, refund massal bisa di-trigger admin |
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
