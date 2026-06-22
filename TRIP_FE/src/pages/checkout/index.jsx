import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link }            from 'react-router-dom';
import {
  ShoppingCart, Check, AlertTriangle, ChevronRight,
  Loader2, MapPin, Calendar, Users, X,
  User, Mail, Package, CreditCard, Plus,
  IdCard, Hash, Clock3,
} from 'lucide-react';
import toast                        from 'react-hot-toast';
import { cn }                       from '../../lib/utils.js';
import { ROUTES }                   from '../../utils/consts/routes.js';
import { useAuthStore }             from '../../stores/useAuthStore.js';
import { useCartData }              from '../cart/api/useCart.js';
import { useCheckout, useExpressCheckout } from './api/useCheckout.js';
import { usePassengers }            from './api/usePassengers.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

const calcItemTotal = (item) => {
  const base   = item.product?.price ?? item.productSnapshot?.price ?? 0;
  const addOns = (item.addOns ?? []).reduce((s, a) => s + (a.price ?? 0), 0);
  return (base + addOns) * (item.participants ?? 1);
};

const emptyPassenger = () => ({ nik: '', name: '', age: '', email: '' });

// ─── Passenger Form ───────────────────────────────────────────────────────────

const PassengerForm = ({ index, value, onChange, savedPassengers }) => {
  const [nikError, setNikError] = useState('');

  const handleChange = (field, val) => {
    onChange(index, { ...value, [field]: val });
    if (field === 'nik') {
      if (val && !/^\d{0,16}$/.test(val)) return; // hanya angka, maks 16
      if (val.length > 0 && val.length !== 16) setNikError('NIK harus 16 digit');
      else setNikError('');
      onChange(index, { ...value, nik: val });
    }
  };

  const fillFromSaved = (p) => {
    onChange(index, { nik: p.nik, name: p.name, age: String(p.age), email: p.email });
    setNikError('');
  };

  const inputCls = cn(
    'w-full h-9 px-3 rounded-lg border text-sm text-foreground',
    'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
    'border-border',
  );

  return (
    <div className="bg-accent/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-travia-orange uppercase tracking-wide">
          Penumpang {index + 1}
        </span>
        {value.name && (
          <span className="text-xs text-muted-foreground">{value.name}</span>
        )}
      </div>

      {/* Quick fill dari saved passengers */}
      {savedPassengers.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5">Pilih dari tersimpan:</p>
          <div className="flex flex-wrap gap-1.5">
            {savedPassengers.slice(0, 5).map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => fillFromSaved(p)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium
                  border border-border bg-card hover:border-travia-orange hover:text-travia-orange
                  text-foreground transition-colors"
              >
                <User className="w-3 h-3" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* NIK */}
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            NIK <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={16}
              value={value.nik}
              onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, ''))}
              placeholder="16 digit NIK"
              className={cn(inputCls, 'pl-8', nikError && 'border-red-400')}
            />
          </div>
          {nikError && <p className="text-[10px] text-red-500 mt-0.5">{nikError}</p>}
          {value.nik.length > 0 && value.nik.length === 16 && !nikError && (
            <p className="text-[10px] text-emerald-500 mt-0.5">✓ NIK valid</p>
          )}
        </div>

        {/* Nama */}
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={value.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Sesuai KTP"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </div>

        {/* Umur */}
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Umur <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock3 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="number"
              min={1}
              max={120}
              value={value.age}
              onChange={(e) => handleChange('age', e.target.value)}
              placeholder="Tahun"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="email"
              value={value.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@contoh.com"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Passengers Section ───────────────────────────────────────────────────────

const PassengersSection = ({ productName, participants, productId, passengers, onPassengersChange, savedPassengers }) => (
  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-travia-orange/10 flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-travia-orange" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm leading-tight">Data Penumpang</p>
        <p className="text-[11px] text-muted-foreground">{productName} · {participants} peserta</p>
      </div>
    </div>

    <div className="space-y-3">
      {Array.from({ length: participants }).map((_, i) => (
        <PassengerForm
          key={i}
          index={i}
          value={passengers[i] ?? emptyPassenger()}
          onChange={(idx, val) => {
            const updated = [...passengers];
            updated[idx] = val;
            onPassengersChange(productId, updated);
          }}
          savedPassengers={savedPassengers}
        />
      ))}
    </div>

    <p className="text-[11px] text-muted-foreground">
      Data penumpang akan otomatis tersimpan untuk memudahkan pemesanan berikutnya.
    </p>
  </div>
);

// ─── Item Card (cart mode) ────────────────────────────────────────────────────

const CheckoutItem = ({ item, selected, onToggle, disabled }) => {
  const product = item.product ?? {};
  const total   = calcItemTotal(item);
  const isAvail = item.isAvailable;

  return (
    <div className={cn(
      'bg-card border rounded-2xl p-4 transition-all duration-200',
      !isAvail
        ? 'border-red-300 dark:border-red-800/50 opacity-60'
        : selected
          ? 'border-travia-orange/50 bg-travia-orange/5'
          : 'border-border hover:border-border/80',
    )}>
      <div className="flex gap-4">
        <div className="shrink-0 pt-1">
          <button
            onClick={() => isAvail && onToggle(item.productId.toString())}
            disabled={!isAvail || disabled}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
              !isAvail
                ? 'border-muted-foreground/30 cursor-not-allowed'
                : selected
                  ? 'bg-travia-orange border-travia-orange'
                  : 'border-border hover:border-travia-orange',
            )}
          >
            {selected && isAvail && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>
        </div>

        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif italic text-3xl text-travia-orange/20">T</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{product.name ?? '—'}</p>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {product.departureDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />{formatDate(product.departureDate)}
              </span>
            )}
            {product.departureCity && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{product.departureCity}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />{item.participants} peserta
            </span>
            {item.addOns?.length > 0 && (
              <span className="text-xs text-muted-foreground">
                + {item.addOns.map((a) => a.name).join(', ')}
              </span>
            )}
          </div>

          {item.note && (
            <p className="text-[11px] text-muted-foreground italic mt-1 line-clamp-1">"{item.note}"</p>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {formatIDR(product.price)} × {item.participants} orang{item.addOns?.length > 0 && ' + add-on'}
            </p>
            <p className="font-bold text-travia-orange text-sm">{formatIDR(total)}</p>
          </div>

          {!isAvail && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Tidak tersedia — tidak dapat di-checkout
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Order Summary ────────────────────────────────────────────────────────────

const OrderSummary = ({ selectedItems, onCheckout, isPending, isExpressMode, expressItem }) => {
  const items      = isExpressMode ? (expressItem ? [expressItem] : []) : selectedItems;
  const grandTotal = items.reduce((s, i) => s + calcItemTotal(i), 0);
  const canPay     = items.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 sticky top-24">
      <h3 className="font-semibold text-foreground">Ringkasan Pesanan</h3>

      {items.length > 0 ? (
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {items.map((item, i) => (
            <div key={item.productId ?? i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-travia-orange shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium truncate">
                  {item.product?.name ?? item.productSnapshot?.name ?? '—'}
                </p>
                <p className="text-[11px] text-muted-foreground">{item.participants} orang</p>
              </div>
              <p className="text-xs font-semibold text-foreground shrink-0">{formatIDR(calcItemTotal(item))}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">Belum ada item dipilih</p>
      )}

      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Total Pembayaran</span>
          <span className="font-bold text-travia-orange text-xl">{formatIDR(grandTotal)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={!canPay || isPending}
        className={cn(
          'w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
          'transition-colors',
          canPay ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
                 : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
          : <><CreditCard className="w-4 h-4" /> Buat Pesanan & Bayar</>}
      </button>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
        Kamu akan diarahkan ke halaman pembayaran setelah pesanan dibuat.
      </p>
    </div>
  );
};

// ─── Mobile Sticky Bar ────────────────────────────────────────────────────────

const MobileStickyBar = ({ selectedItems, onCheckout, isPending, isExpressMode, expressItem }) => {
  const items      = isExpressMode ? (expressItem ? [expressItem] : []) : selectedItems;
  const grandTotal = items.reduce((s, i) => s + calcItemTotal(i), 0);
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden
      bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <p className="text-[10px] text-muted-foreground">
            {items.length} item · Total
          </p>
          <p className="font-bold text-foreground text-base">{formatIDR(grandTotal)}</p>
        </div>
        <button
          onClick={onCheckout}
          disabled={isPending}
          className="h-10 px-6 rounded-full bg-travia-orange text-white text-sm font-semibold
            hover:bg-travia-orange/90 disabled:opacity-60 transition-colors
            flex items-center gap-2 shrink-0"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Buat Pesanan
        </button>
      </div>
    </div>
  );
};

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuthStore();

  // Deteksi mode: express (dari product detail) atau cart (normal)
  const expressData  = location.state?.express ?? null;
  const isExpressMode = !!expressData;

  const [selectedIds,    setSelectedIds]    = useState(new Set());
  const [passengersMap,  setPassengersMap]  = useState({}); // { [productId]: PassengerEntry[] }

  const checkoutMut = useCheckout();
  const expressMut  = useExpressCheckout();
  const { data: savedPassengers = [] } = usePassengers();

  const isPending = checkoutMut.isPending || expressMut.isPending;

  // ── Cart mode: data dari cart ───────────────────────────────────────────────
  const { data: cartData, isLoading: cartLoading } = useCartData(
    { limit: 50 },
    { enabled: !isExpressMode }
  );
  const cartItems    = cartData?.items ?? [];
  const availItems   = cartItems.filter((i) => i.isAvailable);
  const unavailItems = cartItems.filter((i) => !i.isAvailable);

  // Redirect ke cart jika kosong (cart mode only)
  useEffect(() => {
    if (!isExpressMode && !cartLoading && cartItems.length === 0) {
      navigate(ROUTES.CART, { replace: true });
    }
  }, [isExpressMode, cartLoading, cartItems.length, navigate]);

  // Init selectedIds untuk cart mode
  useEffect(() => {
    if (!isExpressMode && availItems.length > 0) {
      setSelectedIds(new Set(availItems.map((i) => i.productId.toString())));
    }
  }, [isExpressMode, availItems.length]); // eslint-disable-line

  // Init passenger forms saat items tersedia
  useEffect(() => {
    if (isExpressMode && expressData) {
      const pid = expressData.productId;
      setPassengersMap({
        [pid]: Array.from({ length: expressData.participants }, emptyPassenger),
      });
    }
  }, [isExpressMode]); // eslint-disable-line

  useEffect(() => {
    if (!isExpressMode && availItems.length > 0) {
      setPassengersMap((prev) => {
        const next = { ...prev };
        availItems.forEach((item) => {
          const pid = item.productId.toString();
          if (!next[pid] || next[pid].length !== item.participants) {
            next[pid] = Array.from({ length: item.participants }, emptyPassenger);
          }
        });
        return next;
      });
    }
  }, [isExpressMode, availItems.length]); // eslint-disable-line

  const toggleItem = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === availItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(availItems.map((i) => i.productId.toString())));
  };

  const selectedItems = useMemo(
    () => availItems.filter((i) => selectedIds.has(i.productId.toString())),
    [availItems, selectedIds]
  );

  const updatePassengers = useCallback((productId, passengers) => {
    setPassengersMap((prev) => ({ ...prev, [productId]: passengers }));
  }, []);

  // ── Validasi penumpang ─────────────────────────────────────────────────────

  const validatePassengers = (items) => {
    for (const item of items) {
      const pid        = item.productId?.toString() ?? item.productId;
      const pax        = passengersMap[pid] ?? [];
      const count      = item.participants;

      if (pax.length !== count) {
        toast.error(`Data penumpang untuk "${item.product?.name ?? item.productSnapshot?.name}" belum lengkap`);
        return false;
      }
      for (let i = 0; i < pax.length; i++) {
        const p = pax[i];
        if (!p.nik || !/^\d{16}$/.test(p.nik)) {
          toast.error(`NIK penumpang ${i + 1} harus 16 digit angka`);
          return false;
        }
        if (!p.name?.trim()) {
          toast.error(`Nama penumpang ${i + 1} wajib diisi`);
          return false;
        }
        if (!p.age || Number(p.age) < 1) {
          toast.error(`Umur penumpang ${i + 1} tidak valid`);
          return false;
        }
        if (!p.email?.includes('@')) {
          toast.error(`Email penumpang ${i + 1} tidak valid`);
          return false;
        }
      }
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (isExpressMode && expressData) {
      const pid  = expressData.productId;
      const item = { productId: pid, participants: expressData.participants, productSnapshot: expressData.productSnapshot };
      if (!validatePassengers([item])) return;

      const passengers = (passengersMap[pid] ?? []).map((p) => ({
        nik:   p.nik,
        name:  p.name,
        age:   Number(p.age),
        email: p.email.toLowerCase(),
      }));

      expressMut.mutate(
        {
          productId:    pid,
          addOns:       expressData.addOns ?? [],
          note:         expressData.note ?? null,
          passengers,
        },
        {
          onSuccess: (order) => {
            navigate(ROUTES.PAYMENT(order._id));
          },
        }
      );
    } else {
      // Cart mode
      if (selectedItems.length === 0) return;
      if (!validatePassengers(selectedItems)) return;

      const productIds  = [...selectedIds];
      const passengersOut = {};
      for (const item of selectedItems) {
        const pid = item.productId.toString();
        passengersOut[pid] = (passengersMap[pid] ?? []).map((p) => ({
          nik:   p.nik,
          name:  p.name,
          age:   Number(p.age),
          email: p.email.toLowerCase(),
        }));
      }

      checkoutMut.mutate(
        { productIds, passengersMap: passengersOut },
        {
          onSuccess: (orders) => {
            if (orders.length === 0) return;
            if (orders.length > 1) {
              toast.success(`${orders.length} pesanan berhasil dibuat! Lanjutkan pembayaran pertama.`, { duration: 4000 });
            }
            navigate(ROUTES.PAYMENT(orders[0]._id));
          },
        }
      );
    }
  };

  // ── Express item shape ─────────────────────────────────────────────────────

  const expressItem = isExpressMode && expressData
    ? {
        productId:       expressData.productId,
        productSnapshot: expressData.productSnapshot,
        product:         { name: expressData.productSnapshot?.name, price: expressData.productSnapshot?.price, ...expressData.productSnapshot },
        participants:    expressData.participants,
        addOns:          expressData.addOns ?? [],
        note:            expressData.note ?? null,
        isAvailable:     true,
      }
    : null;

  // ── Active passenger forms ────────────────────────────────────────────────
  // Cart mode: show form for selected items only
  const passengerFormItems = isExpressMode
    ? (expressItem ? [expressItem] : [])
    : selectedItems;

  // ── Loading (cart mode) ───────────────────────────────────────────────────
  if (!isExpressMode && cartLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
          </div>
          <div className="h-72 bg-muted rounded-2xl hidden lg:block" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <Link to={ROUTES.HOME} className="hover:text-foreground transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          {isExpressMode ? (
            <>
              <Link to={ROUTES.PRODUCTS} className="hover:text-foreground transition-colors">Produk</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <Link to={ROUTES.CART} className="hover:text-foreground transition-colors">Keranjang</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-foreground">Checkout</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground">
            {isExpressMode ? 'Checkout Langsung' : 'Checkout'}
          </h1>
          {isExpressMode && (
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full
              bg-travia-orange/10 text-travia-orange border border-travia-orange/20">
              Tanpa Keranjang
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">

            {/* Informasi Pemesan */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-3 text-sm">Informasi Pemesan</h2>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Nama</p>
                    <p className="text-sm font-medium text-foreground">{user?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-travia-orange/10 text-travia-orange
                    flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-foreground">{user?.email ?? '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Produk (cart mode: pilihan, express mode: fixed) */}
            {!isExpressMode && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground text-sm">Pilih Item untuk Checkout</h2>
                  {availItems.length > 1 && (
                    <button onClick={toggleAll} className="text-xs text-travia-orange hover:underline">
                      {selectedIds.size === availItems.length ? 'Batalkan semua' : 'Pilih semua'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {availItems.map((item) => (
                    <CheckoutItem
                      key={item.productId}
                      item={item}
                      selected={selectedIds.has(item.productId.toString())}
                      onToggle={toggleItem}
                      disabled={isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Produk express (info saja) */}
            {isExpressMode && expressItem && (
              <div className="bg-card border border-travia-orange/30 rounded-2xl p-4">
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                    {expressItem.productSnapshot?.thumbnail ? (
                      <img src={expressItem.productSnapshot.thumbnail}
                        alt={expressItem.productSnapshot?.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-serif italic text-2xl text-travia-orange/20">T</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-snug">
                      {expressItem.productSnapshot?.name}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      {expressItem.productSnapshot?.departureDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(expressItem.productSnapshot.departureDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {expressItem.participants} peserta
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="font-bold text-travia-orange">{formatIDR(calcItemTotal(expressItem))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unavailable items (cart mode) */}
            {!isExpressMode && unavailItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold text-sm text-muted-foreground">
                    Tidak Tersedia ({unavailItems.length} item)
                  </h2>
                </div>
                <div className="space-y-3">
                  {unavailItems.map((item) => (
                    <CheckoutItem key={item.productId} item={item} selected={false} onToggle={() => {}} disabled />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Item di atas tidak bisa di-checkout karena produk tidak aktif atau slot tidak mencukupi.
                  <Link to={ROUTES.CART} className="text-travia-orange hover:underline ml-1">Hapus dari keranjang</Link>
                </p>
              </div>
            )}

            {/* Multiple orders note */}
            {!isExpressMode && selectedItems.length > 1 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50
                dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs
                text-blue-700 dark:text-blue-300">
                <Package className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Memilih <strong>{selectedItems.length} item</strong> akan membuat {selectedItems.length} pesanan terpisah.
                </span>
              </div>
            )}

            {/* ── DATA PENUMPANG ──────────────────────────────────────────── */}
            {passengerFormItems.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-foreground">Data Penumpang</h2>
                {passengerFormItems.map((item) => {
                  const pid = item.productId?.toString() ?? item.productId;
                  return (
                    <PassengersSection
                      key={pid}
                      productName={item.product?.name ?? item.productSnapshot?.name ?? '—'}
                      participants={item.participants}
                      productId={pid}
                      passengers={passengersMap[pid] ?? []}
                      onPassengersChange={updatePassengers}
                      savedPassengers={savedPassengers}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: Order Summary (desktop) ──────────────────────────── */}
          <div className="hidden lg:block">
            <OrderSummary
              selectedItems={selectedItems}
              onCheckout={handleSubmit}
              isPending={isPending}
              isExpressMode={isExpressMode}
              expressItem={expressItem}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <MobileStickyBar
        selectedItems={selectedItems}
        onCheckout={handleSubmit}
        isPending={isPending}
        isExpressMode={isExpressMode}
        expressItem={expressItem}
      />
    </>
  );
};

export default CheckoutPage;
