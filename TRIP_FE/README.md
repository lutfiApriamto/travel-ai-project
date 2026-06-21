# Travia Frontend

Frontend **Travia — AI Travel Agent**, platform pemesanan paket wisata Indonesia berbasis AI. Dibangun dengan React 19 + Vite + Tailwind CSS v4 sebagai portfolio project untuk posisi Fullstack Developer.

---

## Tech Stack

| Komponen | Teknologi | Versi |
|---|---|---|
| Build Tool | Vite | v8 |
| UI Framework | React | v19 |
| Styling | Tailwind CSS v4 (CSS-first config) | v4.3 |
| Routing | React Router DOM | v7 |
| Server State | TanStack Query (React Query) | v5 |
| Client State | Zustand | v5 |
| Form | React Hook Form | v7 |
| Validation | Zod | v4 |
| HTTP Client | Axios | v1 |
| Animation | Framer Motion | v12 |
| Icons | Lucide React | v1 |
| Toast | react-hot-toast | v2 |
| QR Code | qrcode.react | v4 |
| QR Scanner | html5-qrcode | v2 |
| Charts | Recharts | v3 |
| Language | JavaScript (bukan TypeScript) | — |
| Deployment | Vercel | — |

---

## Prasyarat

- Node.js 18+
- Backend Travia sudah berjalan (lihat `TRIP_BE/README.md`)

---

## Setup & Instalasi

**1. Install dependencies**
```bash
cd TRIP_FE
npm install
```

**2. Salin dan isi environment variables**
```bash
cp .env.example .env
# atau buat .env manual — isi dengan nilai yang sesuai
```

**3. Jalankan dev server**
```bash
npm run dev
# Akses di http://localhost:5173
```

**4. Build untuk production**
```bash
npm run build
```

---

## Environment Variables

| Variable | Keterangan | Contoh |
|---|---|---|
| `VITE_API_BASE_URL` | URL base API backend | `http://localhost:5000/api` |
| `VITE_MIDTRANS_CLIENT_KEY` | Midtrans client key (Sandbox) | `Mid-client-xxxxx` |
| `VITE_MIDTRANS_IS_PRODUCTION` | Mode produksi Midtrans | `false` |

> `VITE_` prefix wajib untuk semua env var yang diakses frontend (Vite convention). Tanpa prefix ini, variabel tidak akan terbaca di browser.

---

## Struktur Folder

