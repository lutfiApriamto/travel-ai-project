import { useEffect }             from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { cn }                    from '../../lib/utils.js';
import { ROUTES }                from '../../utils/consts/routes.js';
import { useWishlistData, useRemoveFromWishlist } from './api/useWishlist.js';
import { useAddToCart }          from '../cart/api/useCart.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-2.5">
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="h-5 w-28 bg-muted rounded mt-3" />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ isFiltered }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
    <Heart className="w-12 h-12 text-muted-foreground/20 mb-4" />
    <p className="font-semibold text-foreground mb-1">
      {isFiltered ? 'Tidak ada produk yang sesuai' : 'Wishlist masih kosong'}
    </p>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
      {isFiltered
        ? 'Coba hapus kata kunci pencarian untuk melihat semua produk di wishlist.'
        : 'Temukan paket perjalanan impian dan tambahkan ke wishlist.'}
    </p>
    {!isFiltered && (
      <Link
        to={ROUTES.PRODUCTS}
        className="inline-flex items-center gap-2 h-10 px-6 rounded-full
          bg-travia-orange text-white text-sm font-semibold
          hover:bg-travia-orange/90 transition-colors"
      >
        <ShoppingBag className="w-4 h-4" />
        Jelajahi Produk
      </Link>
    )}
  </div>
);

// ─── WishlistCard ─────────────────────────────────────────────────────────────

const WishlistCard = ({ product }) => {
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart          = useAddToCart();

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWishlist.mutate(product._id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate({ productId: product._id, participants: 1, addOns: [] });
  };

  const isAvailable = product.status === 'active';

  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Thumbnail */}
      <Link to={ROUTES.PRODUCT_DETAIL(product.slug)} className="block">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04]
                transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif italic text-5xl text-travia-orange/20">T</span>
            </div>
          )}

          {/* Status overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full bg-black/50">
                Tidak Tersedia
              </span>
            </div>
          )}

          {/* Remove button — visible on hover */}
          <button
            onClick={handleRemove}
            disabled={removeFromWishlist.isPending}
            title="Hapus dari wishlist"
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full
              bg-red-500 text-white opacity-0 group-hover:opacity-100
              flex items-center justify-center transition-all duration-200
              hover:bg-red-600 disabled:opacity-60 shadow-md"
          >
            {removeFromWishlist.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category badges */}
        {product.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.categories.slice(0, 2).map((cat) => (
              <span
                key={cat._id ?? cat}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                  bg-travia-orange/10 text-travia-orange"
              >
                {cat.name ?? cat}
              </span>
            ))}
          </div>
        )}

        {/* Name */}
        <Link to={ROUTES.PRODUCT_DETAIL(product.slug)}>
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2
            hover:text-travia-orange transition-colors">
            {product.name}
          </p>
        </Link>

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag._id ?? tag}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                style={tag.color ? {
                  backgroundColor: `${tag.color}18`,
                  borderColor:     `${tag.color}40`,
                  color:           tag.color,
                } : {}}
              >
                {tag.name ?? tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between gap-2 pt-1
          border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Mulai dari</p>
            <p className="font-bold text-travia-orange">{formatIDR(product.price)}</p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!isAvailable || addToCart.isPending}
            title={isAvailable ? 'Tambah ke keranjang' : 'Produk tidak tersedia'}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold',
              'transition-colors shrink-0',
              isAvailable
                ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {addToCart.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ShoppingCart className="w-3.5 h-3.5" />}
            Pesan
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPage, onPageChange }) => {
  if (totalPage <= 1) return null;

  const pages = Array.from({ length: totalPage }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
          text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors text-sm">
        ‹
      </button>
      {pages.map((n, i) => n === '…' ? (
        <span key={`d${i}`} className="w-9 text-center text-sm text-muted-foreground">…</span>
      ) : (
        <button key={n} onClick={() => onPageChange(n)}
          className={cn(
            'h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
            page === n
              ? 'bg-travia-orange text-white'
              : 'border border-border text-muted-foreground hover:bg-accent',
          )}>
          {n}
        </button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPage}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
          text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors text-sm">
        ›
      </button>
    </div>
  );
};

// ─── WishlistPage ─────────────────────────────────────────────────────────────

const WishlistPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const page   = Math.max(1, Number(searchParams.get('page')) || 1);

  const { data, isLoading } = useWishlistData({ search, page, limit: 16 });

  const products  = data?.products  ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  const setPage = (p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
          Wishlist Saya
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            {totalData > 0
              ? `${totalData} produk tersimpan${search ? ` · hasil pencarian "${search}"` : ''}`
              : search
                ? `Tidak ada hasil untuk "${search}"`
                : 'Belum ada produk di wishlist'}
          </p>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState isFiltered={!!search} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <WishlistCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPage={totalPage} onPageChange={setPage} />
    </div>
  );
};

export default WishlistPage;
