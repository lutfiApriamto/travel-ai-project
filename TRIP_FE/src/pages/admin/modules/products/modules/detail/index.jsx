import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Copy, Trash2, Loader2,
  Calendar, MapPin, Users, Wallet, Eye, ShoppingBag,
  CheckCircle2, XCircle, Package, Clock,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useProduct, useDeleteProduct, useDuplicateProduct } from '../../api/useProducts.js';
import ProductStatusBadge from '../../components/ProductStatusBadge.jsx';
import DeleteConfirmDialog from '../../../../../../components/shared/admin/DeleteConfirmDialog.jsx';
import { useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
      <Icon className={cn('w-4 h-4', iconColor)} />
    </div>
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

// ─── ProductDetailPage ────────────────────────────────────────────────────────

const ProductDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [del, setDel] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: product, isLoading } = useProduct(id);
  const { mutate: deleteProduct, isPending: deleting }   = useDeleteProduct();
  const { mutate: duplicate,     isPending: duplicating } = useDuplicateProduct();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Produk tidak ditemukan</p>
        <Link to={ROUTES.ADMIN.PRODUCTS} className="mt-3 inline-flex items-center gap-1.5 text-sm text-travia-orange hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar
        </Link>
      </div>
    );
  }

  const allImages = [product.thumbnail, ...(product.gallery ?? [])].filter(Boolean);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.ADMIN.PRODUCTS)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
              text-muted-foreground hover:bg-accent transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-foreground text-xl leading-tight">{product.name}</h1>
              <ProductStatusBadge status={product.status} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => duplicate(id)} disabled={duplicating}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-border
              text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors">
            {duplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Duplikasi</span>
          </button>
          <Link to={ROUTES.ADMIN.PRODUCT_EDIT(id)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium
              bg-travia-orange hover:bg-travia-orange-h text-white transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <button onClick={() => setDel(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800
              text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Wallet}     label="Harga"      value={formatIDR(product.price)}
          iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-500" />
        <StatCard icon={Users}      label="Kuota"      value={`${product.bookedSlots ?? 0}/${product.quota}`}
          sub="terisi / total"
          iconBg="bg-blue-50 dark:bg-blue-950/30" iconColor="text-blue-500" />
        <StatCard icon={Eye}        label="Dilihat"    value={product.viewCount ?? 0}
          sub="total kunjungan"
          iconBg="bg-violet-50 dark:bg-violet-950/30" iconColor="text-violet-500" />
        <StatCard icon={ShoppingBag} label="Terjual"   value={product.soldCount ?? 0}
          sub="pesanan paid"
          iconBg="bg-orange-50 dark:bg-orange-950/30" iconColor="text-travia-orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image gallery */}
          {allImages.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <img src={allImages[imgIdx]} alt={product.name}
                className="w-full aspect-[16/9] object-cover" />
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {allImages.map((url, i) => (
                    <button key={url} onClick={() => setImgIdx(i)}
                      className={cn('w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-colors',
                        imgIdx === i ? 'border-travia-orange' : 'border-transparent'
                      )}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">Deskripsi</h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Itinerary */}
          {product.itinerary?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">
                Itinerary <span className="text-muted-foreground font-normal">({product.itinerary.length} hari)</span>
              </h3>
              <div className="space-y-3">
                {product.itinerary.map((day, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-travia-orange/10 flex items-center justify-center
                        text-xs font-bold text-travia-orange">
                        {i + 1}
                      </div>
                      {i < product.itinerary.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-[20px]" />
                      )}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{day.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{day.activities}</p>
                      {day.hotel && (
                        <p className="text-xs text-muted-foreground mt-1.5">🏨 {day.hotel}</p>
                      )}
                      {(day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner) && (
                        <div className="flex gap-3 mt-1.5">
                          {day.meals.breakfast && <span className="text-xs text-foreground">☀️ Sarapan</span>}
                          {day.meals.lunch     && <span className="text-xs text-foreground">🌤️ Makan Siang</span>}
                          {day.meals.dinner    && <span className="text-xs text-foreground">🌙 Makan Malam</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Includes / Excludes */}
          {(product.includes?.length > 0 || product.excludes?.length > 0) && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">Sudah Termasuk & Tidak Termasuk</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.includes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Termasuk</p>
                    <ul className="space-y-1.5">
                      {product.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.excludes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Tidak Termasuk</p>
                    <ul className="space-y-1.5">
                      {product.excludes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: sidebar info */}
        <div className="space-y-4">
          {/* Schedule */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Jadwal</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Berangkat</p>
                  <p className="font-medium text-foreground">{formatDate(product.departureDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Kembali</p>
                  <p className="font-medium text-foreground">{formatDate(product.returnDate)}</p>
                </div>
              </div>
              {product.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-foreground">{product.duration}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(product.departureCity || product.destinations?.length > 0 || product.meetingPoint) && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Lokasi</h3>
              <div className="space-y-2.5 text-sm">
                {product.departureCity && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Kota Asal</p>
                      <p className="text-foreground">{product.departureCity}</p>
                    </div>
                  </div>
                )}
                {product.destinations?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-travia-orange shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destinasi</p>
                      <p className="text-foreground">{product.destinations.join(', ')}</p>
                    </div>
                  </div>
                )}
                {product.meetingPoint && (
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Meeting Point</p>
                      <p className="text-foreground">{product.meetingPoint}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Classification */}
          {(product.categories?.length > 0 || product.types?.length > 0 || product.tags?.length > 0) && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Klasifikasi</h3>
              <div className="space-y-2">
                {product.categories?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Kategori</p>
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map(c => (
                        <span key={c._id ?? c} className="text-xs px-2 py-0.5 rounded-full bg-accent text-foreground">{c.name ?? c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.types?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tipe</p>
                    <div className="flex flex-wrap gap-1">
                      {product.types.map(t => (
                        <span key={t._id ?? t} className="text-xs px-2 py-0.5 rounded-full bg-accent text-foreground">{t.name ?? t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {product.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tag</p>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map(t => (
                        <span key={t._id ?? t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent text-foreground">
                          {t.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />}
                          {t.name ?? t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {product.addOns?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Add-On</h3>
              <div className="space-y-2">
                {product.addOns.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{a.name}</span>
                    <span className="font-medium text-travia-orange">{formatIDR(a.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Min participants */}
          {product.minParticipants && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Min. Peserta</p>
                  <p className="text-sm font-medium text-foreground">{product.minParticipants} orang</p>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
          {product.terms && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-2">Syarat & Ketentuan</h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.terms}</p>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={del}
        onClose={() => setDel(false)}
        onConfirm={() => deleteProduct(id, { onSuccess: () => navigate(ROUTES.ADMIN.PRODUCTS) })}
        title={`Hapus produk "${product.name}"?`}
        description="Thumbnail, galeri, dan semua data produk dihapus permanen."
        isLoading={deleting}
      />
    </div>
  );
};

export default ProductDetailPage;
