import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams }                            from 'react-router-dom';
import { Search, SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { cn }                                         from '../../lib/utils.js';
import { useDebounce }                                from '../../hooks/useDebounce.js';
import { useCategories, useTypes, useTags }           from '../home/api/useHome.js';
import { useProducts }                                from './api/useProducts.js';
import ProductCard, { ProductCardSkeleton }           from '../home/components/ProductCard.jsx';
import { FilterContent, FilterDrawer }                from './components/FilterSidebar.jsx';

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPage, onChange }) => {
  if (totalPage <= 1) return null;

  const pages = Array.from({ length: totalPage }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-center gap-1 pt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
          text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors text-sm"
      >
        ‹
      </button>

      {pages.map((n, i) =>
        n === '…' ? (
          <span key={`dot-${i}`} className="w-9 text-center text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
              page === n
                ? 'bg-travia-orange text-white'
                : 'border border-border text-muted-foreground hover:bg-accent',
            )}
          >
            {n}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPage}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
          text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors text-sm"
      >
        ›
      </button>
    </div>
  );
};

// ─── Active filter chip ───────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full
    bg-travia-orange/10 border border-travia-orange/30 text-xs font-medium text-travia-orange
    shrink-0">
    {label}
    <button
      onClick={onRemove}
      className="w-4 h-4 rounded-full hover:bg-travia-orange/20 flex items-center
        justify-center transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters, onReset }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
    <PackageSearch className="w-12 h-12 text-muted-foreground/30 mb-4" />
    {hasFilters ? (
      <>
        <p className="font-semibold text-foreground mb-1">Tidak ada produk yang sesuai</p>
        <p className="text-sm text-muted-foreground mb-5">
          Coba ubah atau hapus filter yang sedang diterapkan.
        </p>
        <button
          onClick={onReset}
          className="h-9 px-5 rounded-full bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 transition-colors"
        >
          Hapus Semua Filter
        </button>
      </>
    ) : (
      <>
        <p className="font-semibold text-foreground mb-1">Belum ada produk tersedia</p>
        <p className="text-sm text-muted-foreground">
          Paket perjalanan akan segera hadir. Pantau terus!
        </p>
      </>
    )}
  </div>
);

// ─── ProductsPage ─────────────────────────────────────────────────────────────

