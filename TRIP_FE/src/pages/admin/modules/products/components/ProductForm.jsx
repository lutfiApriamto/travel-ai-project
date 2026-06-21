import { useState, useMemo, useEffect }  from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useBlocker } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, ImagePlus, X, GripVertical,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { cn }         from '../../../../../lib/utils.js';
import PriceInput from '../../../../../components/shared/PriceInput.jsx';
import UnsavedChangesModal from '../../../../../components/shared/admin/UnsavedChangesModal.jsx';
import api from '../../../../../lib/axios.js';
import { useUploadSingle, useUploadBulk, useDeleteImage } from '../api/useUpload.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = v =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

const toDateInput = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
};

const calcDuration = (dep, ret) => {
  if (!dep || !ret) return null;
  const days = Math.round((new Date(ret) - new Date(dep)) / 86_400_000);
  if (days <= 0) return null;
  return `${days} Hari ${Math.max(0, days - 1)} Malam`;
};

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
);

const textareaCls = cn(inputCls, 'h-auto py-2 resize-none');

const Field = ({ label, required, error, hint, children, className }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
    <h3 className="font-semibold text-foreground text-sm border-b border-border pb-3">{title}</h3>
    {children}
  </div>
);

// ─── Multi-select (checkboxes) ────────────────────────────────────────────────

const MultiCheckbox = ({ label, required, options = [], value = [], onChange, renderOption }) => (
  <Field label={label} required={required}>
    <div className="max-h-44 overflow-y-auto border border-border rounded-lg p-2 space-y-0.5 bg-white dark:bg-travia-dark3">
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Belum ada data</p>
      ) : options.map(opt => (
        <label key={opt._id}
          className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-md hover:bg-accent transition-colors">
          <input
            type="checkbox"
            checked={value.includes(opt._id)}
            onChange={e => {
              if (e.target.checked) onChange([...value, opt._id]);
              else onChange(value.filter(v => v !== opt._id));
            }}
            className="accent-travia-orange w-3.5 h-3.5"
          />
          {renderOption ? renderOption(opt) : (
            <span className="text-sm text-foreground">{opt.name}</span>
          )}
        </label>
      ))}
    </div>
    {value.length > 0 && (
      <p className="text-xs text-muted-foreground mt-1">{value.length} dipilih</p>
    )}
  </Field>
);

// ─── String array input (destinations, includes, excludes) ───────────────────

const StringArrayInput = ({ label, value = [], onChange, placeholder, hint }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v) { onChange([...value, v]); setInput(''); }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button type="button" onClick={add}
          className="h-9 px-3 rounded-lg text-sm font-medium border border-border
            text-muted-foreground hover:bg-accent transition-colors shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 space-y-1">
          {value.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg group">
              <span className="flex-1 text-sm text-foreground">{item}</span>
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Field>
  );
};

// ─── Thumbnail uploader ───────────────────────────────────────────────────────

const ThumbnailUploader = ({ value, onChange }) => {
  const { mutate: upload, isPending } = useUploadSingle();
  const { mutate: deleteImg } = useDeleteImage();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upload({ file }, { onSuccess: (url) => onChange(url) });
    e.target.value = '';
  };

  const handleDelete = () => {
    if (value) deleteImg(value);
    onChange('');
  };

  return (
    <div>
      {value ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={value} alt="Thumbnail" className="w-full h-52 object-cover" />
          <button type="button" onClick={handleDelete}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 shadow-md
              flex items-center justify-center text-white hover:bg-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={cn(
          'flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed cursor-pointer',
          'border-border hover:border-travia-orange hover:bg-travia-orange/5 transition-colors',
        )}>
          {isPending ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Upload Thumbnail</p>
              <p className="text-xs text-muted-foreground mt-1">Klik untuk pilih gambar</p>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      )}
    </div>
  );
};

// ─── Gallery uploader ─────────────────────────────────────────────────────────

