import { Link }      from 'react-router-dom';
import { MapPin }    from 'lucide-react';
import { cn }        from '../../../lib/utils.js';
import { ROUTES }    from '../../../utils/consts/routes.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const ProductCardSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-2.5">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="flex gap-1.5 pt-1">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-14 bg-muted rounded-full" />
      </div>
      <div className="flex justify-between items-end pt-1">
        <div className="space-y-1">
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-5 w-24 bg-muted rounded" />
        </div>
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
  </div>
);

// ─── ProductCard ──────────────────────────────────────────────────────────────

const ProductCard = ({ product }) => {
  const slotsLeft   = (product.quota ?? 0) - (product.bookedSlots ?? 0);
  const isAlmostFull = slotsLeft > 0 && slotsLeft <= 5;
  const isFull       = slotsLeft <= 0;

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(product.slug)}
      className="group block focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-travia-orange focus-visible:ring-offset-2 rounded-2xl"
    >
      <article className="bg-card border border-border rounded-2xl overflow-hidden
        hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">

        {/* Thumbnail */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden shrink-0">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04]
                transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-travia-orange/8">
              <span className="font-serif italic text-5xl text-travia-orange/20">T</span>
            </div>
          )}

          {/* Status badge */}
          {isFull && (
            <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5
              rounded-full bg-red-500 text-white">
              Penuh
            </span>
          )}
          {isAlmostFull && !isFull && (
            <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5
              rounded-full bg-amber-500 text-white">
              Sisa {slotsLeft} slot
            </span>
          )}

          {/* Duration badge */}
          {product.duration && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5
              rounded-full bg-black/50 text-white backdrop-blur-sm">
              {product.duration}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Destination */}
          {product.destinations?.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {product.destinations.slice(0, 2).join(' · ')}
              </span>
            </div>
          )}

          {/* Name */}
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2
            group-hover:text-travia-orange transition-colors">
            {product.name}
          </p>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag._id ?? tag}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                  style={tag.color ? {
                    backgroundColor: `${tag.color}18`,
                    borderColor:     `${tag.color}40`,
                    color:           tag.color,
                  } : {}}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price + departure date */}
          <div className="flex items-end justify-between gap-2 pt-1 border-t border-border mt-1">
            <div>
              <p className="text-[10px] text-muted-foreground">Mulai dari</p>
              <p className="font-bold text-travia-orange text-base leading-tight">
                {formatIDR(product.price)}
              </p>
            </div>
            {product.departureDate && (
              <p className="text-[10px] text-muted-foreground text-right shrink-0">
                {formatDate(product.departureDate)}
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
