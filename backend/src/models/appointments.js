import { pool } from '../db.js';

export async function createAppointment({ slotId, customerName, customerEmail, customerPhone }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const slot = await client.query(
      `SELECT s.id, s.starts_at AS "startsAt", s.ends_at AS "endsAt",
              p.name AS "professionalName", sv.name AS "serviceName"
       FROM availability_slots s
       JOIN professionals p ON p.id = s.professional_id
       JOIN services sv ON sv.id = s.service_id
       WHERE s.id = $1 AND s.starts_at > NOW()
       FOR UPDATE OF s`,
      [slotId],
    );
    if (slot.rowCount === 0) {
      const error = new Error('El horario no existe o ya pasó.');
      error.status = 404;
      throw error;
    }

    const result = await client.query(
      `INSERT INTO appointments (slot_id, customer_name, customer_email, customer_phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, slot_id AS "slotId", customer_name AS "customerName",
                 customer_email AS "customerEmail", customer_phone AS "customerPhone",
                 status`,
      [slotId, customerName, customerEmail, customerPhone ?? ''],
    );
    await client.query('COMMIT');
    return { ...result.rows[0], ...slot.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      const conflict = new Error('Este horario acaba de ser reservado. Elige otro horario.');
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function listAppointmentsByDate(date) {
  const { rows } = await pool.query(
    `SELECT a.id, a.customer_name AS "customerName",
            a.customer_email AS "customerEmail", a.customer_phone AS "customerPhone",
            a.status, s.starts_at AS "startsAt", s.ends_at AS "endsAt",
            p.name AS "professionalName", sv.name AS "serviceName"
     FROM appointments a
     JOIN availability_slots s ON s.id = a.slot_id
     JOIN professionals p ON p.id = s.professional_id
     JOIN services sv ON sv.id = s.service_id
     WHERE (s.starts_at AT TIME ZONE 'UTC')::date = $1::date
       AND a.status = 'confirmed'
     ORDER BY s.starts_at`,
    [date],
  );
  return rows;
}
