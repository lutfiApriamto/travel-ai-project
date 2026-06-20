import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './wishlist.service.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const { products, meta } = await svc.getWishlist(req.user._id, req.query);
  sendSuccess(res, products, 'Wishlist berhasil diambil', 200, meta);
});

export const checkWishlist = asyncHandler(async (req, res) => {
  const data = await svc.checkWishlist(req.user._id, req.params.productId);
  sendSuccess(res, data, 'Status wishlist berhasil dicek');
});

export const addToWishlist = asyncHandler(async (req, res) => {
  await svc.addToWishlist(req.user._id, req.params.productId);
  sendSuccess(res, null, 'Produk berhasil ditambahkan ke wishlist', 201);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await svc.removeFromWishlist(req.user._id, req.params.productId);
  sendSuccess(res, null, 'Produk berhasil dihapus dari wishlist');
});
