import { cn } from '../../../../../lib/utils.js';

const CONFIG = {
  draft:     { label: 'Draft',      cls: 'text-muted-foreground bg-muted' },
  active:    { label: 'Aktif',      cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' },
  full:      { label: 'Penuh',      cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400' },
  expired:   { label: 'Kedaluwarsa', cls: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400' },
  cancelled: { label: 'Dibatalkan', cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400' },
};

const ProductStatusBadge = ({ status, className }) => {
  const cfg = CONFIG[status] ?? CONFIG.draft;
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.cls, className)}>
      {cfg.label}
    </span>
  );
};

export default ProductStatusBadge;
