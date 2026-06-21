# Frontend Plan — Travia AI Travel Agent
> Dokumen ini merangkum semua keputusan teknis frontend sebelum implementasi dimulai.
> Dibaca bersama `TRIP_BE/README.md` dan `feature-list.md` untuk gambaran lengkap.

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Bundler / Framework | Vite + React 19 |
| Bahasa | JavaScript (JSX) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI base) |
| Animasi | Framer Motion + GSAP + Lenis (smooth scroll) |
| State Management | Zustand v5 |
| Data Fetching | TanStack React Query v5 |
| HTTP Client | Axios v1 |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| Routing | React Router DOM v7 |
| Chart | Recharts |
| Icons | Lucide React + React Icons |
| Toast | React Hot Toast |
| Date | date-fns |
| CSS Utilities | clsx + tailwind-merge + class-variance-authority |
| Payment | Midtrans Snap (CDN script, bukan npm) |

---

## Dependencies Final

### Perubahan dari project referensi sebelumnya

| Aksi | Package | Alasan |
|---|---|---|
| **TAMBAH** | `recharts` | Chart dashboard admin (trend, top products) |
| **HAPUS** | `@codemirror/lang-json` | Code editor — tidak ada use case di travel platform |
| **HAPUS** | `@uiw/react-codemirror` | Code editor — tidak ada use case |
| **HAPUS** | `react-diff-viewer-continued` | Code diff viewer — tidak ada use case |
| **HAPUS** | `shiki` | Syntax highlighting — tidak ada use case |
| **AUTO** | `embla-carousel-react` | Ter-install otomatis via `npx shadcn@latest add carousel` |

### `package.json` dependencies final

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.4.0",
    "@tanstack/react-query": "^5.101.0",
    "axios": "^1.17.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "framer-motion": "^12.40.0",
    "gsap": "^3.15.0",
    "lenis": "^1.3.23",
    "lucide-react": "^1.18.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-hook-form": "^7.79.0",
    "react-hot-toast": "^2.6.0",
    "react-icons": "^5.6.0",
    "react-router-dom": "^7.17.0",
    "recharts": "^2.x",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.4.3",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/vite": "^4.3.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "tailwindcss": "^4.3.1",
    "vite": "^8.0.12"
  }
}
```

### Setup Midtrans Snap (CDN — bukan npm)

Tambahkan di `index.html` sebelum `</body>`:
```html
<!-- Midtrans Snap SDK (Sandbox) -->
<script
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="SB-Mid-client-XXXXXXX">
</script>
```

Di komponen React, panggil via:
```js
window.snap.pay(snapToken, {
  onSuccess: (result) => { /* redirect ke /orders/:id */ },
  onPending: (result) => { /* tampilkan pesan menunggu */ },
  onError:   (result) => { /* tampilkan error */ },
  onClose:   ()       => { /* user tutup popup tanpa bayar */ },
});
```

---

## Environment Variables

Buat file `.env` di root folder frontend:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXX
```

> Semua env variable di Vite wajib diawali `VITE_` agar ter-expose ke client.

---

## Struktur Folder