```
src/
├── assets/                     # Gambar, SVG statis
│
├── components/
│   ├── layout/                 # Layout wrappers
│   │   ├── UserLayout.jsx      # Layout halaman user (Navbar + main + Footer)
│   │   ├── AdminLayout.jsx     # Layout halaman admin (Sidebar + Topbar + main)
│   │   ├── AuthLayout.jsx      # Layout halaman auth (centered card)
│   │   ├── navbar/             # Navbar user (search, dark mode, profile dropdown)
│   │   ├── footer/             # Footer user
│   │   ├── sidebar/            # Admin sidebar (collapsible, mobile drawer)
│   │   └── admin-topbar/       # Admin topbar (breadcrumb, clock, dark mode, logout)
│   │
│   ├── shared/
│   │   ├── admin/              # Komponen admin reusable (DeleteConfirmDialog, MasterDataModal)
│   │   └── PriceInput.jsx      # Input nominal dengan format Rp X.XXX otomatis
│   │
│   └── ui/                     # Komponen shadcn/ui primitif
│
├── context/
│   └── ThemeContext.jsx        # Dark/light mode context (toggle, persist localStorage)
│
├── hooks/
│   └── useDebounce.js          # Debounce hook untuk search input
│
├── lib/
│   ├── axios.js                # Axios instance + interceptor (auth header, token refresh)
│   ├── queryClient.js          # TanStack Query client config
│   └── utils.js                # cn() helper (clsx + tailwind-merge)
│
├── pages/
│   ├── admin/modules/          # Semua halaman admin
│   │   ├── dashboard/          # Dashboard stats + charts
│   │   ├── products/           # CRUD produk (list, create, edit, detail)
│   │   ├── orders/             # Pesanan admin (list + detail, read-only)
│   │   ├── users/              # Manajemen user (list + detail, suspend)
│   │   ├── refunds/            # Refund admin (list + detail + kebijakan)
│   │   ├── tickets/            # Tiket admin (list + detail + check-in QR)
│   │   ├── finance/            # Keuangan (balance, transaksi, withdrawal, CSV export)
│   │   ├── notifications/      # Broadcast notifikasi ke user
│   │   └── master-data/        # CRUD: Kategori, Tipe, Tag, Banner, Wilayah
│   │
│   ├── auth/modules/           # Login, Register, Forgot Password, Reset Password
│   │
│   ├── home/                   # Beranda (banner carousel, produk infinite scroll, AI CTA)
│   ├── products/               # Listing produk (filter sidebar + URL params)
│   ├── product-detail/         # Detail produk (gallery, booking card, itinerary)
│   ├── wishlist/               # Daftar wishlist user
│   ├── cart/                   # Keranjang belanja
│   ├── checkout/               # Checkout (pilih item + konfirmasi)
│   ├── payment/                # Integrasi Midtrans Snap (state machine 8 fase)
│   ├── orders/                 # Riwayat pesanan user
│   ├── order-detail/           # Detail pesanan + ajukan refund
│   ├── tickets/                # Daftar tiket user
│   ├── ticket-detail/          # Detail tiket (QR code + download PDF)
│   ├── refunds/                # Riwayat refund + form pengajuan baru
│   ├── notifications/          # Notifikasi (infinite scroll cursor-based)
│   ├── profile/                # Profil user (view + edit + ganti password)
│   └── ai/                     # AI Chat (chat + product grid dinamis)
│
├── routes/
│   ├── index.jsx               # Router config (lazyPage helper, semua routes)
│   └── guards/
│       ├── ProtectedRoute.jsx  # Guard: harus login (redirect ke /auth/login)
│       └── AdminRoute.jsx      # Guard: harus login + role admin
│
├── stores/
│   ├── useAuthStore.js         # Auth state (user, accessToken, isAuthenticated)
│   ├── useCartStore.js         # Cart badge count untuk Navbar
│   └── useNotificationStore.js # Unread notification count untuk Navbar badge
│
└── utils/
    ├── consts/
    │   └── routes.js           # Semua konstanta route (ROUTES.HOME, ROUTES.ADMIN.DASHBOARD, dll)
    └── helpers/                # Helper functions
```

---

## Routing

### Tiga Layout Utama

| Layout | Route | Komponen |
|---|---|---|
| `UserLayout` | Semua halaman user | Navbar + main + Footer |
| `AdminLayout` | `/admin/*` | Sidebar + Topbar + main |
| `AuthLayout` | `/auth/*`, `/reset-password/:token` | Centered card, tanpa nav |

### Route Guards

```
UserLayout
├── [Public] /                      → Home
├── [Public] /products              → Product List
├── [Public] /products/:slug        → Product Detail
├── [Public] /refunds/policy        → Kebijakan Refund
└── ProtectedRoute (harus login)
    ├── /wishlist, /cart, /checkout
    ├── /payment/:orderId
    ├── /orders, /orders/:id
    ├── /tickets, /tickets/:id
    ├── /refunds, /refunds/new
    ├── /notifications
    ├── /profile, /profile/edit, /profile/change-password
    └── /ai

AdminRoute (harus login + role admin)
└── AdminLayout
    └── /admin/* (semua halaman admin)
```

### Lazy Loading

Semua halaman dimuat secara lazy menggunakan helper `lazyPage()` agar bundle tidak membesar:

```jsx
const lazyPage = (importFn) => {
  const Page = lazy(importFn);
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
};

// Contoh penggunaan di router:
{ path: ROUTES.HOME, element: lazyPage(() => import('../pages/home/index.jsx')) }
```

