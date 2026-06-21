# Developer Guidelines — Travia Frontend

Panduan ini menjelaskan konvensi kode, pola implementasi, dan aturan yang digunakan di seluruh proyek frontend. Baca dokumen ini sebelum menambahkan fitur baru agar codebase tetap konsisten.

---

## Filosofi Kode

1. **Satu halaman = satu folder** — pisahkan tiap halaman ke folder sendiri, jangan campur logika antar halaman
2. **API hooks terpisah dari UI** — semua TanStack Query dan mutasi di file `api/use*.js`, halaman hanya mengkonsumsi
3. **URL sebagai single source of truth untuk filter** — gunakan `useSearchParams` untuk filter/search, bukan state lokal, agar URL bisa dibagikan
4. **Zustand hanya untuk shared UI state** — auth, cart count, notification count. State lokal halaman → `useState`
5. **Empty state wajib** — setiap tampilan data harus punya kondisi kosong yang informatif
6. **Guard error dari response API** — selalu cek `Array.isArray()` sebelum `.map()` karena response shape bisa berubah
7. **Hindari komentar obvious** — nama fungsi dan variabel harus cukup jelas

---

## Aturan Import

Semua file menggunakan **ekstensi `.jsx` atau `.js`** di import path:

```js
// ✅ BENAR
import ProductCard from './components/ProductCard.jsx';
import { useOrders } from './api/useOrders.js';
import { ROUTES } from '../utils/consts/routes.js';

// ❌ SALAH — tanpa ekstensi bisa gagal di beberapa resolver
import ProductCard from './components/ProductCard';
```

---

## Struktur Page Module

Setiap halaman baru mengikuti pola berikut:

```
pages/<nama-fitur>/
├── api/
│   └── use<NamaFitur>.js   ← semua useQuery + useMutation
├── components/              ← komponen lokal (opsional)
│   └── SomeComponent.jsx
└── index.jsx                ← halaman utama
```

Contoh untuk fitur Orders:
```
pages/orders/
├── api/
│   └── useOrders.js        ← useOrders(), useCancelOrder()
└── index.jsx
```

---

## Konvensi API Hooks

### Format Response Backend

**Wajib dipahami — format response selalu bertingkat tiga:**

```js
// Non-paginated (categories, banners, tags, dll):
const data = r.data.data.data;   // ← array atau object

// Paginated (products, orders, refunds, dll):
const items     = r.data.data.data;       // ← items[]
const totalData = r.data.data.totalData;  // ← total count
const totalPage = r.data.data.totalPage;  // ← total pages
```

**Jangan pernah akses `r.data.data` langsung sebagai array** — itu adalah object `{ data, message, [totalData, totalPage] }`.

### Template useQuery

```js
// Untuk list biasa (non-paginated):
export const useCategories = () =>
  useQuery({
    queryKey:  ['categories'],
    queryFn:   () =>
      api.get('/categories').then((r) => {
        const data = r.data.data.data;
        return Array.isArray(data) ? data : []; // ← selalu guard dengan Array.isArray
      }),
    staleTime: 10 * 60_000,
  });

// Untuk list dengan pagination:
export const useOrders = (params = {}) =>
  useQuery({
    queryKey:  ['orders', params],
    queryFn:   () =>
      api.get('/orders', { params: { page: params.page || 1, limit: 10, ... } })
        .then((r) => ({
          orders:    Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    placeholderData: (prev) => prev, // ← cegah flash saat filter berubah
    staleTime: 30_000,
  });

// Untuk detail single item:
export const useOrder = (id) =>
  useQuery({
    queryKey: ['order', id],
    queryFn:  () => api.get(`/orders/${id}`).then((r) => r.data.data.data),
    enabled:  !!id,        // ← hanya fetch jika id ada
    staleTime: 30_000,
  });
```

### Template useMutation

```js
export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      api.delete(`/orders/${orderId}`).then((r) => r.data.data.data),
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ['orders'] });      // invalidate list
      qc.invalidateQueries({ queryKey: ['order', orderId] }); // invalidate detail
      toast.success('Pesanan berhasil dibatalkan');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal membatalkan pesanan'),
  });
};
```

**Aturan error message:**
```js
// ✅ BENAR — ambil dari response backend jika ada
e.response?.data?.data?.message ?? 'Fallback message'

// ❌ SALAH — jangan hardcode tanpa fallback
e.response.data.data.message  // crash jika network error
```

