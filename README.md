# Plantilla de citas y reservas

Base reutilizable para un sistema de reservas con API REST (Node.js, Express y PostgreSQL) y una aplicación de cliente (React 18, Vite y Tailwind CSS).

## Requisitos

- Node.js 18 o posterior y npm
- PostgreSQL 14 o posterior

## Inicio rápido

1. Cree una base de datos PostgreSQL, por ejemplo `booking_system`.
2. Ejecute el esquema y los datos de demostración:

   ```sh
   psql -d booking_system -f backend/database/schema.sql
   psql -d booking_system -f backend/database/seed.sql
   ```

3. Configure y arranque la API:

   ```sh
   cd backend
   cp .env.example .env
   # Edite DATABASE_URL si sus credenciales locales son distintas.
   npm install
   npm run dev
   ```

   La API está disponible de forma predeterminada en `http://localhost:3001`.

4. En otra terminal, configure y arranque el cliente:

   ```sh
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

   Abra la URL mostrada por Vite (normalmente `http://localhost:5173`).

## Lógica de reservas

Los profesionales ofrecen bloques concretos de disponibilidad asociados a servicios. El cliente escoge uno de esos bloques y envía sus datos. La API inicia una transacción, bloquea el bloque solicitado con `SELECT ... FOR UPDATE`, comprueba que siga libre e inserta la cita. Además, `appointments.slot_id` tiene una restricción `UNIQUE` en PostgreSQL. El bloqueo serializa solicitudes concurrentes para el mismo bloque y la restricción única constituye una última defensa contra la sobre-reserva. Una restricción de exclusión impide crear bloques que se solapen para un mismo profesional.

Las horas se guardan como `TIMESTAMPTZ`; la API recibe instantes ISO 8601 y devuelve fechas ISO. La plantilla presenta y filtra las horas en UTC para que el día elegido corresponda al día consultado en la API. Ajuste la zona horaria del producto antes de desplegar para una región específica. Los bloques de disponibilidad se gestionan explícitamente (no se generan automáticamente a partir de reglas semanales).

## API

- `GET /api/health`
- `GET /api/services`, `POST /api/services`
- `GET /api/professionals?serviceId=...`, `POST /api/professionals`
- `GET /api/availability?serviceId=...&professionalId=...&date=YYYY-MM-DD`
- `POST /api/availability`
- `POST /api/appointments`
- `GET /api/appointments?date=YYYY-MM-DD` — agenda administrativa del día

Los endpoints de administración se dejan sin autenticación para facilitar el desarrollo de la plantilla. Añada autenticación y autorización antes de exponerlos en producción.

## Notificaciones

El backend usa Nodemailer con un transporte de prueba `jsonTransport`: genera y registra el mensaje simulado sin enviarlo a un servidor de correo. La cita queda confirmada si la reserva se guardó correctamente; un fallo de notificación se registra sin revertir una reserva ya confirmada.

## Comandos

En `backend`: `npm run dev`, `npm start`.

En `frontend`: `npm run dev`, `npm run build`, `npm run preview`.

## Personalización y producción

Edite `backend/database/seed.sql` para cargar sus servicios, profesionales y bloques de disponibilidad. Configure `DATABASE_URL`, `PORT` y `CLIENT_ORIGIN` usando `backend/.env.example`; configure `VITE_API_BASE_URL` en `frontend/.env.example`. Para producción, establezca una estrategia de correo real, autenticación/autorización, validación de zona horaria, migraciones y políticas de retención adecuadas.