```
src/
│
├── main.jsx
├── App.jsx
├── index.css
│
├── lib/
│   ├── axios.js          ← Axios instance + JWT interceptor + auto-refresh on 401
│   ├── queryClient.js    ← React Query client config (staleTime, retry, dll)
│   └── utils.js          ← cn() helper (clsx + tailwind-merge) — wajib untuk shadcn
│
├── routes/
│   ├── index.jsx         ← Root router
│   ├── userRoutes.jsx    ← Semua route halaman user
│   ├── adminRoutes.jsx   ← Semua route halaman admin
│   └── guards/
│       ├── ProtectedRoute.jsx   ← Redirect ke /auth/login jika belum login
│       └── AdminRoute.jsx       ← Redirect ke / jika bukan admin
│
├── stores/               ← Global Zustand stores (hanya state yang benar-benar global)
│   ├── useAuthStore.js   ← { user, accessToken, isAuthenticated, setAuth, clearAuth }
│   └── useCartStore.js   ← { itemCount, setItemCount } untuk badge navbar saja
│
├── components/
│   ├── ui/               ← shadcn components (auto-generated via CLI, jangan diedit manual)
│   │   ├── button.jsx
│   │   ├── dialog.jsx
│   │   ├── carousel.jsx
│   │   ├── sheet.jsx
│   │   ├── table.jsx
│   │   ├── select.jsx
│   │   ├── badge.jsx
│   │   ├── skeleton.jsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── UserLayout.jsx        ← Navbar + main content + Footer
│   │   ├── AdminLayout.jsx       ← Sidebar + Topbar + main content
│   │   ├── AuthLayout.jsx        ← Layout centered (logo + card form)
│   │   ├── navbar/
│   │   │   ├── Navbar.jsx
│   │   │   └── modules/
│   │   │       ├── NavLinks.jsx
│   │   │       ├── CartBadge.jsx           ← Pakai useCartStore
│   │   │       ├── NotificationBadge.jsx   ← Pakai useGetUnreadCount
│   │   │       └── UserMenu.jsx            ← Avatar dropdown (profil, logout)
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── modules/
│   │   │       └── SidebarItem.jsx
│   │   └── footer/
│   │       └── Footer.jsx
│   │
│   ├── shared/           ← Komponen domain-agnostic, dipakai di banyak feature
│   │   ├── ProductCard.jsx       ← Dipakai di home, listing, wishlist, AI
│   │   ├── EmptyState.jsx        ← Tampilan kosong generik
│   │   ├── ConfirmDialog.jsx     ← "Yakin hapus/batalkan?" — reusable
│   │   ├── Pagination.jsx
│   │   ├── SearchInput.jsx       ← Debounced input dengan icon search
│   │   ├── StatusBadge.jsx       ← Badge status order/tiket/refund (warna per status)
│   │   └── index.js
│   │
│   └── fallback/         ← Skeleton loaders
│       ├── ProductCardSkeleton.jsx
│       ├── TableSkeleton.jsx
│       ├── PageSkeleton.jsx
│       └── index.js
│
├── hooks/                ← Custom hooks yang dipakai di banyak feature
│   ├── useDebounce.js              ← Debounce input search
│   ├── useIntersectionObserver.js  ← Trigger infinite scroll (notifikasi)
│   └── index.js
│
├── utils/
│   ├── consts/
│   │   ├── routes.js       ← Semua path constant (ROUTES.HOME, ROUTES.ADMIN.DASHBOARD, dll)
│   │   ├── queryKeys.js    ← React Query key factories per domain
│   │   └── index.js
│   ├── helpers/
│   │   ├── formatCurrency.js   ← formatRupiah(amount) → "Rp 1.500.000"
│   │   ├── formatDate.js       ← formatDate(date) → "19 Jun 2026"
│   │   ├── downloadBlob.js     ← Trigger download file dari blob response
│   │   └── index.js
│   └── index.js
│
└── pages/
    │
    ├── auth/
    │   ├── index.jsx
    │   └── modules/
    │       ├── login/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   └── LoginForm.jsx
    │       │   ├── hooks/
    │       │   │   └── useLoginForm.js
    │       │   └── api/
    │       │       └── useLogin.js
    │       ├── register/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   └── RegisterForm.jsx
    │       │   ├── hooks/
    │       │   │   └── useRegisterForm.js
    │       │   └── api/
    │       │       └── useRegister.js
    │       ├── forgot-password/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   └── api/
    │       │       └── useForgotPassword.js
    │       └── reset-password/
    │           ├── index.jsx
    │           ├── components/
    │           └── api/
    │               └── useResetPassword.js
    │
    ├── home/
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── HeroSection.jsx
    │   │   ├── BannerCarousel.jsx        ← shadcn Carousel
    │   │   ├── CategorySection.jsx
    │   │   ├── TagsHighlight.jsx         ← Badge tags (Promo, Terlaris, New, dll)
    │   │   ├── FeaturedProducts.jsx
    │   │   └── index.js
    │   └── api/
    │       ├── useGetBanners.js
    │       ├── useGetCategories.js
    │       ├── useGetTags.js
    │       └── useGetFeaturedProducts.js
    │
    ├── products/
    │   ├── index.jsx
    │   └── modules/
    │       ├── listing/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   ├── ProductGrid.jsx
    │       │   │   ├── FilterPanel.jsx       ← Kategori, Tipe, Tags, Harga, Destinasi
    │       │   │   ├── FilterChips.jsx       ← Filter aktif yang bisa dihapus satu-satu
    │       │   │   ├── SortSelect.jsx
    │       │   │   └── index.js
    │       │   ├── hooks/
    │       │   │   └── useProductFilters.js  ← Sync state filter ke URL params
    │       │   └── api/
    │       │       └── useGetProducts.js
    │       └── detail/
    │           ├── index.jsx
    │           ├── components/
    │           │   ├── ProductGallery.jsx        ← Foto utama + galeri (shadcn Carousel)
    │           │   ├── ProductInfo.jsx           ← Nama, harga, slot, tanggal, destinasi
    │           │   ├── Itinerary.jsx             ← Per hari: aktivitas, hotel, makan
    │           │   ├── IncludeExclude.jsx
    │           │   ├── AddOnSelector.jsx         ← Pilih add-on opsional dengan harga
    │           │   ├── TermsConditions.jsx
    │           │   ├── BookingPanel.jsx          ← Sticky: jumlah peserta, total, CTA
    │           │   └── index.js
    │           ├── hooks/
    │           │   └── useBookingPanel.js        ← Pilih peserta, hitung total, add to cart
    │           └── api/
    │               ├── useGetProductBySlug.js
    │               └── useAddToCart.js
    │
    ├── wishlist/
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── WishlistFilter.jsx
    │   │   └── index.js
    │   └── api/
    │       ├── useGetWishlist.js
    │       ├── useRemoveWishlist.js
    │       └── useCheckWishlist.js
    │
    ├── cart/
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── CartItem.jsx
    │   │   ├── CartSummary.jsx       ← Total harga + tombol Checkout
    │   │   ├── EmptyCart.jsx
    │   │   └── index.js
    │   ├── hooks/
    │   │   └── useCartActions.js     ← Edit item, hapus, kosongkan
    │   └── api/
    │       ├── useGetCart.js
    │       ├── useUpdateCartItem.js
    │       └── useRemoveCartItem.js
    │
    ├── checkout/
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── CheckoutItemList.jsx  ← Item yang dipilih dari cart (dengan checkbox)
    │   │   ├── OrderSummary.jsx      ← Ringkasan total + CTA
    │   │   └── index.js
    │   ├── hooks/
    │   │   └── useCheckout.js        ← Kelola selected items, hitung total
    │   └── api/
    │       └── useCreateOrder.js     ← POST /api/orders → redirect ke /payment/:orderId
    │
    ├── payment/
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── PaymentCard.jsx       ← Info order + tombol "Bayar Sekarang"
    │   │   ├── PaymentStatus.jsx     ← Polling status setelah snap ditutup
    │   │   └── index.js
    │   └── hooks/
    │       └── useMidtransSnap.js    ← Wrap window.snap.pay() + handle semua callback
    │
    ├── order/
    │   ├── index.jsx
    │   └── modules/
    │       ├── history/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   ├── OrderCard.jsx
    │       │   │   ├── OrderFilter.jsx
    │       │   │   └── index.js
    │       │   └── api/
    │       │       └── useGetOrders.js
    │       └── detail/
    │           ├── index.jsx
    │           ├── components/
    │           │   ├── OrderInfo.jsx
    │           │   ├── OrderTimeline.jsx     ← Visualisasi status pesanan
    │           │   ├── CancelOrderButton.jsx ← Muncul hanya jika pending_payment
    │           │   └── index.js
    │           └── api/
    │               ├── useGetOrderDetail.js
    │               └── useCancelOrder.js
    │
    ├── ticket/
    │   ├── index.jsx
    │   └── modules/
    │       ├── list/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   ├── TicketCard.jsx
    │       │   │   ├── TicketFilter.jsx      ← Filter: valid / used / invalid
    │       │   │   └── index.js
    │       │   └── api/
    │       │       └── useGetMyTickets.js
    │       └── detail/
    │           ├── index.jsx
    │           ├── components/
    │           │   ├── TicketInfo.jsx
    │           │   ├── DownloadButton.jsx
    │           │   └── index.js
    │           └── api/
    │               ├── useGetTicketDetail.js
    │               └── useDownloadTicket.js  ← Blob download PDF e-tiket
    │
    ├── refund/
    │   ├── index.jsx
    │   └── modules/
    │       ├── history/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   ├── RefundCard.jsx
    │       │   │   └── index.js
    │       │   └── api/
    │       │       └── useGetMyRefunds.js
    │       ├── detail/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   └── api/
    │       │       └── useGetRefundDetail.js
    │       └── form/
    │           ├── index.jsx
    │           ├── components/
    │           │   └── RefundForm.jsx        ← Alasan refund (min 10 karakter)
    │           ├── hooks/
    │           │   └── useRefundForm.js
    │           └── api/
    │               └── useSubmitRefund.js
    │
    ├── notification/
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── NotificationItem.jsx
    │   │   ├── NotificationFilter.jsx    ← Tab: Semua / Aktivitas / Pengumuman
    │   │   └── index.js
    │   ├── hooks/
    │   │   └── useInfiniteNotifications.js ← Cursor-based infinite scroll
    │   └── api/
    │       ├── useGetNotifications.js
    │       ├── useGetUnreadCount.js
    │       ├── useMarkAsRead.js
    │       └── useMarkAllAsRead.js
    │
    ├── profile/
    │   ├── index.jsx
    │   └── modules/
    │       ├── view/
    │       │   ├── index.jsx
    │       │   └── components/
    │       │       └── ProfileCard.jsx
    │       ├── edit/
    │       │   ├── index.jsx
    │       │   ├── components/
    │       │   │   ├── EditProfileForm.jsx
    │       │   │   └── AvatarUpload.jsx
    │       │   ├── hooks/
    │       │   │   └── useEditProfileForm.js
    │       │   └── api/
    │       │       └── useUpdateProfile.js
    │       └── change-password/
    │           ├── index.jsx
    │           ├── components/
    │           │   └── ChangePasswordForm.jsx
    │           ├── hooks/
    │           │   └── useChangePasswordForm.js
    │           └── api/
    │               └── useChangePassword.js
    │
    ├── ai/
    │   ├── index.jsx                          ← Split layout: chat (atas) + produk (bawah)
    │   ├── components/
    │   │   ├── ChatSection.jsx                ← Container area percakapan
    │   │   ├── ChatBubble.jsx                 ← Satu message bubble (user/AI)
    │   │   ├── ChatInput.jsx                  ← Input teks + tombol kirim
    │   │   ├── ProductSection.jsx             ← Grid produk dinamis (dikontrol AI)
    │   │   ├── ResetSessionButton.jsx         ← Reset chat → kembali tampilkan semua produk
    │   │   └── index.js
    │   ├── hooks/
    │   │   └── useChatSession.js              ← Kelola messages[], conversationHistory[]
    │   ├── store/
    │   │   └── useChatStore.js                ← { messages, recommendedProductIds, showAll }
    │   └── api/
    │       └── useAiChat.js                   ← POST /api/ai/chat
    │
    └── admin/
        ├── index.jsx
        └── modules/
            │
            ├── dashboard/
            │   ├── index.jsx
            │   ├── components/
            │   │   ├── StatsCards.jsx            ← 6 kartu: orders, revenue, users, dll
            │   │   ├── TrendChart.jsx            ← recharts AreaChart (order & revenue harian)
            │   │   ├── TopProducts.jsx           ← Top 5 by soldCount + by viewCount
            │   │   ├── RecentActivity.jsx        ← 5 order terbaru + 5 user terbaru
            │   │   └── index.js
            │   ├── hooks/
            │   │   └── useDashboardFilters.js    ← Custom ?days=N (default 30, max 365)
            │   └── api/
            │       └── useGetDashboard.js
            │
            ├── products/
            │   ├── index.jsx
            │   └── modules/
            │       ├── list/
            │       │   ├── index.jsx
            │       │   ├── components/
            │       │   │   ├── ProductTable.jsx
            │       │   │   ├── ProductFilter.jsx
            │       │   │   ├── BulkActionBar.jsx     ← Bulk update status (max 50)
            │       │   │   └── index.js
            │       │   ├── constants/
            │       │   │   └── columns.jsx           ← Definisi kolom tabel
            │       │   └── api/
            │       │       ├── useGetAdminProducts.js
            │       │       ├── useDeleteProduct.js
            │       │       ├── useDuplicateProduct.js
            │       │       └── useBulkUpdateStatus.js
            │       ├── create/
            │       │   ├── index.jsx
            │       │   ├── components/
            │       │   │   ├── BasicInfoSection.jsx       ← Nama, deskripsi, kategori, tipe, tags
            │       │   │   ├── LocationDateSection.jsx    ← Kota, destinasi, tanggal, meeting point
            │       │   │   ├── PricingSection.jsx         ← Harga, kuota, min peserta
            │       │   │   ├── GallerySection.jsx         ← Upload thumbnail + galeri
            │       │   │   ├── ItineraryBuilder.jsx       ← Add/remove hari secara dinamis
            │       │   │   ├── IncludeExcludeSection.jsx
            │       │   │   ├── AddOnBuilder.jsx           ← Add/remove add-on dengan harga
            │       │   │   ├── TermsSection.jsx
            │       │   │   └── index.js
            │       │   ├── hooks/
            │       │   │   └── useProductForm.js          ← RHF + Zod, shared dengan edit
            │       │   └── api/
            │       │       ├── useCreateProduct.js
            │       │       └── useUploadImage.js          ← POST /api/upload/single
            │       ├── edit/
            │       │   ├── index.jsx
            │       │   ├── hooks/
            │       │   │   └── useProductForm.js          ← Sama dengan create (reuse)
            │       │   └── api/
            │       │       └── useUpdateProduct.js
            │       └── detail/
            │           ├── index.jsx
            │           └── components/
            │
            ├── orders/
            │   ├── index.jsx
            │   └── modules/
            │       ├── list/
            │       │   ├── index.jsx
            │       │   ├── components/
            │       │   │   ├── OrderTable.jsx
            │       │   │   └── OrderFilter.jsx
            │       │   └── api/
            │       │       └── useGetAdminOrders.js
            │       └── detail/
            │           ├── index.jsx
            │           └── components/
            │
            ├── users/
            │   ├── index.jsx
            │   └── modules/
            │       ├── list/
            │       │   ├── index.jsx
            │       │   ├── components/
            │       │   │   ├── UserTable.jsx
            │       │   │   └── UserFilter.jsx
            │       │   └── api/
            │       │       └── useGetUsers.js
            │       └── detail/
            │           ├── index.jsx
            │           ├── components/
            │           │   ├── UserInfo.jsx
            │           │   ├── UserActivitySummary.jsx   ← totalOrders, totalSpent, totalRefunds
            │           │   └── SuspendButton.jsx
            │           └── api/
            │               ├── useGetUserDetail.js
            │               └── useToggleSuspend.js
            │
            ├── refunds/
            │   ├── index.jsx
            │   └── modules/
            │       ├── list/
            │       │   ├── index.jsx
            │       │   ├── components/
            │       │   │   ├── RefundTable.jsx
            │       │   │   └── RefundFilter.jsx
            │       │   └── api/
            │       │       └── useGetAdminRefunds.js
            │       └── detail/
            │           ├── index.jsx
            │           ├── components/
            │           │   ├── RefundDetail.jsx
            │           │   ├── SuggestedAmount.jsx       ← Auto-kalkulasi dari refund policy
            │           │   ├── ApproveButton.jsx
            │           │   └── RejectForm.jsx            ← Wajib isi alasan penolakan
            │           └── api/
            │               ├── useGetAdminRefundDetail.js
            │               ├── useApproveRefund.js
            │               └── useRejectRefund.js
            │
            ├── tickets/
            │   ├── index.jsx
            │   └── modules/
            │       ├── list/
            │       │   ├── index.jsx
            │       │   ├── components/
            │       │   │   ├── TicketTable.jsx
            │       │   │   └── TicketFilter.jsx
            │       │   └── api/
            │       │       └── useGetAdminTickets.js
            │       ├── detail/
            │       │   ├── index.jsx
            │       │   └── components/
            │       └── checkin/
            │           ├── index.jsx
            │           ├── components/
            │           │   ├── TicketCodeInput.jsx       ← Input kode tiket manual
            │           │   └── CheckinResult.jsx         ← Info penumpang setelah berhasil
            │           └── api/
            │               └── useCheckin.js             ← POST /api/tickets/checkin
            │
            ├── finance/
            │   ├── index.jsx
            │   ├── components/
            │   │   ├── BalanceCard.jsx
            │   │   ├── PeriodSummary.jsx
            │   │   ├── TransactionTable.jsx
            │   │   ├── WithdrawalForm.jsx
            │   │   ├── ExportCsvButton.jsx
            │   │   └── index.js
            │   └── api/
            │       ├── useGetBalance.js
            │       ├── useGetTransactions.js
            │       ├── useWithdrawal.js
            │       └── useExportCsv.js
            │
            ├── notifications/
            │   ├── index.jsx
            │   ├── components/
            │   │   └── BroadcastForm.jsx                 ← Title, message, targetUserIds (opsional)
            │   └── api/
            │       └── useBroadcast.js
            │
            └── master-data/
                ├── index.jsx                             ← Redirect ke /admin/master-data/categories
                └── modules/
                    ├── categories/
                    │   ├── index.jsx
                    │   └── modules/
                    │       ├── list/
                    │       ├── create/
                    │       └── edit/
                    ├── types/
                    │   ├── index.jsx
                    │   └── modules/
                    │       ├── list/
                    │       ├── create/
                    │       └── edit/
                    ├── tags/
                    │   ├── index.jsx
                    │   └── modules/
                    │       ├── list/
                    │       ├── create/
                    │       └── edit/
                    └── banners/
                        ├── index.jsx
                        └── modules/
                            ├── list/
                            ├── create/
                            └── edit/
```

