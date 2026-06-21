import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '../../../../lib/utils.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useTheme } from '../../../../hooks/useTheme.js';
import TraviaName from '../../../../components/shared/TraviaName.jsx';
import { useForgotPassword } from './api/useForgotPassword.js';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid'),
});

// ─── Success view ─────────────────────────────────────────────────────────────

const SuccessView = ({ email, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center"
  >
    {/* Icon */}
    <div className="flex justify-center mb-5">
      <div className="w-14 h-14 rounded-2xl bg-travia-orange/10 flex items-center justify-center">
        <MailCheck className="w-7 h-7 text-travia-orange" />
      </div>
    </div>

    <h2
      className="font-serif italic font-bold text-foreground mb-2"
      style={{ fontSize: '22px' }}
    >
      Email Terkirim!
    </h2>

    <p className="text-sm text-muted-foreground leading-relaxed mb-1">
      Jika <span className="font-medium text-foreground">{email}</span> terdaftar
      di <TraviaName />, link reset password sudah dikirim ke inbox kamu.
    </p>
    <p className="text-xs text-muted-foreground mb-6">
      Periksa juga folder <strong>Spam</strong> atau <strong>Junk</strong>.
      Link berlaku selama <strong>1 jam</strong>.
    </p>

    {/* Divider */}
    <div className="h-px bg-border mb-5" />

    {/* Actions */}
    <div className="space-y-3">
      <Link
        to={ROUTES.AUTH.LOGIN}
        className={cn(
          'w-full py-3 rounded-xl text-sm font-semibold text-white',
          'bg-travia-orange hover:bg-travia-orange-h',
          'flex items-center justify-center gap-2 transition-colors'
        )}
      >
        Kembali ke Login
      </Link>

      <button
        onClick={onRetry}
        className="w-full py-2.5 rounded-xl text-sm font-medium
          text-muted-foreground hover:text-foreground hover:bg-accent
          transition-colors"
      >
        Coba email lain
      </button>
    </div>
  </motion.div>
);

// ─── Form view ────────────────────────────────────────────────────────────────

const FormView = ({ onSuccess }) => {
  const { mutate: sendReset, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver:      zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((data) => {
    sendReset(data, {
      onSuccess: () => onSuccess(data.email),
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Orange accent bar */}
      <div className="w-8 h-[3px] bg-travia-orange rounded-full mb-5" />

      {/* Heading */}
      <h1
        className="font-serif italic font-bold leading-tight text-foreground mb-1.5"
        style={{ fontSize: '30px' }}
      >
        Lupa Password?
      </h1>
      <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
        Masukkan email akunmu dan kami akan mengirimkan link untuk
        membuat password baru.
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...register('email')}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm',
              'bg-white dark:bg-travia-dark3 text-foreground border',
              'placeholder:text-muted-foreground/60 outline-none',
              'focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
              errors.email
                ? 'border-status-danger'
                : 'border-input hover:border-muted-foreground/40'
            )}
          />
          {errors.email && (
            <p className="text-xs text-status-danger flex items-center gap-1">
              <span>✕</span> {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold text-white',
            'bg-travia-orange hover:bg-travia-orange-h',
            'active:scale-[0.98] transition-all duration-150',
            'flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengirim...</span>
            </>
          ) : (
            'Kirim Link Reset Password'
          )}
        </button>
      </form>

      {/* Back to login */}
      <Link
        to={ROUTES.AUTH.LOGIN}
        className="mt-5 flex items-center justify-center gap-1.5
          text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Login
      </Link>
    </motion.div>
  );
};

// ─── Forgot Password Page ─────────────────────────────────────────────────────

const ForgotPasswordPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const [sentTo, setSentTo]     = useState(null); // null = form, string = success

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">

      {/* Background atmosphere */}
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
        className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 65%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 65%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 pt-6 shrink-0">
        <Link to={ROUTES.HOME}>
          <img
            src={isDark
              ? '/brand-logo/logo-horizontal-dark.svg'
              : '/brand-logo/logo-horizontal-light.svg'
            }
            alt="Travia"
            className="h-10 w-auto"
          />
        </Link>

        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Ganti ke light mode' : 'Ganti ke dark mode'}
          className="w-11 h-11 flex items-center justify-center rounded-xl
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
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="bg-card border border-border rounded-2xl px-6 sm:px-8 py-7 shadow-sm">
            <AnimatePresence mode="wait">
              {sentTo ? (
                <SuccessView
                  key="success"
                  email={sentTo}
                  onRetry={() => setSentTo(null)}
                />
              ) : (
                <FormView
                  key="form"
                  onSuccess={(email) => setSentTo(email)}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 text-center shrink-0">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} <TraviaName /> · AI Travel Agent
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
