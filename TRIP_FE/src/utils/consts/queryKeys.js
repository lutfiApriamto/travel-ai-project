// React Query key factories.
// Gunakan objek/array konsisten agar invalidasi cache akurat.

export const QUERY_KEYS = {
  // Auth
  ME: ['me'],

  // Public — Banners, Categories, Types, Tags
  BANNERS:    ['banners'],
  CATEGORIES: (params) => ['categories', params],
  TYPES:      (params) => ['types', params],
  TAGS:       (params) => ['tags', params],

  // Products
  PRODUCTS:       (params) => ['products', params],
  PRODUCT_DETAIL: (slug)   => ['products', 'detail', slug],

  // Wishlist
  WISHLIST:       (params)     => ['wishlist', params],
  WISHLIST_CHECK: (productId)  => ['wishlist', 'check', productId],

  // Cart
  CART: (params) => ['cart', params],

  // Orders
  ORDERS:       (params) => ['orders', params],
  ORDER_DETAIL: (id)     => ['orders', 'detail', id],

  // Tickets
  MY_TICKETS:    (params) => ['tickets', 'my', params],
  TICKET_DETAIL: (id)     => ['tickets', 'my', 'detail', id],

  // Refunds
  MY_REFUNDS:    (params) => ['refunds', 'my', params],
  REFUND_DETAIL: (id)     => ['refunds', 'my', 'detail', id],
  REFUND_POLICY: ['refund-policy'],

  // Notifications
  NOTIFICATIONS: (params) => ['notifications', params],
  UNREAD_COUNT:  ['notifications', 'unread-count'],

  // Admin — Dashboard
  ADMIN_DASHBOARD: (params) => ['admin', 'dashboard', params],

  // Admin — Products
  ADMIN_PRODUCTS:       (params) => ['admin', 'products', params],
  ADMIN_PRODUCT_DETAIL: (id)     => ['admin', 'products', 'detail', id],

  // Admin — Orders
  ADMIN_ORDERS:       (params) => ['admin', 'orders', params],
  ADMIN_ORDER_DETAIL: (id)     => ['admin', 'orders', 'detail', id],

  // Admin — Users
  ADMIN_USERS:       (params) => ['admin', 'users', params],
  ADMIN_USER_DETAIL: (id)     => ['admin', 'users', 'detail', id],

  // Admin — Refunds
  ADMIN_REFUNDS:       (params) => ['admin', 'refunds', params],
  ADMIN_REFUND_DETAIL: (id)     => ['admin', 'refunds', 'detail', id],

  // Admin — Tickets
  ADMIN_TICKETS:       (params) => ['admin', 'tickets', params],
  ADMIN_TICKET_DETAIL: (id)     => ['admin', 'tickets', 'detail', id],

  // Admin — Finance
  ADMIN_FINANCE_BALANCE:      (params) => ['admin', 'finance', 'balance', params],
  ADMIN_FINANCE_TRANSACTIONS: (params) => ['admin', 'finance', 'transactions', params],

  // Admin — Master Data
  ADMIN_CATEGORIES:       (params) => ['admin', 'categories', params],
  ADMIN_CATEGORY_DETAIL:  (id)     => ['admin', 'categories', 'detail', id],
  ADMIN_TYPES:            (params) => ['admin', 'types', params],
  ADMIN_TYPE_DETAIL:      (id)     => ['admin', 'types', 'detail', id],
  ADMIN_TAGS:             (params) => ['admin', 'tags', params],
  ADMIN_TAG_DETAIL:       (id)     => ['admin', 'tags', 'detail', id],
  ADMIN_BANNERS:          (params) => ['admin', 'banners', params],
  ADMIN_BANNER_DETAIL:    (id)     => ['admin', 'banners', 'detail', id],
};