---

## Route Structure

```
# Auth — public only (redirect ke / jika sudah login)
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password/:token

# User — sebagian public, sebagian protected (ProtectedRoute)
/                           → Home
/products                   → Listing produk (public)
/products/:slug             → Detail produk (public)
/wishlist                   → Wishlist (protected)
/cart                       → Keranjang (protected)
/checkout                   → Pilih item + konfirmasi order (protected)
/payment/:orderId           → Halaman pembayaran Midtrans (protected)
/orders                     → Riwayat pesanan (protected)
/orders/:id                 → Detail pesanan (protected)
/tickets                    → Tiket saya (protected)
/tickets/:id                → Detail tiket (protected)
/refunds                    → Riwayat refund (protected)
/refunds/new                → Form ajukan refund (protected)
/notifications              → Notifikasi (protected)
/profile                    → Lihat profil (protected)
/profile/edit               → Edit profil (protected)
/profile/change-password    → Ganti password (protected)
/ai                         → AI chat + rekomendasi produk (protected)

# Admin — semua protected + admin role (AdminRoute)
/admin                           → Dashboard
/admin/products                  → List produk
/admin/products/create           → Tambah produk baru
/admin/products/:id              → Detail produk
/admin/products/:id/edit         → Edit produk
/admin/orders                    → Semua pesanan
/admin/orders/:id                → Detail pesanan
/admin/users                     → Manajemen user
/admin/users/:id                 → Detail + suspend user
/admin/refunds                   → Semua pengajuan refund
/admin/refunds/:id               → Detail + approve/reject refund
/admin/tickets                   → Semua tiket
/admin/tickets/checkin           → Scanner check-in (statis, daftar sebelum /:id)
/admin/tickets/:id               → Detail tiket
/admin/finance                   → Keuangan (saldo, transaksi, withdrawal, export)
/admin/notifications             → Broadcast notifikasi
/admin/master-data/categories    → CRUD kategori
/admin/master-data/types         → CRUD tipe
/admin/master-data/tags          → CRUD tags
/admin/master-data/banners       → CRUD banner
```

