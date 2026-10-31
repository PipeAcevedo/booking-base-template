INSERT INTO services (name, description, duration_minutes, price_cents)
VALUES
  ('Consulta inicial', 'Primera consulta de valoración.', 30, 4500),
  ('Sesión de seguimiento', 'Sesión individual de seguimiento.', 60, 8000)
ON CONFLICT DO NOTHING;

INSERT INTO professionals (name, email)
VALUES
  ('Alex Rivera', 'alex@example.com'),
  ('Sam Lee', 'sam@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO professional_services (professional_id, service_id)
SELECT p.id, s.id
FROM professionals p
CROSS JOIN services s
ON CONFLICT DO NOTHING;

INSERT INTO availability_slots (professional_id, service_id, starts_at, ends_at)
SELECT ps.professional_id, ps.service_id,
       ((CURRENT_DATE + INTERVAL '1 day')::date + times.slot_time) AT TIME ZONE 'UTC',
       (((CURRENT_DATE + INTERVAL '1 day')::date + times.slot_time)
         + make_interval(mins => s.duration_minutes)) AT TIME ZONE 'UTC'
FROM professional_services ps
JOIN services s ON s.id = ps.service_id
CROSS JOIN (VALUES
  ('Consulta inicial', TIME '09:00'),
  ('Consulta inicial', TIME '10:00'),
  ('Sesión de seguimiento', TIME '11:00'),
  ('Sesión de seguimiento', TIME '14:00')
) AS times(service_name, slot_time)
WHERE s.name = times.service_name
ON CONFLICT DO NOTHING;
