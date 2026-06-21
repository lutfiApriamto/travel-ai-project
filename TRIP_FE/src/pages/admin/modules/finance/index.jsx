import { useState }           from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Wallet, TrendingUp, TrendingDown, BarChart3,
  Calendar, Download, CreditCard, X,
  ChevronLeft, ChevronRight, ShoppingCart,
  RotateCcw, Banknote, ArrowUpRight, ArrowDownRight,
  AlertCircle, Loader2,
} from 'lucide-react';
import toast        from 'react-hot-toast';
import { cn }       from '../../../../lib/utils.js';
import PriceInput   from '../../../../components/shared/PriceInput.jsx';
import { useBalance, useTransactions, useWithdraw, downloadFinanceCsv } from './api/useFinance.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatDateTime = (v) =>
  new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CFG = {
  order:      { label: 'Order',      Icon: ShoppingCart, cls: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
  refund:     { label: 'Refund',     Icon: RotateCcw,    cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  withdrawal: { label: 'Withdrawal', Icon: Banknote,     cls: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
};

const TYPE_FILTERS = [
  { key: '',        label: 'Semua'       },
  { key: 'income',  label: 'Pemasukan'   },
  { key: 'outcome', label: 'Pengeluaran' },
];

const CAT_FILTERS = [
  { key: '',           label: 'Semua Kategori' },
  { key: 'order',      label: 'Order'          },
  { key: 'refund',     label: 'Refund'         },
  { key: 'withdrawal', label: 'Withdrawal'     },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, Icon, iconCls, accent, isLoading, sub }) => (
  <div className={cn(
    'bg-card border rounded-xl p-5 flex flex-col gap-3',
    accent ? 'border-travia-orange/30 bg-travia-orange/5' : 'border-border',
  )}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconCls)}>
        <Icon className="w-4 h-4" />
      </span>
    </div>
    {isLoading ? (
      <div className="h-7 w-32 bg-muted animate-pulse rounded" />
    ) : (
      <p className={cn(
        'text-2xl font-bold tracking-tight',
        accent ? 'text-travia-orange' : 'text-foreground',
      )}>
        {formatIDR(value)}
      </p>
    )}
    {sub && !isLoading && (
      <p className="text-[11px] text-muted-foreground leading-relaxed">{sub}</p>
    )}
  </div>
);

// ─── Period Card ──────────────────────────────────────────────────────────────

const PeriodCard = ({ label, value, trend, isLoading }) => {
  const positive = trend === 'up';
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <span className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        positive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                 : trend === 'down' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                 : 'bg-accent text-muted-foreground',
      )}>
        {trend === 'up'   ? <ArrowUpRight   className="w-4 h-4" /> :
         trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> :
                            <BarChart3      className="w-4 h-4" />}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="h-5 w-24 bg-muted animate-pulse rounded mt-1" />
        ) : (
          <p className={cn(
            'font-bold text-base',
            trend === 'up'   ? 'text-emerald-600 dark:text-emerald-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
                               'text-foreground',
          )}>
            {formatIDR(value)}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-48 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-20 bg-muted rounded-full" /></td>
        <td className="px-4 py-3"><div className="h-4 w-28 bg-muted rounded ml-auto" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-28 bg-muted rounded" /></td>
        <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 w-32 bg-muted rounded" /></td>
      </tr>
    ))}
  </>
);

// ─── Withdrawal Modal ─────────────────────────────────────────────────────────

