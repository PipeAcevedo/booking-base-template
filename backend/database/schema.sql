CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_services (
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, service_id)
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_professional_service_fk
    FOREIGN KEY (professional_id, service_id)
    REFERENCES professional_services(professional_id, service_id) ON DELETE CASCADE,
  CONSTRAINT availability_positive_duration CHECK (ends_at > starts_at),
  CONSTRAINT availability_unique_slot UNIQUE (professional_id, service_id, starts_at),
  CONSTRAINT availability_no_overlap
    EXCLUDE USING gist (
      professional_id WITH =,
      tstzrange(starts_at, ends_at, '[)') WITH &&
    )
);

CREATE INDEX IF NOT EXISTS availability_lookup_idx
  ON availability_slots (service_id, professional_id, starts_at);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL UNIQUE REFERENCES availability_slots(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON appointments (created_at);
