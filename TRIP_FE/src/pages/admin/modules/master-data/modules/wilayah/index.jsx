import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../../../../../../lib/utils.js';
import { useDebounce } from '../../../../../../hooks/useDebounce.js';
import MasterDataModal from '../../../../../../components/shared/admin/MasterDataModal.jsx';
import DeleteConfirmDialog from '../../../../../../components/shared/admin/DeleteConfirmDialog.jsx';
import {
  useProvinces, useCreateProvince, useUpdateProvince, useDeleteProvince,
  useRegencies, useCreateRegency, useUpdateRegency, useDeleteRegency,
  useDistricts, useCreateDistrict, useUpdateDistrict, useDeleteDistrict,
  useVillages, useCreateVillage, useUpdateVillage, useDeleteVillage,
} from './api/useWilayah.js';

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls = cn(
  'w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground',
  'bg-white dark:bg-travia-dark3 placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange transition-colors',
);

const selectCls = cn(inputCls, 'cursor-pointer');

// ─── Generic Table ────────────────────────────────────────────────────────────

const WilayahTable = ({ items, isLoading, emptyText, onEdit, onDelete, columns }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-background">
        <tr className="text-left">
          {columns.map(col => (
            <th key={col.key}
              className={cn('px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider', col.cls)}>
              {col.label}
            </th>
          ))}
          <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              {columns.map(col => (
                <td key={col.key} className={cn('px-4 py-3', col.cls)}>
                  <div className="h-4 bg-muted rounded w-3/4" />
                </td>
              ))}
              <td className="px-4 py-3"><div className="h-6 w-16 bg-muted rounded ml-auto" /></td>
            </tr>
          ))
        ) : items.length === 0 ? (
          <tr>
            <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
              {emptyText}
            </td>
          </tr>
        ) : items.map(item => (
          <tr key={item._id ?? item.id} className="hover:bg-accent/30 transition-colors">
            {columns.map(col => (
              <td key={col.key} className={cn('px-4 py-3 text-foreground', col.cls)}>
                {col.render ? col.render(item) : item[col.key] ?? '—'}
              </td>
            ))}
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(item)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Generic Modal Form ───────────────────────────────────────────────────────

const WilayahModal = ({ isOpen, onClose, item, title, fields, onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useState(() => {
    if (isOpen) {
      const defaults = {};
      fields.forEach(f => { defaults[f.name] = item?.[f.name] ?? ''; });
      reset(defaults);
    }
  }, [isOpen, item]);

  // Reset on open change
  useState(() => { reset({}); }, [isOpen]);

  return (
    <MasterDataModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === 'select' ? (
              <select {...register(f.name, f.rules)} className={selectCls} defaultValue={item?.[f.name] ?? ''}>
                <option value="">— Pilih {f.label} —</option>
                {f.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                {...register(f.name, f.rules)}
                defaultValue={item?.[f.name] ?? ''}
                placeholder={f.placeholder}
                className={inputCls}
                readOnly={f.readOnly && !!item}
              />
            )}
            {errors[f.name] && <p className="text-xs text-red-500 mt-1">{errors[f.name].message}</p>}
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm font-medium border border-border
              text-muted-foreground hover:bg-accent transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isLoading}
            className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2
              bg-travia-orange hover:bg-travia-orange-h text-white disabled:opacity-50 transition-colors">
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isLoading ? 'Menyimpan...' : item ? 'Perbarui' : 'Tambahkan'}
          </button>
        </div>
      </form>
    </MasterDataModal>
  );
};

// ─── Tab: Provinsi ────────────────────────────────────────────────────────────

const ProvinsiTab = () => {
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState({ open: false, item: null });
  const [del,    setDel]    = useState({ open: false, item: null });
  const debouncedSearch = useDebounce(search);

  const { data: provinces = [], isLoading } = useProvinces(debouncedSearch);
  const { mutate: create, isPending: creating } = useCreateProvince();
  const { mutate: update, isPending: updating } = useUpdateProvince();
  const { mutate: remove, isPending: deleting } = useDeleteProvince();

  const closeModal = () => setModal({ open: false, item: null });
  const closeDel   = () => setDel  ({ open: false, item: null });

  const handleSubmit = (data) => {
    if (modal.item) update({ id: modal.item._id, name: data.name }, { onSuccess: closeModal });
    else            create(data, { onSuccess: closeModal });
  };

  const fields = [
    { name: 'id',   label: 'Kode BPS', required: true, readOnly: true, placeholder: 'Contoh: 11',
      rules: { required: 'Kode wajib diisi' } },
    { name: 'name', label: 'Nama Provinsi', required: true, placeholder: 'Contoh: Aceh',
      rules: { required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari provinsi..."
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
              text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
              focus:ring-travia-orange focus:border-travia-orange transition-colors" />
        </div>
        <button onClick={() => setModal({ open: true, item: null })}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <WilayahTable
        items={provinces} isLoading={isLoading}
        emptyText={search ? 'Tidak ada provinsi yang cocok' : 'Belum ada provinsi'}
        onEdit={item => setModal({ open: true, item })}
        onDelete={item => setDel({ open: true, item })}
        columns={[
          { key: 'id',   label: 'Kode', cls: 'w-20 font-mono text-muted-foreground' },
          { key: 'name', label: 'Nama Provinsi' },
        ]}
      />
      {!isLoading && provinces.length > 0 && (
        <p className="text-xs text-muted-foreground px-4 pb-2">{provinces.length} provinsi</p>
      )}

      <WilayahModal isOpen={modal.open} onClose={closeModal} item={modal.item}
        title={modal.item ? 'Edit Provinsi' : 'Tambah Provinsi'}
        fields={fields} onSubmit={handleSubmit} isLoading={creating || updating} />
      <DeleteConfirmDialog isOpen={del.open} onClose={closeDel}
        onConfirm={() => remove(del.item?._id, { onSuccess: closeDel })}
        title={`Hapus provinsi "${del.item?.name}"?`}
        description="Semua kabupaten/kota, kecamatan, dan kelurahan di bawahnya juga akan terhapus."
        isLoading={deleting} />
    </div>
  );
};

// ─── Tab: Kabupaten/Kota ──────────────────────────────────────────────────────

const RegencyTab = () => {
  const [provinceId, setProvinceId] = useState('');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState({ open: false, item: null });
  const [del,        setDel]        = useState({ open: false, item: null });
  const debouncedSearch = useDebounce(search);

  const { data: provinces = [] }                   = useProvinces();
  const { data: regencies = [], isLoading }        = useRegencies(provinceId, debouncedSearch);
  const { mutate: create, isPending: creating }    = useCreateRegency();
  const { mutate: update, isPending: updating }    = useUpdateRegency();
  const { mutate: remove, isPending: deleting }    = useDeleteRegency();

  const closeModal = () => setModal({ open: false, item: null });
  const closeDel   = () => setDel  ({ open: false, item: null });

  const handleSubmit = (data) => {
    if (modal.item) update({ id: modal.item._id, name: data.name, province_id: data.province_id }, { onSuccess: closeModal });
    else            create(data, { onSuccess: closeModal });
  };

  const fields = [
    { name: 'id',          label: 'Kode BPS',     required: true, readOnly: true, placeholder: 'Contoh: 1101',
      rules: { required: 'Kode wajib diisi' } },
    { name: 'province_id', label: 'Provinsi',      required: true, type: 'select',
      options: provinces.map(p => ({ value: p.id, label: p.name })),
      rules: { required: 'Provinsi wajib dipilih' } },
    { name: 'name',        label: 'Nama Kab/Kota', required: true, placeholder: 'Contoh: Kabupaten Simeulue',
      rules: { required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={provinceId} onChange={e => { setProvinceId(e.target.value); setSearch(''); }}
          className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3 text-sm
            text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange focus:border-travia-orange
            transition-colors min-w-[180px]">
          <option value="">— Pilih Provinsi —</option>
          {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {provinceId && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kab/kota..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                focus:ring-travia-orange focus:border-travia-orange transition-colors" />
          </div>
        )}
        <button onClick={() => setModal({ open: true, item: null })}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 ml-auto">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {!provinceId ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Pilih provinsi terlebih dahulu untuk melihat daftar kabupaten/kota
        </div>
      ) : (
        <>
          <WilayahTable
            items={regencies} isLoading={isLoading}
            emptyText={search ? 'Tidak ada yang cocok' : 'Belum ada kabupaten/kota di provinsi ini'}
            onEdit={item => setModal({ open: true, item })}
            onDelete={item => setDel({ open: true, item })}
            columns={[
              { key: 'id',   label: 'Kode', cls: 'w-20 font-mono text-muted-foreground' },
              { key: 'name', label: 'Nama Kabupaten/Kota' },
            ]}
          />
          {!isLoading && regencies.length > 0 && (
            <p className="text-xs text-muted-foreground px-4 pb-2">{regencies.length} kab/kota</p>
          )}
        </>
      )}

      <WilayahModal isOpen={modal.open} onClose={closeModal} item={modal.item}
        title={modal.item ? 'Edit Kab/Kota' : 'Tambah Kab/Kota'}
        fields={fields} onSubmit={handleSubmit} isLoading={creating || updating} />
      <DeleteConfirmDialog isOpen={del.open} onClose={closeDel}
        onConfirm={() => remove(del.item?._id, { onSuccess: closeDel })}
        title={`Hapus "${del.item?.name}"?`}
        description="Kecamatan dan kelurahan di bawahnya juga akan terhapus."
        isLoading={deleting} />
    </div>
  );
};

// ─── Tab: Kecamatan ───────────────────────────────────────────────────────────

const DistrictTab = () => {
  const [provinceId, setProvinceId] = useState('');
  const [regencyId,  setRegencyId]  = useState('');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState({ open: false, item: null });
  const [del,        setDel]        = useState({ open: false, item: null });
  const debouncedSearch = useDebounce(search);

  const { data: provinces = [] }                  = useProvinces();
  const { data: regencies = [] }                  = useRegencies(provinceId);
  const { data: districts = [], isLoading }       = useDistricts(regencyId, debouncedSearch);
  const { mutate: create, isPending: creating }   = useCreateDistrict();
  const { mutate: update, isPending: updating }   = useUpdateDistrict();
  const { mutate: remove, isPending: deleting }   = useDeleteDistrict();

  const closeModal = () => setModal({ open: false, item: null });
  const closeDel   = () => setDel  ({ open: false, item: null });

  const handleSubmit = (data) => {
    if (modal.item) update({ id: modal.item._id, name: data.name, regency_id: data.regency_id }, { onSuccess: closeModal });
    else            create(data, { onSuccess: closeModal });
  };

  const fields = [
    { name: 'id',         label: 'Kode BPS',   required: true, readOnly: true, placeholder: 'Contoh: 110101',
      rules: { required: 'Kode wajib diisi' } },
    { name: 'regency_id', label: 'Kab/Kota',   required: true, type: 'select',
      options: regencies.map(r => ({ value: r.id, label: r.name })),
      rules: { required: 'Kab/Kota wajib dipilih' } },
    { name: 'name',       label: 'Nama Kecamatan', required: true, placeholder: 'Contoh: Teupah Selatan',
      rules: { required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={provinceId} onChange={e => { setProvinceId(e.target.value); setRegencyId(''); setSearch(''); }}
          className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3 text-sm
            text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors min-w-[160px]">
          <option value="">— Provinsi —</option>
          {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={regencyId} onChange={e => { setRegencyId(e.target.value); setSearch(''); }}
          disabled={!provinceId}
          className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3 text-sm
            text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors
            min-w-[160px] disabled:opacity-50">
          <option value="">— Kab/Kota —</option>
          {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {regencyId && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kecamatan..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                focus:ring-travia-orange transition-colors" />
          </div>
        )}
        <button onClick={() => setModal({ open: true, item: null })}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 ml-auto">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {!regencyId ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Pilih provinsi dan kabupaten/kota untuk melihat kecamatan
        </div>
      ) : (
        <>
          <WilayahTable
            items={districts} isLoading={isLoading}
            emptyText={search ? 'Tidak ada yang cocok' : 'Belum ada kecamatan'}
            onEdit={item => setModal({ open: true, item })}
            onDelete={item => setDel({ open: true, item })}
            columns={[
              { key: 'id',   label: 'Kode', cls: 'w-24 font-mono text-muted-foreground' },
              { key: 'name', label: 'Nama Kecamatan' },
            ]}
          />
          {!isLoading && districts.length > 0 && (
            <p className="text-xs text-muted-foreground px-4 pb-2">{districts.length} kecamatan</p>
          )}
        </>
      )}

      <WilayahModal isOpen={modal.open} onClose={closeModal} item={modal.item}
        title={modal.item ? 'Edit Kecamatan' : 'Tambah Kecamatan'}
        fields={fields} onSubmit={handleSubmit} isLoading={creating || updating} />
      <DeleteConfirmDialog isOpen={del.open} onClose={closeDel}
        onConfirm={() => remove(del.item?._id, { onSuccess: closeDel })}
        title={`Hapus kecamatan "${del.item?.name}"?`}
        description="Kelurahan di bawahnya juga akan terhapus." isLoading={deleting} />
    </div>
  );
};

// ─── Tab: Kelurahan ───────────────────────────────────────────────────────────

const VillageTab = () => {
  const [provinceId,  setProvinceId]  = useState('');
  const [regencyId,   setRegencyId]   = useState('');
  const [districtId,  setDistrictId]  = useState('');
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState({ open: false, item: null });
  const [del,         setDel]         = useState({ open: false, item: null });
  const debouncedSearch = useDebounce(search);

  const { data: provinces = [] }                 = useProvinces();
  const { data: regencies = [] }                 = useRegencies(provinceId);
  const { data: districts = [] }                 = useDistricts(regencyId);
  const { data: villages  = [], isLoading }      = useVillages(districtId, debouncedSearch);
  const { mutate: create, isPending: creating }  = useCreateVillage();
  const { mutate: update, isPending: updating }  = useUpdateVillage();
  const { mutate: remove, isPending: deleting }  = useDeleteVillage();

  const closeModal = () => setModal({ open: false, item: null });
  const closeDel   = () => setDel  ({ open: false, item: null });

  const handleSubmit = (data) => {
    if (modal.item) update({ id: modal.item._id, name: data.name, district_id: data.district_id }, { onSuccess: closeModal });
    else            create(data, { onSuccess: closeModal });
  };

  const fields = [
    { name: 'id',          label: 'Kode BPS',     required: true, readOnly: true, placeholder: 'Contoh: 1101012001',
      rules: { required: 'Kode wajib diisi' } },
    { name: 'district_id', label: 'Kecamatan',    required: true, type: 'select',
      options: districts.map(d => ({ value: d.id, label: d.name })),
      rules: { required: 'Kecamatan wajib dipilih' } },
    { name: 'name',        label: 'Nama Kelurahan', required: true, placeholder: 'Contoh: Latiung',
      rules: { required: 'Nama wajib diisi', minLength: { value: 2, message: 'Min 2 karakter' } } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { value: provinceId, onChange: v => { setProvinceId(v); setRegencyId(''); setDistrictId(''); setSearch(''); }, placeholder: '— Provinsi —',  options: provinces, disabled: false },
          { value: regencyId,  onChange: v => { setRegencyId(v);  setDistrictId(''); setSearch(''); },                  placeholder: '— Kab/Kota —', options: regencies, disabled: !provinceId },
          { value: districtId, onChange: v => { setDistrictId(v); setSearch(''); },                                     placeholder: '— Kecamatan —', options: districts, disabled: !regencyId },
        ].map((sel, i) => (
          <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)} disabled={sel.disabled}
            className="h-9 px-3 rounded-lg border border-border bg-white dark:bg-travia-dark3 text-sm
              text-foreground focus:outline-none focus:ring-1 focus:ring-travia-orange transition-colors
              min-w-[140px] disabled:opacity-50">
            <option value="">{sel.placeholder}</option>
            {sel.options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ))}
        {districtId && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kelurahan..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-white dark:bg-travia-dark3
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1
                focus:ring-travia-orange transition-colors" />
          </div>
        )}
        <button onClick={() => setModal({ open: true, item: null })}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
            bg-travia-orange hover:bg-travia-orange-h text-white transition-colors shrink-0 ml-auto">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {!districtId ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Pilih provinsi → kab/kota → kecamatan untuk melihat kelurahan
        </div>
      ) : (
        <>
          <WilayahTable
            items={villages} isLoading={isLoading}
            emptyText={search ? 'Tidak ada yang cocok' : 'Belum ada kelurahan'}
            onEdit={item => setModal({ open: true, item })}
            onDelete={item => setDel({ open: true, item })}
            columns={[
              { key: 'id',   label: 'Kode', cls: 'w-28 font-mono text-muted-foreground' },
              { key: 'name', label: 'Nama Kelurahan' },
            ]}
          />
          {!isLoading && villages.length > 0 && (
            <p className="text-xs text-muted-foreground px-4 pb-2">{villages.length} kelurahan</p>
          )}
        </>
      )}

      <WilayahModal isOpen={modal.open} onClose={closeModal} item={modal.item}
        title={modal.item ? 'Edit Kelurahan' : 'Tambah Kelurahan'}
        fields={fields} onSubmit={handleSubmit} isLoading={creating || updating} />
      <DeleteConfirmDialog isOpen={del.open} onClose={closeDel}
        onConfirm={() => remove(del.item?._id, { onSuccess: closeDel })}
        title={`Hapus kelurahan "${del.item?.name}"?`} isLoading={deleting} />
    </div>
  );
};

// ─── Main: WilayahPage ────────────────────────────────────────────────────────

const TABS = [
  { key: 'provinsi',  label: 'Provinsi'       },
  { key: 'regency',   label: 'Kabupaten/Kota' },
  { key: 'district',  label: 'Kecamatan'      },
  { key: 'village',   label: 'Kelurahan'      },
];

const WilayahPage = () => {
  const [activeTab, setActiveTab] = useState('provinsi');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-foreground text-xl">Wilayah</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola data wilayah administratif Indonesia</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-travia-orange text-travia-orange'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-5">
          {activeTab === 'provinsi'  && <ProvinsiTab />}
          {activeTab === 'regency'   && <RegencyTab  />}
          {activeTab === 'district'  && <DistrictTab />}
          {activeTab === 'village'   && <VillageTab  />}
        </div>
      </div>
    </div>
  );
};

export default WilayahPage;
