import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import MasterDataModal from '../../../../../../../components/shared/admin/MasterDataModal.jsx';
import { cn } from '../../../../../../../lib/utils.js';

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
);

const TagModal = ({ isOpen, onClose, item, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const colorVal = watch('color', item?.color ?? '#FF6B35');

  useEffect(() => {
    reset(item
      ? { name: item.name, color: item.color ?? '#FF6B35', status: item.status }
      : { name: '', color: '#FF6B35', status: undefined }
    );
  }, [item, isOpen, reset]);

  return (
    <MasterDataModal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Tag' : 'Tambah Tag'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nama <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name', {
              required: 'Nama wajib diisi',
              minLength: { value: 2, message: 'Min 2 karakter' },
              maxLength: { value: 50, message: 'Maks 50 karakter' },
            })}
            placeholder="Contoh: Promo"
            className={inputCls}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Warna</label>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg border-2 border-border shrink-0"
              style={{ backgroundColor: colorVal }}
            />
            <input
              type="color"
              {...register('color', {
                pattern: { value: /^#[0-9A-Fa-f]{6}$/, message: 'Format hex tidak valid' },
              })}
              className="h-9 flex-1 rounded-lg border border-border cursor-pointer bg-transparent"
            />
            <input
              value={colorVal}
              readOnly
              className={cn(inputCls, 'w-28 flex-shrink-0 font-mono text-xs')}
            />
          </div>
          {errors.color && <p className="text-xs text-red-500 mt-1">{errors.color.message}</p>}
        </div>

        {/* Status (edit only) */}
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
          <button type="button" onClick={onClose}
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
  );
};

export default TagModal;
