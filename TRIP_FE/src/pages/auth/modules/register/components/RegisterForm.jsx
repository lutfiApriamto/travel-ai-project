import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, Circle } from 'lucide-react';
import { cn } from '../../../../../lib/utils.js';
import { useRegisterForm } from '../hooks/useRegisterForm.js';
import { ROUTES } from '../../../../../utils/consts/routes.js';

// ─── Password requirements ────────────────────────────────────────────────────

const RULES = [
  { label: 'Min. 8 karakter',           test: (v) => v.length >= 8 },
  { label: 'Huruf kapital (A–Z)',        test: (v) => /[A-Z]/.test(v) },
  { label: 'Huruf kecil (a–z)',          test: (v) => /[a-z]/.test(v) },
  { label: 'Angka (0–9)',                test: (v) => /[0-9]/.test(v) },
  { label: 'Karakter spesial (!@#$…)',  test: (v) => /[^A-Za-z0-9\s]/.test(v) },
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
            <span className={cn(
              'text-xs transition-colors',
              met ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls = (hasError) =>
  cn(
    'w-full px-4 py-3 rounded-xl text-sm',
    'bg-white dark:bg-travia-dark3 text-foreground border',
    'placeholder:text-muted-foreground/60',
    'outline-none',
    'focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
    hasError
      ? 'border-status-danger'
      : 'border-input hover:border-muted-foreground/40'
  );

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, id, error, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {hint && (
        <span className="text-[11px] text-muted-foreground/60 font-medium">
          {hint}
        </span>
      )}
    </div>
    {children}
    {error && (
      <p className="text-xs text-status-danger flex items-center gap-1">
        <span>✕</span> {error.message}
      </p>
    )}
  </div>
);

// ─── Register Form ────────────────────────────────────────────────────────────

const RegisterForm = () => {
  const { field, errors, onSubmit, isPending, watch } = useRegisterForm();
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordValue = watch('password');

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">

      {/* Nama Lengkap */}
      <Field label="Nama Lengkap" id="name" error={errors.name}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkapmu"
          {...field('name')}
          className={inputCls(!!errors.name)}
        />
      </Field>

      {/* Email */}
      <Field label="Email" id="email" error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          {...field('email')}
          className={inputCls(!!errors.email)}
        />
      </Field>

      {/* Nomor HP */}
      <Field label="Nomor HP" id="phone" error={errors.phone} hint="Opsional">
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
          {...field('phone')}
          className={inputCls(!!errors.phone)}
        />
      </Field>

      {/* Password */}
      <Field label="Password" id="password" error={errors.password}>
        <div className="relative">
          <input
            id="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Buat password kuat"
            {...field('password')}
            className={cn(inputCls(!!errors.password), 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Sembunyikan' : 'Tampilkan'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2
              text-muted-foreground hover:text-foreground transition-colors p-0.5"
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {/* Live requirements — muncul saat mulai mengetik */}
        <PasswordRequirements value={passwordValue} />
      </Field>

      {/* Konfirmasi Password */}
      <Field label="Konfirmasi Password" id="confirmPassword" error={errors.confirmPassword}>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ulangi password"
            {...field('confirmPassword')}
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
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full py-3.5 rounded-xl text-sm font-semibold text-white',
          'bg-travia-orange hover:bg-travia-orange-h',
          'active:scale-[0.98] transition-all duration-150',
          'flex items-center justify-center gap-2 mt-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Membuat akun...</span>
          </>
        ) : (
          'Buat Akun'
        )}
      </button>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground pt-1">
        Sudah punya akun?{' '}
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="text-travia-orange font-medium hover:text-travia-orange-h transition-colors"
        >
          Masuk sekarang
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
