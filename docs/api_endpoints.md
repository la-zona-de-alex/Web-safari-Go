# Especificación de Endpoints - WebSafari

Versión: v1

Autenticación: Bearer JWT (cabecera `Authorization: Bearer <token>`)

Base path: `/api/v1`

Endpoints principales:

- `POST /api/v1/auth/login` : Autenticar usuario (email/phone + password). Respuesta: `{ token, user }`.
- `POST /api/v1/auth/register` : Registrar usuario (tipo: rider/driver).
- `POST /api/v1/auth/refresh` : Refrescar token (refresh token cookie o body).

- Users service (microservicio `users`):
  - `GET /api/v1/users/:id` : Obtener perfil de usuario.
  - `PUT /api/v1/users/:id` : Actualizar perfil.
  - `GET /api/v1/users/:id/trips` : Historial de viajes.

- Drivers service (puede ser parte de `users` o separado):
  - `GET /api/v1/drivers/:id` : Perfil conductor.
  - `POST /api/v1/drivers/:id/availability` : Cambiar estado disponible/no disponible.

- Rides service:
  - `POST /api/v1/rides` : Crear solicitud de viaje (origin, destination, rider_id, options).
  - `GET /api/v1/rides/:id` : Obtener estado del viaje.
  - `PATCH /api/v1/rides/:id/accept` : Conductor acepta el viaje.
  - `PATCH /api/v1/rides/:id/cancel` : Cancelar (rider o driver).
  - `POST /api/v1/rides/:id/complete` : Marcar como completado.

- Payments service:
  - `POST /api/v1/payments/charge` : Cargar pago por viaje.
  - `GET /api/v1/payments/:id` : Estado de pago.

- Maps/geocoding service:
  - `GET /api/v1/maps/reverse?lat=&lon=` : Reverse geocoding.
  - `GET /api/v1/maps/route?origin=&dest=` : Ruta estimada y duración.

- WebSocket / Realtime (Socket.IO recommended):
  - Namespace `/realtime` para eventos: `ride_request`, `ride_update`, `driver_location`, `chat_message`.

Contratos y convenciones:
- Todos los POST/PATCH aceptan y devuelven JSON.
- Errores estándar: `{ code, message, details? }` con códigos HTTP apropiados.
- Paginación estándar: `?page=&limit=` y encabezados `X-Total-Count`.

Seguridad:
- Validar y sanitizar inputs en cada servicio.
- Rate-limit en endpoints críticos (auth, searches).

Notas específicas para el backend de ejemplo (`backend/api/src/index.js`):

- `POST /api/register` : Registro público. Campos esperados: `name`, `email`, `password`, `role`.
  - `role` no puede ser `admin` (se devuelve 403). Solo `passenger` o `driver`.
  - Si `role=driver` se requieren archivos multipart: `vehicle_photo`, `license_photo`, `driver_photo`, `dni_photo`. Si faltan, responde 400 con `{ error: 'missing driver files', missing: [...] }`.
  - Para conductores se establece `verified: false` (respuesta incluye `user.verified`).

- `POST /api/login` : Login con JSON `{ email, password }`.
  - Si el usuario es conductor y `verified` es `false` (pendiente de verificación), el endpoint responde 403 con `{ error: 'driver_verification_pending' }`.

- `GET /api/me` : Devuelve el usuario asociado al token Bearer.

- Rides:
  - `POST /api/rides` crea una solicitud de viaje. Si se usa storage en memoria, devuelve el objeto creado; si hay MSSQL configurado guarda en BD.
  - `GET /api/rides` lista solicitudes; soporta `?status=` y `?passenger_id=`.
  - `POST /api/rides/:id/accept` acepta una solicitud como conductor (requiere auth o `driver_id` en body).

Notas técnicas:
- Uploads se guardan en `backend/uploads` y los metadatos se intentan guardar en BD si existe conexión.
- El servicio intenta detectar y usar driver MSSQL adecuado (msnodesqlv8 si es Integrated Security), y tiene fallback para config por string.

Estos detalles aplican al demo local; en producción conviene añadir validación MIME/size, escaneo antivirus, y endpoints admin para verificar conductores manualmente.
