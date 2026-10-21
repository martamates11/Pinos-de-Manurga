# Catastro · Pinos de Manurga

Visor cartográfico de parcelas con los comentarios, fotos y vídeos que se fueron añadiendo. Cada publicación muestra el nombre de quien la subió y la fecha/hora.

## Stack
- **Frontend**: Vite + Leaflet (mapa) + proj4 (conversión UTM → WGS84), desplegado en **Vercel**.
- **Sin backend**: las publicaciones están incrustadas en `src/publicacionesEstaticas.js` y las fotos en `public/fotos-parcelas/`. La app no necesita base de datos ni variables de entorno.

## Desarrollo local
```bash
npm install
npm run dev
```

## Despliegue en Vercel
1. Importa este repositorio en Vercel.
2. Framework preset: **Vite**.
3. Despliega. Al ser un sitio estático servido por su CDN, está siempre disponible.

## Añadir publicaciones
La app ya no guarda nada. Si alguien rellena un comentario o adjunta una foto/vídeo y pulsa **Guardar**, aparece un aviso pidiéndole que haga una captura de pantalla y se la envíe a Marta por WhatsApp. El aviso incluye un botón que abre un chat con Marta con el texto ya escrito. Para incorporar una publicación nueva:
1. Si tiene foto o vídeo, copia el archivo a `public/fotos-parcelas/`.
2. Añade una entrada a la lista de `src/publicacionesEstaticas.js` con `id` único, `parcela_numero`, `nombre`, `tipo` (comentario/foto/video), `texto`, `archivo_url` y `created_at`.

## Identificación de usuarios
No hay contraseñas. El botón 👤 guarda un nombre en el navegador (`localStorage`), que aparece en el aviso de captura.
