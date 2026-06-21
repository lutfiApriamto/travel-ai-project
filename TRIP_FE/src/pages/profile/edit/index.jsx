import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link }            from 'react-router-dom';
import { useForm }                      from 'react-hook-form';
import {
  Camera, Trash2, ChevronRight,
  Loader2, User, Phone, AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn }                    from '../../../lib/utils.js';
import { ROUTES }                from '../../../utils/consts/routes.js';
import { useAuthStore }          from '../../../stores/useAuthStore.js';
import {
  useMyProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../api/useProfile.js';

// ─── Avatar helpers (reused from profile page) ────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500',    'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500',   'bg-rose-500',   'bg-cyan-500',
  'bg-indigo-500',  'bg-pink-500',   'bg-teal-500',
];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.toUpperCase().charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Avatar Uploader ──────────────────────────────────────────────────────────

const AvatarUploader = ({ currentAvatarUrl, currentName, onAvatarChange }) => {
  const [preview,    setPreview]    = useState(currentAvatarUrl ?? null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef(null);
  const uploadAvatar = useUploadAvatar();

  // Sync external avatar URL change (e.g., after profile load)
  useEffect(() => {
    setPreview(currentAvatarUrl ?? null);
  }, [currentAvatarUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected
    e.target.value = '';

    // Immediate local preview (FileReader → data URL)
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload in background
    setUploading(true);
    setUploadDone(false);
    try {
      const url = await uploadAvatar.mutateAsync(file);
      setPreview(url);        // replace local preview with actual URL
      onAvatarChange(url);    // inform parent form
      setUploadDone(true);
      setTimeout(() => setUploadDone(false), 2000);
    } catch {
      // Error already toasted by mutation onError
      setPreview(currentAvatarUrl ?? null); // revert preview on failure
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onAvatarChange(null);
    setUploadDone(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt="Avatar preview"
            className="w-24 h-24 rounded-full object-cover ring-4 ring-card shadow-md"
          />
        ) : (
          <div className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center ring-4 ring-card shadow-md',
            'font-bold text-white text-3xl select-none',
            getAvatarColor(currentName),
          )}>
            {getInitials(currentName)}
          </div>
        )}

        {/* Upload / loading overlay */}
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'absolute -bottom-1 -right-1 w-8 h-8 rounded-full',
            'flex items-center justify-center shadow-md',
            'transition-colors',
            uploadDone
              ? 'bg-emerald-500 text-white'
              : 'bg-travia-orange text-white hover:bg-travia-orange/90',
          )}
          aria-label="Ganti foto profil"
        >
          {uploading  ? <Loader2     className="w-4 h-4 animate-spin" /> :
           uploadDone ? <CheckCircle2 className="w-4 h-4" /> :
                        <Camera      className="w-4 h-4" />}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border
            text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground
            disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          {uploading ? 'Mengupload...' : 'Ganti Foto'}
        </button>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-300
              dark:border-red-800/50 text-xs font-medium text-red-500
              hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Hapus Foto
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        JPG, PNG, atau WebP · Maks 5 MB
      </p>
    </div>
  );
};

// ─── Form Field ───────────────────────────────────────────────────────────────

const FormField = ({ label, error, required, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
    )}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

// ─── EditProfilePage ──────────────────────────────────────────────────────────

const EditProfilePage = () => {
  const navigate      = useNavigate();
  const userFromStore = useAuthStore((s) => s.user);

  // Fetch fresh data from API
  const { data: userFromApi } = useMyProfile();
  const user = userFromApi ?? userFromStore;

  const updateProfile = useUpdateProfile();

  // Track avatar URL separately (managed by AvatarUploader)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { name: '', phone: '' },
  });

  // Populate form when user data arrives
  useEffect(() => {
    if (user) {
      reset({
        name:  user.name  ?? '',
        phone: user.phone ?? '',
      });
      setAvatarUrl(user.avatar ?? null);
    }
  }, [user?._id]); // eslint-disable-line

  const onSubmit = ({ name, phone }) => {
    const body = {
      name:   name.trim(),
      phone:  phone.trim() || undefined,
      avatar: avatarUrl,    // null if removed, URL if set
    };

    updateProfile.mutate(body, {
      onSuccess: () => navigate(ROUTES.PROFILE),
    });
  };

  // Detect any change (form fields OR avatar)
  const avatarChanged = avatarUrl !== (user?.avatar ?? null);
  const hasChanges    = isDirty || avatarChanged;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link to={ROUTES.PROFILE} className="hover:text-foreground transition-colors">
          Profil
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">Edit Profil</span>
      </nav>

      <h1 className="font-serif italic text-2xl sm:text-3xl text-foreground mb-6">
        Edit Profil
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Avatar section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-5">
            Foto Profil
          </p>
          <AvatarUploader
            currentAvatarUrl={user?.avatar ?? null}
            currentName={user?.name}
            onAvatarChange={setAvatarUrl}
          />
        </div>

        {/* Form fields */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Informasi Akun
          </p>

          {/* Email — read-only */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-3 h-10 px-4 rounded-xl border border-border
              bg-muted/40 text-muted-foreground text-sm">
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{user?.email ?? '—'}</span>
              <span className="ml-auto text-[10px] font-medium text-muted-foreground/60 shrink-0">
                Tidak dapat diubah
              </span>
            </div>
          </div>

          {/* Name */}
          <FormField
            label="Nama Lengkap"
            required
            error={errors.name?.message}
          >
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nama lengkap kamu"
                {...register('name', {
                  required:  'Nama wajib diisi',
                  minLength: { value: 2,   message: 'Minimal 2 karakter' },
                  maxLength: { value: 100, message: 'Maksimal 100 karakter' },
                })}
                className={cn(
                  'w-full h-10 pl-10 pr-4 rounded-xl border bg-white dark:bg-travia-dark3',
                  'text-sm text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
                  'transition-colors',
                  errors.name ? 'border-red-400' : 'border-border',
                )}
              />
            </div>
          </FormField>

          {/* Phone */}
          <FormField
            label="No. Telepon"
            error={errors.phone?.message}
            hint="Opsional · Contoh: 08123456789"
          >
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                {...register('phone', {
                  maxLength: { value: 20, message: 'Maksimal 20 karakter' },
                })}
                className={cn(
                  'w-full h-10 pl-10 pr-4 rounded-xl border bg-white dark:bg-travia-dark3',
                  'text-sm text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-travia-orange/30 focus:border-travia-orange',
                  'transition-colors',
                  errors.phone ? 'border-red-400' : 'border-border',
                )}
              />
            </div>
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={ROUTES.PROFILE}
            className="flex-1 sm:flex-none h-11 px-6 rounded-xl border border-border
              text-sm font-medium text-muted-foreground hover:bg-accent transition-colors
              flex items-center justify-center"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={updateProfile.isPending || !hasChanges}
            className={cn(
              'flex-1 h-11 rounded-xl text-sm font-semibold transition-colors',
              'flex items-center justify-center gap-2',
              hasChanges && !updateProfile.isPending
                ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {updateProfile.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>

        {/* No changes hint */}
        {!hasChanges && (
          <p className="text-xs text-center text-muted-foreground -mt-2">
            Belum ada perubahan
          </p>
        )}

      </form>
    </div>
  );
};

export default EditProfilePage;
