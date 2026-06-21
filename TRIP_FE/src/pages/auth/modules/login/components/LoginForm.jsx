import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils.js';
import { useLoginForm } from '../hooks/useLoginForm.js';
import { ROUTES } from '../../../../../utils/consts/routes.js';

const LoginForm = () => {
  const { register, errors, onSubmit, isPending } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">

      {/* Email */}
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
            'placeholder:text-muted-foreground/60',
            'outline-none transition-shadow',
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

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD}
            className="text-xs text-travia-orange hover:text-travia-orange-h transition-colors"
          >
            Lupa password?
          </Link>
        </div>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Masukkan password"
            {...register('password')}
            className={cn(
              'w-full pl-4 pr-11 py-3 rounded-xl text-sm',
              'bg-white dark:bg-travia-dark3 text-foreground border',
              'placeholder:text-muted-foreground/60',
              'outline-none transition-shadow',
              'focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
              errors.password
                ? 'border-status-danger'
                : 'border-input hover:border-muted-foreground/40'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2
              text-muted-foreground hover:text-foreground transition-colors p-0.5"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {errors.password && (
          <p className="text-xs text-status-danger flex items-center gap-1">
            <span>✕</span> {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
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
            <span>Memverifikasi...</span>
          </>
        ) : (
          'Masuk'
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground pt-1">
        Belum punya akun?{' '}
        <Link
          to={ROUTES.AUTH.REGISTER}
          className="text-travia-orange font-medium hover:text-travia-orange-h transition-colors"
        >
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
