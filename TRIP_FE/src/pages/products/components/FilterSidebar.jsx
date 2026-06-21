import { X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn }          from '../../../lib/utils.js';
import PriceInput      from '../../../components/shared/PriceInput.jsx';

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="py-4 border-b border-border last:border-b-0">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {title}
    </p>
    {children}
  </div>
);

// ─── Radio-style single-select list ──────────────────────────────────────────

const RadioList = ({ items, value, onChange, allLabel = 'Semua' }) => (
  <div className="space-y-1.5">
    <button
      onClick={() => onChange('')}
      className={cn(
        'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
        !value
          ? 'bg-travia-orange/10 text-travia-orange font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <span className={cn(
        'w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center',
        !value ? 'border-travia-orange' : 'border-border',
      )}>
        {!value && <span className="w-1.5 h-1.5 rounded-full bg-travia-orange" />}
      </span>
      {allLabel}
    </button>

    {(items ?? []).map((item) => (
      <button
        key={item._id}
        onClick={() => onChange(value === item._id ? '' : item._id)}
        className={cn(
          'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
          value === item._id
            ? 'bg-travia-orange/10 text-travia-orange font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <span className={cn(
          'w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center',
          value === item._id ? 'border-travia-orange' : 'border-border',
        )}>
          {value === item._id && <span className="w-1.5 h-1.5 rounded-full bg-travia-orange" />}
        </span>
        <span className="truncate">{item.name}</span>
      </button>
    ))}
  </div>
);

// ─── Tag list (single-select with color) ─────────────────────────────────────

const TagList = ({ tags, value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    <button
      onClick={() => onChange('')}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
        !value
          ? 'bg-travia-orange text-white border-travia-orange'
          : 'border-border text-muted-foreground hover:border-travia-orange/50 hover:text-travia-orange',
      )}
    >
      Semua
    </button>
    {(tags ?? []).map((tag) => (
      <button
        key={tag._id}
        onClick={() => onChange(value === tag._id ? '' : tag._id)}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
          value === tag._id ? 'text-white border-transparent' : 'border-border',
        )}
        style={value === tag._id && tag.color
          ? { backgroundColor: tag.color }
          : tag.color
            ? { borderColor: `${tag.color}50`, color: tag.color }
            : {}}
      >
        {tag.name}
      </button>
    ))}
  </div>
);

// ─── Price range ──────────────────────────────────────────────────────────────

const PriceRange = ({ minPrice, maxPrice, onChange }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <PriceInput
        value={minPrice}
        onChange={(num) => onChange('minPrice', num ?? '')}
        placeholder="Min"
        className="w-full pr-2 h-8 rounded-lg border border-border bg-white dark:bg-travia-dark3
          text-sm text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
          transition-colors"
      />
      <PriceInput
        value={maxPrice}
        onChange={(num) => onChange('maxPrice', num ?? '')}
        placeholder="Maks"
        className="w-full pr-2 h-8 rounded-lg border border-border bg-white dark:bg-travia-dark3
          text-sm text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
          transition-colors"
      />
    </div>
  </div>
);

// ─── FilterSidebar Content ────────────────────────────────────────────────────

export const FilterContent = ({
  categories, types, tags,
  filters, onFilterChange, onReset,
  activeCount,
}) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between mb-1 shrink-0 px-1">
      <p className="font-semibold text-foreground text-sm">Filter</p>
      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-muted-foreground
            hover:text-travia-orange transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset ({activeCount})
        </button>
      )}
    </div>

    {/* Sections */}
    <div className="flex-1 overflow-y-auto mt-1">
      {/* Kategori */}
      <Section title="Kategori">
        {(!categories || categories.length === 0) ? (
          <p className="text-xs text-muted-foreground italic">Belum ada kategori</p>
        ) : (
          <RadioList
            items={categories}
            value={filters.category}
            onChange={(v) => onFilterChange('category', v)}
          />
        )}
      </Section>

      {/* Tipe Perjalanan */}
      <Section title="Tipe Perjalanan">
        {(!types || types.length === 0) ? (
          <p className="text-xs text-muted-foreground italic">Belum ada tipe</p>
        ) : (
          <RadioList
            items={types}
            value={filters.type}
            onChange={(v) => onFilterChange('type', v)}
          />
        )}
      </Section>

      {/* Tags */}
      <Section title="Tag">
        {(!tags || tags.length === 0) ? (
          <p className="text-xs text-muted-foreground italic">Belum ada tag</p>
        ) : (
          <TagList
            tags={tags}
            value={filters.tag}
            onChange={(v) => onFilterChange('tag', v)}
          />
        )}
      </Section>

      {/* Harga */}
      <Section title="Rentang Harga">
        <PriceRange
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={onFilterChange}
        />
      </Section>

      {/* Kota keberangkatan */}
      <Section title="Kota Keberangkatan">
        <input
          type="text"
          value={filters.departureCity}
          onChange={(e) => onFilterChange('departureCity', e.target.value)}
          placeholder="cth. Jakarta, Surabaya"
          className="w-full h-8 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3
            text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
            transition-colors"
        />
      </Section>

      {/* Destinasi */}
      <Section title="Destinasi">
        <input
          type="text"
          value={filters.destination}
          onChange={(e) => onFilterChange('destination', e.target.value)}
          placeholder="cth. Bali, Lombok"
          className="w-full h-8 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3
            text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
            transition-colors"
        />
      </Section>
    </div>
  </div>
);

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

export const FilterDrawer = ({ isOpen, onClose, ...props }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="fixed left-0 top-0 bottom-0 w-[300px] bg-card border-r border-border
            z-50 flex flex-col shadow-2xl lg:hidden"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
            <h3 className="font-semibold text-foreground">Filter Produk</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground
                hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <FilterContent {...props} />
          </div>
          <div className="px-4 py-3 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-travia-orange text-white text-sm font-semibold
                hover:bg-travia-orange/90 transition-colors"
            >
              Lihat Hasil
            </button>
          </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);
