import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title         = 'Hapus item ini?',
  description   = 'Tindakan ini tidak dapat dibatalkan.',
  isLoading     = false,
  // Kustomisasi tombol konfirmasi
  confirmLabel  = 'Ya, Hapus',
  loadingLabel  = 'Memproses...',
  confirmCls    = 'bg-red-500 hover:bg-red-600 text-white',
  // Kustomisasi ikon
  iconCls       = 'bg-red-50 dark:bg-red-950/30',
  iconColor     = 'text-red-500',
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          key="del-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={!isLoading ? onClose : undefined}
          className="fixed inset-0 z-50 bg-black/50"
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="del-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', iconCls)}>
                <AlertTriangle className={cn('w-5 h-5', iconColor)} />
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="font-semibold text-foreground text-sm leading-snug">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="h-9 px-4 rounded-lg text-sm font-medium border border-border
                  text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50',
                  confirmCls,
                )}
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoading ? loadingLabel : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);

export default DeleteConfirmDialog;
