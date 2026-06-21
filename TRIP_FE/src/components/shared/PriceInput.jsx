import { useState, useEffect, forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

// 10000 → "10.000"
export const formatRupiah = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(String(value).replace(/\D/g, ''));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

// "10.000" or "10000" → 10000, "" → undefined
export const parseRupiah = (str) => {
  if (str === '' || str === null || str === undefined) return undefined;
  const raw = String(str).replace(/\D/g, '');
  return raw ? parseInt(raw, 10) : undefined;
};

// ─── PriceInput ───────────────────────────────────────────────────────────────
//
// Penggunaan:
//   <PriceInput value={someNumber} onChange={(num) => setState(num)} />
//
// Dengan React Hook Form (Controller):
//   <Controller name="price" control={control} render={({ field: { value, onChange } }) => (
//     <PriceInput value={value} onChange={onChange} />
//   )} />
//
// Props:
//   value     — number | string | undefined  (angka murni atau string angka)
//   onChange  — (number | undefined) => void (selalu callback angka murni, bukan event)
//   className — class untuk elemen <input> (tanpa padding kiri, sudah diatur otomatis)
//   prefix    — default "Rp", bisa diubah (misal "" untuk tanpa prefix)
// ─────────────────────────────────────────────────────────────────────────────

const PriceInput = forwardRef(({
  value,
  onChange,
  onBlur,
  placeholder = '0',
  disabled   = false,
  className,
  prefix     = 'Rp',
  ...rest
}, ref) => {
  // State internal: tampilan terformat (mis. "10.000")
  const [display, setDisplay] = useState(() => formatRupiah(value));

  // Sinkronisasi jika value dari luar berubah (form reset, dll)
  useEffect(() => {
    setDisplay(formatRupiah(value));
  }, [value]); // eslint-disable-line

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // hapus semua non-digit

    if (raw === '') {
      setDisplay('');
      onChange?.(undefined);
      return;
    }

    const num = parseInt(raw, 10);
    setDisplay(new Intl.NumberFormat('id-ID').format(num));
    onChange?.(num); // kirim angka murni ke parent/RHF
  };

  const handleBlur = (e) => {
    onBlur?.(e);
  };

  const prefixWidth = prefix ? (prefix.length <= 2 ? 'pl-9' : 'pl-11') : '';

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm
          text-muted-foreground pointer-events-none select-none z-10">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ? formatRupiah(Number(placeholder.replace(/\D/g, ''))) || placeholder : '0'}
        disabled={disabled}
        className={cn(prefixWidth, className)}
        {...rest}
      />
    </div>
  );
});

PriceInput.displayName = 'PriceInput';
export default PriceInput;
