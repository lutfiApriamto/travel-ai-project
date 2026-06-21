import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence }                            from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Loader2 }        from 'lucide-react';
import { cn }                                                 from '../../../lib/utils.js';
import { useCategories, useTypes, useTags, useInfiniteProducts } from '../api/useHome.js';
import PriceInput                                              from '../../../components/shared/PriceInput.jsx';
import ProductCard, { ProductCardSkeleton }                   from './ProductCard.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

// ─── FilterPanel ──────────────────────────────────────────────────────────────

const FilterPanel = ({
  isOpen, onClose,
  types, tags,
  draft, setDraft,
  onApply, onReset,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px]
          bg-card border-l border-border z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground">Filter Produk</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground
              hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Tipe Perjalanan */}
          {types?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tipe Perjalanan
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDraft(d => ({ ...d, type: '' }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    !draft.type
                      ? 'bg-travia-orange text-white border-travia-orange'
                      : 'border-border text-muted-foreground hover:border-travia-orange hover:text-travia-orange',
                  )}
                >
                  Semua Tipe
                </button>
                {types.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setDraft(d => ({ ...d, type: d.type === t._id ? '' : t._id }))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      draft.type === t._id
                        ? 'bg-travia-orange text-white border-travia-orange'
                        : 'border-border text-muted-foreground hover:border-travia-orange hover:text-travia-orange',
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tag */}
          {tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tag
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDraft(d => ({ ...d, tag: '' }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    !draft.tag
                      ? 'bg-travia-orange text-white border-travia-orange'
                      : 'border-border text-muted-foreground hover:border-travia-orange hover:text-travia-orange',
                  )}
                >
                  Semua Tag
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag._id}
                    onClick={() => setDraft(d => ({ ...d, tag: d.tag === tag._id ? '' : tag._id }))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      draft.tag === tag._id
                        ? 'border-transparent text-white'
                        : 'border-border text-muted-foreground hover:opacity-80',
                    )}
                    style={draft.tag === tag._id && tag.color
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : tag.color
                        ? { borderColor: `${tag.color}60`, color: tag.color }
                        : {}}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rentang Harga */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Rentang Harga
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Harga Minimum</label>
                <PriceInput
                  value={draft.minPrice}
                  onChange={(num) => setDraft(d => ({ ...d, minPrice: num ?? '' }))}
                  placeholder="0"
                  className="w-full pr-3 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                    text-sm placeholder:text-muted-foreground text-foreground
                    focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
                    transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Harga Maksimum</label>
                <PriceInput
                  value={draft.maxPrice}
                  onChange={(num) => setDraft(d => ({ ...d, maxPrice: num ?? '' }))}
                  placeholder="Maks"
                  className="w-full pr-3 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                    text-sm placeholder:text-muted-foreground text-foreground
                    focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
                    transition-colors"
                />
              </div>
            </div>
            {(draft.minPrice || draft.maxPrice) && (
              <p className="text-[11px] text-muted-foreground mt-2">
                {draft.minPrice ? formatIDR(Number(draft.minPrice)) : 'Rp 0'} —{' '}
                {draft.maxPrice ? formatIDR(Number(draft.maxPrice)) : 'Tidak terbatas'}
              </p>
            )}
          </div>

          {/* Kota Keberangkatan */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Kota Keberangkatan
            </p>
            <input
              type="text"
              value={draft.departureCity}
              onChange={(e) => setDraft(d => ({ ...d, departureCity: e.target.value }))}
              placeholder="Contoh: Jakarta, Surabaya..."
              className="w-full h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground text-foreground
                focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
                transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          <button
            onClick={onReset}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
              text-muted-foreground hover:bg-accent transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className="flex-1 h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
              hover:bg-travia-orange/90 transition-colors"
          >
            Terapkan Filter
          </button>
        </div>
      </motion.aside>
    </>
  );
};

// ─── ProductSection ───────────────────────────────────────────────────────────

const EMPTY_FILTERS = {
  category:     '',
  type:         '',
  tag:          '',
  minPrice:     '',
  maxPrice:     '',
  departureCity: '',
};

