import { useState }       from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm }         from 'react-hook-form';
import {
  Eye, EyeOff, KeyRound, ChevronRight,
  Loader2, CheckCircle2, Mail, ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { cn }               from '../../../lib/utils.js';
import { ROUTES }           from '../../../utils/consts/routes.js';
import { useAuthStore }     from '../../../stores/useAuthStore.js';
import { useChangePassword } from '../api/useProfile.js';

// ─── Password strength ────────────────────────────────────────────────────────

const calcStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  const checks = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 1) return { score, label: 'Lemah',  color: 'bg-red-500'   };
  if (score === 2) return { score, label: 'Sedang', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Baik',   color: 'bg-blue-500'  };
  return               { score, label: 'Kuat',   color: 'bg-emerald-500' };
};

const StrengthBar = ({ password }) => {
  const { score, label, color } = calcStrength(password);
  if (!password) return null;

  const criteria = [
    { ok: password.length >= 8, text: 'Minimal 8 karakter'    },
    { ok: /[A-Z]/.test(password), text: 'Huruf kapital (A-Z)' },
    { ok: /[0-9]/.test(password), text: 'Angka (0-9)'         },
    { ok: /[^A-Za-z0-9]/.test(password), text: 'Karakter khusus (!@#...)' },
  ];

  return (
    <div className="mt-2.5 space-y-2">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1 h-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-full transition-all duration-300',
                i <= score ? color : 'bg-muted',
              )}
            />
          ))}
        </div>
        <span className={cn('text-[11px] font-semibold w-12 text-right', {
          'text-red-500':     score <= 1,
          'text-amber-500':   score === 2,
          'text-blue-600':    score === 3,
          'text-emerald-600': score === 4,
        })}>
          {label}
        </span>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {criteria.map(({ ok, text }) => (
          <span key={text} className={cn(
            'flex items-center gap-1 text-[10px]',
            ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}>
            <CheckCircle2 className={cn('w-3 h-3 shrink-0', ok ? '' : 'opacity-30')} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Password Input ───────────────────────────────────────────────────────────

const PasswordInput = ({ label, error, hint, showStrength, watch, ...inputProps }) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={show ? 'text' : 'password'}
          autoComplete={inputProps.autoComplete ?? 'off'}
          {...inputProps}
          className={cn(
            'w-full h-11 pl-10 pr-11 rounded-xl border bg-white dark:bg-travia-dark3',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
            'transition-colors',
            error ? 'border-red-400' : 'border-border',
          )}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground
            hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {showStrength && watch && <StrengthBar password={watch} />}

      {hint && !error && (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

// ─── Success State ────────────────────────────────────────────────────────────

const SuccessState = ({ email }) => (
  <div className="flex flex-col items-center py-10 text-center gap-5">
    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40
      flex items-center justify-center">
      <ShieldCheck className="w-8 h-8 text-emerald-500" />
    </div>

    <div>
      <h2 className="font-serif italic text-xl text-foreground mb-1">
        Password Berhasil Diubah
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Password akun kamu sudah berhasil diperbarui.
      </p>
    </div>

    {email && (
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
        bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50
        text-xs text-blue-700 dark:text-blue-300 max-w-sm text-left">
        <Mail className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Email konfirmasi perubahan password telah dikirim ke <strong>{email}</strong>.
        </span>
      </div>
    )}

    <Link
      to={ROUTES.PROFILE}
      className="h-10 px-6 rounded-xl bg-travia-orange text-white text-sm font-semibold
        hover:bg-travia-orange/90 transition-colors"
    >
      Kembali ke Profil
    </Link>
  </div>
);

// ─── ChangePasswordPage ───────────────────────────────────────────────────────

const ChangePasswordPage = () => {
  const navigate      = useNavigate();
  const user          = useAuthStore((s) => s.user);
  const [success, setSuccess] = useState(false);

  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      currentPassword:  '',
      newPassword:      '',
      confirmPassword:  '',
    },
  });

  const newPasswordValue = watch('newPassword');
  const { score: strengthScore } = calcStrength(newPasswordValue);

  const onSubmit = ({ currentPassword, newPassword }) => {
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => setSuccess(true),
      },
    );
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-card border border-border rounded-2xl overflow-hidden p-6">
          <SuccessState email={user?.email} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link to={ROUTES.PROFILE} className="hover:text-foreground transition-colors">
          Profil
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">Ganti Password</span>
      </nav>

      <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground mb-6">
        Ganti Password
      </h1>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">

        {/* Info banner */}
        <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl
          bg-accent border border-border text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-travia-orange" />
          <span>
            Setelah berhasil, email konfirmasi akan dikirim ke <strong className="text-foreground">{user?.email}</strong>.
            Akun kamu tetap aktif — tidak perlu login ulang.
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Current password */}
          <PasswordInput
            label="Password Saat Ini"
            placeholder="Masukkan password lama"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            disabled={changePassword.isPending}
            {...register('currentPassword', {
              required: 'Password saat ini wajib diisi',
            })}
          />

          {/* New password + strength */}
          <div>
            <PasswordInput
              label="Password Baru"
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              disabled={changePassword.isPending}
              showStrength
              watch={newPasswordValue}
              {...register('newPassword', {
                required:  'Password baru wajib diisi',
                minLength: { value: 8,   message: 'Minimal 8 karakter' },
                maxLength: { value: 100, message: 'Maksimal 100 karakter' },
                validate: (val) =>
                  val !== watch('currentPassword') ||
                  'Password baru tidak boleh sama dengan password lama',
              })}
            />
          </div>

          {/* Confirm password */}
          <PasswordInput
            label="Ulangi Password Baru"
            placeholder="Ketik ulang password baru"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            disabled={changePassword.isPending}
            hint={!errors.confirmPassword ? 'Harus sama dengan password baru di atas' : undefined}
            {...register('confirmPassword', {
              required: 'Konfirmasi password wajib diisi',
              validate: (val) =>
                val === newPasswordValue || 'Password tidak cocok',
            })}
          />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={ROUTES.PROFILE}
              className="flex-1 sm:flex-none h-11 px-6 rounded-xl border border-border
                text-sm font-medium text-muted-foreground hover:bg-accent transition-colors
                flex items-center justify-center"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={changePassword.isPending || strengthScore < 1}
              className={cn(
                'flex-1 h-11 rounded-xl text-sm font-semibold transition-colors',
                'flex items-center justify-center gap-2',
                !changePassword.isPending && strengthScore >= 1
                  ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {changePassword.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><KeyRound className="w-4 h-4" /> Simpan Password Baru</>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default ChangePasswordPage;