const WithdrawModal = ({ isOpen, onClose, currentBalance, onSuccess }) => {
  const withdraw = useWithdraw();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { amount: '', description: '' },
  });

  const onSubmit = async ({ amount, description }) => {
    await withdraw.mutateAsync(
      { amount: Number(amount), description: description || undefined },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border
        animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center
              justify-center text-purple-600 dark:text-purple-400">
              <Banknote className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Tarik Saldo</h3>
              <p className="text-xs text-muted-foreground">Saldo tersedia: {formatIDR(currentBalance)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground
              hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nominal <span className="text-red-500">*</span>
            </label>
            <Controller
              name="amount"
              control={control}
              rules={{
                required: 'Nominal wajib diisi',
                min:      { value: 10000, message: 'Minimal penarikan Rp 10.000' },
                validate: (v) =>
                  Number(v) <= currentBalance || 'Nominal melebihi saldo tersedia',
              }}
              render={({ field: { value, onChange, onBlur } }) => (
                <PriceInput
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="10.000"
                  className={cn(
                    'w-full pr-4 h-10 rounded-lg border bg-white dark:bg-travia-dark3',
                    'text-sm placeholder:text-muted-foreground transition-colors',
                    'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange',
                    errors.amount ? 'border-red-400' : 'border-border',
                  )}
                />
              )}
            />
            {errors.amount && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.amount.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Keterangan <span className="text-muted-foreground font-normal">(opsional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={200}
              placeholder="Penarikan saldo bulanan..."
              {...register('description', { maxLength: { value: 200, message: 'Maks. 200 karakter' } })}
              className={cn(
                'w-full px-3 py-2 rounded-lg border bg-white dark:bg-travia-dark3',
                'text-sm placeholder:text-muted-foreground resize-none transition-colors',
                'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange',
                errors.description ? 'border-red-400' : 'border-border',
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-medium
                text-muted-foreground hover:bg-accent transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={withdraw.isPending}
              className="flex-1 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white
                text-sm font-medium flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {withdraw.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                : <><Banknote className="w-4 h-4" /> Konfirmasi Tarik</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── FinancePage ──────────────────────────────────────────────────────────────

const FinancePage = () => {
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [page,        setPage]        = useState(1);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [isExporting,  setIsExporting]  = useState(false);

  const dateParams = { startDate: startDate || undefined, endDate: endDate || undefined };
  const hasPeriod  = !!(startDate || endDate);

  const { data: balance, isLoading: balanceLoading } = useBalance(dateParams);

  const { data: txData, isLoading: txLoading } = useTransactions({
    ...dateParams,
    type:     typeFilter  || undefined,
    category: catFilter   || undefined,
    page,
    limit: 15,
  });

  const transactions = txData?.transactions ?? [];
  const totalData    = txData?.totalData    ?? 0;
  const totalPage    = txData?.totalPage    ?? 1;

  const hasFilters = typeFilter || catFilter || startDate || endDate;
  const clearFilters = () => {
    setTypeFilter(''); setCatFilter('');
    setStartDate('');  setEndDate('');
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadFinanceCsv({
        type:      typeFilter  || undefined,
        category:  catFilter   || undefined,
        startDate: startDate   || undefined,
        endDate:   endDate     || undefined,
      });
    } catch (e) {
      toast.error(e.message || 'Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-foreground text-xl">Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pantau arus kas dan riwayat transaksi platform</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
              border border-border text-muted-foreground hover:bg-accent hover:text-foreground
              disabled:opacity-60 transition-colors"
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
              bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Tarik Saldo
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-xs font-medium">Filter Periode</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Dari</span>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sampai</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="h-8 px-2 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors"
            />
          </div>
          {hasPeriod && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Hapus tanggal
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards — All-Time */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Ringkasan Keseluruhan
        </p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Saldo Saat Ini"
            value={balance?.currentBalance}
            Icon={Wallet}
            iconCls="bg-travia-orange/10 text-travia-orange"
            accent
            isLoading={balanceLoading}
            sub="Total saldo aktif platform"
          />
          <KpiCard
            label="Total Pemasukan"
            value={balance?.allTime?.totalIncome}
            Icon={TrendingUp}
            iconCls="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
            isLoading={balanceLoading}
            sub="Dari semua order yang dibayar"
          />
          <KpiCard
            label="Total Pengeluaran"
            value={balance?.allTime?.totalOutcome}
            Icon={TrendingDown}
            iconCls="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
            isLoading={balanceLoading}
            sub="Refund + withdrawal"
          />
          <KpiCard
            label="Net Profit"
            value={balance?.allTime?.net}
            Icon={BarChart3}
            iconCls="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            isLoading={balanceLoading}
            sub="Pemasukan dikurangi pengeluaran"
          />
        </div>
      </div>

      {/* Period Summary (conditional) */}
      {hasPeriod && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ringkasan Periode
            {startDate && endDate && (
              <span className="font-normal normal-case ml-1">
                ({new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' – '}
                {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PeriodCard label="Pemasukan Periode" value={balance?.period?.income} trend="up"   isLoading={balanceLoading} />
            <PeriodCard label="Pengeluaran Periode" value={balance?.period?.outcome} trend="down" isLoading={balanceLoading} />
            <PeriodCard
              label="Net Periode"
              value={balance?.period?.net}
              trend={balance?.period?.net > 0 ? 'up' : balance?.period?.net < 0 ? 'down' : 'neutral'}
              isLoading={balanceLoading}
            />
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
          {/* Type pills */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => { setTypeFilter(f.key); setPage(1); }}
                className={cn(
                  'px-3 py-2 font-medium whitespace-nowrap transition-colors',
                  typeFilter === f.key
                    ? 'bg-travia-orange text-white'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <select
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3
              text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors"
          >
            {CAT_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border border-border
                text-muted-foreground hover:bg-accent transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5" /> Reset Filter
            </button>
          )}

          <p className="text-xs text-muted-foreground ml-auto">
            {txLoading ? '—' : `${totalData} transaksi`}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Deskripsi</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Tipe</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Nominal</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell text-right">Saldo Setelah</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {txLoading ? (
                <SkeletonRows />
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {hasFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada riwayat transaksi'}
                    </p>
                  </td>
                </tr>
              ) : transactions.map(tx => {
                const cat  = CATEGORY_CFG[tx.category] ?? CATEGORY_CFG.order;
                const isIn = tx.type === 'income';

                return (
                  <tr key={tx._id} className="hover:bg-accent/30 transition-colors">
                    {/* Kategori */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full',
                        cat.cls,
                      )}>
                        <cat.Icon className="w-3 h-3" />
                        {cat.label}
                      </span>
                    </td>

                    {/* Deskripsi */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-foreground truncate max-w-xs">{tx.description}</p>
                      {tx.processedBy && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          oleh {tx.processedBy.name}
                        </p>
                      )}
                    </td>

                    {/* Tipe */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-semibold',
                        isIn
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400',
                      )}>
                        {isIn
                          ? <ArrowUpRight className="w-3 h-3" />
                          : <ArrowDownRight className="w-3 h-3" />}
                        {isIn ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="px-4 py-3 text-right">
                      <p className={cn(
                        'font-bold',
                        isIn
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400',
                      )}>
                        {isIn ? '+' : '−'}{formatIDR(tx.amount)}
                      </p>
                      {/* mobile: show desc */}
                      <p className="text-[10px] text-muted-foreground mt-0.5 md:hidden truncate max-w-[160px]">
                        {tx.description}
                      </p>
                    </td>

                    {/* Saldo setelah */}
                    <td className="px-4 py-3 hidden lg:table-cell text-right">
                      <p className="font-medium text-foreground">{formatIDR(tx.balanceAfter)}</p>
                    </td>

                    {/* Waktu */}
                    <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                      {formatDateTime(tx.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPage} · {totalData} transaksi
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
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
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === n
                        ? 'bg-travia-orange text-white'
                        : 'border border-border text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {n}
                  </button>
                ))
              }

              <button
                onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                disabled={page >= totalPage}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border
                  text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        currentBalance={balance?.currentBalance ?? 0}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default FinancePage;
