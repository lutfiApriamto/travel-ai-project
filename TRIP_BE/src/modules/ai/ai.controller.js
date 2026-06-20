import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './ai.service.js';

export const chat = asyncHandler(async (req, res) => {
  const { message, conversationHistory } = req.body;
  const data = await svc.chat({ message, conversationHistory });
  sendSuccess(res, data, 'Berhasil');
});
