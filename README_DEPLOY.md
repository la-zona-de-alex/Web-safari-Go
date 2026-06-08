Guía breve: conectar BD y desplegar frontend/backend

Resumen rápido — lo que incluyo aquí:
- `backend/db/init.sql` — script para crear tablas básicas en MSSQL.
- `docker-compose.yml` — levanta un MSSQL local, backend y frontend para pruebas.
- `backend/.env.example` — variables de entorno ejemplo.

1) Probar local con Docker Compose

Requisitos: Docker instalado.

Comandos:

```powershell
docker compose up --build
```

Esto levanta:
- MSSQL en el servicio `mssql` (usuario `sa`, contraseña `Your_password123` configurada en `docker-compose.yml`).
- Backend en `http://localhost:4000`
- Frontend en `http://localhost:5173`

Si usas Docker para ejecutar MSSQL, puedes aplicar el script de inicialización con Azure Data Studio o sqlcmd apuntando al contenedor.

2) Crear Azure SQL (opción A)

Con Azure CLI (ejemplo resumido):

```bash
az sql server create -g <rg> -n <server-name> -l <location> -u <admin-user> -p '<StrongPassword1!>'
az sql db create -g <rg> -s <server-name> -n WebSafari --service-objective S0
```

Cadena de conexión ejemplo (ADO.NET) para `MSSQL_CONN`:

```
Server=tcp:<server-name>.database.windows.net,1433;Initial Catalog=WebSafari;Persist Security Info=False;User ID=<admin-user>;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

3) Desplegar backend (Render / Railway / Azure App Service)

- Render: crea nuevo Web Service conectado a tu repo GitHub (`Web-safari-Go`), rama `main`.
- Añade `MSSQL_CONN`, `JWT_SECRET` y `FRONTEND_ORIGIN` como Environment variables en el panel de Render.

4) Desplegar frontend (Vercel / Netlify)

- En Vercel: importa proyecto desde GitHub. En 'Root Directory' selecciona `scaffolding/frontend` o `frontend` según corresponda.
- Añade variable `VITE_API_URL` o `REACT_APP_API_URL` según tu frontend, apuntando a `https://<tu-backend>/api`.

5) Exponer temporalmente desde tu máquina (ngrok)

```bash
ngrok http 4000
```

6) Notas sobre archivos grandes

Ya configuré Git LFS para los MP4 en `scaffolding/frontend/public/images`. Si quieres que mueva otros archivos grandes, dímelo.

¿Qué quieres que haga ahora?
- Ejecutar la creación de la base de datos en Azure automáticamente (necesitaré tus credenciales/az cli login).
- Preparar deployment automático (workflows / scripts) para Render y Vercel (te preparo los workflows y tú añades los secrets en GitHub).
- Levantar Docker Compose localmente aquí (puedo ejecutar `docker compose up` si quieres que lo pruebe en tu máquina).
