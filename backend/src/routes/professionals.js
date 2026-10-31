import { Router } from 'express';
import { createProfessional, listProfessionals } from '../models/professionals.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined;
  if (serviceId !== undefined && !Number.isInteger(serviceId)) {
    return res.status(400).json({ error: 'serviceId no válido.' });
  }
  res.json(await listProfessionals(serviceId));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, email, serviceIds } = req.body;
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')
      || !Array.isArray(serviceIds) || serviceIds.length === 0
      || serviceIds.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ error: 'Datos del profesional o sus servicios no válidos.' });
  }
  res.status(201).json(await createProfessional(req.body));
}));

export default router;