### Template useInfiniteQuery (Infinite Scroll)

```js
export const useInfiniteProducts = (filters = {}) =>
  useInfiniteQuery({
    queryKey:         ['products', 'infinite', filters],
    queryFn:          ({ pageParam }) =>
      api.get('/products', { params: { ...filters, page: pageParam, limit: 12 } })
        .then((r) => ({
          products:    Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData:   r.data.data.totalData ?? 0,
          totalPage:   r.data.data.totalPage ?? 1,
          currentPage: pageParam,
        })),
    initialPageParam: 1,                                   // ← v5: wajib ada
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPage
        ? lastPage.currentPage + 1
        : undefined,
    staleTime: 30_000,
  });

// Konsumsi:
const allItems = data?.pages.flatMap((p) => p.products) ?? [];
```

### Cursor-based Infinite Query (Notifikasi)

```js
export const useInfiniteNotifications = (filters = {}) =>
  useInfiniteQuery({
    queryKey:         ['notifications', filters],
    queryFn:          ({ pageParam }) =>   // pageParam = cursor (null untuk pertama)
      api.get('/notifications', { params: { cursor: pageParam ?? undefined, limit: 20 } })
        .then((r) => r.data.data.data),    // r.data.data.data = { notifications, nextCursor, hasMore }
    initialPageParam: null,                // ← null = no cursor (first page)
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });
```

---

## Konvensi Komponen

### Struktur Komponen Halaman

```jsx
// pages/orders/index.jsx

// 1. Imports
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link }                      from 'react-router-dom';
import { ... }                                        from 'lucide-react';
import { cn }                                         from '../../lib/utils.js';
import { ROUTES }                                     from '../../utils/consts/routes.js';
import { useOrders, useCancelOrder }                  from './api/useOrders.js';

// 2. Helpers / Constants (di luar komponen)
const formatIDR = (v) => new Intl.NumberFormat('id-ID', ...).format(v ?? 0);
const STATUS_MAP = { ... };

// 3. Sub-komponen kecil (di luar komponen utama)
const StatusBadge = ({ status }) => { ... };
const SkeletonRow = () => { ... };
const EmptyState = ({ hasFilters }) => { ... };

// 4. Komponen utama
const OrdersPage = () => {
  // State
  // Hooks (query, mutation)
  // Derived state (useMemo)
  // Handlers (useCallback)
  // Render
};

export default OrdersPage;
```

### Aturan Penamaan

| Item | Konvensi | Contoh |
|---|---|---|
| Komponen | PascalCase | `ProductCard`, `OrdersPage` |
| Hook custom | camelCase, prefix `use` | `useOrders`, `useCancelOrder` |
| Konstanta | SCREAMING_SNAKE | `ROUTES`, `STATUS_MAP`, `SESSION_LIMIT` |
| File komponen | kebab-case atau PascalCase | `ProductCard.jsx`, `product-card.jsx` |
| File hooks | camelCase, prefix `use` | `useOrders.js`, `useProducts.js` |

---

## Konvensi Routing

### ROUTES Constant

Semua path didefinisikan di `utils/consts/routes.js`. **Jangan pernah hardcode path string di komponen**:

```js
// ✅ BENAR
import { ROUTES } from '../utils/consts/routes.js';
<Link to={ROUTES.ORDERS} />
navigate(ROUTES.PRODUCT_DETAIL(product.slug));

// ❌ SALAH — hardcode string
<Link to="/orders" />
navigate(`/products/${product.slug}`);
```

### Menambah Route Baru

1. Tambah konstanta di `utils/consts/routes.js`
2. Tambah lazy import di `routes/index.jsx`
3. Pastikan urutan route benar (lebih spesifik sebelum lebih umum):

```js
// ✅ BENAR — '/refunds/policy' sebelum '/refunds/:id'
{ path: ROUTES.REFUND_POLICY, element: lazyPage(...) },
{ path: `${ROUTES.REFUNDS}/:id`, element: lazyPage(...) },

// ❌ SALAH — "policy" akan ditangkap sebagai :id
{ path: `${ROUTES.REFUNDS}/:id`, element: lazyPage(...) },
{ path: ROUTES.REFUND_POLICY, element: lazyPage(...) },
```

---

