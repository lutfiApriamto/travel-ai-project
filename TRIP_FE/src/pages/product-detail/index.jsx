import { useState }                      from 'react';
import { useParams, Link, useNavigate }  from 'react-router-dom';
import { AnimatePresence, motion }       from 'framer-motion';
import {
  MapPin, Calendar, Clock, Users, Navigation,
  Check, X as XIcon, ChevronRight, Utensils,
  BedDouble, ShoppingCart, Heart, Loader2,
  Coffee, UtensilsCrossed, PackageSearch,
  CreditCard, ChevronUp, Minus, Plus, AlertTriangle,
} from 'lucide-react';
import { cn }                            from '../../lib/utils.js';
import { ROUTES }                        from '../../utils/consts/routes.js';
import { useAuthStore }                  from '../../stores/useAuthStore.js';
import {
  useProductDetail,
  useWishlistCheck,
  useToggleWishlist,
  useAddToCart,
}                                        from './api/useProductDetail.js';
import Gallery                           from './components/Gallery.jsx';
import BookingCard                       from './components/BookingCard.jsx';
import AuthRequiredModal                 from '../../components/shared/AuthRequiredModal.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : '—';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="aspect-[16/9] w-full rounded-2xl bg-muted" />
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-4">
        <div className="h-8 w-3/4 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
      <div className="h-72 bg-muted rounded-2xl" />
    </div>
  </div>
);

// ─── Not Found ────────────────────────────────────────────────────────────────

const NotFound = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center px-4">
    <PackageSearch className="w-14 h-14 text-muted-foreground/30 mb-5" />
    <h2 className="font-serif italic text-2xl text-foreground mb-2">
      Produk tidak ditemukan
    </h2>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
      Paket ini mungkin sudah tidak tersedia atau alamat URL tidak benar.
    </p>
    <Link
      to={ROUTES.PRODUCTS}
      className="inline-flex items-center gap-2 h-10 px-6 rounded-full
        bg-travia-orange text-white text-sm font-semibold
        hover:bg-travia-orange/90 transition-colors"
    >
      Lihat Semua Produk
    </Link>
  </div>
);

// ─── Key Info Bar ─────────────────────────────────────────────────────────────

