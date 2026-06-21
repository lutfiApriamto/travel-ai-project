import { AlertTriangle } from 'lucide-react';

/**
 * Modal peringatan ketika pengguna mencoba meninggalkan form yang belum disimpan.
 * Digunakan di semua form admin (modal maupun halaman penuh).
 *
 * Props:
 *   isOpen      — tampilkan modal
 *   onConfirm   — callback ketika user memilih "Tutup Tanpa Menyimpan"
 *   onCancel    — callback ketika user memilih "Kembali"
 *   description — (opsional) pesan kustom
 */
const UnsavedChangesModal = ({
  isOpen,
  onConfirm,
  onCancel,
  description = 'Form ini memiliki perubahan yang belum disimpan. Jika Anda meninggalkan halaman ini, semua perubahan akan hilang.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6
        animate-in fade-in zoom-in-95 duration-200">

        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center
            justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">Data Belum Tersimpan</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-9 rounded-lg border border-border text-sm font-medium
              text-muted-foreground hover:bg-accent transition-colors"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white
              text-sm font-medium transition-colors"
          >
            Tutup Tanpa Menyimpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesModal;