---

## State Management

### Zustand (Client State)

| Store | File | Isi |
|---|---|---|
| `useAuthStore` | `stores/useAuthStore.js` | `user`, `accessToken`, `isAuthenticated` |
| `useCartStore` | `stores/useCartStore.js` | `itemCount` — badge cart di Navbar |
| `useNotificationStore` | `stores/useNotificationStore.js` | `unreadCount` — badge notifikasi di Navbar |

Zustand hanya digunakan untuk **shared UI state** yang diakses lintas komponen tanpa prop-drilling. State lokal halaman tetap menggunakan `useState`.

Mengakses Zustand di luar React component (misal mutation onSuccess):
```js
useCartStore.getState().increment();         // ✅ aman
useNotificationStore.getState().decrement(); // ✅ aman
```

### TanStack Query (Server State)

Semua data dari API dikelola TanStack Query v5. Setiap modul halaman punya file API hooks sendiri:

```
pages/orders/
├── api/
│   └── useOrders.js    ← useOrders(), useCancelOrder()
└── index.jsx
```

**Format response backend (wajib dipahami):**

```js
// ⚠️ PENTING: format bertingkat tiga

// Non-paginated (banners, categories, types, tags, dll):
r.data.data.data = array

// Paginated (products, orders, refunds, dll):
r.data.data.data      = items[]
r.data.data.totalData = total count
r.data.data.totalPage = total pages
```

---

## Autentikasi

Sistem auth menggunakan **JWT dual-token**:
- **Access token**: di-store di `useAuthStore` (memory), lifetime pendek
- **Refresh token**: HttpOnly cookie `trip_refresh`, dikelola backend

Axios interceptor (`lib/axios.js`) menangani otomatis:
1. Attach `Authorization: Bearer <token>` ke setiap request
2. Intercept 401 → call `POST /auth/refresh` → retry request original
3. Jika refresh gagal → `clearAuth()` + redirect ke `/auth/login`
4. Refresh queue: mencegah 401 paralel memicu multiple refresh sekaligus

---

## Tema & Styling

### Tailwind CSS v4 (CSS-first)

Konfigurasi token di `src/index.css` menggunakan `@theme`:

```css
@theme {
  --color-travia-orange:  #FF6B35;
  --color-background:     #FAF7F0;
  --color-card:           #F0E8D8;
  --color-page-shell:     #D5CFC7;  /* background admin shell */
  /* ... lihat index.css untuk semua token */
}

.dark {
  --color-background: #1A1510;
  /* ... dark mode overrides */
}
```

### Dark Mode

Class `.dark` di `<html>` element, dikelola `ThemeContext`, persisted ke `localStorage('travia-theme')`.

### Admin: Page Shell Effect

Admin layout menggunakan efek depth "card terapung di atas background":
- Outer div: `bg-page-shell` (lebih gelap)
- Content area: `bg-background` (lebih terang)

### Typography

- **Heading**: `font-serif italic` → Georgia (dipakai untuk semua `<h1>`, `<h2>`)
- **Body**: `font-sans` → Inter (default)

---

## Input Nominal/Harga

Gunakan komponen `PriceInput` untuk semua input yang berhubungan dengan uang:

```jsx
import PriceInput from 'components/shared/PriceInput.jsx';

// Controlled (tanpa RHF):
<PriceInput
  value={amount}
  onChange={(num) => setAmount(num)}  // callback angka murni, undefined jika kosong
/>

// Dengan React Hook Form (wajib pakai Controller):
<Controller
  name="price"
  control={control}
  rules={{ required: 'Harga wajib diisi' }}
  render={({ field: { value, onChange, onBlur } }) => (
    <PriceInput value={value} onChange={onChange} onBlur={onBlur} />
  )}
/>
```

User ketik `10000` → tampil `Rp 10.000` → `onChange(10000)` (angka murni, bukan string).

---

## Midtrans Payment

Halaman `/payment/:orderId` state machine:

