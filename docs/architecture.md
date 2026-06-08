# WebSafari - Arquitectura propuesta

- Frontend: SPA (React) con rutas para usuario, conductor y admin.
- Gateway: puerta de entrada (Node/Nest/Express) con autenticación JWT.
- Microservicios: users, rides, payments, maps, notifications.
- Data: Postgres principal, Redis cache, S3 para assets.
- Infra: Docker Compose para desarrollo, Kubernetes para producción.

Flujos principales y componentes están descritos en este repositorio.
