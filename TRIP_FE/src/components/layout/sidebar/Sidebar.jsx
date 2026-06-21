import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, RefreshCw,
  Ticket, Wallet, Bell, Database, X, ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';
import { ROUTES } from '../../../utils/consts/routes.js';

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: ROUTES.ADMIN.DASHBOARD,    end: true  },
  { label: 'Produk',     icon: Package,         to: ROUTES.ADMIN.PRODUCTS,     end: false },
  { label: 'Pesanan',    icon: ShoppingBag,     to: ROUTES.ADMIN.ORDERS,       end: false },
  { label: 'Pengguna',   icon: Users,           to: ROUTES.ADMIN.USERS,        end: false },
  { label: 'Refund',     icon: RefreshCw,       to: ROUTES.ADMIN.REFUNDS,      end: false },
  { label: 'Tiket',      icon: Ticket,          to: ROUTES.ADMIN.TICKETS,      end: false },
  { label: 'Keuangan',   icon: Wallet,          to: ROUTES.ADMIN.FINANCE,      end: false },
  { label: 'Notifikasi', icon: Bell,            to: ROUTES.ADMIN.NOTIFICATIONS, end: false },
];

const MASTER_DATA_ITEMS = [
  { label: 'Kategori', to: ROUTES.ADMIN.MASTER_DATA.CATEGORIES },
  { label: 'Tipe',     to: ROUTES.ADMIN.MASTER_DATA.TYPES      },
  { label: 'Tag',      to: ROUTES.ADMIN.MASTER_DATA.TAGS       },
  { label: 'Banner',   to: ROUTES.ADMIN.MASTER_DATA.BANNERS    },
  { label: 'Wilayah',  to: ROUTES.ADMIN.MASTER_DATA.WILAYAH    },
];

// ─── MasterDataAccordion ──────────────────────────────────────────────────────

const MasterDataAccordion = ({ isCollapsed, onMobileClose }) => {
  const { pathname }   = useLocation();
  const isSectionActive = pathname.startsWith('/admin/master-data');
  const [isOpen, setIsOpen] = useState(isSectionActive);

  // Auto-open accordion when navigating into master-data from elsewhere
  useEffect(() => {
    if (isSectionActive) setIsOpen(true);
  }, [isSectionActive]);

  // ── Collapsed desktop: icon-only, navigates to first sub-item ─────────────
  if (isCollapsed) {
    return (
      <NavLink
        to={ROUTES.ADMIN.MASTER_DATA.CATEGORIES}
        title="Master Data"
        onClick={onMobileClose}
        className={cn(
          'flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-colors px-0',
          isSectionActive
            ? 'bg-travia-orange text-white'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Database className="w-4 h-4 shrink-0" />
      </NavLink>
    );
  }

  // ── Expanded: accordion with sub-items ────────────────────────────────────
  return (
    <div>
      <button
        onClick={() => setIsOpen(p => !p)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isSectionActive
            ? 'text-travia-orange bg-travia-orange/10'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Database className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left whitespace-nowrap overflow-hidden">Master Data</span>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 shrink-0 transition-transform duration-250',
            isOpen && 'rotate-90',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="master-data-sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 ml-[22px] pl-3 border-l border-border space-y-0.5 pb-1">
              {MASTER_DATA_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onMobileClose}
                  className={({ isActive }) => cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'font-semibold text-travia-orange bg-travia-orange/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const SidebarLogo = ({ isCollapsed, onMobileClose, showClose }) => (
  <div className="h-14 flex items-center border-b border-border shrink-0 px-4 gap-2 overflow-hidden">
    <AnimatePresence mode="wait" initial={false}>
      {!isCollapsed ? (
        <motion.div
          key="logo-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 min-w-0"
        >
          <Link to={ROUTES.ADMIN.DASHBOARD} className="block">
            <img
              src="/brand-logo/logo-horizontal-light.svg"
              alt="Travia"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/brand-logo/logo-horizontal-dark.svg"
              alt="Travia"
              className="h-7 w-auto hidden dark:block"
            />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          key="logo-icon"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex justify-center"
        >
          <Link
            to={ROUTES.ADMIN.DASHBOARD}
            className="font-serif italic font-bold text-xl text-travia-orange leading-none"
          >
            T
          </Link>
        </motion.div>
      )}
    </AnimatePresence>

    {showClose && (
      <button
        onClick={onMobileClose}
        aria-label="Tutup sidebar"
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
          text-muted-foreground hover:bg-accent transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

const SidebarNav = ({ isCollapsed, onMobileClose }) => (
  <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
    {/* Regular nav items */}
    {NAV_ITEMS.map(({ label, icon: Icon, to, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onMobileClose}
        title={isCollapsed ? label : undefined}
        className={({ isActive }) => cn(
          'flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isCollapsed ? 'justify-center px-0' : 'px-3',
          isActive
            ? 'bg-travia-orange text-white'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="whitespace-nowrap overflow-hidden block"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>
    ))}

    {/* Master Data accordion */}
    <MasterDataAccordion isCollapsed={isCollapsed} onMobileClose={onMobileClose} />
  </nav>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => (
  <>
    {/* ── Desktop — always mounted, animates width ──────────────────────── */}
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col
        bg-card border-r border-border overflow-hidden"
    >
      <SidebarLogo isCollapsed={isCollapsed} onMobileClose={onMobileClose} showClose={false} />
      <SidebarNav  isCollapsed={isCollapsed} onMobileClose={onMobileClose} />
    </motion.aside>

    {/* ── Mobile — spring slide-in drawer ───────────────────────────────── */}
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          />

          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className="fixed inset-y-0 left-0 z-30 w-64 flex flex-col
              bg-card border-r border-border overflow-hidden lg:hidden"
          >
            <SidebarLogo isCollapsed={false} onMobileClose={onMobileClose} showClose={true} />
            <SidebarNav  isCollapsed={false} onMobileClose={onMobileClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
);

export default Sidebar;
