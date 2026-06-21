import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Image } from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { useDebounce } from '../../../../../../hooks/useDebounce.js';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './api/useCategories.js';
import CategoryModal from './components/CategoryModal.jsx';
import DeleteConfirmDialog from '../../../../../../components/shared/admin/DeleteConfirmDialog.jsx';

const formatDate = v => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const StatusBadge = ({ status }) => (
  <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full',
    status === 'active'
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
      : 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
  )}>
    {status === 'active' ? 'Aktif' : 'Nonaktif'}
  </span>
);

const SkeletonRows = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-muted shrink-0" /><div className="h-4 w-28 bg-muted rounded" /></div></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-40 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-8 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-5 w-16 bg-muted rounded-full" /></td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-24 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-6 w-16 bg-muted rounded" /></td>
      </tr>
    ))}
  </>
);

const CategoriesPage = () => {
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState({ open: false, item: null });
  const [del,    setDel]    = useState({ open: false, item: null });
  const debouncedSearch     = useDebounce(search);

  const { data: categories = [], isLoading } = useCategories(debouncedSearch);
  const { mutate: create, isPending: creating } = useCreateCategory();
  const { mutate: update, isPending: updating } = useUpdateCategory();
  const { mutate: remove, isPending: deleting } = useDeleteCategory();

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
          <h1 className="font-bold text-foreground text-xl">Kategori</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola kategori destinasi wisata</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /><span>Tambah Kategori</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kategori..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                focus:ring-travia-orange focus:border-travia-orange transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Deskripsi</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Urutan</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Dibuat</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? <SkeletonRows /> : categories.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {search ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori'}
                </td></tr>
              ) : categories.map(cat => (
                <tr key={cat._id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-travia-orange/10 flex items-center justify-center shrink-0">
                          <Image className="w-4 h-4 text-travia-orange/50" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-xs">
                    <p className="truncate">{cat.description || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{cat.sortOrder ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDate(cat.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openDel(cat)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && categories.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">{categories.length} kategori ditemukan</p>
          </div>
        )}
      </div>

      <CategoryModal isOpen={modal.open} onClose={closeModal} item={modal.item}
        onSubmit={handleSubmit} isLoading={creating || updating} />
      <DeleteConfirmDialog isOpen={del.open} onClose={closeDel}
        onConfirm={() => remove(del.item?._id, { onSuccess: closeDel })}
        title={`Hapus kategori "${del.item?.name}"?`} isLoading={deleting} />
    </div>
  );
};

export default CategoriesPage;
