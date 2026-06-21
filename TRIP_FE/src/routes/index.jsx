import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import UserLayout     from '../components/layout/UserLayout.jsx';
import AdminLayout    from '../components/layout/AdminLayout.jsx';
import AuthLayout     from '../components/layout/AuthLayout.jsx';
import ProtectedRoute from './guards/ProtectedRoute.jsx';
import AdminRoute     from './guards/AdminRoute.jsx';
import NotFoundPage   from '../pages/NotFoundPage.jsx';
import { ROUTES }     from '../utils/consts/routes.js';

// ─── Placeholder untuk halaman yang belum dibangun ───────────────────────────
const ComingSoon = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
    <p className="text-5xl">🚧</p>
    <h2 className="font-serif italic text-2xl text-[--text-heading]">Segera hadir</h2>
    <p className="text-sm text-muted-foreground">Halaman ini sedang dalam pembangunan.</p>
  </div>
);

// ─── Loading fallback ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[70vh]">
    <div className="w-7 h-7 border-2 border-travia-orange border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Lazy loader helper ───────────────────────────────────────────────────────
const lazyPage = (importFn) => {
  const Page = lazy(importFn);
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
};

// ─── Router ───────────────────────────────────────────────────────────────────
// Halaman yang belum dibangun menggunakan <ComingSoon />.
// Ganti satu per satu dengan lazyPage(...) seiring halaman dibangun.

