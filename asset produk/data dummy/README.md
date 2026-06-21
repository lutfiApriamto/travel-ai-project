# Data Dummy Travia

Kumpulan data dummy untuk aplikasi Travia — AI Travel Agent. Semua data saling berkaitan satu sama lain dan mencakup seluruh 18 model yang ada di database.

---

## Struktur File

| File | Koleksi MongoDB | Jumlah |
|---|---|---|
| `categories.json` | categories | 10 kategori |
| `types.json` | types | 7 tipe perjalanan |
| `tags.json` | tags | 10 tag berwarna |
| `banners.json` | banners | 3 banner promo |
| `products.json` | products | 15 produk wisata |
| `users.json` | users | 6 user (1 admin + 5 user) |
| `wishlists.json` | wishlists | 15 item wishlist |
| `carts.json` | carts | 5 keranjang belanja |
| `orders.json` | orders | 20 pesanan |
| `tickets.json` | tickets | 13 tiket perjalanan |
| `refundPolicies.json` | refundpolicies | 1 kebijakan refund |
| `refunds.json` | refunds | 5 pengajuan refund |
| `notifications.json` | notifications | 40 notifikasi |
| `finances.json` | finances | 17 transaksi keuangan |

**Catatan:** Data wilayah (provinces, regencies, districts, villages) sudah ada secara terpisah.

---

## Urutan Insert yang Disarankan

```
1. categories      — tidak ada dependensi
2. types           — tidak ada dependensi
3. tags            — tidak ada dependensi
4. banners         — tidak ada dependensi
5. users           — tidak ada dependensi (HASH PASSWORD DULU!)
6. products        — referensi ke categories, types, tags
7. refundPolicies  — referensi ke users (updatedBy)
8. wishlists       — referensi ke users, products
9. carts           — referensi ke users, products
10. orders         — referensi ke users, products
11. tickets        — referensi ke orders, users, products
12. refunds        — referensi ke orders, users
13. notifications  — referensi ke orders, tickets, refunds, users
14. finances       — referensi ke orders, refunds, users
```

---

## Relasi Antar Data

```
User ─────────────────────────────────────────────────┐
Category ──────────────────────────────────────┐      │
Type ───────────────────────────────────────────┤──→ Product
Tag ────────────────────────────────────────────┘      │
                                                        │
User + Product ──────────────────────→ Wishlist        │
User + Product ──────────────────────→ Cart            │
User + Product ──────────────────────→ Order ──────────┤
Order ───────────────────────────────→ Ticket          │
Order + User ────────────────────────→ Refund          │
User ────────────────────────────────→ Notification    │
Order/Refund ────────────────────────→ Finance         │
RefundPolicy ────────────────────────→ (global)        │
```

---

## ID Reference Map

### Categories
| _id | Nama |
|---|---|
| `507f1f77bcf86cd799439011` | Private Trip |
| `507f1f77bcf86cd799439012` | Solo Traveling |
| `507f1f77bcf86cd799439013` | FIT / Backpacking |
| `507f1f77bcf86cd799439014` | Flashpacking |
| `507f1f77bcf86cd799439015` | Corporate / Incentive Trip |
| `507f1f77bcf86cd799439016` | Staycation |
| `507f1f77bcf86cd799439017` | Honeymoon Trip |
| `507f1f77bcf86cd799439018` | Open Trip |
| `507f1f77bcf86cd799439019` | Luar Negeri |
| `507f1f77bcf86cd79943901a` | Adventure Trip |

### Types
| _id | Nama |
|---|---|
| `507f1f77bcf86cd79943902a` | Wisata Alam |
| `507f1f77bcf86cd79943902b` | Wisata Budaya |
| `507f1f77bcf86cd79943902c` | Wisata Bahari |
| `507f1f77bcf86cd79943902d` | Wisata Kuliner |
| `507f1f77bcf86cd79943902e` | Wisata Petualangan |
| `507f1f77bcf86cd79943902f` | Eco Tourism |
| `507f1f77bcf86cd799439030` | City Tour |

