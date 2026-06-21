import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate }           from 'react-router-dom';
import { AnimatePresence, motion }                   from 'framer-motion';
import { useQuery }                                  from '@tanstack/react-query';
import {
  Search, X, User, Sun, Moon, LogOut,
  ShoppingCart, Heart, Package, Ticket,
  Bell, LayoutDashboard, ChevronDown, MapPin,
} from 'lucide-react';
import toast               from 'react-hot-toast';
import { useAuthStore }          from '../../../stores/useAuthStore.js';
import { useNotificationStore }  from '../../../stores/useNotificationStore.js';
import { useTheme }              from '../../../context/ThemeContext.jsx';
import { useDebounce }           from '../../../hooks/useDebounce.js';
import { ROUTES }                from '../../../utils/consts/routes.js';
import { cn }                    from '../../../lib/utils.js';
import api                       from '../../../lib/axios.js';
import { queryClient }           from '../../../lib/queryClient.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

// ─── Dark mode toggle ─────────────────────────────────────────────────────────

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
      className="p-2 rounded-xl hover:bg-accent transition-colors shrink-0"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0,   opacity: 1, scale: 1   }}
          exit={{    rotate:  90, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18 }}
        >
          {isDark
            ? <Sun  className="w-5 h-5 text-amber-400" />
            : <Moon className="w-5 h-5 text-muted-foreground" />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};

// ─── Search Bar ───────────────────────────────────────────────────────────────

