import { useState } from 'react';
import { Plus, Pencil, Trash2, Image, ExternalLink } from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from './api/useBanners.js';
import BannerModal from './components/BannerModal.jsx';
import DeleteConfirmDialog from '../../../../../../components/shared/admin/DeleteConfirmDialog.jsx';

const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
    <div className="aspect-[16/6] bg-muted" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-3 w-24 bg-muted rounded" />
    </div>
  </div>
);

const BannersPage = () => {
  const [modal, setModal] = useState({ open: false, item: null });
  const [del,   setDel]   = useState({ open: false, item: null });

  const { data: banners = [], isLoading } = useBanners();
  const { mutate: create, isPending: creating } = useCreateBanner();
  const { mutate: update, isPending: updating } = useUpdateBanner();
  const { mutate: remove, isPending: deleting } = useDeleteBanner();

  const openCreate = ()   => setModal({ open: true,  item: null });
  const openEdit   = item => setModal({ open: true,  item       });
  const closeModal = ()   => setModal({ open: false, item: null });
  const openDel    = item => setDel  ({ open: true,  item       });
  const closeDel   = ()   => setDel  ({ open: false, item: null });

  const handleSubmit = (data) => {
    if (modal.item) update({ id: modal.item._id, ...data }, { onSuccess: closeModal });
    else            create(data, { onSuccess: closeModal });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-foreground text-xl">Banner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola banner halaman utama</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /><span>Tambah Banner</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada banner</p>
          <button onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
              bg-travia-orange hover:bg-travia-orange-h text-white transition-colors">
            <Plus className="w-4 h-4" /> Tambah Banner Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(banner => (
            <div key={banner._id}
              className="bg-card border border-border rounded-xl overflow-hidden group">
              {/* Image */}
              <div className="relative aspect-[16/6] bg-muted overflow-hidden">
                {banner.image ? (
                  <img src={banner.image} alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                {/* Status badge overlay */}
                <div className="absolute top-2 left-2">
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm',
                    banner.isActive
                      ? 'text-emerald-700 bg-emerald-100/90'
                      : 'text-red-700 bg-red-100/90'
                  )}>
                    {banner.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                {/* Order badge */}
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full
                    bg-black/40 text-white backdrop-blur-sm">
                    #{banner.order ?? 0}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-medium text-foreground text-sm truncate">{banner.title}</p>
                {banner.link && (
                  <a href={banner.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-travia-orange hover:underline mt-0.5 truncate">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{banner.link}</span>
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <button onClick={() => openEdit(banner)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium
                    border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => openDel(banner)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium
                    border border-red-200 dark:border-red-800 text-red-500
                    hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BannerModal isOpen={modal.open} onClose={closeModal} item={modal.item}
        onSubmit={handleSubmit} isLoading={creating || updating} />
      <DeleteConfirmDialog isOpen={del.open} onClose={closeDel}
        onConfirm={() => remove(del.item?._id, { onSuccess: closeDel })}
        title={`Hapus banner "${del.item?.title}"?`} isLoading={deleting} />
    </div>
  );
};

export default BannersPage;
