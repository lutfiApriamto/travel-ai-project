import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, ImagePlus, X, Trash2 } from 'lucide-react';
import MasterDataModal from '../../../../../../../components/shared/admin/MasterDataModal.jsx';
import UnsavedChangesModal from '../../../../../../../components/shared/admin/UnsavedChangesModal.jsx';
import { useUploadSingle, useDeleteImage } from '../../../../products/api/useUpload.js';
import { cn } from '../../../../../../../lib/utils.js';

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
);

const CategoryModal = ({ isOpen, onClose, item, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  // ── Image state ─────────────────────────────────────────────────────────────
  const [imageUrl,    setImageUrl]    = useState(null); // current URL in state
  const [isUploading, setIsUploading] = useState(false);
  const originalImageUrl              = useRef(null);   // URL when modal opened

  // ── Leave warning state ──────────────────────────────────────────────────────
  const [showWarning, setShowWarning] = useState(false);

  // Track if image has changed from original
  const imageChanged = imageUrl !== originalImageUrl.current;
  const hasUnsaved   = isDirty || imageChanged;

  // ── Reset on open/item change ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const existing = item?.image ?? null;
    originalImageUrl.current = existing;
    setImageUrl(existing);
    setIsUploading(false);
    setShowWarning(false);
    reset(item
      ? { name: item.name, description: item.description ?? '', sortOrder: item.sortOrder ?? '', status: item.status }
      : { name: '', description: '', sortOrder: '', status: undefined }
    );
  }, [item, isOpen, reset]);

  const { mutate: upload }     = useUploadSingle();
  const { mutate: deleteImg }  = useDeleteImage();

  // ── Upload immediately on file select ────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // If there's already a newly-uploaded (unsaved) image, delete it first from Supabase
    if (imageUrl && imageUrl !== originalImageUrl.current) {
      deleteImg(imageUrl);
    }

    setIsUploading(true);
    upload(
      { file, folder: 'categories' },
      {
        onSuccess: (url) => { setImageUrl(url); setIsUploading(false); },
        onError:   ()    => { setIsUploading(false); },
      },
    );
  };

  // ── Delete: remove from Supabase, then clear state ───────────────────────────
  const handleDeleteImage = () => {
    if (!imageUrl) return;
    deleteImg(imageUrl, {
      onSuccess: () => setImageUrl(null),
    });
  };

  // ── Close with dirty check ───────────────────────────────────────────────────
  const handleClose = () => {
    if (hasUnsaved) { setShowWarning(true); return; }
    onClose();
  };

  // User confirmed close — cleanup newly uploaded (unsaved) image from Supabase
  const handleConfirmClose = () => {
    if (imageUrl && imageUrl !== originalImageUrl.current) {
      deleteImg(imageUrl);
    }
    setShowWarning(false);
    onClose();
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleFormSubmit = (formData) => {
    // Merge imageUrl (string URL or null) into form data
    onSubmit({ ...formData, image: imageUrl });
  };

  return (
    <>
      <MasterDataModal isOpen={isOpen} onClose={handleClose} title={item ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

          {/* ── Image upload ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Gambar</label>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
                <button type="button" onClick={handleDeleteImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 shadow-md
                    flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className={cn(
                'flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-lg cursor-pointer',
                'border-border hover:border-travia-orange hover:bg-travia-orange/5 transition-colors gap-2',
                isUploading && 'pointer-events-none opacity-70',
              )}>
                {isUploading
                  ? <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  : <><ImagePlus className="w-6 h-6 text-muted-foreground" />
                     <span className="text-xs text-muted-foreground">Klik untuk upload gambar</span></>
                }
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={isUploading} />
              </label>
            )}
          </div>

          {/* ── Nama ─────────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nama <span className="text-red-500">*</span>
            </label>
            <input {...register('name', {
              required:  'Nama wajib diisi',
              minLength: { value: 2,   message: 'Min 2 karakter' },
              maxLength: { value: 100, message: 'Maks 100 karakter' },
            })} placeholder="Contoh: Wisata Alam" className={inputCls} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* ── Deskripsi ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi</label>
            <textarea {...register('description', { maxLength: { value: 500, message: 'Maks 500 karakter' } })}
              placeholder="Deskripsi singkat (opsional)" rows={2}
              className={cn(inputCls, 'h-auto py-2 resize-none')} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* ── Urutan tampil ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Urutan Tampil</label>
            <input type="number" min={0} {...register('sortOrder')} placeholder="0" className={inputCls} />
          </div>

          {/* ── Status (edit only) ───────────────────────────────────────────── */}
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
            <button type="submit" disabled={isLoading || isUploading}
              className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2
                bg-travia-orange hover:bg-travia-orange-h text-white disabled:opacity-50 transition-colors">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? 'Menyimpan...' : item ? 'Perbarui' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </MasterDataModal>

      {/* Leave warning */}
      <UnsavedChangesModal
        isOpen={showWarning}
        onCancel={() => setShowWarning(false)}
        onConfirm={handleConfirmClose}
        description="Form kategori ini memiliki perubahan yang belum disimpan. Jika ditutup, semua perubahan akan hilang."
      />
    </>
  );
};

export default CategoryModal;
