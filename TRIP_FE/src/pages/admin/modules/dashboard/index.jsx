import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../../../lib/utils.js';
import { useAuthStore } from '../../../../stores/useAuthStore.js';
import { useDashboard } from './api/useDashboard.js';
import StatCards    from './components/StatCards.jsx';
import TrendChart   from './components/TrendChart.jsx';
import RecentOrders from './components/RecentOrders.jsx';
import RecentUsers  from './components/RecentUsers.jsx';
import TopProducts  from './components/TopProducts.jsx';
import TraviaName   from '../../../../components/shared/TraviaName.jsx';

const DashboardPage = () => {
  const [days, setDays] = useState(30);
  const { user }        = useAuthStore();

  const { data, isLoading, isError, refetch, isFetching } = useDashboard(days);

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="font-serif italic font-bold text-foreground leading-tight"
            style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}
          >
            Selamat datang, {user?.name?.split(' ')[0] ?? <span className="text-travia-orange">Adnin</span>} 
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan aktivitas{' '}
            <TraviaName className="font-medium text-foreground" />
            {' · '}
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh data"
          className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium
            border border-border text-muted-foreground
            hover:text-foreground hover:bg-accent
            disabled:opacity-50 transition-colors shrink-0"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          <span className="hidden sm:inline text-xs">Refresh</span>
        </button>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800
          rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Gagal memuat data dashboard. Pastikan backend berjalan dan coba{' '}
          <button
            onClick={() => refetch()}
            className="font-semibold underline hover:no-underline"
          >
            refresh
          </button>.
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <StatCards stats={data?.stats} isLoading={isLoading} />

      {/* ── Trend chart ─────────────────────────────────────────────────── */}
      <TrendChart
        trend={data?.trend}
        days={days}
        onDaysChange={setDays}
        isLoading={isLoading}
      />

      {/* ── Recent activity ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentOrders orders={data?.recentActivity?.orders} isLoading={isLoading} />
        <RecentUsers  users={data?.recentActivity?.users}   isLoading={isLoading} />
      </div>

      {/* ── Top products ────────────────────────────────────────────────── */}
      <TopProducts topProducts={data?.topProducts} isLoading={isLoading} />
    </div>
  );
};

export default DashboardPage;
