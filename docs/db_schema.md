# Esquema de Base de Datos - WebSafari (Postgres)

Entidades principales y relaciones (ERD textual):

1) `users` (riders y drivers)
- `id` SERIAL PRIMARY KEY
- `email` VARCHAR UNIQUE
- `phone` VARCHAR UNIQUE
- `password_hash` VARCHAR
- `role` ENUM('rider','driver','admin')
- `name` VARCHAR
- `created_at`, `updated_at`

2) `drivers` (datos específicos si separamos)
- `id` PK references `users(id)`
- `rating` NUMERIC(3,2)
- `vehicle_id` FK -> `vehicles(id)`
- `status` ENUM('offline','available','on_trip')

3) `vehicles`
- `id` SERIAL PK
- `driver_id` FK -> `drivers(id)`
- `make`, `model`, `plate`, `color`

4) `rides`
- `id` SERIAL PK
- `rider_id` FK -> `users(id)`
- `driver_id` FK -> `users(id)` (nullable until assigned)
- `origin_lat`, `origin_lon`, `origin_address`
- `dest_lat`, `dest_lon`, `dest_address`
- `status` ENUM('requested','accepted','ongoing','completed','cancelled')
- `price_cents` INTEGER
- `distance_meters`, `duration_seconds`
- `requested_at`, `started_at`, `completed_at`, `cancelled_at`

5) `payments`
- `id` SERIAL PK
- `ride_id` FK -> `rides(id)`
- `amount_cents` INTEGER
- `status` ENUM('pending','paid','failed','refunded')
- `provider_transaction_id` VARCHAR

6) `locations` (tracking conductor)
- `id` SERIAL PK
- `driver_id` FK -> `users(id)`
- `lat`, `lon`, `bearing`, `speed`
- `recorded_at`

7) `sessions` / `refresh_tokens`
- `id` PK
- `user_id` FK
- `refresh_token_hash`, `expires_at`

Índices recomendados:
- `users(email)`, `users(phone)`
- `rides(rider_id)`, `rides(driver_id)`, `rides(status)`
- `locations(driver_id, recorded_at DESC)` para queries recientes

SQL de ejemplo (inicial):

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(10) NOT NULL DEFAULT 'rider',
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  rider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES users(id),
  origin_lat DECIMAL(10,7), origin_lon DECIMAL(10,7), origin_address TEXT,
  dest_lat DECIMAL(10,7), dest_lon DECIMAL(10,7), dest_address TEXT,
  status VARCHAR(20) DEFAULT 'requested',
  price_cents INTEGER,
  distance_meters INTEGER,
  duration_seconds INTEGER,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

Notas:
- Podemos separar `drivers` si necesitamos campos extensos de conductor.
- Para consultas geoespaciales avanzadas, considerar PostGIS.
