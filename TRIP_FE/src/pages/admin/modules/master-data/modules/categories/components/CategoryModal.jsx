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

const CategoryModal = ({ isOpen, onClose, item, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setPreview(item?.image ?? null);
    reset(item
      ? { name: item.name, description: item.description ?? '', sortOrder: item.sortOrder ?? '', status: item.status }
      : { name: '', description: '', sortOrder: '', status: undefined }
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
    <MasterDataModal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Kategori' : 'Tambah Kategori'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Gambar</label>
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
              <button type="button" onClick={clearImage}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed
              border-border rounded-lg cursor-pointer hover:border-travia-orange hover:bg-travia-orange/5
              transition-colors gap-2">
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Klik untuk upload gambar</span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nama <span className="text-red-500">*</span>
          </label>
          <input {...register('name', {
            required: 'Nama wajib diisi',
            minLength: { value: 2, message: 'Min 2 karakter' },
            maxLength: { value: 100, message: 'Maks 100 karakter' },
          })} placeholder="Contoh: Wisata Alam" className={inputCls} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi</label>
          <textarea {...register('description', { maxLength: { value: 500, message: 'Maks 500 karakter' } })}
            placeholder="Deskripsi singkat (opsional)" rows={2}
            className={cn(inputCls, 'h-auto py-2 resize-none')} />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Urutan Tampil</label>
          <input type="number" min={0} {...register('sortOrder')}
            placeholder="0" className={inputCls} />
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

export default CategoryModal;