const GalleryUploader = ({ value = [], onChange }) => {
  const { mutate: uploadBulk, isPending } = useUploadBulk();
  const { mutate: deleteImg } = useDeleteImage();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    uploadBulk({ files }, { onSuccess: (urls) => onChange([...value, ...urls]) });
    e.target.value = '';
  };

  const handleDelete = (url, i) => {
    deleteImg(url);
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {value.map((url, i) => (
        <div key={url} className="relative aspect-square rounded-lg overflow-hidden">
          <img src={url} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" />
          <button type="button" onClick={() => handleDelete(url, i)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 shadow-sm
              flex items-center justify-center text-white hover:bg-red-600 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {value.length < 20 && (
        <label className="aspect-square rounded-lg border-2 border-dashed border-border cursor-pointer
          hover:border-travia-orange hover:bg-travia-orange/5 transition-colors
          flex flex-col items-center justify-center gap-1">
          {isPending
            ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            : <><Plus className="w-5 h-5 text-muted-foreground" />
               <span className="text-[10px] text-muted-foreground">Tambah</span></>
          }
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        </label>
      )}
    </div>
  );
};

// ─── Itinerary section ────────────────────────────────────────────────────────

const ItinerarySection = ({ control, register, errors }) => {
  const { fields, append, remove } = useFieldArray({ control, name: 'itinerary' });
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const addDay = () => {
    append({ day: fields.length + 1, title: '', activities: '', hotel: '', meals: { breakfast: false, lunch: false, dinner: false } });
    setExpanded(p => ({ ...p, [fields.length]: true }));
  };

  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={field.id} className="border border-border rounded-xl overflow-hidden">
          <div
            className="flex items-center gap-3 px-4 py-3 bg-background cursor-pointer"
            onClick={() => toggleExpand(i)}
          >
            <span className="w-8 h-8 rounded-lg bg-travia-orange/10 flex items-center justify-center
              text-xs font-bold text-travia-orange shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {field.title || `Hari ${i + 1}`}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={e => { e.stopPropagation(); remove(i); }}
                className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {expanded[i] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          {expanded[i] && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
              <Field label="Judul Hari" required error={errors?.itinerary?.[i]?.title?.message}>
                <input {...register(`itinerary.${i}.title`, { required: 'Judul wajib diisi' })}
                  placeholder={`Contoh: Tiba di Bali`} className={inputCls} />
              </Field>

              <Field label="Aktivitas" required error={errors?.itinerary?.[i]?.activities?.message}>
                <textarea {...register(`itinerary.${i}.activities`, { required: 'Aktivitas wajib diisi' })}
                  placeholder="Deskripsi kegiatan hari ini..." rows={3} className={textareaCls} />
              </Field>

              <Field label="Hotel (opsional)">
                <input {...register(`itinerary.${i}.hotel`)}
                  placeholder="Nama hotel" className={inputCls} />
              </Field>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Konsumsi</label>
                <div className="flex gap-5">
                  {[
                    { key: 'breakfast', label: 'Sarapan' },
                    { key: 'lunch',     label: 'Makan Siang' },
                    { key: 'dinner',    label: 'Makan Malam' },
                  ].map(m => (
                    <label key={m.key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        {...register(`itinerary.${i}.meals.${m.key}`)}
                        className="accent-travia-orange" />
                      <span className="text-sm text-foreground">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={addDay}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed
          border-border text-sm font-medium text-muted-foreground
          hover:border-travia-orange hover:text-travia-orange hover:bg-travia-orange/5 transition-colors">
        <Plus className="w-4 h-4" /> Tambah Hari
      </button>
    </div>
  );
};

// ─── AddOns section ───────────────────────────────────────────────────────────

const AddOnsSection = ({ control, register, errors }) => {
  const { fields, append, remove } = useFieldArray({ control, name: 'addOns' });

  return (
    <div className="space-y-2">
      {fields.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Harga (Rp)</p>
            <div className="w-8" />
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-start">
              <input {...register(`addOns.${i}.name`, { required: true })}
                placeholder="Nama add-on" className={inputCls} />
              <Controller
                name={`addOns.${i}.price`}
                control={control}
                rules={{ min: 0 }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <PriceInput
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="0"
                    className={cn(inputCls, 'w-36')}
                  />
                )}
              />
              <button type="button" onClick={() => remove(i)}
                className="h-9 w-9 flex items-center justify-center rounded-lg
                  text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => append({ name: '', price: 0 })}
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-sm font-medium border border-border
          text-muted-foreground hover:bg-accent transition-colors">
        <Plus className="w-3.5 h-3.5" /> Tambah Add-on
      </button>
    </div>
  );
};

// ─── ProductForm ──────────────────────────────────────────────────────────────

const ProductForm = ({ defaultValues, onSubmit, isLoading, isEdit = false }) => {
  const { register, control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm({
    defaultValues: defaultValues || {
      name: '', shortDescription: '', description: '',
      categories: [], types: [], tags: [],
      departureDate: '', returnDate: '',
      departureCity: '', destinations: [], meetingPoint: '',
      price: '', quota: '', minParticipants: '',
      thumbnail: '', gallery: [],
      itinerary: [], includes: [], excludes: [],
      addOns: [], terms: '',
      ...(isEdit ? { status: 'draft' } : {}),
    },
  });

  // Watched values
  const depDate    = watch('departureDate');
  const retDate    = watch('returnDate');
  const thumbnail  = watch('thumbnail');
  const gallery    = watch('gallery') || [];
  const categories = watch('categories') || [];
  const types      = watch('types') || [];
  const tags       = watch('tags') || [];
  const destinations = watch('destinations') || [];
  const includes   = watch('includes') || [];
  const excludes   = watch('excludes') || [];
  const priceVal   = watch('price');

  const duration = useMemo(() => calcDuration(depDate, retDate), [depDate, retDate]);

  // ── Leave warning: block React Router navigation when form is dirty ───────────
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isLoading &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  // Block browser refresh/close when form is dirty
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Fetch options for multi-selects
  const { data: categoryOptions = [] } = useQuery({
    queryKey: ['form-categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data.data),
    staleTime: 5 * 60_000,
  });
  const { data: typeOptions = [] } = useQuery({
    queryKey: ['form-types'],
    queryFn: () => api.get('/types').then(r => r.data.data.data),
    staleTime: 5 * 60_000,
  });
  const { data: tagOptions = [] } = useQuery({
    queryKey: ['form-tags'],
    queryFn: () => api.get('/tags').then(r => r.data.data.data),
    staleTime: 5 * 60_000,
  });

  return (
    <>
    {/* Leave warning modal — shown when React Router navigation is blocked */}
    <UnsavedChangesModal
      isOpen={blocker.state === 'blocked'}
      onCancel={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      description="Form produk ini memiliki perubahan yang belum disimpan. Jika Anda meninggalkan halaman ini, semua perubahan termasuk gambar yang sudah diupload akan hilang."
    />
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── Informasi Dasar ─────────────────────────────────────────────── */}
      <Section title="Informasi Dasar">
        <Field label="Nama Produk" required error={errors.name?.message}>
          <input {...register('name', {
            required: 'Nama wajib diisi',
            minLength: { value: 2, message: 'Min 2 karakter' },
            maxLength: { value: 200, message: 'Maks 200 karakter' },
          })} placeholder="Contoh: Paket Wisata Bali 4D3N" className={inputCls} />
        </Field>

        <Field label="Deskripsi Singkat" error={errors.shortDescription?.message}
          hint="Tampil di listing produk — maks 300 karakter">
          <textarea {...register('shortDescription', { maxLength: { value: 300, message: 'Maks 300 karakter' } })}
            placeholder="Highlight singkat paket wisata ini..." rows={2} className={textareaCls} />
        </Field>

        <Field label="Deskripsi Lengkap" error={errors.description?.message}>
          <textarea {...register('description')}
            placeholder="Deskripsi detail paket wisata, fasilitas, dan informasi penting..." rows={6} className={textareaCls} />
        </Field>
      </Section>

      {/* ── Klasifikasi ─────────────────────────────────────────────────── */}
      <Section title="Klasifikasi">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MultiCheckbox
            label="Kategori"
            options={categoryOptions.filter(c => c.status === 'active')}
            value={categories}
            onChange={v => setValue('categories', v)}
          />
          <MultiCheckbox
            label="Tipe"
            options={typeOptions.filter(t => t.status === 'active')}
            value={types}
            onChange={v => setValue('types', v)}
          />
          <MultiCheckbox
            label="Tag"
            options={tagOptions.filter(t => t.status === 'active')}
            value={tags}
            onChange={v => setValue('tags', v)}
            renderOption={opt => (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: opt.color || '#ccc' }} />
                <span className="text-sm text-foreground">{opt.name}</span>
              </div>
            )}
          />
        </div>
      </Section>

      {/* ── Jadwal & Lokasi ─────────────────────────────────────────────── */}
      <Section title="Jadwal & Lokasi">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tanggal Berangkat" required error={errors.departureDate?.message}>
            <input type="date" {...register('departureDate', { required: 'Tanggal berangkat wajib diisi' })}
              className={inputCls} />
          </Field>
          <Field label="Tanggal Kembali" required error={errors.returnDate?.message}>
            <input type="date" {...register('returnDate', { required: 'Tanggal kembali wajib diisi' })}
              className={inputCls} />
          </Field>
        </div>

        {duration && (
          <div className="flex items-center gap-2 px-3 py-2 bg-travia-orange/10 rounded-lg border border-travia-orange/20">
            <Info className="w-4 h-4 text-travia-orange shrink-0" />
            <p className="text-sm font-medium text-travia-orange">Durasi: {duration}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Kota Keberangkatan" error={errors.departureCity?.message}>
            <input {...register('departureCity', { maxLength: { value: 100, message: 'Maks 100 karakter' } })}
              placeholder="Contoh: Jakarta" className={inputCls} />
          </Field>
          <Field label="Meeting Point" error={errors.meetingPoint?.message}>
            <input {...register('meetingPoint', { maxLength: { value: 300, message: 'Maks 300 karakter' } })}
              placeholder="Lokasi berkumpul peserta" className={inputCls} />
          </Field>
        </div>

        <StringArrayInput
          label="Destinasi"
          value={destinations}
          onChange={v => setValue('destinations', v)}
          placeholder="Ketik destinasi, tekan Enter atau +"
          hint="Tambah satu per satu — contoh: Bali, Lombok"
        />
      </Section>

      {/* ── Harga & Kuota ────────────────────────────────────────────────── */}
      <Section title="Harga & Kuota">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Harga (Rp)" required error={errors.price?.message}>
            <Controller
              name="price"
              control={control}
              rules={{ required: 'Harga wajib diisi', min: { value: 0, message: 'Min 0' } }}
              render={({ field: { value, onChange, onBlur } }) => (
                <PriceInput
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="0"
                  className={inputCls}
                />
              )}
            />
          </Field>

          <Field label="Kuota" required error={errors.quota?.message}>
            <input type="number" min={1}
              {...register('quota', {
                required: 'Kuota wajib diisi',
                valueAsNumber: true,
                min: { value: 1, message: 'Min 1' },
              })}
              placeholder="20" className={inputCls} />
          </Field>

          <Field label="Min. Peserta" error={errors.minParticipants?.message}
            hint="Opsional — trip jalan jika peserta terpenuhi">
            <input type="number" min={1}
              {...register('minParticipants', { valueAsNumber: true, min: { value: 1, message: 'Min 1' } })}
              placeholder="—" className={inputCls} />
          </Field>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Add-On Opsional</label>
          <AddOnsSection control={control} register={register} errors={errors} />
        </div>
      </Section>

      {/* ── Media ────────────────────────────────────────────────────────── */}
      <Section title="Media">
        <Field label="Thumbnail Utama" hint="Gambar utama yang tampil di listing produk">
          <ThumbnailUploader value={thumbnail} onChange={v => setValue('thumbnail', v)} />
        </Field>

        <Field label="Galeri" hint={`Foto-foto pendukung — maks 20 gambar (${gallery.length}/20)`}>
          <GalleryUploader value={gallery} onChange={v => setValue('gallery', v)} />
        </Field>
      </Section>

      {/* ── Itinerary ────────────────────────────────────────────────────── */}
      <Section title="Itinerary">
        <ItinerarySection control={control} register={register} errors={errors} />
      </Section>

      {/* ── Detail Paket ─────────────────────────────────────────────────── */}
      <Section title="Detail Paket">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StringArrayInput
            label="Yang Sudah Termasuk"
            value={includes}
            onChange={v => setValue('includes', v)}
            placeholder="Contoh: Tiket pesawat PP"
          />
          <StringArrayInput
            label="Tidak Termasuk"
            value={excludes}
            onChange={v => setValue('excludes', v)}
            placeholder="Contoh: Biaya visa"
          />
        </div>

        <Field label="Syarat & Ketentuan" error={errors.terms?.message}>
          <textarea {...register('terms')}
            placeholder="Syarat dan ketentuan booking paket ini..." rows={5} className={textareaCls} />
        </Field>
      </Section>

      {/* ── Status (edit only) ───────────────────────────────────────────── */}
      {isEdit && (
        <Section title="Status Produk">
          <Field label="Status" hint="'Penuh' dan 'Kedaluwarsa' diatur otomatis oleh sistem">
            <select {...register('status')} className={inputCls}>
              <option value="draft">Draft — Belum dipublikasi</option>
              <option value="active">Aktif — Tersedia untuk dipesan</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </Field>
        </Section>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-2">
        <button type="submit" disabled={isLoading}
          className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold
            bg-travia-orange hover:bg-travia-orange-h text-white
            disabled:opacity-50 transition-colors">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Produk'}
        </button>
      </div>
    </form>
    </>
  );
};

export { toDateInput };
export default ProductForm;
