import { pool } from '../db.js';

export async function listProfessionals(serviceId) {
  const values = serviceId ? [serviceId] : [];
  const filter = serviceId ? 'AND ps.service_id = $1' : '';
  const { rows } = await pool.query(
    `SELECT DISTINCT p.id, p.name, p.email
     FROM professionals p
     JOIN professional_services ps ON ps.professional_id = p.id
     WHERE p.active = TRUE ${filter}
     ORDER BY p.name`,
    values,
  );
  return rows;
}

export async function createProfessional({ name, email, serviceIds }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO professionals (name, email) VALUES ($1, $2) RETURNING id, name, email',
      [name, email],
    );
    const professional = rows[0];
    for (const serviceId of serviceIds) {
      await client.query(
        'INSERT INTO professional_services (professional_id, service_id) VALUES ($1, $2)',
        [professional.id, serviceId],
      );
    }
    await client.query('COMMIT');
    return professional;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
