import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Eye, Image } from 'lucide-react';
import { ROUTES } from '../../../../../utils/consts/routes.js';

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonItem = () => (
  <div className="flex items-center gap-3 py-2.5 animate-pulse">
    <div className="w-5 text-center shrink-0">
      <div className="h-3 w-3 bg-muted rounded mx-auto" />
    </div>
    <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
    <div className="flex-1 space-y-1.5 min-w-0">
      <div className="h-3 w-36 bg-muted rounded" />
      <div className="h-3 w-20 bg-muted rounded" />
    </div>
    <div className="h-3 w-14 bg-muted rounded shrink-0" />
  </div>
);

// ─── ProductList ──────────────────────────────────────────────────────────────

const ProductList = ({ title, MetricIcon, products = [], countKey, countLabel, isLoading }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <MetricIcon className="w-4 h-4 text-travia-orange" />
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      <Link
        to={ROUTES.ADMIN.PRODUCTS}
        className="text-xs text-travia-orange hover:underline flex items-center gap-1"
      >
        Lihat semua <ArrowRight className="w-3 h-3" />
      </Link>
    </div>

    {isLoading ? (
      <div className="space-y-0.5">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)}
      </div>
    ) : products.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
    ) : (
      <div className="space-y-0.5">
        {products.map((product, i) => (
          <Link
            key={product._id}
            to={ROUTES.ADMIN.PRODUCT_DETAIL(product._id)}
            className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg
              hover:bg-accent/50 transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-center text-xs font-bold text-muted-foreground shrink-0">
              {i + 1}
            </span>

            {/* Thumbnail */}
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-travia-orange/10
                flex items-center justify-center shrink-0">
                <Image className="w-4 h-4 text-travia-orange/40" />
              </div>
            )}

            {/* Name + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              {product.departureDate && (
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(product.departureDate)}
                </p>
              )}
            </div>

            {/* Count */}
            <p className="text-xs font-semibold text-travia-orange shrink-0">
              {new Intl.NumberFormat('id-ID').format(product[countKey])}{' '}
              <span className="font-normal text-muted-foreground">{countLabel}</span>
            </p>
          </Link>
        ))}
      </div>
    )}
  </div>
);

// ─── TopProducts ──────────────────────────────────────────────────────────────

const TopProducts = ({ topProducts, isLoading }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <ProductList
      title="Produk Terlaris"
      MetricIcon={ShoppingBag}
      products={topProducts?.bySoldCount}
      countKey="soldCount"
      countLabel="terjual"
      isLoading={isLoading}
    />
    <ProductList
      title="Produk Terpopuler"
      MetricIcon={Eye}
      products={topProducts?.byViewCount}
      countKey="viewCount"
      countLabel="dilihat"
      isLoading={isLoading}
    />
  </div>
);

export default TopProducts;