## Filter dengan URL Params

Filter halaman **wajib** disimpan di URL params (bukan state lokal) agar:
- URL bisa dibagikan
- Back/forward browser berfungsi
- Bookmark bekerja

```jsx
const [searchParams, setSearchParams] = useSearchParams();

// Baca filter dari URL:
const status = searchParams.get('status') || '';
const page   = Math.max(1, Number(searchParams.get('page')) || 1);

// Update filter (replace: true agar tidak polusi history):
const setFilter = useCallback((key, value) => {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');  // ← selalu reset ke halaman 1 saat filter berubah
    return next;
  }, { replace: true });
}, [setSearchParams]);

// Text input — debounce sebelum push ke URL:
const [localSearch, setLocalSearch] = useState(() => searchParams.get('search') || '');
const debouncedSearch = useDebounce(localSearch, 400);

useEffect(() => {
  setFilter('search', debouncedSearch.trim());
}, [debouncedSearch]);  // eslint-disable-line
```

---

## Styling Guidelines

### Tailwind v4 — Aturan Utama

```css
/* ✅ BENAR — gunakan @theme untuk token baru */
@theme {
  --color-custom-blue: #3B82F6;
}

/* ❌ SALAH — jangan override di tailwind.config.js (tidak ada di v4) */
```

### Warna yang Tersedia

```jsx
// Brand colors:
className="bg-travia-orange"         // #FF6B35 — primary CTA
className="bg-travia-orange/10"      // 10% opacity — background accent
className="text-travia-orange"       // text orange
className="bg-travia-dark3"          // #2E2518 — dark input background

// Semantic colors:
className="bg-background"            // page background
className="bg-card"                  // card background
className="text-foreground"          // primary text
className="text-muted-foreground"    // secondary text
className="border-border"            // border default
className="bg-accent"                // hover background
```

### Dark Mode

Gunakan Tailwind dark: prefix, jangan hardcode hex:

```jsx
// ✅ BENAR
className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"

// ❌ SALAH — tidak responsive terhadap dark mode
style={{ backgroundColor: '#f0fdf4' }}
```

### cn() Helper

Selalu gunakan `cn()` dari `lib/utils.js` untuk conditional classes:

```jsx
import { cn } from '../../lib/utils.js';

// ✅ BENAR
<div className={cn('base-class', isActive && 'active-class', error && 'error-class')} />

// ❌ SALAH — string interpolation tidak di-dedup oleh tailwind-merge
<div className={`base-class ${isActive ? 'active-class' : ''}`} />
```

---

## Input Nominal

**Selalu gunakan `PriceInput`** untuk semua input yang menerima nilai uang:

```jsx
import PriceInput from '../../components/shared/PriceInput.jsx';

// Tanpa RHF (controlled):
<PriceInput
  value={price}
  onChange={(num) => setPrice(num)}
  placeholder="0"
  className="w-full h-10 rounded-xl border ..."
/>

// Dengan RHF (wajib pakai Controller, bukan register):
<Controller
  name="price"
  control={control}
  rules={{ required: 'Wajib diisi', min: { value: 0, message: 'Min 0' } }}
  render={({ field: { value, onChange, onBlur } }) => (
    <PriceInput value={value} onChange={onChange} onBlur={onBlur} />
  )}
/>
```

**Jangan gunakan `<input type="number">`** untuk input harga — tampilan tidak sesuai format Indonesia.

**Export utilities dari PriceInput:**
```js
import PriceInput, { formatRupiah, parseRupiah } from '../../components/shared/PriceInput.jsx';

formatRupiah(10000)     // → "10.000"
formatRupiah(1500000)   // → "1.500.000"
parseRupiah("10.000")   // → 10000
parseRupiah("")         // → undefined
```

---

## Zustand

### Cara Akses di dalam Komponen

```js
// ✅ BENAR — select state yang diperlukan saja (performa)
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const unreadCount     = useNotificationStore((s) => s.unreadCount);

// ❌ AGAK BURUK — ambil seluruh store, menyebabkan re-render berlebih
const store = useAuthStore();
```

### Cara Akses di Luar Komponen (misal mutation onSuccess)

```js
// ✅ BENAR — gunakan .getState() di luar hook context
useCartStore.getState().increment();
useAuthStore.getState().clearAuth();

// ❌ SALAH — hook tidak bisa dipanggil di luar komponen
const { increment } = useCartStore(); // akan error
```

