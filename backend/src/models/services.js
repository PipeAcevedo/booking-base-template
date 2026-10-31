import { pool } from '../db.js';

export async function listServices() {
  const { rows } = await pool.query(
    `SELECT id, name, description, duration_minutes AS "durationMinutes",
            price_cents AS "priceCents"
     FROM services WHERE active = TRUE ORDER BY name`,
  );
  return rows;
}

export async function createService({ name, description, durationMinutes, priceCents }) {
  const { rows } = await pool.query(
    `INSERT INTO services (name, description, duration_minutes, price_cents)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, duration_minutes AS "durationMinutes",
               price_cents AS "priceCents"`,
    [name, description ?? '', durationMinutes, priceCents ?? 0],
  );
  return rows[0];
}
