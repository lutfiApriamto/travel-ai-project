import multer from 'multer';
import { sendError } from '../utils/apiResponse.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// Wrapper agar error multer mengikuti format sendError, bukan Express default error.
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, `Ukuran file melebihi ${MAX_SIZE_MB}MB`, 400);
    }
    return sendError(res, err.message, 400);
  }
  if (err) return sendError(res, err.message, 400);
  next();
};

export default upload;
