import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

const toDate = (value) => {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
};

// Contoh: "19 Jun 2026"
export const formatDate = (value, pattern = 'd MMM yyyy') => {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: id }) : '-';
};

// Contoh: "19 Jun 2026, 14:30"
export const formatDateTime = (value) => formatDate(value, 'd MMM yyyy, HH:mm');

// Contoh: "19 Jun – 23 Jun 2026"
export const formatDateRange = (start, end) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '-';
  return `${format(s, 'd MMM', { locale: id })} – ${format(e, 'd MMM yyyy', { locale: id })}`;
};

// Contoh: "Sabtu, 19 Juni 2026"
export const formatDateLong = (value) => formatDate(value, 'EEEE, d MMMM yyyy');