const InfoBar = ({ product }) => {
  const items = [
    product.departureCity && {
      Icon: Navigation,
      label: 'Kota Asal',
      value: product.departureCity,
    },
    product.departureDate && {
      Icon: Calendar,
      label: 'Keberangkatan',
      value: formatDate(product.departureDate),
    },
    product.returnDate && {
      Icon: Calendar,
      label: 'Kepulangan',
      value: formatDate(product.returnDate),
    },
    product.duration && {
      Icon: Clock,
      label: 'Durasi',
      value: product.duration,
    },
    product.meetingPoint && {
      Icon: MapPin,
      label: 'Titik Kumpul',
      value: product.meetingPoint,
    },
    (product.quota != null) && {
      Icon: Users,
      label: 'Kapasitas',
      value: `${product.quota} peserta`,
    },
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(({ Icon, label, value }) => (
        <div
          key={label}
          className="flex items-start gap-3 p-3 rounded-xl bg-accent/50 border border-border"
        >
          <Icon className="w-4 h-4 text-travia-orange shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-foreground truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Itinerary ────────────────────────────────────────────────────────────────

const Itinerary = ({ items = [] }) => {
  const [expanded, setExpanded] = useState(null);

  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="font-serif italic text-xl text-foreground mb-4">Itinerary</h3>
      <div className="space-y-2">
        {items.map((day, i) => {
          const isOpen = expanded === i;
          const hasMeals = day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner;

          return (
            <div key={i} className="border border-border rounded-xl overflow-hidden bg-background">

              {/* Header — seluruhnya bisa diklik */}
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3.5 text-left
                  hover:bg-accent/50 transition-colors group"
              >
                {/* Day badge */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  'border-2 transition-colors duration-200',
                  isOpen
                    ? 'bg-travia-orange border-travia-orange text-white'
                    : 'bg-travia-orange/8 border-travia-orange/30 text-travia-orange',
                )}>
                  <span className="text-[11px] font-bold leading-none">H{day.day}</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Hari ke-{day.day}
                  </p>
                  <p className={cn(
                    'text-sm font-semibold leading-tight mt-0.5 transition-colors',
                    isOpen ? 'text-travia-orange' : 'text-foreground group-hover:text-travia-orange',
                  )}>
                    {day.title}
                  </p>
                </div>

                {/* Meal icons preview (visible tanpa harus expand) */}
                {hasMeals && (
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {day.meals?.breakfast && (
                      <Coffee className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                    {day.meals?.lunch && (
                      <Utensils className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                    {day.meals?.dinner && (
                      <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                  </div>
                )}

                {/* Chevron */}
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="shrink-0"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key={`day-${i}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="border-t border-border px-4 pt-4 pb-5 space-y-4">

                      {/* Activities */}
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {day.activities}
                      </p>

                      {/* Hotel */}
                      {day.hotel && (
                        <div className="flex items-center gap-2.5 text-sm bg-card
                          border border-border rounded-lg px-3 py-2.5">
                          <BedDouble className="w-4 h-4 text-travia-orange shrink-0" />
                          <span className="text-muted-foreground">
                            Menginap di:{' '}
                            <strong className="text-foreground font-medium">{day.hotel}</strong>
                          </span>
                        </div>
                      )}

                      {/* Meals — neutral pills, warna dari icon saja */}
                      {hasMeals && (
                        <div className="flex flex-wrap gap-2">
                          {day.meals?.breakfast && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium
                              px-3 py-1 rounded-full bg-card border border-border text-foreground">
                              <Coffee className="w-3.5 h-3.5 text-travia-orange" />
                              Sarapan
                            </span>
                          )}
                          {day.meals?.lunch && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium
                              px-3 py-1 rounded-full bg-card border border-border text-foreground">
                              <Utensils className="w-3.5 h-3.5 text-travia-orange" />
                              Makan Siang
                            </span>
                          )}
                          {day.meals?.dinner && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium
                              px-3 py-1 rounded-full bg-card border border-border text-foreground">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-travia-orange" />
                              Makan Malam
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ─── Includes / Excludes ──────────────────────────────────────────────────────

const IncludesExcludes = ({ includes = [], excludes = [] }) => {
  if (includes.length === 0 && excludes.length === 0) return null;

  return (
    <section>
      <h3 className="font-serif italic text-xl text-foreground mb-5">
        Sudah Termasuk & Tidak Termasuk
      </h3>
      <div className="space-y-5">
        {includes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Sudah Termasuk
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {includes.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5
                  rounded-full text-sm bg-card border border-border text-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {excludes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XIcon className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Tidak Termasuk
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {excludes.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5
                  rounded-full text-sm bg-card border border-border text-foreground">
                  <XIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Mobile sticky bottom bar ─────────────────────────────────────────────────

const MobileBottomBar = ({ product, isAuthenticated, isWishlisted, productId }) => {
  const navigate       = useNavigate();
  const toggleWishlist = useToggleWishlist();
  const addToCart      = useAddToCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOptions,   setShowOptions]   = useState(false);

  const remaining = Math.max(0, (product?.quota ?? 0) - (product?.bookedSlots ?? 0));
  const isFull    = remaining === 0;
  const minPax    = product?.minParticipants ?? 1;

  const [participants, setParticipants] = useState(minPax);

  const handleParticipants = (delta) => {
    setParticipants((p) => Math.max(minPax, Math.min(remaining, p + delta)));
  };

  const slotWarning = !isFull && participants >= remaining;

  const requireAuth = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return false; }
    return true;
  };

  const handleAddToCart = () => {
    setShowOptions(false);
    if (!requireAuth()) return;
    if (isFull || !productId) return;
    addToCart.mutate({ productId, participants, addOns: [] });
  };

  const handleCheckoutLangsung = () => {
    setShowOptions(false);
    if (!requireAuth()) return;
    if (isFull || !productId) return;

    navigate(ROUTES.CHECKOUT, {
      state: {
        express: {
          productId,
          productSnapshot: {
            name:          product?.name,
            price:         product?.price,
            departureDate: product?.departureDate,
            returnDate:    product?.returnDate,
            duration:      product?.duration,
            departureCity: product?.departureCity,
            destinations:  product?.destinations,
            meetingPoint:  product?.meetingPoint,
            thumbnail:     product?.thumbnail,
          },
          participants,
          addOns:     [],
          note:       null,
          totalPrice: (product?.price ?? 0) * participants,
        },
      },
    });
  };

  const handleOrderClick = () => {
    if (isFull) return;
    if (!requireAuth()) return;
    setShowOptions((v) => !v);
  };

  const handleWishlist = () => {
    if (!requireAuth()) return;
    toggleWishlist.mutate({ productId, isWishlisted });
  };

  return (
    <>
    <AuthRequiredModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onLogin={() => navigate(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(window.location.pathname)}`)}
    />
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden
      bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 safe-area-pb">
      <div className="relative flex items-center gap-3 max-w-lg mx-auto">
        {/* Price */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground">Mulai dari</p>
          <p className="font-bold text-travia-orange text-base leading-tight">
            {formatIDR(product?.price)}
          </p>
        </div>

        {/* Wishlist icon button */}
        <button
          onClick={handleWishlist}
          disabled={toggleWishlist.isPending}
          className={cn(
            'w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0',
            isWishlisted
              ? 'border-red-300 text-red-500 bg-red-50 dark:bg-red-950/30'
              : 'border-border text-muted-foreground hover:bg-accent',
          )}
        >
          <Heart className={cn(isWishlisted && 'fill-current')}
            style={{ width: 18, height: 18 }} />
        </button>

        {/* Order button — toggles drop-up options */}
        <button
          onClick={handleOrderClick}
          disabled={isFull}
          className={cn(
            'h-10 px-5 rounded-full font-semibold text-sm flex items-center gap-2',
            'transition-colors shrink-0',
            isFull
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-travia-orange text-white hover:bg-travia-orange/90',
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          {isFull ? 'Penuh' : 'Pesan'}
          {!isFull && (
            <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', !showOptions && 'rotate-180')} />
          )}
        </button>

        {/* Drop-up menu */}
        <AnimatePresence>
          {showOptions && !isFull && (
            <>
              {/* Invisible backdrop to close on outside tap */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOptions(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute z-50 right-0 bottom-full mb-3 w-72
                  bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Participant stepper */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">Jumlah Peserta</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {remaining} slot tersisa
                        {minPax > 1 && ` · min ${minPax} orang`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleParticipants(-1)}
                        disabled={participants <= minPax}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center
                          text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-foreground">
                        {participants}
                      </span>
                      <button
                        onClick={() => handleParticipants(1)}
                        disabled={participants >= remaining}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center
                          text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {slotWarning && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Sudah mencapai batas maksimum sisa slot</span>
                    </div>
                  )}
                </div>

                {/* Checkout langsung */}
                <button
                  onClick={handleCheckoutLangsung}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                    hover:bg-accent transition-colors border-b border-border"
                >
                  <span className="w-9 h-9 rounded-xl bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Checkout Langsung</p>
                    <p className="text-[11px] text-muted-foreground">Langsung ke pembayaran</p>
                  </div>
                </button>

                {/* Tambah ke keranjang */}
                <button
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                    hover:bg-accent transition-colors disabled:opacity-60"
                >
                  <span className="w-9 h-9 rounded-xl bg-accent text-foreground
                    flex items-center justify-center shrink-0">
                    {addToCart.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <ShoppingCart className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Masukkan ke Keranjang</p>
                    <p className="text-[11px] text-muted-foreground">Simpan untuk nanti</p>
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};

// ─── ProductDetailPage ────────────────────────────────────────────────────────

const ProductDetailPage = () => {
  const { slug }          = useParams();
  const { isAuthenticated } = useAuthStore();

  const { data: product, isLoading, isError } = useProductDetail(slug);

  // Wishlist check — hanya jika sudah login dan product ada
  const { data: wishlistData } = useWishlistCheck(product?._id, isAuthenticated);
  const isWishlisted            = wishlistData?.isWishlisted ?? false;

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Skeleton />
    </div>
  );

  if (isError || !product) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <NotFound />
    </div>
  );

  const hasDescription = !!product.description?.trim();
  const hasItinerary   = Array.isArray(product.itinerary) && product.itinerary.length > 0;
  const hasIncludes    = Array.isArray(product.includes)  && product.includes.length > 0;
  const hasExcludes    = Array.isArray(product.excludes)  && product.excludes.length > 0;
  const hasTags        = Array.isArray(product.tags)      && product.tags.length > 0;
  const hasTerms       = !!product.terms?.trim();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <Link to={ROUTES.HOME} className="hover:text-foreground transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={ROUTES.PRODUCTS} className="hover:text-foreground transition-colors">Produk</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Gallery */}
        <div className="mb-6 sm:mb-8">
          <Gallery thumbnail={product.thumbnail} gallery={product.gallery} />
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-8">

          {/* ── Left: All detail content ────────────────────────────────── */}
          <div className="space-y-8 min-w-0">

            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {(product.categories ?? []).map((cat) => (
                  <span key={cat._id ?? cat}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                      bg-travia-orange/10 text-travia-orange border border-travia-orange/20">
                    {cat.name ?? cat}
                  </span>
                ))}
                {(product.types ?? []).map((type) => (
                  <span key={type._id ?? type}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                      bg-accent text-muted-foreground border border-border">
                    {type.name ?? type}
                  </span>
                ))}
              </div>

              <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground leading-tight">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="text-muted-foreground mt-2 text-sm sm:text-base leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Tags */}
              {hasTags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {product.tags.map((tag) => (
                    <span
                      key={tag._id ?? tag}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
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

              {/* Destinations */}
              {product.destinations?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-travia-orange shrink-0" />
                  <span>{product.destinations.join(' · ')}</span>
                </div>
              )}
            </div>

            {/* Key info bar */}
            <InfoBar product={product} />

            {/* Description */}
            {hasDescription && (
              <section>
                <h3 className="font-serif italic text-xl text-foreground mb-3">Deskripsi</h3>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </section>
            )}

            {/* Itinerary */}
            {hasItinerary && <Itinerary items={product.itinerary} />}

            {/* Includes / Excludes */}
            {(hasIncludes || hasExcludes) && (
              <IncludesExcludes includes={product.includes} excludes={product.excludes} />
            )}

            {/* Add-ons info (mobile — full list for reference) */}
            {Array.isArray(product.addOns) && product.addOns.length > 0 && (
              <section className="lg:hidden">
                <h3 className="font-serif italic text-xl text-foreground mb-3">Layanan Tambahan</h3>
                <div className="space-y-2">
                  {product.addOns.map((addOn) => (
                    <div key={addOn.name}
                      className="flex justify-between items-center px-4 py-2.5
                        rounded-xl border border-border bg-accent/30">
                      <span className="text-sm text-foreground">{addOn.name}</span>
                      <span className="text-sm font-semibold text-travia-orange">
                        +{formatIDR(addOn.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Terms */}
            {hasTerms && (
              <section>
                <h3 className="font-serif italic text-xl text-foreground mb-3">
                  Syarat & Ketentuan
                </h3>
                <div className="text-sm text-muted-foreground leading-relaxed
                  whitespace-pre-line bg-accent/40 rounded-xl p-4 border border-border">
                  {product.terms}
                </div>
              </section>
            )}

          </div>

          {/* ── Right: Booking card (desktop only) ─────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BookingCard
                product={product}
                isAuthenticated={isAuthenticated}
                isWishlisted={isWishlisted}
                productId={product._id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <MobileBottomBar
        product={product}
        isAuthenticated={isAuthenticated}
        isWishlisted={isWishlisted}
        productId={product._id}
      />
    </>
  );
};

export default ProductDetailPage;