const ProductSection = () => {
  // Applied filters (sent to API)
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Draft filters (in panel, not yet applied)
  const [draft,   setDraft]   = useState(EMPTY_FILTERS);
  // Panel open state
  const [panelOpen, setPanelOpen] = useState(false);

  const sentinelRef = useRef(null);

  const { data: categories } = useCategories();
  const { data: types }      = useTypes();
  const { data: tags }       = useTags();

  // Build query params from applied filters
  const queryFilters = useMemo(() => ({
    category:      filters.category      || undefined,
    type:          filters.type          || undefined,
    tag:           filters.tag           || undefined,
    minPrice:      filters.minPrice      || undefined,
    maxPrice:      filters.maxPrice      || undefined,
    departureCity: filters.departureCity || undefined,
  }), [filters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteProducts(queryFilters);

  const allProducts = useMemo(
    () => data?.pages.flatMap((p) => p.products) ?? [],
    [data],
  );
  const total = data?.pages[0]?.totalData ?? 0;

  // Active filter count (panel filters only, not category)
  const activePanelCount = useMemo(() => {
    let c = 0;
    if (filters.type)          c++;
    if (filters.tag)           c++;
    if (filters.minPrice)      c++;
    if (filters.maxPrice)      c++;
    if (filters.departureCity) c++;
    return c;
  }, [filters]);

  // IntersectionObserver — trigger next page load
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync draft when panel opens
  const openPanel = () => {
    setDraft(filters);
    setPanelOpen(true);
  };

  const applyFilter = () => {
    setFilters(draft);
    setPanelOpen(false);
  };

  const resetFilters = () => {
    const empty = { ...EMPTY_FILTERS, category: filters.category };
    setDraft(empty);
    setFilters(empty);
    setPanelOpen(false);
  };

  const setCategory = useCallback((catId) => {
    setFilters((f) => ({ ...f, category: catId }));
  }, []);

  return (
    <section>
      {/* Section heading */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-foreground">
            Jelajahi Perjalanan
          </h2>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {total} paket tersedia
            </p>
          )}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Category pills — horizontal scroll on mobile */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-1
            scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* "Semua" pill */}
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors shrink-0',
                !filters.category
                  ? 'bg-travia-orange text-white border-travia-orange'
                  : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
              )}
            >
              Semua
            </button>

            {/* Category pills from API */}
            {(categories ?? []).map((cat) => (
              <button
                key={cat._id}
                onClick={() => setCategory(filters.category === cat._id ? '' : cat._id)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors shrink-0',
                  filters.category === cat._id
                    ? 'bg-travia-orange text-white border-travia-orange'
                    : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter button */}
        <button
          onClick={openPanel}
          className={cn(
            'flex items-center gap-2 h-9 px-4 rounded-full border text-sm font-medium',
            'transition-colors shrink-0',
            activePanelCount > 0
              ? 'border-travia-orange text-travia-orange bg-travia-orange/8'
              : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activePanelCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-travia-orange text-white text-[10px] font-bold
              flex items-center justify-center -mr-1">
              {activePanelCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activePanelCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.type && (
            <FilterChip
              label={types?.find(t => t._id === filters.type)?.name ?? 'Tipe'}
              onRemove={() => setFilters(f => ({ ...f, type: '' }))}
            />
          )}
          {filters.tag && (
            <FilterChip
              label={tags?.find(t => t._id === filters.tag)?.name ?? 'Tag'}
              onRemove={() => setFilters(f => ({ ...f, tag: '' }))}
            />
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <FilterChip
              label={`${filters.minPrice ? formatIDR(Number(filters.minPrice)) : 'Rp 0'} – ${filters.maxPrice ? formatIDR(Number(filters.maxPrice)) : '∞'}`}
              onRemove={() => setFilters(f => ({ ...f, minPrice: '', maxPrice: '' }))}
            />
          )}
          {filters.departureCity && (
            <FilterChip
              label={`Dari ${filters.departureCity}`}
              onRemove={() => setFilters(f => ({ ...f, departureCity: '' }))}
            />
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-travia-orange transition-colors"
          >
            Hapus semua filter
          </button>
        </div>
      )}

      {/* ── Product Grid ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : allProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif italic text-2xl text-muted-foreground/40 mb-3">
            Tidak ditemukan
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Tidak ada produk yang sesuai dengan filter yang dipilih.
          </p>
          <button
            onClick={resetFilters}
            className="h-9 px-5 rounded-full bg-travia-orange text-white text-sm font-semibold
              hover:bg-travia-orange/90 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {allProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}

            {/* Skeleton cards saat fetch next page */}
            {isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`skel-${i}`} />
            ))}
          </div>

          {/* Sentinel — IntersectionObserver target */}
          <div ref={sentinelRef} className="h-1 mt-8" aria-hidden="true" />

          {/* End of list indicator */}
          {!hasNextPage && allProducts.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-6 pb-2">
              Semua paket sudah ditampilkan · {allProducts.length} paket
            </p>
          )}

          {/* Loading indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-5 h-5 animate-spin text-travia-orange" />
            </div>
          )}
        </>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {panelOpen && (
          <FilterPanel
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            types={types}
            tags={tags}
            draft={draft}
            setDraft={setDraft}
            onApply={applyFilter}
            onReset={resetFilters}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// ─── FilterChip ───────────────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full
    bg-travia-orange/10 border border-travia-orange/30 text-xs font-medium text-travia-orange">
    {label}
    <button onClick={onRemove} className="hover:bg-travia-orange/20 rounded-full p-0.5 transition-colors">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default ProductSection;
