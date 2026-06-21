import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Eye, QrCode, ChevronLeft, ChevronRight, X,
  CheckCircle2, XCircle, Ticket, Calendar,
} from 'lucide-react';
import { cn } from '../../../../lib/utils.js';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { ROUTES } from '../../../../utils/consts/routes.js';
import { useTickets } from './api/useTickets.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = v =>
  new Date(v).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// ─── Status badge ─────────────────────────────────────────────────────────────

const getStatus = (ticket) => {
  if (!ticket.isValid)  return { label: 'Tidak Valid',    cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',         dot: 'bg-red-500' };
  if (ticket.checkedIn) return { label: 'Sudah Check-in', cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',      dot: 'bg-blue-500' };
  return                       { label: 'Aktif',           cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
};

const StatusBadge = ({ ticket }) => {
  const s = getStatus(ticket);
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit', s.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {s.label}
    </span>
  );
};

// ─── Status filter options ────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: 'all',     label: 'Semua',          isValid: undefined,  checkedIn: undefined  },
  { key: 'valid',   label: 'Aktif',          isValid: 'true',     checkedIn: 'false'    },
  { key: 'used',    label: 'Sudah Check-in', isValid: undefined,  checkedIn: 'true'     },
  { key: 'invalid', label: 'Tidak Valid',    isValid: 'false',    checkedIn: undefined  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3"><div className="h-4 w-32 bg-muted rounded font-mono" /></td>
        <td className="px-4 py-3">
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3 w-36 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-24 bg-muted rounded-full" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-8 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-20 bg-muted rounded" /></td>
        <td className="px-4 py-3"><div className="h-7 w-7 bg-muted rounded-lg ml-auto" /></td>
      </tr>
    ))}
  </>
);

// ─── TicketsPage ──────────────────────────────────────────────────────────────

const TicketsPage = () => {
  const [search,      setSearch]      = useState('');
  const [statusKey,   setStatusKey]   = useState('all');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [page,        setPage]        = useState(1);

  const debouncedSearch = useDebounce(search);
  const activeFilter    = STATUS_FILTERS.find(f => f.key === statusKey) ?? STATUS_FILTERS[0];

  const { data, isLoading } = useTickets({
    search:    debouncedSearch,
    isValid:   activeFilter.isValid,
    checkedIn: activeFilter.checkedIn,
    startDate, endDate, page, limit: 15,
  });

  const tickets   = data?.tickets   ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPage = data?.totalPage ?? 1;

  const hasFilters = search || statusKey !== 'all' || startDate || endDate;
  const clearFilters = () => {
    setSearch(''); setStatusKey('all'); setStartDate(''); setEndDate(''); setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-foreground text-xl">Tiket</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola tiket wisata{totalData ? ` · ${totalData} tiket` : ''}
          </p>
        </div>
        <Link
          to={ROUTES.ADMIN.TICKET_CHECKIN}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" /> Proses Check-in
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Row 1: search + status tabs + reset */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari kode tiket / produk..."
                className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                  text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                  focus:ring-travia-orange focus:border-travia-orange transition-colors"
              />
            </div>

            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setStatusKey(f.key); setPage(1); }}
                  className={cn(
                    'px-3 py-2 font-medium whitespace-nowrap transition-colors',
                    statusKey === f.key
                      ? 'bg-travia-orange text-white'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border border-border
                  text-muted-foreground hover:bg-accent transition-colors">
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          {/* Row 2: Date range */}
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Dari</span>
            <input type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors" />
            <span className="text-xs text-muted-foreground">Sampai</span>
            <input type="date" value={endDate} min={startDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors" />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Hapus tanggal
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kode Tiket</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produk</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Pemegang</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Peserta</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Dibuat</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <SkeletonRows />
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Ticket className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {hasFilters ? 'Tidak ada tiket yang cocok dengan filter' : 'Belum ada tiket'}
                    </p>
                  </td>
                </tr>
              ) : tickets.map(ticket => (
                <tr key={ticket._id} className="hover:bg-accent/30 transition-colors">
                  {/* Kode */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-semibold text-foreground">{ticket.ticketCode}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">
                      <StatusBadge ticket={ticket} />
                    </p>
                  </td>

                  {/* Produk */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[180px]">
                      {ticket.productSnapshot?.name || ticket.productId?.name || '—'}
                    </p>
                    {ticket.productSnapshot?.departureDate && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(ticket.productSnapshot.departureDate)}
                      </p>
                    )}
                  </td>

                  {/* Pemegang */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium text-foreground">{ticket.userId?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{ticket.userId?.email ?? ''}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge ticket={ticket} />
                    {ticket.checkedIn && ticket.checkedInAt && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDateTime(ticket.checkedInAt)}
                      </p>
                    )}
                  </td>

                  {/* Peserta */}
                  <td className="px-4 py-3 text-foreground hidden lg:table-cell">
                    {ticket.participants ?? '—'}
                  </td>

                  {/* Dibuat */}
                  <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell text-xs">
                    {formatDate(ticket.createdAt)}
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-3">
                    <Link
                      to={ROUTES.ADMIN.TICKET_DETAIL(ticket._id)}
                      className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg
                        text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Lihat detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPage} · {totalData} tiket
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPage }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPage || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…' ? (
                  <span key={`d${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={cn('h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === n ? 'bg-travia-orange text-white' : 'border border-border text-muted-foreground hover:bg-accent',
                    )}>
                    {n}
                  </button>
                ))
              }
              <button onClick={() => setPage(p => Math.min(totalPage, p + 1))} disabled={page >= totalPage}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
