import { sendError } from '../utils/apiResponse.js';

const notFound = (req, res) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} tidak ditemukan`, 404);
};

export default notFound;
