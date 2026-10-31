import { Router } from 'express';
import { createAppointment, listAppointmentsByDate } from '../models/appointments.js';
import { sendAppointmentConfirmation } from '../services/emailService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const date = req.query.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Indica date con formato YYYY-MM-DD.' });
  }
  res.json(await listAppointmentsByDate(date));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { slotId, customerName, customerEmail, customerPhone } = req.body;
  if (!Number.isInteger(slotId) || !customerName?.trim()
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail ?? '')
      || (customerPhone !== undefined && typeof customerPhone !== 'string')) {
    return res.status(400).json({ error: 'Datos de la reserva no válidos.' });
  }
  const appointment = await createAppointment(req.body);
  try {
    await sendAppointmentConfirmation(appointment);
  } catch (error) {
    console.error('No se pudo generar la notificación de la cita:', error);
  }
  res.status(201).json(appointment);
}));

export default router;
