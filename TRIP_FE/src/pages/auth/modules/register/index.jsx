import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import RegisterForm from './components/RegisterForm.jsx';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useTheme } from '../../../../hooks/useTheme.js';
import TraviaName from '../../../../components/shared/TraviaName.jsx';

const RegisterPage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-x-hidden">

      {/* ── Background atmosphere ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(237,224,204,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 65%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 65%)',
        }}
      />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 pt-6 shrink-0">
        {/* Logo → ke "/" */}
        <Link to={ROUTES.HOME}>
          <img
            src={
              isDark
                ? '/brand-logo/logo-horizontal-dark.svg'
                : '/brand-logo/logo-horizontal-light.svg'
            }
            alt="Travia"
            className="h-10 w-auto"
          />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Ganti ke light mode' : 'Ganti ke dark mode'}
          className="w-11 h-11 flex items-center justify-center rounded-xl
            text-muted-foreground hover:text-foreground hover:bg-accent
            transition-colors"
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
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center
        px-4 sm:px-6 py-8">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Card */}
          <div className="bg-card border border-border rounded-2xl
            px-6 sm:px-8 py-7 shadow-sm">

            {/* Orange accent bar */}
            <div className="w-8 h-[3px] bg-travia-orange rounded-full mb-5" />

            {/* Heading */}
            <h1
              className="font-serif italic font-bold leading-tight text-foreground mb-1"
              style={{ fontSize: '30px' }}
            >
              Daftar di <TraviaName />
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Mulai perjalanan impianmu hari ini
            </p>

            {/* Form */}
            <RegisterForm />
          </div>
        </motion.div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 pb-6 text-center shrink-0">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} <TraviaName /> · AI Travel Agent
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
