import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './passenger.service.js';

export const getMyPassengers = asyncHandler(async (req, res) => {
  const data = await svc.getMyPassengers(req.user._id);
  sendSuccess(res, data, 'Data penumpang berhasil diambil');
});

export const upsertPassenger = asyncHandler(async (req, res) => {
  const data = await svc.upsertPassenger(req.user._id, req.body);
  sendSuccess(res, data, 'Data penumpang berhasil disimpan', 200);
});

export const deletePassenger = asyncHandler(async (req, res) => {
  await svc.deletePassenger(req.params.id, req.user._id);
  sendSuccess(res, null, 'Data penumpang berhasil dihapus');
});