---

## Dark/Light Mode

Gunakan `useTheme()` untuk toggle:

```jsx
import { useTheme } from '../../context/ThemeContext.jsx';

const { isDark, toggleTheme } = useTheme();
```

Untuk menentukan apakah dark mode aktif dari luar React (pure JS):
```js
const isDark = document.documentElement.classList.contains('dark');
```

---

## Animasi (Framer Motion)

Gunakan Framer Motion untuk animasi yang bermakna, bukan dekorasi berlebihan:

```jsx
// ✅ BENAR — animasi entry/exit yang halus
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>

// ❌ BERLEBIHAN — jangan animasi semua elemen kecil
<motion.span whileHover={{ scale: 1.02 }}>teks biasa</motion.span>
```

---

## Toast Notifications

Selalu gunakan `react-hot-toast` untuk feedback aksi user:

```js
import toast from 'react-hot-toast';

// Success:
toast.success('Data berhasil disimpan');

// Error:
toast.error('Gagal menyimpan data');

// Custom duration:
toast.success('Berhasil!', { duration: 5000 });
```

**Aturan:**
- `toast.success` → setelah mutasi berhasil (di `onSuccess`)
- `toast.error` → setelah mutasi gagal (di `onError`)
- Jangan tampilkan toast untuk loading state — gunakan button disabled + spinner

---

## Empty States

**Wajib ada** untuk setiap tampilan list:

```jsx
const EmptyState = ({ hasFilters, onReset }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <SomeIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
    <p className="font-semibold text-foreground mb-1">
      {hasFilters ? 'Tidak ada yang cocok' : 'Belum ada data'}
    </p>
    <p className="text-sm text-muted-foreground mb-5 max-w-xs">
      {hasFilters
        ? 'Coba hapus atau ubah filter.'
        : 'Data akan muncul di sini setelah ada.'}
    </p>
    {hasFilters && (
      <button onClick={onReset} className="...">Reset Filter</button>
    )}
  </div>
);
```

**Dua kondisi yang selalu dibedakan:**
1. List kosong karena filter aktif → "Tidak ada hasil" + tombol reset filter
2. List benar-benar kosong → "Belum ada data" + CTA yang relevan

---

## Skeleton Loading

Gunakan skeleton untuk semua data yang di-fetch, jangan hanya loading spinner:

```jsx
// ✅ BENAR — skeleton yang merepresentasikan struktur konten
const CardSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-2.5">
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-3/4 bg-muted rounded" />
    </div>
  </div>
);

// Penggunaan:
{isLoading
  ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
  : items.map((item) => <ItemCard key={item._id} item={item} />)
}
```

---

## Pagination vs Infinite Scroll

### Kapan menggunakan Pagination

Gunakan pagination standar (nomor halaman + ellipsis) untuk:
- Halaman admin (data terstruktur, perlu navigasi spesifik)
- Halaman yang perlu deep-link ke halaman tertentu

```jsx
// Pagination helper pattern:
const pages = Array.from({ length: totalPage }, (_, i) => i + 1)
  .filter((n) => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
  .reduce((acc, n, i, arr) => {
    if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
    acc.push(n);
    return acc;
  }, []);
```

### Kapan menggunakan Infinite Scroll

Gunakan `useInfiniteQuery` + `IntersectionObserver` untuk:
- Home page product grid
- AI page product grid
- Notifikasi (cursor-based)

```jsx
// IntersectionObserver pattern:
const sentinelRef = useRef(null);

useEffect(() => {
  const sentinel = sentinelRef.current;
  if (!sentinel) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
        fetchNextPage();
    },
    { rootMargin: '300px' }  // ← pre-fetch 300px sebelum sentinel terlihat
  );
  observer.observe(sentinel);
  return () => observer.disconnect();  // ← selalu cleanup!
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// Di JSX:
<div ref={sentinelRef} className="h-1" aria-hidden="true" />
```

---

## Form dengan React Hook Form

### Pola Standar

