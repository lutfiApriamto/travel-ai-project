import { useEffect } from 'react';
import { Link }      from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  ArrowLeft, Plus, Trash2, Save, Info,
  ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { cn }                             from '../../../../../../lib/utils.js';
import { ROUTES }                         from '../../../../../../utils/consts/routes.js';
import { useRefundPolicy, useUpdatePolicy } from '../../api/useRefunds.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

// ─── Default rule template ────────────────────────────────────────────────────

const newRule = () => ({
  minDaysBeforeDeparture: 0,
  maxDaysBeforeDeparture: null,
  refundPercentage:       0,
  description:            '',
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-8 w-48 bg-muted rounded" />
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-3">
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Policy Preview ───────────────────────────────────────────────────────────

const PolicyPreview = ({ rules }) => {
  if (!rules || rules.length === 0) return null;

  const pct = (v) => {
    const n = Number(v);
    if (n === 100) return { cls: 'text-emerald-600 dark:text-emerald-400', label: '100%' };
    if (n >= 50)   return { cls: 'text-blue-600 dark:text-blue-400',       label: `${n}%` };
    if (n > 0)     return { cls: 'text-amber-600 dark:text-amber-400',     label: `${n}%` };
    return           { cls: 'text-red-600 dark:text-red-400',              label: '0%' };
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-travia-orange shrink-0" />
        <h3 className="font-semibold text-foreground text-sm">Preview Kebijakan</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background">
            <tr className="text-left">
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rentang Hari (sebelum keberangkatan)</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">% Refund</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.map((rule, i) => {
              const { cls, label } = pct(rule.refundPercentage);
              const minD = Number(rule.minDaysBeforeDeparture);
              const maxD = rule.maxDaysBeforeDeparture === null || rule.maxDaysBeforeDeparture === ''
                ? null
                : Number(rule.maxDaysBeforeDeparture);
              const range = maxD === null
                ? `H-${minD} atau lebih`
                : minD === maxD
                  ? `Tepat H-${minD}`
                  : `H-${minD} hingga H-${maxD}`;

              return (
                <tr key={i} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{range}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn('font-bold text-base', cls)}>{label}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {rule.description || <span className="text-border italic">Belum diisi</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── RefundPolicyPage ─────────────────────────────────────────────────────────

const RefundPolicyPage = () => {
  const { data: policy, isLoading } = useRefundPolicy();
  const updatePolicy = useUpdatePolicy();

  const { control, handleSubmit, reset, watch, formState: { isDirty, errors } } = useForm({
    defaultValues: { rules: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'rules' });
  const watchedRules = watch('rules');

  // Populate form when data loads
  useEffect(() => {
    if (policy?.rules) {
      reset({ rules: policy.rules.map(r => ({ ...r })) });
    }
  }, [policy, reset]);

  const onSubmit = ({ rules }) => {
    const parsed = rules.map(r => ({
      minDaysBeforeDeparture: Number(r.minDaysBeforeDeparture),
      maxDaysBeforeDeparture: r.maxDaysBeforeDeparture === '' || r.maxDaysBeforeDeparture === null
        ? null
        : Number(r.maxDaysBeforeDeparture),
      refundPercentage: Number(r.refundPercentage),
      description:      r.description,
    }));
    updatePolicy.mutate(parsed);
  };

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to={ROUTES.ADMIN.REFUNDS}
          className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg border border-border
            text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-foreground text-xl">Kebijakan Refund</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Atur persentase refund berdasarkan rentang hari sebelum keberangkatan
          </p>
        </div>
        {policy?.updatedAt && (
          <p className="text-xs text-muted-foreground shrink-0 hidden sm:block mt-1">
            Diperbarui: {formatDate(policy.updatedAt)}
          </p>
        )}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-sm">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-medium">Cara kerja kebijakan ini</p>
          <p className="text-xs leading-relaxed">
            Ketika admin menyetujui refund, sistem menghitung selisih hari antara tanggal pengajuan
            dan tanggal keberangkatan produk, lalu mencocokkan dengan aturan di bawah.
            Aturan dievaluasi dari atas ke bawah — aturan pertama yang cocok yang digunakan.
            Biarkan <strong>Maks. Hari</strong> kosong jika aturan berlaku tanpa batas atas.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Rules editor */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Aturan Refund</h3>
            <button
              type="button"
              onClick={() => append(newRule())}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium
                border border-border text-muted-foreground hover:bg-accent hover:text-foreground
                transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Aturan
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada aturan. Tambahkan minimal satu aturan.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Column headers */}
              <div className="px-5 py-2 bg-background grid grid-cols-[1fr_1fr_120px_1fr_40px] gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Min. Hari</span>
                <span>Maks. Hari</span>
                <span>% Refund</span>
                <span>Deskripsi</span>
                <span />
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="px-5 py-3 grid grid-cols-[1fr_1fr_120px_1fr_40px] gap-3 items-start">
                  {/* Min Days */}
                  <div>
                    <Controller
                      control={control}
                      name={`rules.${index}.minDaysBeforeDeparture`}
                      rules={{ required: true, min: 0 }}
                      render={({ field: f }) => (
                        <input
                          {...f}
                          type="number"
                          min={0}
                          placeholder="0"
                          className={cn(
                            'w-full h-9 px-3 rounded-lg border bg-white dark:bg-travia-dark3',
                            'text-sm placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange',
                            'transition-colors',
                            errors.rules?.[index]?.minDaysBeforeDeparture
                              ? 'border-red-400'
                              : 'border-border',
                          )}
                        />
                      )}
                    />
                  </div>

                  {/* Max Days */}
                  <div>
                    <Controller
                      control={control}
                      name={`rules.${index}.maxDaysBeforeDeparture`}
                      render={({ field: f }) => (
                        <input
                          {...f}
                          value={f.value ?? ''}
                          onChange={e => f.onChange(e.target.value === '' ? null : e.target.value)}
                          type="number"
                          min={0}
                          placeholder="(kosong = tidak terbatas)"
                          className="w-full h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3
                            text-sm placeholder:text-muted-foreground text-[11px]
                            focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
                            transition-colors"
                        />
                      )}
                    />
                  </div>

                  {/* Percentage */}
                  <div>
                    <Controller
                      control={control}
                      name={`rules.${index}.refundPercentage`}
                      rules={{ required: true, min: 0, max: 100 }}
                      render={({ field: f }) => (
                        <div className="relative">
                          <input
                            {...f}
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            placeholder="0"
                            className={cn(
                              'w-full h-9 pl-3 pr-8 rounded-lg border bg-white dark:bg-travia-dark3',
                              'text-sm placeholder:text-muted-foreground',
                              'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange',
                              'transition-colors',
                              errors.rules?.[index]?.refundPercentage
                                ? 'border-red-400'
                                : 'border-border',
                            )}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                            %
                          </span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Controller
                      control={control}
                      name={`rules.${index}.description`}
                      rules={{ required: true, minLength: 1, maxLength: 200 }}
                      render={({ field: f }) => (
                        <input
                          {...f}
                          type="text"
                          maxLength={200}
                          placeholder="Deskripsi aturan ini..."
                          className={cn(
                            'w-full h-9 px-3 rounded-lg border bg-white dark:bg-travia-dark3',
                            'text-sm placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange',
                            'transition-colors',
                            errors.rules?.[index]?.description
                              ? 'border-red-400'
                              : 'border-border',
                          )}
                        />
                      )}
                    />
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-border
                      text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200
                      dark:hover:bg-red-950/30 dark:hover:border-red-800/50
                      disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Hapus aturan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-background/50">
            <p className="text-xs text-muted-foreground">
              {fields.length} aturan &middot; Urutan atas ke bawah menentukan prioritas
            </p>
            <button
              type="submit"
              disabled={updatePolicy.isPending || fields.length === 0}
              className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-medium
                bg-travia-orange text-white hover:bg-travia-orange/90
                disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {updatePolicy.isPending ? 'Menyimpan...' : 'Simpan Kebijakan'}
            </button>
          </div>
        </div>

        {/* Unsaved changes warning */}
        {isDirty && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Ada perubahan yang belum disimpan
          </div>
        )}
      </form>

      {/* Live preview */}
      <PolicyPreview rules={watchedRules} />
    </div>
  );
};

export default RefundPolicyPage;