### Tags
| _id | Nama | Warna |
|---|---|---|
| `507f1f77bcf86cd79943903a` | Family Friendly | #22C55E |
| `507f1f77bcf86cd79943903b` | Budget Friendly | #3B82F6 |
| `507f1f77bcf86cd79943903c` | Luxury | #D97706 |
| `507f1f77bcf86cd79943903d` | Adventure | #EF4444 |
| `507f1f77bcf86cd79943903e` | Romantic | #EC4899 |
| `507f1f77bcf86cd79943903f` | Solo | #8B5CF6 |
| `507f1f77bcf86cd799439040` | Group | #FF6B35 |
| `507f1f77bcf86cd799439041` | Weekend Trip | #14B8A6 |
| `507f1f77bcf86cd799439042` | Long Holiday | #6366F1 |
| `507f1f77bcf86cd799439043` | Hidden Gem | #F59E0B |

### Users
| _id | Nama | Role | Password |
|---|---|---|---|
| `507f1f77bcf86cd799460001` | Lutfi Apriamto | admin | Admin@123 |
| `507f1f77bcf86cd799460002` | Andi Pratama | user | User@123 |
| `507f1f77bcf86cd799460003` | Siti Rahayu | user | User@123 |
| `507f1f77bcf86cd799460004` | Budi Santoso | user | User@123 |
| `507f1f77bcf86cd799460005` | Dewi Kusuma | user | User@123 |
| `507f1f77bcf86cd799460006` | Rizky Firmansyah | user | User@123 |

### Products
| _id | Nama | Harga | Keberangkatan |
|---|---|---|---|
| `507f1f77bcf86cd799450001` | Bali Honeymoon Romantis 4D3N | Rp 4.500.000 | 15 Agustus 2026 |
| `507f1f77bcf86cd799450002` | Lombok Adventure Trip 3D2N | Rp 2.800.000 | 05 September 2026 |
| `507f1f77bcf86cd799450003` | Raja Ampat Diving Paradise 5D4N | Rp 8.500.000 | 12 Oktober 2026 |
| `507f1f77bcf86cd799450004` | Yogyakarta Heritage Tour 3D2N | Rp 1.800.000 | 19 Juli 2026 |
| `507f1f77bcf86cd799450005` | Labuan Bajo Premium Private 4D3N | Rp 7.200.000 | 20 September 2026 |
| `507f1f77bcf86cd799450006` | Bromo Sunrise Weekend 2D1N | Rp 850.000 | 12 Juli 2026 |
| `507f1f77bcf86cd799450007` | Flores Island Hopping 6D5N | Rp 6.500.000 | 05 Oktober 2026 |
| `507f1f77bcf86cd799450008` | Derawan Snorkeling & Dive 4D3N | Rp 4.200.000 | 08 Agustus 2026 |
| `507f1f77bcf86cd799450009` | Toraja Cultural Immersion 5D4N | Rp 5.500.000 | 01 November 2026 |
| `507f1f77bcf86cd79945000a` | Wakatobi Marine Paradise 4D3N | Rp 7.800.000 | 15 November 2026 |
| `507f1f77bcf86cd79945000b` | Komodo Dragon & Pink Beach 3D2N | Rp 4.900.000 | 22 Agustus 2026 |
| `507f1f77bcf86cd79945000c` | Bunaken Underwater World 3D2N | Rp 3.600.000 | 12 September 2026 |
| `507f1f77bcf86cd79945000d` | Bali Family Fun 5D4N | Rp 3.500.000 | 20 Desember 2026 |
| `507f1f77bcf86cd79945000e` | Singapore City Explorer 4D3N | Rp 8.900.000 | 25 Juli 2026 |
| `507f1f77bcf86cd79945000f` | Bandung Weekend Getaway 2D1N | Rp 1.200.000 | 05 Juli 2026 |

