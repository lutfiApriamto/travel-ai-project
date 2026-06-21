import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '../../../../../lib/utils.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v);

const formatIDRCompact = v => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}jt`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
};

const formatXDate = (dateStr, days) => {
  const d = new Date(dateStr);
  if (days <= 30) return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
};

// ─── Config ───────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { label: '7H',    value: 7   },
  { label: '30H',   value: 30  },
  { label: '90H',   value: 90  },
  { label: '1 Thn', value: 365 },
];

const METRICS = [
  { key: 'revenue', label: 'Pendapatan' },
  { key: 'orders',  label: 'Pesanan'    },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">
        {new Date(label).toLocaleDateString('id-ID', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        })}
      </p>
      <p className="font-semibold text-foreground">
        {metric === 'revenue' ? formatIDR(val) : `${val} pesanan`}
      </p>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ChartSkeleton = () => (
  <div className="h-[220px] flex items-end gap-1 pb-4 animate-pulse">
    {Array.from({ length: 28 }).map((_, i) => (
      <div
        key={i}
        className="flex-1 bg-muted rounded-t"
        style={{ height: `${15 + ((i * 7 + 13) % 70)}%` }}
      />
    ))}
  </div>
);

// ─── TrendChart ───────────────────────────────────────────────────────────────

const TrendChart = ({ trend = [], days, onDaysChange, isLoading }) => {
  const [metric, setMetric] = useState('revenue');
  const isRevenue = metric === 'revenue';

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-foreground text-sm">
            Tren {isRevenue ? 'Pendapatan' : 'Pesanan'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{days} hari terakhir</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  metric === m.key
                    ? 'bg-travia-orange text-white'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Day selector */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {DAY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onDaysChange(opt.value)}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  days === opt.value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FF6B35" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={d => formatXDate(d, days)}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={isRevenue ? formatIDRCompact : v => v}
              width={isRevenue ? 58 : 28}
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} metric={metric} />}
              cursor={{ stroke: '#FF6B35', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#FF6B35"
              strokeWidth={2}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#FF6B35', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TrendChart;