---

## Auth Flow & Token Strategy

```
LOGIN
  → POST /api/auth/login
  → Response: { accessToken } + HttpOnly cookie (refreshToken)
  → Simpan accessToken di useAuthStore (in-memory, bukan localStorage)
  → Redirect berdasarkan role:
      role === 'admin' → /admin
      role === 'user'  → /

SETIAP REQUEST
  → axios.js request interceptor: attach Authorization: Bearer {accessToken}

KETIKA 401 (token expired)
  → axios.js response interceptor:
      1. POST /api/auth/refresh (kirim cookie otomatis)
      2. Dapat accessToken baru → update useAuthStore → retry request asal
      3. Jika refresh juga gagal → clearAuth() → redirect ke /auth/login

LOGOUT
  → POST /api/auth/logout (hapus cookie di server)
  → clearAuth() di useAuthStore
  → Redirect ke /auth/login
```

---

## Checkout & Payment Flow

```
1. User di halaman /cart
   → Pilih item (checkbox) → klik "Checkout"
   → Redirect ke /checkout

2. Halaman /checkout
   → Tampil item yang dipilih + ringkasan total
   → Klik "Buat Pesanan"
   → POST /api/orders → dapat array of { orderId }

3. Untuk setiap orderId → GET /api/payment/create/:orderId → dapat snapToken

4. Redirect ke /payment/:orderId
   → Tampil info order + tombol "Bayar Sekarang"
   → Klik → window.snap.pay(snapToken, callbacks)

5. Setelah Snap ditutup:
   → Polling GET /api/payment/status/:orderId setiap 3 detik
   → Jika status paid → redirect ke /orders/:id (tampil success)
   → Jika pending/masih menunggu → tetap di halaman payment
   → Jika expired/cancelled → tampil pesan gagal + opsi coba lagi
```