### Orders (20 pesanan)
| _id | Kode | User | Produk | Status | Total |
|---|---|---|---|---|---|
| `507f1f77bcf86cd799470001` | ORD-20260115-0001 | Andi | Bali Honeymoon | paid | Rp 9.350.000 |
| `507f1f77bcf86cd799470002` | ORD-20260118-0002 | Andi | Bromo Sunrise | paid | Rp 1.700.000 |
| `507f1f77bcf86cd799470003` | ORD-20260120-0003 | Siti | Yogyakarta | paid | Rp 5.400.000 |
| `507f1f77bcf86cd799470004` | ORD-20260122-0004 | Siti | Lombok Adventure | paid | Rp 5.800.000 |
| `507f1f77bcf86cd799470005` | ORD-20260201-0005 | Budi | Raja Ampat | paid | Rp 17.450.000 |
| `507f1f77bcf86cd799470006` | ORD-20260205-0006 | Budi | Bandung | paid | Rp 4.800.000 |
| `507f1f77bcf86cd799470007` | ORD-20260210-0007 | Dewi | Bali Family Fun | paid | Rp 14.600.000 |
| `507f1f77bcf86cd799470008` | ORD-20260215-0008 | Dewi | Derawan | paid | Rp 8.400.000 |
| `507f1f77bcf86cd799470009` | ORD-20260220-0009 | Rizky | Singapore | paid | Rp 18.600.000 |
| `507f1f77bcf86cd79947000a` | ORD-20260301-0010 | Rizky | Komodo | paid | Rp 14.700.000 |
| `507f1f77bcf86cd79947000b` | ORD-20260610-0011 | Andi | Labuan Bajo | **pending_payment** | Rp 14.400.000 |
| `507f1f77bcf86cd79947000c` | ORD-20260612-0012 | Siti | Toraja | **pending_payment** | Rp 11.000.000 |
| `507f1f77bcf86cd79947000d` | ORD-20260615-0013 | Dewi | Flores | **pending_payment** | Rp 19.500.000 |
| `507f1f77bcf86cd79947000e` | ORD-20260618-0014 | Rizky | Wakatobi | **pending_payment** | Rp 15.600.000 |
| `507f1f77bcf86cd79947000f` | ORD-20260501-0015 | Budi | Bunaken | **cancelled** | Rp 7.200.000 |
| `507f1f77bcf86cd799470010` | ORD-20260510-0016 | Rizky | Bandung | **cancelled** | Rp 3.600.000 |
| `507f1f77bcf86cd799470011` | ORD-20260601-0017 | Siti | Bromo | **cancelled** | Rp 1.700.000 |
| `507f1f77bcf86cd799470012` | ORD-20260310-0018 | Budi | Bali Honeymoon | **refunded** | Rp 9.000.000 |
| `507f1f77bcf86cd799470013` | ORD-20260315-0019 | Andi | Toraja | **refunded** | Rp 11.000.000 |
| `507f1f77bcf86cd799470014` | ORD-20260401-0020 | Dewi | Singapore | **refunded** | Rp 26.700.000 |

### Tickets (13 tiket)
| _id | Kode | Order | User | Valid? |
|---|---|---|---|---|
| `507f1f77bcf86cd799480001` | TRIP-2601-0001 | order 001 | Andi | ✅ valid |
| `507f1f77bcf86cd799480002` | TRIP-2601-0002 | order 002 | Andi | ✅ valid |
| `507f1f77bcf86cd799480003` | TRIP-2601-0003 | order 003 | Siti | ✅ valid |
| `507f1f77bcf86cd799480004` | TRIP-2601-0004 | order 004 | Siti | ✅ valid |
| `507f1f77bcf86cd799480005` | TRIP-2602-0005 | order 005 | Budi | ✅ valid |
| `507f1f77bcf86cd799480006` | TRIP-2602-0006 | order 006 | Budi | ✅ valid |
| `507f1f77bcf86cd799480007` | TRIP-2602-0007 | order 007 | Dewi | ✅ valid |
| `507f1f77bcf86cd799480008` | TRIP-2602-0008 | order 008 | Dewi | ✅ valid |
| `507f1f77bcf86cd799480009` | TRIP-2602-0009 | order 009 | Rizky | ✅ valid |
| `507f1f77bcf86cd79948000a` | TRIP-2603-0010 | order 010 | Rizky | ✅ valid |
| `507f1f77bcf86cd79948000b` | TRIP-2603-0011 | order 018 | Budi | ❌ invalidated (refund) |
| `507f1f77bcf86cd79948000c` | TRIP-2603-0012 | order 019 | Andi | ❌ invalidated (refund) |
| `507f1f77bcf86cd79948000d` | TRIP-2604-0013 | order 020 | Dewi | ❌ invalidated (refund) |

