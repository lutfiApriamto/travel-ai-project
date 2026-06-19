import asyncHandler                            from '../../utils/asyncHandler.js';
import { sendSuccess, sendError }              from '../../utils/apiResponse.js';
import { uploadImage, deleteFile,
         extractStoragePath }                  from '../../utils/uploadHelper.js';

// Folder hanya boleh huruf, angka, dan tanda hubung untuk mencegah path traversal.
const sanitizeFolder = (folder) => {
  if (!folder) return 'uploads';
  return folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'uploads';
};

const buildPath = (folder) =>
  `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

// ─── Upload ───────────────────────────────────────────────────────────────────

// POST /api/upload/single?folder=xxx
export const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'File tidak ditemukan', 400);

  const folder = sanitizeFolder(req.query.folder);
  const url    = await uploadImage(req.file.buffer, buildPath(folder));

  sendSuccess(res, { url }, 'Gambar berhasil diupload', 201);
});

// POST /api/upload/bulk?folder=xxx  (max 10 file)
export const uploadBulk = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) return sendError(res, 'File tidak ditemukan', 400);

  const folder = sanitizeFolder(req.query.folder);
  const urls   = await Promise.all(
    req.files.map((file) => uploadImage(file.buffer, buildPath(folder)))
  );

  sendSuccess(res, { urls }, `${urls.length} gambar berhasil diupload`, 201);
});

// ─── Delete ───────────────────────────────────────────────────────────────────

// DELETE /api/upload/single  — body: { url }
export const deleteSingle = asyncHandler(async (req, res) => {
  const storagePath = extractStoragePath(req.body.url);
  if (!storagePath) return sendError(res, 'URL tidak valid atau bukan dari storage ini', 400);

  await deleteFile(storagePath);
  sendSuccess(res, null, 'Gambar berhasil dihapus');
});

// DELETE /api/upload/bulk  — body: { urls: [] }
// Gunakan allSettled agar satu file yang gagal tidak menghentikan penghapusan lainnya.
export const deleteBulk = asyncHandler(async (req, res) => {
  const paths   = req.body.urls.map(extractStoragePath).filter(Boolean);
  if (paths.length === 0) return sendError(res, 'Tidak ada URL valid yang diberikan', 400);

  const results = await Promise.allSettled(paths.map(deleteFile));
  const failed  = results.filter((r) => r.status === 'rejected').length;

  const message = failed > 0
    ? `${paths.length - failed} gambar dihapus, ${failed} gagal`
    : `${paths.length} gambar berhasil dihapus`;

  sendSuccess(res, { total: paths.length, failed }, message);
});