---

## State Management Strategy

| State | Tempat | Alasan |
|---|---|---|
| User info + access token | `useAuthStore` (Zustand global) | Diakses dari mana saja (navbar, interceptor, guards) |
| Cart item count (badge) | `useCartStore` (Zustand global) | Hanya untuk badge, data asli dari React Query |
| Data cart, produk, orders, dll | React Query cache | Server state, auto-invalidate, refetch |
| AI chat messages + rekomendasi | `useChatStore` (Zustand, feature-level) | State UI yang kompleks dan tidak di-server |
| Form state | React Hook Form local | Scope ke komponen form saja |
| Filter/sort state | URL params | Shareable, bookmarkable, back-button friendly |

---

## Konvensi Penamaan

| Entitas | Konvensi | Contoh |
|---|---|---|
| Komponen React | PascalCase | `ProductCard.jsx`, `ChatBubble.jsx` |
| Custom hooks | camelCase + prefix `use` | `useProductFilters.js`, `useChatSession.js` |
| API hooks (React Query) | `use{Get/Create/Update/Delete}{Entity}.js` | `useGetProducts.js`, `useCreateOrder.js` |
| Store hooks (Zustand) | `use{Feature}Store.js` | `useAuthStore.js`, `useChatStore.js` |
| Utility functions | camelCase | `formatCurrency.js`, `downloadBlob.js` |
| Constants | UPPER_SNAKE_CASE | `ROUTES.HOME`, `QUERY_KEYS.PRODUCTS` |
| CSS class helper | `cn()` dari `lib/utils.js` | `cn('base-class', conditional && 'extra')` |

