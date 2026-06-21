import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn }          from '../../../lib/utils.js';
import { ROUTES }      from '../../../utils/consts/routes.js';
import { useToggleWishlist, useAddToCart } from '../api/useProductDetail.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

// ─── Slot indicator ───────────────────────────────────────────────────────────

const SlotBar = ({ quota, bookedSlots }) => {
  const remaining = Math.max(0, (quota ?? 0) - (bookedSlots ?? 0));
  const pct       = quota > 0 ? Math.round((bookedSlots / quota) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{bookedSlots ?? 0} terbooking</span>
        <span className={cn(
          'font-medium',
          remaining === 0       ? 'text-red-500' :
          remaining <= 5        ? 'text-amber-500' :
                                  'text-emerald-600 dark:text-emerald-400',
        )}>
          {remaining === 0 ? 'Penuh' : `${remaining} slot tersisa`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct >= 100 ? 'bg-red-500' :
            pct >= 80  ? 'bg-amber-500' :
                         'bg-emerald-500',
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
};

// ─── BookingCard ──────────────────────────────────────────────────────────────

const BookingCard = ({
  product,
  isAuthenticated,
  isWishlisted = false,
  productId,
}) => {
  const navigate   = useNavigate();
  const [participants, setParticipants] = useState(
    product?.minParticipants ?? 1
  );
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [showAddOns, setShowAddOns]         = useState(false);

  const toggleWishlist = useToggleWishlist();
  const addToCart      = useAddToCart();

  const remaining = Math.max(0, (product?.quota ?? 0) - (product?.bookedSlots ?? 0));
  const isFull    = remaining === 0;
  const hasAddOns = Array.isArray(product?.addOns) && product.addOns.length > 0;

  // Total addOn price per person
  const addOnTotal = selectedAddOns.reduce((sum, name) => {
    const found = product?.addOns?.find((a) => a.name === name);
    return sum + (found?.price ?? 0);
  }, 0);

  const pricePerPerson  = (product?.price ?? 0) + addOnTotal;
  const totalPrice      = pricePerPerson * participants;

  const handleParticipants = (delta) => {
    setParticipants((p) => Math.max(product?.minParticipants ?? 1, Math.min(remaining, p + delta)));
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    toggleWishlist.mutate({ productId, isWishlisted });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!productId || isFull) return;
    addToCart.mutate({
      productId,
      participants,
      addOns: selectedAddOns.map((name) => ({ name })),
    });
  };

  const toggleAddOn = (name) => {
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
      {/* Price */}
      <div>
        <p className="text-xs text-muted-foreground">Harga per orang</p>
        <p className="text-2xl font-bold text-travia-orange">{formatIDR(product?.price)}</p>
        {addOnTotal > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            + {formatIDR(addOnTotal)} add-on
          </p>
        )}
      </div>

      {/* Slot bar */}
      <SlotBar quota={product?.quota} bookedSlots={product?.bookedSlots} />

      {/* Participants counter */}
      {!isFull && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Jumlah Peserta
            {product?.minParticipants && product.minParticipants > 1 && (
              <span className="font-normal normal-case ml-1">(min {product.minParticipants} orang)</span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleParticipants(-1)}
              disabled={participants <= (product?.minParticipants ?? 1)}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center
                text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold text-foreground">{participants}</span>
            <button
              onClick={() => handleParticipants(1)}
              disabled={participants >= remaining}
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center
                text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground ml-1">orang</span>
          </div>
        </div>
      )}

      {/* Add-ons */}
      {hasAddOns && !isFull && (
        <div>
          <button
            onClick={() => setShowAddOns((v) => !v)}
            className="flex items-center justify-between w-full text-xs font-semibold
              text-muted-foreground uppercase tracking-wide"
          >
            Layanan Tambahan (Opsional)
            {showAddOns
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showAddOns && (
            <div className="mt-2 space-y-2">
              {product.addOns.map((addOn) => (
                <label
                  key={addOn.name}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl
                    border border-border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(addOn.name)}
                      onChange={() => toggleAddOn(addOn.name)}
                      className="w-4 h-4 accent-travia-orange rounded"
                    />
                    <span className="text-sm text-foreground">{addOn.name}</span>
                  </div>
                  <span className="text-sm font-medium text-travia-orange shrink-0">
                    +{formatIDR(addOn.price)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Total price */}
      {!isFull && (
        <div className="border-t border-border pt-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-bold text-foreground text-lg">{formatIDR(totalPrice)}</span>
        </div>
      )}

      {/* CTA buttons */}
      <div className="space-y-2.5">
        <button
          onClick={handleAddToCart}
          disabled={isFull || addToCart.isPending}
          className={cn(
            'w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
            'transition-colors',
            isFull
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-travia-orange text-white hover:bg-travia-orange/90',
          )}
        >
          {addToCart.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menambahkan...</>
          ) : isFull ? (
            'Slot Penuh'
          ) : (
            <><ShoppingCart className="w-4 h-4" /> Pesan Sekarang</>
          )}
        </button>

        <button
          onClick={handleWishlist}
          disabled={toggleWishlist.isPending}
          className={cn(
            'w-full h-10 rounded-xl border font-medium text-sm flex items-center justify-center gap-2',
            'transition-colors',
            isWishlisted
              ? 'border-red-300 text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
              : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          {isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
