import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Eye, EyeOff, Loader2, ShieldCheck, Check, Circle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useTheme } from '../../../../hooks/useTheme.js';
import TraviaName from '../../../../components/shared/TraviaName.jsx';
import { useVerifyResetToken } from './api/useVerifyResetToken.js';
import { useResetPassword }    from './api/useResetPassword.js';

// ─── Password rules ───────────────────────────────────────────────────────────

const RULES = [
  { label: 'Min. 8 karakter',          test: (v) => v.length >= 8 },
  { label: 'Huruf kapital (A–Z)',       test: (v) => /[A-Z]/.test(v) },
  { label: 'Huruf kecil (a–z)',         test: (v) => /[a-z]/.test(v) },
  { label: 'Angka (0–9)',               test: (v) => /[0-9]/.test(v) },
  { label: 'Karakter spesial (!@#$…)', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

const PasswordRequirements = ({ value }) => {
  if (!value) return null;
  return (
    <div className="mt-2 p-3 rounded-xl bg-background border border-border space-y-1.5">
      {RULES.map(({ label, test }) => {
        const met = test(value);
        return (
          <div key={label} className="flex items-center gap-2">
            {met
              ? <Check  className="w-3 h-3 shrink-0 text-status-success" />
              : <Circle className="w-3 h-3 shrink-0 text-muted-foreground/50" />
            }
            <span className={cn('text-xs transition-colors', met ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Input style ──────────────────────────────────────────────────────────────

const inputCls = (hasError) =>
  cn(
    'w-full px-4 py-3 rounded-xl text-sm',
    'bg-white dark:bg-travia-dark3 text-foreground border',
    'placeholder:text-muted-foreground/60 outline-none',
    'focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
    hasError
      ? 'border-status-danger'
      : 'border-input hover:border-muted-foreground/40'
  );

// ─── Step 1: Email verification ───────────────────────────────────────────────

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid'),
});

const EmailStep = ({ token, onVerified }) => {
  const { mutate: verify, isPending } = useVerifyResetToken(token);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver:      zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((data) => {
    verify(data, {
      onSuccess: (result) => onVerified({ email: data.email, name: result.name }),
      onError:   (err)    => {
        const msg =
          err.response?.data?.errors?.[0]?.message ||
          'Email tidak valid atau link sudah kedaluwarsa.';
        toast.error(msg);
      },
    });
  });

  return (
    <motion.div
      key="email-step"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      {/* Orange accent bar */}
      <div className="w-8 h-[3px] bg-travia-orange rounded-full mb-5" />

      <h1
        className="font-serif italic font-bold leading-tight text-foreground mb-1.5"
        style={{ fontSize: '30px' }}
      >
        Buat Password Baru
      </h1>
      <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
        Masukkan email akun kamu untuk memverifikasi link reset password.
      </p>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email Akun
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            {...register('email')}
            className={inputCls(!!errors.email)}
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
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi...</span></>
          ) : (
            'Verifikasi Email'
          )}
        </button>
      </form>

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

// ─── Step 2: New password form ────────────────────────────────────────────────

const passwordSchema = z
  .object({
    newPassword: z.string().refine(
      (v) =>
        v.length >= 8 &&
        /[A-Z]/.test(v) &&
        /[a-z]/.test(v) &&
        /[0-9]/.test(v) &&
        /[^A-Za-z0-9\s]/.test(v),
      { message: 'Password tidak memenuhi semua persyaratan di atas' }
    ),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Password tidak cocok',
    path:    ['confirmPassword'],
  });

const PasswordStep = ({ token, userName, onSuccess }) => {
  const { mutate: resetPwd, isPending } = useResetPassword(token);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver:      zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = handleSubmit((data) => {
    resetPwd(
      { newPassword: data.newPassword },
      { onSuccess }
    );
  });

  return (
    <motion.div
      key="password-step"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      {/* Orange accent bar */}
      <div className="w-8 h-[3px] bg-travia-orange rounded-full mb-5" />

      <h1
        className="font-serif italic font-bold leading-tight text-foreground mb-1"
        style={{ fontSize: '28px' }}
      >
        Halo, {userName}!
      </h1>
      <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
        Email terverifikasi. Sekarang buat password baru yang kuat.
      </p>

      <form onSubmit={onSubmit} noValidate className="space-y-4">

        {/* Password Baru */}
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
            Password Baru
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Buat password kuat"
              {...register('newPassword')}
              className={cn(inputCls(!!errors.newPassword), 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Sembunyikan' : 'Tampilkan'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-status-danger flex items-center gap-1">
              <span>✕</span> {errors.newPassword.message}
            </p>
          )}
          <PasswordRequirements value={newPasswordValue} />
        </div>

        {/* Konfirmasi Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              {...register('confirmPassword')}
              className={cn(inputCls(!!errors.confirmPassword), 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-status-danger flex items-center gap-1">
              <span>✕</span> {errors.confirmPassword.message}
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
            'flex items-center justify-center gap-2 mt-1',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
          ) : (
            'Simpan Password Baru'
          )}
        </button>
      </form>
    </motion.div>
  );
};

// ─── Success view ─────────────────────────────────────────────────────────────

const SuccessView = () => (
  <motion.div
    key="success"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center"
  >
    <div className="flex justify-center mb-5">
      <div className="w-14 h-14 rounded-2xl bg-travia-orange/10 flex items-center justify-center">
        <ShieldCheck className="w-7 h-7 text-travia-orange" />
      </div>
    </div>
    <h2
      className="font-serif italic font-bold text-foreground mb-2"
      style={{ fontSize: '22px' }}
    >
      Password Berhasil Diubah!
    </h2>
    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
      Password akun <TraviaName /> kamu sudah direset. Sekarang kamu bisa
      masuk dengan password baru.
    </p>
    <Link
      to={ROUTES.AUTH.LOGIN}
      className={cn(
        'w-full py-3 rounded-xl text-sm font-semibold text-white',
        'bg-travia-orange hover:bg-travia-orange-h',
        'flex items-center justify-center transition-colors'
      )}
    >
      Masuk Sekarang
    </Link>
  </motion.div>
);

// ─── Invalid token view ───────────────────────────────────────────────────────

const InvalidView = () => (
  <motion.div
    key="invalid"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center"
  >
    <div className="flex justify-center mb-5">
      <div className="w-14 h-14 rounded-2xl bg-status-danger/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-status-danger" />
      </div>
    </div>
    <h2
      className="font-serif italic font-bold text-foreground mb-2"
      style={{ fontSize: '22px' }}
    >
      Link Tidak Valid
    </h2>
    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
      Link reset password ini sudah <strong>kedaluwarsa</strong> atau tidak valid.
      Link hanya berlaku selama <strong>1 jam</strong>.
    </p>
    <div className="h-px bg-border mb-5" />
    <Link
      to={ROUTES.AUTH.FORGOT_PASSWORD}
      className={cn(
        'w-full py-3 rounded-xl text-sm font-semibold text-white',
        'bg-travia-orange hover:bg-travia-orange-h',
        'flex items-center justify-center transition-colors'
      )}
    >
      Minta Link Baru
    </Link>
    <Link
      to={ROUTES.AUTH.LOGIN}
      className="mt-3 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Kembali ke Login
    </Link>
  </motion.div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ResetPasswordPage = () => {
  const { token }               = useParams();
  const { isDark, toggleTheme } = useTheme();

  // state: 'email' | 'password' | 'success' | 'invalid'
  const [step, setStep]         = useState('email');
  const [verified, setVerified] = useState(null); // { email, name }

  const handleVerified = (data) => {
    setVerified(data);
    setStep('password');
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">

      {/* Background atmosphere */}
      <div
        aria-hidden className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(237,224,204,0.06) 1px, transparent 1px)',
          backgroundSize:  '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 65%)' }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 pt-6 shrink-0">
        <Link to={ROUTES.HOME}>
          <img
            src={isDark ? '/brand-logo/logo-horizontal-dark.svg' : '/brand-logo/logo-horizontal-light.svg'}
            alt="Travia" className="h-10 w-auto"
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
              {step === 'email' && (
                <EmailStep
                  key="email"
                  token={token}
                  onVerified={handleVerified}
                />
              )}
              {step === 'password' && (
                <PasswordStep
                  key="password"
                  token={token}
                  userName={verified?.name?.split(' ')[0]}
                  onSuccess={() => setStep('success')}
                />
              )}
              {step === 'success' && <SuccessView key="success" />}
              {step === 'invalid' && <InvalidView key="invalid" />}
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

export default ResetPasswordPage;