const SearchBar = () => {
  const navigate               = useNavigate();
  const location               = useLocation();
  const [query,    setQuery]   = useState('');
  const [open,     setOpen]    = useState(false);
  const [focused,  setFocused] = useState(false);
  const debouncedQuery         = useDebounce(query, 350);
  const wrapperRef             = useRef(null);
  const inputRef               = useRef(null);

  // ── Deteksi mode local-search (wishlist / cart) ────────────────────────────
  const isWishlist    = location.pathname === ROUTES.WISHLIST;
  const isCart        = location.pathname === ROUTES.CART;
  const isLocalSearch = isWishlist || isCart;

  // ── Sync query dari URL ketika masuk ke halaman local-search ──────────────
  useEffect(() => {
    if (isLocalSearch) {
      const urlSearch = new URLSearchParams(location.search).get('search') || '';
      setQuery(urlSearch);
    } else {
      setQuery('');
    }
    setOpen(false);
    setFocused(false);
  }, [location.pathname]); // eslint-disable-line

  // ── Push debounced query ke URL (hanya untuk wishlist / cart) ─────────────
  useEffect(() => {
    if (!isLocalSearch) return;
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('search', debouncedQuery.trim());
    const qs     = params.toString();
    const newUrl = qs ? `${location.pathname}?${qs}` : location.pathname;
    navigate(newUrl, { replace: true });
  }, [debouncedQuery]); // eslint-disable-line

  // ── Live product search — dinonaktifkan saat mode local-search ────────────
  const { data: results = [], isFetching } = useQuery({
    queryKey:  ['navbar-search', debouncedQuery],
    queryFn:   () =>
      api.get('/products', {
        params: { search: debouncedQuery, limit: 6 },
      }).then((r) => {
        const d = r.data.data.data;
        return Array.isArray(d) ? d : [];
      }),
    enabled:   !isLocalSearch && debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  // Dropdown hanya muncul di mode produk (bukan wishlist/cart)
  const showDrop = !isLocalSearch && focused && query.trim().length >= 2;

  // Placeholder sesuai konteks halaman
  const placeholder = isWishlist
    ? 'Cari di wishlist...'
    : isCart
      ? 'Cari di keranjang...'
      : 'Cari paket perjalanan...';

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isLocalSearch && query.trim()) {
        // Mode produk → navigasi ke halaman products
        navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(query.trim())}`);
      }
      // Mode local-search → URL sudah diupdate via debounce, cukup close/blur
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (slug) => {
    navigate(ROUTES.PRODUCT_DETAIL(slug));
    setOpen(false);
    setFocused(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    if (isLocalSearch) {
      // Hapus search param dari URL
      navigate(location.pathname, { replace: true });
    }
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      {/* Input */}
      <div className={cn(
        'flex items-center gap-2 h-10 px-4 rounded-full border transition-all duration-200',
        'bg-accent/60 dark:bg-travia-dark3',
        focused
          ? 'border-travia-orange ring-2 ring-travia-orange/20 bg-card dark:bg-travia-dark3'
          : 'border-border hover:border-muted-foreground/40',
      )}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground
            placeholder:text-muted-foreground focus:outline-none min-w-0"
        />
        {query && (
          <button onClick={handleClear} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDrop && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{    opacity: 0, y: -6, scale: 0.98  }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border
              rounded-2xl shadow-xl overflow-hidden z-50"
          >
            {isFetching ? (
              // Loading skeleton
              <div className="p-2 space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
                    <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-36 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                    <div className="h-3.5 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tidak ada produk untuk <span className="font-medium text-foreground">"{query}"</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tekan Enter untuk cari di semua produk
                </p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleSelect(product.slug)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      hover:bg-accent transition-colors text-left group"
                  >
                    {/* Thumbnail */}
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-travia-orange/10 flex items-center
                        justify-center shrink-0 text-travia-orange font-serif italic text-sm">
                        T
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-travia-orange transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {product.destinations?.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {product.destinations.slice(0, 2).join(', ')}
                          </span>
                        )}
                        {product.duration && (
                          <span className="text-[11px] text-muted-foreground">
                            · {product.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Harga */}
                    <p className="text-sm font-semibold text-travia-orange shrink-0">
                      {formatIDR(product.price)}
                    </p>
                  </button>
                ))}

                {/* Footer: lihat semua hasil */}
                <button
                  onClick={() => {
                    navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(query.trim())}`);
                    setOpen(false);
                    setFocused(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-1
                    rounded-xl border border-dashed border-border text-xs text-muted-foreground
                    hover:bg-accent hover:text-foreground hover:border-border transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Lihat semua hasil untuk <span className="font-medium">"{query}"</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

const ProfileDropdown = () => {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);
  const navigate            = useNavigate();
  const location            = useLocation();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setOpen(false);
    try { await api.post('/auth/logout'); } catch { /* lanjut */ }
    clearAuth();
    queryClient.clear();
    toast.success('Berhasil keluar. Sampai jumpa!');
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  const USER_MENU = [
    { label: 'Keranjang',    Icon: ShoppingCart,  to: ROUTES.CART          },
    { label: 'Wishlist',     Icon: Heart,         to: ROUTES.WISHLIST      },
    { label: 'Pesanan Saya', Icon: Package,       to: ROUTES.ORDERS        },
    { label: 'Tiket Saya',   Icon: Ticket,        to: ROUTES.TICKETS       },
    { label: 'Notifikasi',   Icon: Bell,          to: ROUTES.NOTIFICATIONS },
    { label: 'Profil Saya',  Icon: User,          to: ROUTES.PROFILE       },
  ];

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        className={cn(
          'flex items-center gap-2 h-10 pl-3 pr-3 rounded-full border transition-all duration-200',
          open
            ? 'border-travia-orange bg-accent shadow-sm'
            : 'border-border hover:shadow-sm hover:border-muted-foreground/40',
        )}
      >
        {/* Avatar */}
        {isAuthenticated && user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            isAuthenticated
              ? 'bg-travia-orange/20 text-travia-orange'
              : 'bg-muted text-muted-foreground',
          )}>
            <User className="w-3.5 h-3.5" />
          </div>
        )}
        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
          open && 'rotate-180',
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{    opacity: 0, y: -8, scale: 0.96  }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-60
              bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
          >
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {USER_MENU.map(({ label, Icon, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground
                        hover:bg-accent transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1">{label}</span>
                      {/* Badge unread untuk Notifikasi */}
                      {to === ROUTES.NOTIFICATIONS && unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full
                          bg-travia-orange text-white text-[10px] font-bold
                          flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Admin panel (jika admin) */}
                {user?.role === 'admin' && (
                  <div className="border-t border-border py-1.5">
                    <Link
                      to={ROUTES.ADMIN.DASHBOARD}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground
                        hover:bg-accent transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                      Admin Panel
                    </Link>
                  </div>
                )}

                {/* Logout */}
                <div className="border-t border-border py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                      hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Keluar
                  </button>
                </div>
              </>
            ) : (
              // Belum login
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground text-center px-2 pb-1">
                  Masuk untuk mengakses fitur lengkap
                </p>
                <Link
                  to={ROUTES.AUTH.LOGIN}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-full h-9 rounded-xl
                    border border-border text-sm font-medium text-foreground
                    hover:bg-accent transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to={ROUTES.AUTH.REGISTER}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-full h-9 rounded-xl
                    bg-travia-orange text-white text-sm font-semibold
                    hover:bg-travia-orange/90 transition-colors"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated }     = useAuthStore();
  const unreadCount             = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount          = useNotificationStore((s) => s.setUnreadCount);

  // Fetch unread notification count → sync ke Zustand untuk badge bell
  const { data: unreadData } = useQuery({
    queryKey:        ['notifications', 'unread-count'],
    queryFn:         () =>
      api.get('/notifications/unread-count')
        .then((r) => r.data.data.data?.unreadCount ?? 0),
    enabled:         isAuthenticated,
    staleTime:       30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (unreadData !== undefined) setUnreadCount(unreadData);
  }, [unreadData, setUnreadCount]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full transition-all duration-300',
      'bg-card/95 backdrop-blur-sm border-b',
      scrolled ? 'border-border shadow-sm' : 'border-transparent',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Desktop: 3-column grid ─────────────────────────────────────────
            [Logo · · · · ·] [· · Search · ·] [· · · Toggle + Profile]
            Kolom kiri dan kanan sama lebar → search benar-benar di tengah.
        ────────────────────────────────────────────────────────────────────── */}
        <div className="h-16 hidden md:grid md:grid-cols-[1fr_minmax(0,480px)_1fr] md:items-center md:gap-6">
          {/* Kiri — Logo */}
          <div className="flex justify-start">
            <Link to={ROUTES.HOME}>
              <img src="/brand-logo/logo-horizontal-light.svg" alt="Travia"
                className="h-8 dark:hidden" />
              <img src="/brand-logo/logo-horizontal-dark.svg" alt="Travia"
                className="h-8 hidden dark:block" />
            </Link>
          </div>

          {/* Tengah — Search */}
          <div className="flex justify-center w-full">
            <SearchBar />
          </div>

          {/* Kanan — Toggle + Profile */}
          <div className="flex justify-end items-center gap-2">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </div>

        {/* ── Mobile: 2-row layout ───────────────────────────────────────────
            Row 1: Logo (kiri) + Toggle + Profile (kanan)
            Row 2: Search bar full-width
        ────────────────────────────────────────────────────────────────────── */}
        <div className="md:hidden">
          {/* Row 1 */}
          <div className="py-4 flex items-center justify-between">
            <Link to={ROUTES.HOME}>
              <img src="/brand-logo/logo-horizontal-light.svg" alt="Travia"
                className="h-7 dark:hidden" />
              <img src="/brand-logo/logo-horizontal-dark.svg" alt="Travia"
                className="h-7 hidden dark:block" />
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </div>

          {/* Row 2 — Search */}
          <div className="pb-3">
            <SearchBar />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