```
initializing → creating token
     ↓
    ready → [Snap popup open]
     ↓           ↓
  polling    onClose → ready (resume button)
     ↓
  success / failed / cancelled / timeout (45 detik)
```

Config di `.env`: `VITE_MIDTRANS_CLIENT_KEY`, `VITE_MIDTRANS_IS_PRODUCTION`

---

## AI Chat (`/ai`)

- **Stateless di backend** — frontend kirim full `conversationHistory` tiap request
- Backend return `{ message, recommendedProductIds, showAll }`
- `showAll: true` → tampilkan semua produk (infinite scroll)
- `showAll: false + ids` → tampilkan hanya produk yang direkomendasikan AI
- **Client-side rate limit**: 30 pesan/jam per sesi (reset saat tinggalkan halaman)
- **Navigation guard**: `useBlocker` + `beforeunload` mencegah loss percakapan

---

## Daftar Halaman Lengkap

### User-facing (19 halaman)

| Route | Halaman | Auth |
|---|---|---|
| `/` | Home | Public |
| `/products` | Listing Produk | Public |
| `/products/:slug` | Detail Produk | Public |
| `/refunds/policy` | Kebijakan Refund | Public |
| `/wishlist` | Wishlist | Login |
| `/cart` | Keranjang | Login |
| `/checkout` | Checkout | Login |
| `/payment/:orderId` | Pembayaran (Midtrans) | Login |
| `/orders` | Riwayat Pesanan | Login |
| `/orders/:id` | Detail Pesanan | Login |
| `/tickets` | Tiket Saya | Login |
| `/tickets/:id` | Detail Tiket (QR) | Login |
| `/refunds` | Riwayat Refund | Login |
| `/refunds/new` | Ajukan Refund | Login |
| `/notifications` | Notifikasi | Login |
| `/profile` | Profil Saya | Login |
| `/profile/edit` | Edit Profil | Login |
| `/profile/change-password` | Ganti Password | Login |
| `/ai` | AI Chat | Login |

### Auth (4 halaman)

| Route | Halaman |
|---|---|
| `/auth/login` | Login |
| `/auth/register` | Registrasi |
| `/auth/forgot-password` | Lupa Password |
| `/reset-password/:token` | Reset Password |

### Admin (23 halaman)

| Route | Halaman |
|---|---|
| `/admin` | Dashboard |
| `/admin/products` | Produk (list) |
| `/admin/products/create` | Tambah Produk |
| `/admin/products/:id` | Detail Produk |
| `/admin/products/:id/edit` | Edit Produk |
| `/admin/orders` | Pesanan |
| `/admin/orders/:id` | Detail Pesanan |
| `/admin/users` | Pengguna |
| `/admin/users/:id` | Detail Pengguna |
| `/admin/refunds` | Refund |
| `/admin/refunds/policy` | Kebijakan Refund |
| `/admin/refunds/:id` | Detail Refund |
| `/admin/tickets` | Tiket |
| `/admin/tickets/checkin` | Check-in QR Scanner |
| `/admin/tickets/:id` | Detail Tiket |
| `/admin/finance` | Keuangan |
| `/admin/notifications` | Broadcast Notifikasi |
| `/admin/master-data/categories` | Master Kategori |
| `/admin/master-data/types` | Master Tipe |
| `/admin/master-data/tags` | Master Tag |
| `/admin/master-data/banners` | Master Banner |
| `/admin/master-data/wilayah` | Master Wilayah |

---

## Scripts

```bash
npm run dev       # Dev server (http://localhost:5173, HMR aktif)
npm run build     # Build production ke /dist
npm run preview   # Preview hasil build secara lokal
```

---

## Deploy ke Vercel

1. Connect repo GitHub ke Vercel
2. Set **Root Directory**: `TRIP_FE`
3. Set environment variables di Vercel dashboard
4. Deploy — `vercel.json` sudah dikonfigurasi untuk SPA routing (semua path → `index.html`)
