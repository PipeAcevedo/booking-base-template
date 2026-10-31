import { Router } from 'express';
import { createService, listServices } from '../models/services.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => res.json(await listServices())));
router.post('/', asyncHandler(async (req, res) => {
  const { name, durationMinutes, priceCents } = req.body;
  if (!name?.trim() || !Number.isInteger(durationMinutes) || durationMinutes < 1
      || (priceCents !== undefined && (!Number.isInteger(priceCents) || priceCents < 0))) {
    return res.status(400).json({ error: 'Nombre, duración y precio no válidos.' });
  }
  res.status(201).json(await createService(req.body));
}));

export default router;