### Refunds (5 pengajuan)
| _id | Order | User | Status | % Refund | Dana Kembali |
|---|---|---|---|---|---|
| `507f1f77bcf86cd799490001` | order 004 (Lombok) | Siti | **rejected** | - | - |
| `507f1f77bcf86cd799490002` | order 009 (Singapore) | Rizky | **pending** | - | - |
| `507f1f77bcf86cd799490003` | order 018 (Bali Honeymoon) | Budi | **approved** | 100% | Rp 9.000.000 |
| `507f1f77bcf86cd799490004` | order 019 (Toraja) | Andi | **approved** | 75% | Rp 8.250.000 |
| `507f1f77bcf86cd799490005` | order 020 (Singapore) | Dewi | **approved** | 50% | Rp 13.350.000 |

### Finance (17 transaksi)
| _id | Tipe | Kategori | Jumlah | Saldo Setelah |
|---|---|---|---|---|
| `507f1f77bcf86cd799530001` | income | order | Rp 9.350.000 | Rp 9.350.000 |
| `507f1f77bcf86cd799530002` | income | order | Rp 1.700.000 | Rp 11.050.000 |
| `507f1f77bcf86cd799530003` | income | order | Rp 5.400.000 | Rp 16.450.000 |
| `507f1f77bcf86cd799530004` | income | order | Rp 5.800.000 | Rp 22.250.000 |
| `507f1f77bcf86cd799530005` | income | order | Rp 17.450.000 | Rp 39.700.000 |
| `507f1f77bcf86cd799530006` | income | order | Rp 4.800.000 | Rp 44.500.000 |
| `507f1f77bcf86cd799530007` | income | order | Rp 14.600.000 | Rp 59.100.000 |
| `507f1f77bcf86cd799530008` | income | order | Rp 8.400.000 | Rp 67.500.000 |
| `507f1f77bcf86cd799530009` | income | order | Rp 18.600.000 | Rp 86.100.000 |
| `507f1f77bcf86cd79953000a` | income | order | Rp 14.700.000 | Rp 100.800.000 |
| `507f1f77bcf86cd79953000b` | income | order | Rp 9.000.000 | Rp 109.800.000 |
| `507f1f77bcf86cd79953000c` | income | order | Rp 11.000.000 | Rp 120.800.000 |
| `507f1f77bcf86cd79953000d` | income | order | Rp 26.700.000 | Rp 147.500.000 |
| `507f1f77bcf86cd79953000e` | **outcome** | withdrawal | Rp 20.000.000 | Rp 127.500.000 |
| `507f1f77bcf86cd79953000f` | **outcome** | refund | Rp 9.000.000 | Rp 118.500.000 |
| `507f1f77bcf86cd799530010` | **outcome** | refund | Rp 13.350.000 | Rp 105.150.000 |
| `507f1f77bcf86cd799530011` | **outcome** | refund | Rp 8.250.000 | **Rp 96.900.000** |

**Saldo akhir platform: Rp 96.900.000**

---

## Catatan Penting untuk Seeding

### 1. Password Users (WAJIB di-hash sebelum insert!)
```js
const bcrypt = require('bcrypt');
// Admin
const adminHash = await bcrypt.hash('Admin@123', 12);
// User biasa
const userHash = await bcrypt.hash('User@123', 12);
```
Ganti nilai `password` di `users.json` dengan hash yang dihasilkan sebelum `insertMany`.

### 2. Hapus Field `_note` Sebelum Insert
Field `_note` di beberapa dokumen hanya komentar untuk developer. Hapus sebelum insert.

### 3. ObjectId Format
Semua `_id` sudah dalam format 24-karakter hex yang valid untuk MongoDB ObjectId.

### 4. Notifikasi yang Belum Dibaca (isRead: false)
Beberapa notifikasi sengaja dibuat `isRead: false` untuk mensimulasikan notifikasi baru yang belum dibaca. Ini akan muncul sebagai badge di navbar user.

### 5. Tiket yang Di-invalidasi
Tiket dengan kode TRIP-2603-0011, TRIP-2603-0012, dan TRIP-2604-0013 sengaja dibuat `isValid: false` karena order-nya sudah di-refund.

### 6. Saldo Finance Bersifat Running Balance
Field `balanceAfter` di setiap record finance adalah saldo akumulatif setelah transaksi terjadi. Urutan insert harus sesuai urutan `createdAt`.

### 7. Tanggal Keberangkatan
Semua tanggal departure mulai Juli 2026 agar produk tidak expired saat testing. Data orders dibuat mulai Januari 2026.
