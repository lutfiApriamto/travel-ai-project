import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import MasterDataModal from '../../../../../../../components/shared/admin/MasterDataModal.jsx';
import UnsavedChangesModal from '../../../../../../../components/shared/admin/UnsavedChangesModal.jsx';
import { cn } from '../../../../../../../lib/utils.js';

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange',
  'transition-colors',
);

const TypeModal = ({ isOpen, onClose, item, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setShowWarning(false);
    reset(item
      ? { name: item.name, description: item.description ?? '', status: item.status }
      : { name: '', description: '', status: undefined }
    );
  }, [item, isOpen, reset]);

  const handleClose = () => {
    if (isDirty) { setShowWarning(true); return; }
    onClose();
  };

  return (
    <>
      <MasterDataModal isOpen={isOpen} onClose={handleClose} title={item ? 'Edit Tipe' : 'Tambah Tipe'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', {
                required:  'Nama wajib diisi',
                minLength: { value: 2,   message: 'Min 2 karakter' },
                maxLength: { value: 100, message: 'Maks 100 karakter' },
              })}
              placeholder="Contoh: Wisata Alam"
              className={inputCls}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi</label>
            <textarea
              {...register('description', { maxLength: { value: 500, message: 'Maks 500 karakter' } })}
              placeholder="Deskripsi singkat (opsional)"
              rows={3}
              className={cn(inputCls, 'h-auto py-2 resize-none')}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          {item && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
              <select {...register('status')} className={inputCls}>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-border
                text-muted-foreground hover:bg-accent transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isLoading}
              className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2
                bg-travia-orange hover:bg-travia-orange-h text-white disabled:opacity-50 transition-colors">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? 'Menyimpan...' : item ? 'Perbarui' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </MasterDataModal>

      <UnsavedChangesModal
        isOpen={showWarning}
        onCancel={() => setShowWarning(false)}
        onConfirm={() => { setShowWarning(false); onClose(); }}
        description="Form tipe ini memiliki perubahan yang belum disimpan. Jika ditutup, semua perubahan akan hilang."
      />
    </>
  );
};

export default TypeModal;
