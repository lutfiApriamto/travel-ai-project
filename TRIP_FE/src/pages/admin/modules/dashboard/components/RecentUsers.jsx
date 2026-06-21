import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../../../lib/utils.js';
import { ROUTES } from '../../../../../utils/consts/routes.js';

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3.5 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
    <div className="flex-1 space-y-2 min-w-0">
      <div className="h-3 w-28 bg-muted rounded" />
      <div className="h-3 w-40 bg-muted rounded" />
    </div>
    <div className="text-right shrink-0 space-y-1.5">
      <div className="h-4 w-12 bg-muted rounded-full" />
      <div className="h-3 w-16 bg-muted rounded" />
    </div>
  </div>
);

// ─── RecentUsers ──────────────────────────────────────────────────────────────

const RecentUsers = ({ users = [], isLoading }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-foreground text-sm">Pengguna Terbaru</h2>
      <Link
        to={ROUTES.ADMIN.USERS}
        className="text-xs text-travia-orange hover:underline flex items-center gap-1"
      >
        Lihat semua <ArrowRight className="w-3 h-3" />
      </Link>
    </div>

    {isLoading ? (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    ) : users.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-8">Belum ada pengguna</p>
    ) : (
      <div className="divide-y divide-border">
        {users.map(user => (
          <Link
            key={user._id}
            to={ROUTES.ADMIN.USER_DETAIL(user._id)}
            className="flex items-center gap-3 py-3.5 -mx-2 px-2 rounded-lg
              hover:bg-accent/50 transition-colors"
          >
            {/* Avatar */}
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-travia-orange/10
                flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-travia-orange">
                  {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Status + date */}
            <div className="text-right shrink-0">
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full block mb-1',
                user.isActive
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
              )}>
                {user.isActive ? 'Aktif' : 'Suspend'}
              </span>
              <p className="text-[10px] text-muted-foreground">{formatDate(user.createdAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);

export default RecentUsers;
