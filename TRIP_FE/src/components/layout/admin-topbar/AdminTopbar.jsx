import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronLeft, ChevronRight, Sun, Moon, LogOut } from 'lucide-react';
import { cn } from '../../../lib/utils.js';
import { useTheme } from '../../../context/ThemeContext.jsx';
import { useAuthStore } from '../../../stores/useAuthStore.js';
import { queryClient } from '../../../lib/queryClient.js';
import api from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../utils/consts/routes.js';

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const SEGMENT_LABELS = {
  products:      'Produk',
  orders:        'Pesanan',
  users:         'Pengguna',
  refunds:       'Refund',
  tickets:       'Tiket',
  finance:       'Keuangan',
  notifications: 'Notifikasi',
  'master-data': 'Master Data',
  categories:    'Kategori',
  types:         'Tipe',
  tags:          'Tag',
  banners:       'Banner',
  create:        'Buat Baru',
  edit:          'Edit',
  checkin:       'Check-in',
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean).slice(1); // remove 'admin'

  if (segments.length === 0) {
    return <span className="text-sm font-semibold text-foreground">Dashboard</span>;
  }

  // Skip MongoDB ObjectIds (24-char hex strings)
  const crumbs = segments
    .filter(seg => !/^[a-f0-9]{24}$/i.test(seg))
    .map(seg => SEGMENT_LABELS[seg] || seg);

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="w-3 h-3 text-border shrink-0" />}
          <span
            className={cn(
              'truncate',
              i === crumbs.length - 1
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
};

// ─── LiveClock ────────────────────────────────────────────────────────────────

const LiveClock = () => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time
      className="text-xs font-mono text-muted-foreground tabular-nums select-none hidden sm:block"
      aria-label="Waktu sekarang"
    >
      {time.toLocaleTimeString('id-ID', {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    </time>
  );
};

// ─── AdminTopbar ──────────────────────────────────────────────────────────────

const AdminTopbar = ({ isCollapsed, onToggleCollapse, onToggleMobile }) => {
  const { isDark, toggleTheme } = useTheme();
  const { clearAuth }           = useAuthStore();
  const navigate                = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    queryClient.clear();
    toast.success('Berhasil keluar. Sampai jumpa!');
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-card">

      {/* ── Left: sidebar toggles + breadcrumb ──────────────────────────── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleMobile}
          aria-label="Buka sidebar"
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
            text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg
            text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ChevronLeft className={cn(
            'w-4 h-4 transition-transform duration-300 ease-in-out',
            isCollapsed && 'rotate-180'
          )} />
        </button>

        <div className="w-px h-5 bg-border shrink-0 hidden sm:block" />

        <div className="min-w-0 overflow-hidden">
          <Breadcrumb />
        </div>
      </div>

      {/* ── Right: clock · theme · logout ───────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        <LiveClock />

        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Ganti ke light mode' : 'Ganti ke dark mode'}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? 'sun' : 'moon'}
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0,   opacity: 1, scale: 1   }}
              exit={{    rotate:  30, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
          </AnimatePresence>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Keluar"
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-sm
            text-muted-foreground hover:text-red-500
            hover:bg-red-50 dark:hover:bg-red-950/30
            transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline text-xs font-medium">Keluar</span>
        </button>
      </div>
    </header>
  );
};

export default AdminTopbar;
