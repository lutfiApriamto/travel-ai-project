import { LogIn, X } from 'lucide-react';

/**
 * Modal peringatan ketika pengguna yang belum login mencoba menggunakan
 * fitur yang memerlukan autentikasi.
 *
 * Props:
 *   isOpen   — tampilkan modal
 *   onClose  — callback tombol "Kembali" / backdrop click
 *   onLogin  — callback tombol "Masuk / Daftar"
 */
const AuthRequiredModal = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl
        shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center
            rounded-lg text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-travia-orange/10 flex items-center
          justify-center mx-auto mb-4">
          <LogIn className="w-7 h-7 text-travia-orange" />
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="font-semibold text-foreground text-lg mb-2">
            Perlu Masuk Akun
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anda perlu masuk akun terlebih dahulu untuk menggunakan fitur ini.
            Bergabunglah dengan Travia dan nikmati pengalaman wisata terbaik!
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onLogin}
            className="w-full h-11 rounded-xl bg-travia-orange hover:bg-travia-orange-h
              text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Masuk / Daftar Sekarang
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-xl border border-border text-sm font-medium
              text-muted-foreground hover:bg-accent transition-colors"
          >
            Tetap di Sini
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
