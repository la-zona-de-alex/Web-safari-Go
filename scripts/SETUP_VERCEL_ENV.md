Instrucciones para vincular Vercel (frontend) con el backend desplegado

1) Variables de entorno en Vercel

- `VITE_API_URL` (o `REACT_APP_API_URL` según tu proyecto): URL pública del backend, por ejemplo `https://api-mi-app.azurewebsites.net/api`.
- `VITE_FRONTEND_ORIGIN` (opcional): URL del frontend en Vercel, por ejemplo `https://mi-app.vercel.app`.

En Vercel: Project Settings -> Environment Variables -> Add Variable. Añade `VITE_API_URL` para `Production` (y `Preview`/`Development` si quieres).

2) Si usas autenticación con Google OAuth, añade también en Vercel:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

3) Si vas a usar toques automáticos desde GitHub Actions (workflow `frontend-vercel.yml`), añade los siguientes secrets en GitHub repo Settings -> Secrets:
- `VERCEL_TOKEN` – token personal de Vercel
- `VERCEL_ORG_ID` – id de la org en Vercel
- `VERCEL_PROJECT_ID` – id del proyecto en Vercel

4) Si prefieres que yo despliegue el backend en Azure y luego actualice `VITE_API_URL` por ti, dame permiso para ejecutar `az` aquí o ejecuta el script `scripts/azure_create_sql.sh` con tus parámetros.