```jsx
import { useForm, Controller } from 'react-hook-form';

const MyForm = () => {
  const {
    register,
    control,       // ← untuk Controller (PriceInput, custom inputs)
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: { name: '', price: undefined } });

  const onSubmit = (data) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Text input biasa: gunakan register */}
      <input {...register('name', { required: 'Nama wajib diisi' })} />
      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}

      {/* Input nominal: HARUS gunakan Controller */}
      <Controller
        name="price"
        control={control}
        rules={{ required: 'Harga wajib diisi' }}
        render={({ field: { value, onChange, onBlur } }) => (
          <PriceInput value={value} onChange={onChange} onBlur={onBlur}
            className={errors.price ? 'border-red-400' : 'border-border'} />
        )}
      />

      <button type="submit" disabled={!isDirty}>Simpan</button>
    </form>
  );
};
```

### Aturan `valueAsNumber`

Jangan gunakan `valueAsNumber: true` pada `register` — gunakan `Controller` dengan `PriceInput` atau `type="number"` input terpisah:

```js
// ❌ SALAH — tidak terintegrasi dengan PriceInput
{...register('price', { valueAsNumber: true })}

// ✅ BENAR
<Controller name="price" control={control}
  render={({ field }) => <PriceInput {...field} />} />
```

---

## Upload File (Avatar)

Avatar user diupload ke endpoint khusus user: `POST /users/me/avatar`:

```js
const formData = new FormData();
formData.append('image', file);  // ← field name harus 'image'

const url = await api.post('/users/me/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then((r) => r.data.data.data);  // → URL string Supabase
```

> Upload admin (produk, banner, dll) menggunakan endpoint berbeda (`/upload/single`, admin-only).

---

## Midtrans Payment Integration

Halaman payment menggunakan `useBlocker` untuk mencegah navigasi selama pembayaran, tidak perlu implementasi ulang:

```jsx
// Midtrans Snap callback pattern:
window.snap.pay(snapToken, {
  onSuccess:  () => startPolling(),   // mulai poll status
  onPending:  () => startPolling(),
  onError:    (result) => setPhase('failed'),
  onClose:    () => setPhase('ready'),  // user tutup popup → tampilkan resume button
});
```

---

## AI Chat — Aturan Khusus

1. **Selalu simpan conversationHistory di local state** (bukan Zustand, bukan localStorage) — percakapan harus hilang saat user tinggalkan halaman
2. **Build history sebelum append userMsg**:
   ```js
   const historySnapshot = buildHistory(messages);    // ← snapshot SEBELUM append
   setMessages((prev) => [...prev, userMsg]);          // ← baru append
   aiChat.mutate({ message: text, conversationHistory: historySnapshot });
   ```
3. **Format role untuk backend**: `'ai'` → `'model'` (bukan `'assistant'`)
4. **Guard rate limit di client** sebelum kirim request, jangan andalkan backend saja

---

## Checklist Menambah Halaman Baru

- [ ] Buat folder `pages/<nama>/` dengan struktur yang benar
- [ ] Buat `api/use<Nama>.js` dengan query/mutation hooks
- [ ] Guard response dengan `Array.isArray()` dan nullish coalescing `?? []`
- [ ] Tambah loading skeleton
- [ ] Tambah empty state (dua kondisi: filtered vs benar-benar kosong)
- [ ] Tambah error state atau error toast
- [ ] Responsive di mobile, tablet, desktop
- [ ] Dark mode kompatibel (gunakan semantic colors `bg-card`, `text-foreground`, dll)
- [ ] Tambah route constant di `utils/consts/routes.js`
- [ ] Tambah route di `routes/index.jsx` menggunakan `lazyPage()`
- [ ] Cek urutan route (lebih spesifik sebelum dynamic `:param`)
- [ ] Cek Footer dan Navbar jika ada link baru yang perlu diperbarui

---

## Checklist Review Sebelum Commit

- [ ] Tidak ada `console.log` yang tertinggal
- [ ] Tidak ada `<ComingSoon />` yang seharusnya sudah diimplementasi
- [ ] Semua import memiliki ekstensi file (`.jsx`, `.js`)
- [ ] Response API diakses dengan `r.data.data.data` (bukan `r.data.data`)
- [ ] Input nominal menggunakan `PriceInput`, bukan `input type="number"`
- [ ] Filter state menggunakan URL params, bukan `useState`
- [ ] Toast error menggunakan `e.response?.data?.data?.message ?? 'fallback'`
- [ ] IntersectionObserver memiliki cleanup `observer.disconnect()`
- [ ] `useEffect` dengan dependency array yang benar