const LIMIT = 12;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen]     = useState(false);

  // ── Read filters from URL ──────────────────────────────────────────────────
  const urlSearch      = searchParams.get('search')       || '';
  const urlCategory    = searchParams.get('category')     || '';
  const urlType        = searchParams.get('type')         || '';
  const urlTag         = searchParams.get('tag')          || '';
  const urlMinPrice    = searchParams.get('minPrice')     || '';
  const urlMaxPrice    = searchParams.get('maxPrice')     || '';
  const urlDeptCity    = searchParams.get('departureCity') || '';
  const urlDestination = searchParams.get('destination')  || '';
  const urlPage        = Math.max(1, Number(searchParams.get('page')) || 1);

  // ── Local search input (debounced before pushing to URL) ──────────────────
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const debouncedSearch               = useDebounce(localSearch, 400);

  // Sync local search if URL param changes externally (e.g. navbar navigate)
  useEffect(() => {
    setLocalSearch(searchParams.get('search') || '');
  }, [searchParams.get('search')]); // eslint-disable-line

  // Push debounced search to URL
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = searchParams.get('search') || '';
    if (trimmed === current) return; // no change
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set('search', trimmed);
        else next.delete('search');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch]); // eslint-disable-line

  // ── Filter change helper ───────────────────────────────────────────────────
  const setFilter = useCallback((key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const setPage = useCallback((p) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setLocalSearch('');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // ── Current filter state (for sidebar + chips) ─────────────────────────────
  const filters = useMemo(() => ({
    search:       urlSearch,
    category:     urlCategory,
    type:         urlType,
    tag:          urlTag,
    minPrice:     urlMinPrice,
    maxPrice:     urlMaxPrice,
    departureCity: urlDeptCity,
    destination:  urlDestination,
  }), [urlSearch, urlCategory, urlType, urlTag, urlMinPrice, urlMaxPrice, urlDeptCity, urlDestination]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: categories } = useCategories();
  const { data: types }      = useTypes();
  const { data: tags }       = useTags();

  const { data, isLoading, isFetching } = useProducts({
    ...filters,
    page:  urlPage,
    limit: LIMIT,
  });

  const products  = data?.products  ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  // ── Active filter count (excluding search) ─────────────────────────────────
  const activeFilterCount = useMemo(() => (
    [urlCategory, urlType, urlTag, urlMinPrice, urlMaxPrice, urlDeptCity, urlDestination]
      .filter(Boolean).length
  ), [urlCategory, urlType, urlTag, urlMinPrice, urlMaxPrice, urlDeptCity, urlDestination]);

  const hasFilters = !!(urlSearch || activeFilterCount);

  // ── Label lookup helpers ───────────────────────────────────────────────────
  const categoryName = categories?.find((c) => c._id === urlCategory)?.name;
  const typeName     = types?.find((t) => t._id === urlType)?.name;
  const tagName      = tags?.find((t) => t._id === urlTag)?.name;

  const formatPrice = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* ── Page heading ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
          {urlSearch ? `Hasil pencarian "${urlSearch}"` : 'Semua Produk'}
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            {totalData > 0
              ? `${totalData} paket perjalanan ditemukan`
              : hasFilters
                ? 'Tidak ada produk yang sesuai'
                : 'Belum ada produk tersedia'}
          </p>
        )}
      </div>

      {/* ── Search bar (full width) ──────────────────────────────────────────── */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Cari paket perjalanan, destinasi..."
          className="w-full h-11 pl-11 pr-11 rounded-full border border-border bg-card
            text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange
            transition-all shadow-sm"
        />
        {localSearch && (
          <button
            onClick={() => { setLocalSearch(''); setFilter('search', ''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground
              hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Active filter chips ──────────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {categoryName && (
            <FilterChip label={categoryName} onRemove={() => setFilter('category', '')} />
          )}
          {typeName && (
            <FilterChip label={typeName} onRemove={() => setFilter('type', '')} />
          )}
          {tagName && (
            <FilterChip label={tagName} onRemove={() => setFilter('tag', '')} />
          )}
          {(urlMinPrice || urlMaxPrice) && (
            <FilterChip
              label={`${urlMinPrice ? formatPrice(urlMinPrice) : 'Rp 0'} – ${urlMaxPrice ? formatPrice(urlMaxPrice) : '∞'}`}
              onRemove={() => { setFilter('minPrice', ''); setFilter('maxPrice', ''); }}
            />
          )}
          {urlDeptCity && (
            <FilterChip label={`Dari ${urlDeptCity}`} onRemove={() => setFilter('departureCity', '')} />
          )}
          {urlDestination && (
            <FilterChip label={`Destinasi: ${urlDestination}`} onRemove={() => setFilter('destination', '')} />
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-travia-orange transition-colors self-center"
          >
            Hapus semua
          </button>
        </div>
      )}

      {/* ── Main layout: Sidebar + Grid ────────────────────────────────────── */}
      <div className="flex gap-7">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
          <div className="sticky top-24 bg-card border border-border rounded-2xl p-4">
            <FilterContent
              categories={categories}
              types={types}
              tags={tags}
              filters={filters}
              onFilterChange={setFilter}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {/* Products area */}
        <div className="flex-1 min-w-0">

          {/* Mobile filter button + count */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <p className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${totalData} produk`}
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className={cn(
                'flex items-center gap-2 h-9 px-4 rounded-full border text-sm font-medium transition-colors',
                activeFilterCount > 0
                  ? 'border-travia-orange text-travia-orange bg-travia-orange/8'
                  : 'border-border text-muted-foreground hover:border-travia-orange/50',
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-travia-orange text-white text-[10px]
                  font-bold flex items-center justify-center -mr-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop result count */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? 'Memuat...'
                : `Menampilkan ${products.length} dari ${totalData} produk · Halaman ${urlPage} dari ${totalPage}`}
            </p>
            {isFetching && !isLoading && (
              <span className="text-xs text-muted-foreground animate-pulse">Memperbarui...</span>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
          ) : (
            <div className={cn(
              'grid gap-4 transition-opacity duration-200',
              isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
              'grid-cols-2 sm:grid-cols-3',
            )}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={urlPage}
            totalPage={totalPage}
            onChange={setPage}
          />
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        types={types}
        tags={tags}
        filters={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />
    </div>
  );
};

export default ProductsPage;
