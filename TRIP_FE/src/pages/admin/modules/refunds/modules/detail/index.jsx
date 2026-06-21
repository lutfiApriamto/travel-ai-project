import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Clock,
  User, Mail, Phone, Package, ShoppingBag, Wallet,
  AlertTriangle, ExternalLink, Info,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils.js';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import {
  useRefund, useApproveRefund, useRejectRefund,
} from '../../api/useRefunds.js';
import DeleteConfirmDialog from '../../../../../../components/shared/admin/DeleteConfirmDialog.jsx';
import MasterDataModal from '../../../../../../components/shared/admin/MasterDataModal.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);

const formatDate = v =>
  new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const formatDateTime = v =>
  new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:  { label: 'Menunggu Review', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',      icon: Clock        },
  approved: { label: 'Disetujui',       cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Ditolak',         cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',             icon: XCircle      },
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, mono, className }) => (
  <div className={cn('flex items-start gap-3 py-2.5 border-b border-border last:border-0', className)}>
    <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-medium text-foreground mt-0.5 break-all', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  </div>
);

// ─── Reject modal ─────────────────────────────────────────────────────────────

const RejectModal = ({ isOpen, onClose, onReject, isLoading }) => {
  const [reason, setReason] = useState('');

  const handleClose = () => { setReason(''); onClose(); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) return;
    onReject(reason.trim());
  };

  const inputCls = cn(
    'w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground resize-none',
    'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors',
  );

  return (
    <MasterDataModal isOpen={isOpen} onClose={handleClose} title="Tolak Pengajuan Refund">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/20
          border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
            Penolakan akan mengirimkan email beserta alasan ke user. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Alasan Penolakan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Jelaskan alasan penolakan refund secara jelas..."
            rows={4}
            maxLength={500}
            className={inputCls}
          />
          <div className="flex items-center justify-between mt-1">
            {reason.length < 5 && reason.length > 0 && (
              <p className="text-xs text-red-500">Min 5 karakter</p>
            )}
            <p className={cn('text-[10px] text-muted-foreground ml-auto', reason.length > 480 && 'text-amber-500')}>
              {reason.length}/500
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={handleClose}
            className="h-9 px-4 rounded-lg text-sm font-medium border border-border
              text-muted-foreground hover:bg-accent transition-colors">
            Batal
          </button>
          <button
            type="submit"
            disabled={reason.trim().length < 5 || isLoading}
            className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2
              bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isLoading ? 'Memproses...' : 'Tolak Refund'}
          </button>
        </div>
      </form>
    </MasterDataModal>
  );
};

// ─── RefundDetailPage ─────────────────────────────────────────────────────────

const RefundDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen,  setRejectOpen]  = useState(false);

  const { data: refund, isLoading }             = useRefund(id);
  const { mutate: approve, isPending: approving } = useApproveRefund();
  const { mutate: reject,  isPending: rejecting } = useRejectRefund();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Pengajuan refund tidak ditemukan</p>
        <button onClick={() => navigate(ROUTES.ADMIN.REFUNDS)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-travia-orange hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>
      </div>
    );
  }

  const statusCfg  = STATUS_CFG[refund.status] ?? STATUS_CFG.pending;
  const StatusIcon = statusCfg.icon;
  const snap       = refund.orderId?.productSnapshot ?? {};
  const isPending  = refund.status === 'pending';

  const handleApprove = () =>
    approve(id, { onSuccess: () => setApproveOpen(false) });

  const handleReject = (reason) =>
    reject({ id, rejectionReason: reason }, { onSuccess: () => setRejectOpen(false) });

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.ADMIN.REFUNDS)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
              text-muted-foreground hover:bg-accent transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-bold text-foreground text-xl">Detail Refund</h1>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5', statusCfg.cls)}>
                <StatusIcon className="w-3 h-3 shrink-0" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Diajukan {formatDateTime(refund.createdAt)}
            </p>
          </div>
        </div>

        {/* Action buttons — hanya untuk pending */}
        {isPending && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setRejectOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
                border border-red-200 dark:border-red-800 text-red-500
                hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Tolak
            </button>
            <button
              onClick={() => setApproveOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
                bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Setujui
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Alasan refund */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Alasan Pengajuan</h3>
            <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
              {refund.reason}
            </p>
          </div>

          {/* Saran refund berdasarkan policy (only for pending) */}
          {isPending && refund.suggestedRefundAmount != null && (
            <div className={cn(
              'rounded-xl border p-5',
              refund.suggestedRefundAmount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
            )}>
              <div className="flex items-start gap-3">
                <Info className={cn('w-5 h-5 shrink-0 mt-0.5',
                  refund.suggestedRefundAmount > 0 ? 'text-emerald-500' : 'text-amber-500'
                )} />
                <div>
                  <p className={cn('font-semibold text-sm',
                    refund.suggestedRefundAmount > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  )}>
                    Saran Refund Berdasarkan Kebijakan Saat Ini
                  </p>
                  <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
                    Persentase: <span className="font-bold text-foreground">{refund.suggestedPercentage}%</span>
                    {' · '}
                    Jumlah: <span className="font-bold text-foreground">{formatIDR(refund.suggestedRefundAmount)}</span>
                  </p>
                  {refund.suggestedRefundAmount === 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Berdasarkan kebijakan H-, tidak ada pengembalian dana untuk jadwal keberangkatan ini.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hasil proses (approved) */}
          {refund.status === 'approved' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200
              dark:border-emerald-800 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm mb-3">
                Refund Disetujui
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Persentase</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {refund.refundPercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jumlah Dikembalikan</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(refund.refundAmount)}
                  </p>
                </div>
              </div>
              {refund.processedBy && (
                <p className="text-xs text-muted-foreground mt-3">
                  Diproses oleh <span className="font-medium text-foreground">{refund.processedBy.name}</span>
                  {refund.processedAt && <> · {formatDateTime(refund.processedAt)}</>}
                </p>
              )}
            </div>
          )}

          {/* Hasil proses (rejected) */}
          {refund.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200
              dark:border-red-800 rounded-xl p-5">
              <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm mb-2">
                Alasan Penolakan
              </h3>
              <p className="text-sm text-foreground leading-relaxed bg-white/60 dark:bg-red-950/20
                rounded-lg p-3">
                {refund.adminNote}
              </p>
              {refund.processedBy && (
                <p className="text-xs text-muted-foreground mt-3">
                  Ditolak oleh <span className="font-medium text-foreground">{refund.processedBy.name}</span>
                  {refund.processedAt && <> · {formatDateTime(refund.processedAt)}</>}
                </p>
              )}
            </div>
          )}

          {/* Info order */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-travia-orange" />
              <h3 className="font-semibold text-foreground text-sm">Informasi Order</h3>
            </div>
            {snap.thumbnail && (
              <img src={snap.thumbnail} alt={snap.name}
                className="w-full h-32 object-cover rounded-lg mb-4" />
            )}
            <p className="font-semibold text-foreground mb-3">
              {snap.name ?? refund.orderId?.productSnapshot?.name ?? '—'}
            </p>
            <div className="space-y-0">
              <InfoRow icon={Package}  label="Kode Order"   value={refund.orderId?.orderCode} mono />
              <InfoRow icon={Wallet}   label="Total Pesanan" value={formatIDR(refund.orderId?.totalPrice)} />
              {snap.departureDate && (
                <InfoRow icon={Package} label="Tanggal Berangkat" value={formatDate(snap.departureDate)} />
              )}
            </div>
            {refund.orderId?._id && (
              <Link
                to={ROUTES.ADMIN.ORDER_DETAIL(refund.orderId._id)}
                className="mt-4 flex items-center justify-center gap-1.5 h-8 w-full rounded-lg text-xs
                  font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Lihat Detail Order
              </Link>
            )}
          </div>
        </div>

        {/* ── Right (1/3) ── */}
        <div className="space-y-4">
          {/* Pemohon */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-travia-orange" />
              <h3 className="font-semibold text-foreground text-sm">Pemohon</h3>
            </div>
            <div>
              <InfoRow icon={User}  label="Nama"     value={refund.userId?.name} />
              <InfoRow icon={Mail}  label="Email"    value={refund.userId?.email} />
              <InfoRow icon={Phone} label="Telepon"  value={refund.userId?.phone} />
            </div>
            {refund.userId?._id && (
              <Link
                to={ROUTES.ADMIN.USER_DETAIL(refund.userId._id)}
                className="mt-4 flex items-center justify-center gap-1.5 h-8 w-full rounded-lg text-xs
                  font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Lihat Profil User
              </Link>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-travia-orange mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Refund Diajukan</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(refund.createdAt)}</p>
                </div>
              </div>

              {refund.processedAt && (
                <div className="flex items-start gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0',
                    refund.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                  )} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {refund.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(refund.processedAt)}</p>
                  </div>
                </div>
              )}

              {!refund.processedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  <p className="text-xs text-muted-foreground italic">Menunggu review admin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approve confirm */}
      <DeleteConfirmDialog
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
        isLoading={approving}
        title="Setujui refund ini?"
        description={`Jumlah refund akan dihitung otomatis berdasarkan kebijakan H- yang berlaku${
          refund.suggestedRefundAmount != null
            ? ` · Estimasi: ${formatIDR(refund.suggestedRefundAmount)} (${refund.suggestedPercentage}%)`
            : ''
        }. Email notifikasi akan terkirim ke user.`}
        confirmLabel="Ya, Setujui"
        loadingLabel="Memproses..."
        confirmCls="bg-emerald-500 hover:bg-emerald-600 text-white"
        iconCls="bg-emerald-50 dark:bg-emerald-950/30"
        iconColor="text-emerald-500"
      />

      {/* Reject modal */}
      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onReject={handleReject}
        isLoading={rejecting}
      />
    </div>
  );
};

export default RefundDetailPage;
