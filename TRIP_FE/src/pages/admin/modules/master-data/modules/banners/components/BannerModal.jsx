import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, ImagePlus, X } from 'lucide-react';
import MasterDataModal from '../../../../../../../components/shared/admin/MasterDataModal.jsx';
import { cn } from '../../../../../../../lib/utils.js';

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
);

const BannerModal = ({ isOpen, onClose, item, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setPreview(item?.image ?? null);
    reset(item
      ? { title: item.title, link: item.link ?? '', order: item.order ?? '', isActive: item.isActive }
      : { title: '', link: '', order: '', isActive: true }
    );
  }, [item, isOpen, reset]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue('image', file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => { setValue('image', null); setPreview(null); };

  return (
    <MasterDataModal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Banner' : 'Tambah Banner'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Gambar {!item && <span className="text-red-500">*</span>}
          </label>
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
              <button type="button" onClick={clearImage}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed
              border-border rounded-lg cursor-pointer hover:border-travia-orange hover:bg-travia-orange/5
              transition-colors gap-2">
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {item ? 'Upload gambar baru (opsional)' : 'Klik untuk upload gambar'}
              </span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Judul <span className="text-red-500">*</span>
          </label>
          <input {...register('title', {
            required: 'Judul wajib diisi',
            minLength: { value: 2, message: 'Min 2 karakter' },
            maxLength: { value: 150, message: 'Maks 150 karakter' },
          })} placeholder="Contoh: Promo Akhir Tahun" className={inputCls} />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Link (opsional)</label>
          <input {...register('link', { maxLength: { value: 500, message: 'Maks 500 karakter' } })}
            placeholder="https://..." className={inputCls} />
          {errors.link && <p className="text-xs text-red-500 mt-1">{errors.link.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Urutan</label>
            <input type="number" min={0} {...register('order')} placeholder="0" className={inputCls} />
          </div>

          {/* isActive (edit only) */}
          {item && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
              <select {...register('isActive', { setValueAs: v => v === 'true' || v === true })} className={inputCls}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          )}
        </div>

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

export default BannerModal;
