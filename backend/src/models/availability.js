import { pool } from '../db.js';

export async function listAvailableSlots({ serviceId, professionalId, date }) {
  const { rows } = await pool.query(
    `SELECT s.id, s.professional_id AS "professionalId",
            s.service_id AS "serviceId", s.starts_at AS "startsAt",
            s.ends_at AS "endsAt", p.name AS "professionalName"
     FROM availability_slots s
     JOIN professionals p ON p.id = s.professional_id
     LEFT JOIN appointments a ON a.slot_id = s.id AND a.status = 'confirmed'
     WHERE s.service_id = $1 AND s.professional_id = $2
       AND (s.starts_at AT TIME ZONE 'UTC')::date = $3::date
       AND s.starts_at > NOW() AND a.id IS NULL
     ORDER BY s.starts_at`,
    [serviceId, professionalId, date],
  );
  return rows;
}

export async function createAvailability({ professionalId, serviceId, startsAt, endsAt }) {
  const { rows } = await pool.query(
    `INSERT INTO availability_slots (professional_id, service_id, starts_at, ends_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, professional_id AS "professionalId", service_id AS "serviceId",
               starts_at AS "startsAt", ends_at AS "endsAt"`,
    [professionalId, serviceId, startsAt, endsAt],
  );
  return rows[0];
}