---

## Pola Internal Setiap Module (Adaptasi dari Paragon)

Setiap module mengikuti struktur berikut. Folder yang tidak diperlukan boleh dihapus.

```
module-name/
├── index.jsx              ← Page component utama (hanya render, tidak ada logika)
├── api/                   ← React Query hooks (useQuery / useMutation)
│   ├── useGet{Entity}.js
│   └── index.js
├── components/            ← UI components milik module ini
│   ├── ComponentName.jsx
│   └── index.js
├── hooks/                 ← Custom hooks (logika, form handling, state lokal)
│   ├── use{Feature}.js
│   └── index.js
├── store/                 ← Zustand store lokal (hanya jika state kompleks)
│   └── use{Feature}Store.js
└── constants/             ← Konstanta, config, definisi kolom tabel
    ├── columns.jsx
    ├── index.js
    └── ...
```

**Aturan:**
- `index.jsx` hanya boleh berisi rendering, bukan logika bisnis
- Semua logika ke `hooks/`, semua API call ke `api/`
- Barrel export (`index.js`) di setiap folder agar import bersih
- Gunakan `constants/` (bukan `variables/`) agar lebih intuitif

---

## Catatan Implementasi Penting

| # | Topik | Keputusan |
|---|---|---|
| 1 | Access token storage | In-memory via Zustand — tidak pernah di localStorage (XSS safe) |
| 2 | Refresh token | HttpOnly cookie — dikelola browser otomatis, tidak bisa diakses JS |
| 3 | Filter state | Sync ke URL params — back button dan share link tetap bekerja |
| 4 | Notifikasi pagination | Cursor-based infinite scroll via `useIntersectionObserver` + React Query `useInfiniteQuery` |
| 5 | AI conversation history | Disimpan di `useChatStore`, dikirim ke backend tiap request, hilang saat reload |
| 6 | PDF download | Axios request dengan `responseType: 'blob'` → `downloadBlob()` helper |
| 7 | Image upload admin | Upload dulu via `POST /api/upload/single` → dapat URL → kirim URL ke endpoint produk/banner |
| 8 | Midtrans Snap | Load via CDN di `index.html`, panggil `window.snap.pay()` di `useMidtransSnap.js` |
| 9 | Admin route `/admin/tickets/checkin` | Harus didaftarkan SEBELUM `/admin/tickets/:id` di router untuk hindari konflik |
| 10 | shadcn components | Install per-komponen via `npx shadcn@latest add <component>` — jangan copy manual |
| 11 | Travia brand colors | Orange `#FF6B35` sebagai primary, dark `#1A1510`, ivory `#FAF7F0`/`#F0E8D8`, muted `#8B7355` |
| 12 | Master-data | 4 halaman terpisah (categories, types, tags, banners) bukan tabs — URL bookmarkable |
| 13 | Checkout flow | Cart → /checkout (pilih item) → POST /api/orders → /payment/:orderId → Midtrans Snap |
| 14 | Role-based redirect | Setelah login: admin → /admin, user → / |
| 15 | Product form admin | Satu halaman panjang dengan section-section (bukan wizard) — lebih simpel dan familiar |
