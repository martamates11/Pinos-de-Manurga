# Catastro · Pinos de Manurga

Visor cartográfico de parcelas con comentarios, fotos y vídeos subidos por un grupo reducido de personas. Cada publicación muestra el nombre de quien la sube y la fecha/hora.

## Stack
- **Frontend**: Vite + Leaflet (mapa) + proj4 (conversión UTM → WGS84), desplegado en **Vercel**.
- **Backend**: **Supabase** (Postgres + Storage) para comentarios, fotos y vídeos.
- **CI**: **GitHub Actions** con un cron diario que hace una petición de lectura a Supabase para que el proyecto gratuito nunca quede en pausa por inactividad.

## Desarrollo local
```bash
npm install
npm run dev
```
Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` ya están en `.env` (son claves públicas, pensadas para usarse en el cliente; el acceso real está controlado por las políticas RLS de Supabase).

## Despliegue en Vercel
1. Importa este repositorio en Vercel.
2. Framework preset: **Vite**.
3. Añade las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el proyecto de Vercel (Settings → Environment Variables), con los mismos valores de `.env`.
4. Despliega. Vercel no "duerme": al ser un sitio estático servido por su CDN, está siempre disponible.

## Evitar que Supabase se pause
Los proyectos gratuitos de Supabase se pausan tras ~1 semana sin actividad. El workflow `.github/workflows/keep-alive.yml` hace una petición diaria a la API para mantenerlo activo. Para que funcione, añade estos secretos en GitHub (Settings → Secrets and variables → Actions):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

(mismos valores que en `.env`).

## Datos
- Tabla `publicaciones` (Postgres): `parcela_numero`, `nombre`, `tipo` (comentario/foto/video), `texto`, `archivo_url`, `created_at`.
- Bucket de Storage `parcelas-media`: fotos y vídeos subidos desde la app.
- Lectura e inserción son públicas (pensado para un grupo cerrado que solo conoce la URL); no hay edición ni borrado desde la app.

## Identificación de usuarios
No hay contraseñas. Al publicar por primera vez, se pide un nombre que se guarda en el navegador (`localStorage`) y se adjunta a cada comentario/foto/vídeo junto con la fecha y hora.