export const router = createBrowserRouter([

  // ── Auth routes ────────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.AUTH.LOGIN,           element: lazyPage(() => import('../pages/auth/modules/login/index.jsx')) },
      { path: ROUTES.AUTH.REGISTER,        element: lazyPage(() => import('../pages/auth/modules/register/index.jsx')) },
      { path: ROUTES.AUTH.FORGOT_PASSWORD, element: lazyPage(() => import('../pages/auth/modules/forgot-password/index.jsx')) },
    ],
  },
  {
    path: '/reset-password/:token',
    element: <AuthLayout />,
    children: [
      { index: true, element: lazyPage(() => import('../pages/auth/modules/reset-password/index.jsx')) },
    ],
  },

  // ── User routes ────────────────────────────────────────────────────────────
  {
    element: <UserLayout />,
    children: [
      { path: ROUTES.HOME,                    element: lazyPage(() => import('../pages/home/index.jsx')) },
      { path: ROUTES.PRODUCTS,               element: lazyPage(() => import('../pages/products/index.jsx')) },
      { path: `${ROUTES.PRODUCTS}/:slug`,    element: lazyPage(() => import('../pages/product-detail/index.jsx')) },
      { path: ROUTES.REFUND_POLICY,          element: lazyPage(() => import('../pages/refunds/policy/index.jsx')) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: ROUTES.WISHLIST,                    element: lazyPage(() => import('../pages/wishlist/index.jsx')) },
          { path: ROUTES.CART,                        element: lazyPage(() => import('../pages/cart/index.jsx')) },
          { path: ROUTES.CHECKOUT,                    element: lazyPage(() => import('../pages/checkout/index.jsx')) },
          { path: '/payment/:orderId',                element: lazyPage(() => import('../pages/payment/index.jsx')) },
          { path: ROUTES.ORDERS,                      element: lazyPage(() => import('../pages/orders/index.jsx')) },
          { path: `${ROUTES.ORDERS}/:id`,             element: lazyPage(() => import('../pages/order-detail/index.jsx')) },
          { path: ROUTES.TICKETS,                     element: lazyPage(() => import('../pages/tickets/index.jsx')) },
          { path: `${ROUTES.TICKETS}/:id`,            element: lazyPage(() => import('../pages/ticket-detail/index.jsx')) },
          { path: ROUTES.REFUNDS,                     element: lazyPage(() => import('../pages/refunds/index.jsx')) },
          { path: ROUTES.REFUND_NEW,                  element: lazyPage(() => import('../pages/refunds/new/index.jsx')) },
          { path: ROUTES.NOTIFICATIONS,               element: lazyPage(() => import('../pages/notifications/index.jsx')) },
          { path: ROUTES.PROFILE,                     element: lazyPage(() => import('../pages/profile/index.jsx')) },
          { path: ROUTES.PROFILE_EDIT,                element: lazyPage(() => import('../pages/profile/edit/index.jsx')) },
          { path: ROUTES.PROFILE_CHANGE_PASSWORD,     element: lazyPage(() => import('../pages/profile/change-password/index.jsx')) },
          { path: ROUTES.AI,                          element: lazyPage(() => import('../pages/ai/index.jsx')) },
        ],
      },
    ],
  },

  // ── Admin routes ───────────────────────────────────────────────────────────
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: ROUTES.ADMIN.DASHBOARD,               element: lazyPage(() => import('../pages/admin/modules/dashboard/index.jsx')) },
          { path: ROUTES.ADMIN.PRODUCTS,                element: lazyPage(() => import('../pages/admin/modules/products/index.jsx')) },
          { path: ROUTES.ADMIN.PRODUCT_CREATE,          element: lazyPage(() => import('../pages/admin/modules/products/modules/create/index.jsx')) },
          { path: `${ROUTES.ADMIN.PRODUCTS}/:id`,       element: lazyPage(() => import('../pages/admin/modules/products/modules/detail/index.jsx')) },
          { path: `${ROUTES.ADMIN.PRODUCTS}/:id/edit`,  element: lazyPage(() => import('../pages/admin/modules/products/modules/edit/index.jsx')) },
          { path: ROUTES.ADMIN.ORDERS,                  element: lazyPage(() => import('../pages/admin/modules/orders/index.jsx')) },
          { path: `${ROUTES.ADMIN.ORDERS}/:id`,         element: lazyPage(() => import('../pages/admin/modules/orders/modules/detail/index.jsx')) },
          { path: ROUTES.ADMIN.USERS,                   element: lazyPage(() => import('../pages/admin/modules/users/index.jsx')) },
          { path: `${ROUTES.ADMIN.USERS}/:id`,          element: lazyPage(() => import('../pages/admin/modules/users/modules/detail/index.jsx')) },
          { path: ROUTES.ADMIN.REFUNDS,                 element: lazyPage(() => import('../pages/admin/modules/refunds/index.jsx')) },
          { path: ROUTES.ADMIN.REFUND_POLICY,           element: lazyPage(() => import('../pages/admin/modules/refunds/modules/policy/index.jsx')) },
          { path: `${ROUTES.ADMIN.REFUNDS}/:id`,        element: lazyPage(() => import('../pages/admin/modules/refunds/modules/detail/index.jsx')) },
          { path: ROUTES.ADMIN.TICKETS,                 element: lazyPage(() => import('../pages/admin/modules/tickets/index.jsx')) },
          { path: ROUTES.ADMIN.TICKET_CHECKIN,          element: lazyPage(() => import('../pages/admin/modules/tickets/modules/checkin/index.jsx')) },
          { path: `${ROUTES.ADMIN.TICKETS}/:id`,        element: lazyPage(() => import('../pages/admin/modules/tickets/modules/detail/index.jsx')) },
          { path: ROUTES.ADMIN.FINANCE,                 element: lazyPage(() => import('../pages/admin/modules/finance/index.jsx')) },
          { path: ROUTES.ADMIN.NOTIFICATIONS,           element: lazyPage(() => import('../pages/admin/modules/notifications/index.jsx')) },
          { path: ROUTES.ADMIN.MASTER_DATA.CATEGORIES,  element: lazyPage(() => import('../pages/admin/modules/master-data/modules/categories/index.jsx')) },
          { path: ROUTES.ADMIN.MASTER_DATA.TYPES,       element: lazyPage(() => import('../pages/admin/modules/master-data/modules/types/index.jsx')) },
          { path: ROUTES.ADMIN.MASTER_DATA.TAGS,        element: lazyPage(() => import('../pages/admin/modules/master-data/modules/tags/index.jsx')) },
          { path: ROUTES.ADMIN.MASTER_DATA.BANNERS,     element: lazyPage(() => import('../pages/admin/modules/master-data/modules/banners/index.jsx')) },
          { path: ROUTES.ADMIN.MASTER_DATA.WILAYAH,     element: lazyPage(() => import('../pages/admin/modules/master-data/modules/wilayah/index.jsx')) },
          { path: '/admin/master-data', element: <Navigate to={ROUTES.ADMIN.MASTER_DATA.CATEGORIES} replace /> },
        ],
      },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
