import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './src/db.js';
import servicesRouter from './src/routes/services.js';
import professionalsRouter from './src/routes/professionals.js';
import availabilityRouter from './src/routes/availability.js';
import appointmentsRouter from './src/routes/appointments.js';
import { asyncHandler } from './src/utils/asyncHandler.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));
app.use('/api/services', servicesRouter);
app.use('/api/professionals', professionalsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/appointments', appointmentsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === '23503') {
    return res.status(400).json({ error: 'La referencia a un servicio, profesional o bloque no existe.' });
  }
  if (error.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe.' });
  }
  if (error.code === '23P01') {
    return res.status(409).json({ error: 'El horario se solapa con otro bloque del profesional.' });
  }
  res.status(error.status ?? 500).json({
    error: error.status ? error.message : 'Error interno del servidor.',
  });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.info(`API de reservas disponible en http://localhost:${port}`));
