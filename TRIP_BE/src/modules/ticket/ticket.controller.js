import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './ticket.service.js';

// ─── User ─────────────────────────────────────────────────────────────────────

export const getMyTickets = asyncHandler(async (req, res) => {
  const { tickets, meta } = await svc.getMyTickets(req.user._id, req.query);
  sendSuccess(res, tickets, 'Tiket berhasil diambil', 200, meta);
});

export const getMyTicketById = asyncHandler(async (req, res) => {
  const data = await svc.getMyTicketById(req.params.id, req.user._id);
  sendSuccess(res, data, 'Detail tiket berhasil diambil');
});

export const downloadTicket = asyncHandler(async (req, res) => {
  const buffer = await svc.downloadTicket(req.params.id, req.user._id);
  res.set({
    'Content-Type':        'application/pdf',
    'Content-Disposition': `attachment; filename="tiket-${req.params.id}.pdf"`,
  });
  res.send(buffer);
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllTickets = asyncHandler(async (req, res) => {
  const { tickets, meta } = await svc.getAllTickets(req.query);
  sendSuccess(res, tickets, 'Data tiket berhasil diambil', 200, meta);
});

export const getTicketById = asyncHandler(async (req, res) => {
  const data = await svc.getTicketById(req.params.id);
  sendSuccess(res, data, 'Detail tiket berhasil diambil');
});

export const checkIn = asyncHandler(async (req, res) => {
  const data = await svc.checkIn(req.body.ticketCode);
  sendSuccess(res, data, 'Check-in berhasil');
});
