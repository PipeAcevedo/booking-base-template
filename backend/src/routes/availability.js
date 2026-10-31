import { Router } from 'express';
import { createAvailability, listAvailableSlots } from '../models/availability.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const serviceId = Number(req.query.serviceId);
  const professionalId = Number(req.query.professionalId);
  const date = req.query.date;
  if (!Number.isInteger(serviceId) || !Number.isInteger(professionalId)
      || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Indica serviceId, professionalId y date (YYYY-MM-DD).' });
  }
  res.json(await listAvailableSlots({ serviceId, professionalId, date }));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { professionalId, serviceId, startsAt, endsAt } = req.body;
  if (!Number.isInteger(professionalId) || !Number.isInteger(serviceId)
      || !Number.isFinite(Date.parse(startsAt)) || !Number.isFinite(Date.parse(endsAt))
      || Date.parse(endsAt) <= Date.parse(startsAt)) {
    return res.status(400).json({ error: 'Datos del bloque de disponibilidad no válidos.' });
  }
  res.status(201).json(await createAvailability(req.body));
}));

export default router;
