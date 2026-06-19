import sharp    from 'sharp';
import supabase from '../config/supabase.js';

const BUCKET   = process.env.SUPABASE_BUCKET;
const MAX_PX   = 1280;  // max lebar/tinggi setelah resize
const QUALITY  = 82;    // kualitas WebP (0-100), 82 = sweet spot kualitas vs ukuran

// Kompres gambar ke WebP sebelum upload.
// Resize hanya jika dimensi melebihi MAX_PX — gambar kecil tidak diperbesar.
const compressImage = (buffer) =>
  sharp(buffer)
    .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();

// Upload gambar ke Supabase Storage dengan kompresi WebP otomatis.
// storagePath contoh: 'products/thumbnail-abc123.webp' atau 'avatars/user-xyz.webp'
// Selalu return public URL file yang berhasil diupload.
export const uploadImage = async (buffer, storagePath) => {
  const compressed = await compressImage(buffer);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, compressed, {
      contentType: 'image/webp',
      upsert:      true,
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Hapus file dari Supabase Storage berdasarkan path relatif.
export const deleteFile = async (storagePath) => {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Hapus file gagal: ${error.message}`);
};

// Ekstrak path relatif dari full Supabase public URL untuk keperluan deleteFile.
// Contoh input : 'https://xxx.supabase.co/storage/v1/object/public/trip-assets/products/abc.webp'
// Contoh output: 'products/abc.webp'
export const extractStoragePath = (publicUrl) => {
  const marker = `/object/public/${BUCKET}/`;
  const idx    = publicUrl.indexOf(marker);
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : null;
};
