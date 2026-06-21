import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Copy, Pencil, Trash2, Eye,
  ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';
import { cn } from '../../../../lib/utils.js';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import {
  useProducts, useDeleteProduct, useDuplicateProduct, useBulkStatus,
} from './api/useProducts.js';
import ProductStatusBadge from './components/ProductStatusBadge.jsx';
import DeleteConfirmDialog from '../../../../components/shared/admin/DeleteConfirmDialog.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUSES = [
  { value: '',          label: 'Semua Status' },
  { value: 'draft',     label: 'Draft'        },
  { value: 'active',    label: 'Aktif'        },
  { value: 'full',      label: 'Penuh'        },
  { value: 'expired',   label: 'Kedaluwarsa'  },
  { value: 'cancelled', label: 'Dibatalkan'   },
];

const BULK_STATUSES = [
  { value: 'draft',     label: 'Set ke Draft'      },
  { value: 'active',    label: 'Set ke Aktif'      },
  { value: 'cancelled', label: 'Set ke Dibatalkan' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3"><input type="checkbox" disabled /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-9 rounded-lg bg-muted shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-16 bg-muted rounded-full" /></td>
        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-24 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-16 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-20 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-6 w-24 bg-muted rounded ml-auto" /></td>
      </tr>
    ))}
  </>
);

// ─── ProductsPage ─────────────────────────────────────────────────────────────

const ProductsPage = () => {
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState([]);
  const [bulkVal,   setBulkVal]   = useState('');
  const [del,       setDel]       = useState({ open: false, item: null });

  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useProducts({ search: debouncedSearch, status, page, limit: 12 });
  const products = data?.products ?? [];
  const meta     = data?.meta     ?? {};

  const { mutate: deleteProduct, isPending: deleting }   = useDeleteProduct();
  const { mutate: duplicate,     isPending: duplicating } = useDuplicateProduct();
  const { mutate: bulkStatus,    isPending: bulkPending } = useBulkStatus();

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(prev => prev.length === products.length ? [] : products.map(p => p._id));

  const handleBulk = () => {
    if (!bulkVal || !selected.length) return;
    bulkStatus({ ids: selected, status: bulkVal }, {
      onSuccess: () => { setSelected([]); setBulkVal(''); },
    });
  };

  const handleDelete = () => {
    deleteProduct(del.item?._id, { onSuccess: () => setDel({ open: false, item: null }) });
  };

  const clearFilters = () => { setSearch(''); setStatus(''); setPage(1); };
  const hasFilters   = search || status;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-foreground text-xl">Produk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola paket wisata{meta.total ? ` · ${meta.total} produk` : ''}
          </p>
        </div>
        <Link to={ROUTES.ADMIN.PRODUCT_CREATE}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Tambah Produk
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari produk..."
                className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                  text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                  focus:ring-travia-orange focus:border-travia-orange transition-colors" />
            </div>

            {/* Status filter */}
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3 text-sm
                text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm
                  text-muted-foreground border border-border hover:bg-accent transition-colors">
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap px-3 py-2 bg-travia-orange/10
              border border-travia-orange/20 rounded-lg">
              <span className="text-sm font-medium text-travia-orange">
                {selected.length} dipilih
              </span>
              <select value={bulkVal} onChange={e => setBulkVal(e.target.value)}
                className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                  text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange">
                <option value="">Pilih aksi...</option>
                {BULK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={handleBulk} disabled={!bulkVal || bulkPending}
                className="h-8 px-3 rounded-lg text-sm font-medium bg-travia-orange text-white
                  disabled:opacity-50 hover:bg-travia-orange-h transition-colors">
                Terapkan
              </button>
              <button onClick={() => setSelected([])}
                className="h-8 px-3 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors">
                Batal pilih
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={products.length > 0 && selected.length === products.length}
                    onChange={toggleAll}
                    className="accent-travia-orange" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produk</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Harga</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Kuota</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Berangkat</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? <SkeletonRows /> : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <p className="text-sm text-muted-foreground">
                      {hasFilters ? 'Tidak ada produk yang cocok dengan filter' : 'Belum ada produk'}
                    </p>
                    {!hasFilters && (
                      <Link to={ROUTES.ADMIN.PRODUCT_CREATE}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-travia-orange hover:underline">
                        <Plus className="w-4 h-4" /> Buat produk pertama
                      </Link>
                    )}
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p._id} className={cn('hover:bg-accent/30 transition-colors', selected.includes(p._id) && 'bg-travia-orange/5')}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="accent-travia-orange" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name}
                          className="w-12 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-travia-orange/10 flex items-center
                          justify-center shrink-0 text-travia-orange/40 text-lg font-serif italic">T</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ProductStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-foreground hidden md:table-cell font-medium">
                    {formatIDR(p.price)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-foreground">{p.bookedSlots ?? 0}</span>
                    <span className="text-muted-foreground">/{p.quota}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-sm">
                    {formatDate(p.departureDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={ROUTES.ADMIN.PRODUCT_DETAIL(p._id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Detail">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link to={ROUTES.ADMIN.PRODUCT_EDIT(p._id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => duplicate(p._id)} disabled={duplicating}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Duplikasi">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDel({ open: true, item: p })}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
                        title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Halaman {meta.page} dari {meta.totalPages} · {meta.total} produk
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === meta.totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '...' ? (
                  <span key={`dot-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={cn('h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === n
                        ? 'bg-travia-orange text-white'
                        : 'border border-border text-muted-foreground hover:bg-accent'
                    )}>
                    {n}
                  </button>
                ))
              }
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={del.open}
        onClose={() => setDel({ open: false, item: null })}
        onConfirm={handleDelete}
        title={`Hapus produk "${del.item?.name}"?`}
        description="Thumbnail, galeri, dan data produk akan dihapus permanen. Wishlist dan keranjang yang berkaitan juga akan dibersihkan."
        isLoading={deleting}
      />
    </div>
  );
};

export default ProductsPage;
