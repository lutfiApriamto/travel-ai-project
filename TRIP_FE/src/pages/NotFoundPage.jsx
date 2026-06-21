import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore.js';
import { ROUTES }       from '../utils/consts/routes.js';
import TraviaName       from '../components/shared/TraviaName.jsx';

const NotFoundPage = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  const isAdmin   = isAuthenticated && user?.role === 'admin';
  const homeTo    = isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.HOME;
  const HomeIcon  = isAdmin ? LayoutDashboard : Home;
  const homeLabel = isAdmin ? 'Dashboard' : 'Beranda';

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden px-4">

      {/* ── Watermark 404 ──────────────────────────────────────────────────── */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute font-serif italic font-bold
          leading-none tracking-tighter text-foreground/[0.04]"
        style={{ fontSize: '42vw' }}
      >
        404
      </span>

      {/* ── Background atmosphere ──────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(237,224,204,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 60%)',
        }}
      />

      {/* ── Logo — top left ────────────────────────────────────────────────── */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-10">
        <Link
          to={ROUTES.HOME}
          className="opacity-50 hover:opacity-100 transition-opacity duration-200 block"
        >
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
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md flex flex-col items-center text-center"
      >
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7
          bg-status-danger/10 border border-status-danger/20 text-status-danger
          text-xs font-semibold"
        >
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-current"
          />
          404 · Tidak Ditemukan
        </div>

        {/* Icon */}
        <motion.div
          className="w-16 h-16 rounded-2xl bg-travia-orange/10 flex items-center justify-center mb-6"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Compass className="w-8 h-8 text-travia-orange" />
        </motion.div>

        {/* Heading */}
        <h1
          className="font-serif italic font-bold text-foreground leading-tight mb-3"
          style={{ fontSize: 'clamp(24px, 5vw, 34px)' }}
        >
          Halaman Tidak Ditemukan
        </h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
          Sepertinya kamu tersasar dari jalur perjalanan bersama{' '}
          <TraviaName className="font-medium text-foreground" />.
          Halaman ini tidak ditemukan atau sudah dipindahkan.
        </p>

        {/* Path info card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          className="w-full bg-card border border-border rounded-xl px-4 py-3.5 mb-8 text-left"
        >
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 font-semibold">
            Halaman yang dicari
          </p>
          <p className="text-sm font-mono text-travia-orange break-all">
            {location.pathname}
          </p>
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.32, ease: 'easeOut' }}
        >
          <Link
            to={homeTo}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm
              font-semibold text-white bg-travia-orange hover:bg-travia-orange-h
              active:scale-[0.97] transition-all duration-150"
          >
            <HomeIcon className="w-4 h-4" />
            {homeLabel}
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} <TraviaName /> · AI Travel Agent
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
