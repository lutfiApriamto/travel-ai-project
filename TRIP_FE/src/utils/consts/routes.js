// Semua path constant frontend.
// Gunakan fungsi untuk path yang membutuhkan parameter dinamis.

export const ROUTES = {
  HOME:     '/',

  // Products
  PRODUCTS:       '/products',
  PRODUCT_DETAIL: (slug) => `/products/${slug}`,

  // User features (protected)
  WISHLIST:    '/wishlist',
  CART:        '/cart',
  CHECKOUT:    '/checkout',
  PAYMENT:     (orderId) => `/payment/${orderId}`,

  ORDERS:       '/orders',
  ORDER_DETAIL: (id) => `/orders/${id}`,

  TICKETS:       '/tickets',
  TICKET_DETAIL: (id) => `/tickets/${id}`,

  REFUNDS:        '/refunds',
  REFUND_NEW:     '/refunds/new',
  REFUND_POLICY:  '/refunds/policy',

  NOTIFICATIONS: '/notifications',

  PROFILE:                 '/profile',
  PROFILE_EDIT:            '/profile/edit',
  PROFILE_CHANGE_PASSWORD: '/profile/change-password',

  AI: '/ai',

  // Auth
  // Catatan: reset-password TANPA prefix /auth/ karena backend mengirim
  // link ke ${CLIENT_URL}/reset-password/:token (bukan /auth/reset-password)
  AUTH: {
    LOGIN:           '/auth/login',
    REGISTER:        '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD:  (token) => `/reset-password/${token}`,
  },

  // Admin (semua protected + role admin)
  ADMIN: {
    DASHBOARD:       '/admin',

    PRODUCTS:        '/admin/products',
    PRODUCT_CREATE:  '/admin/products/create',
    PRODUCT_DETAIL:  (id) => `/admin/products/${id}`,
    PRODUCT_EDIT:    (id) => `/admin/products/${id}/edit`,

    ORDERS:          '/admin/orders',
    ORDER_DETAIL:    (id) => `/admin/orders/${id}`,

    USERS:           '/admin/users',
    USER_DETAIL:     (id) => `/admin/users/${id}`,

    REFUNDS:         '/admin/refunds',
    REFUND_DETAIL:   (id) => `/admin/refunds/${id}`,
    REFUND_POLICY:   '/admin/refunds/policy',

    TICKETS:         '/admin/tickets',
    TICKET_CHECKIN:  '/admin/tickets/checkin',
    TICKET_DETAIL:   (id) => `/admin/tickets/${id}`,

    FINANCE:         '/admin/finance',
    NOTIFICATIONS:   '/admin/notifications',

    MASTER_DATA: {
      CATEGORIES: '/admin/master-data/categories',
      TYPES:      '/admin/master-data/types',
      TAGS:       '/admin/master-data/tags',
      BANNERS:    '/admin/master-data/banners',
      WILAYAH:    '/admin/master-data/wilayah',
    },
  },
};
