# D.O. · El Mapa del Sabor

Atlas pedagógico e interactivo de los productos españoles con **DOP**, **IGP** y **ETG**.
Un mapa de España por comunidades autónomas: cada región se colorea según cuántos
productos con sello de calidad reúne; al seleccionarla se despliegan sus productos, con
ficha explicativa y hueco reservado para el vídeo de elaboración y la compra directa
(fases posteriores — ver `PLAN.md`).

> Carpeta autocontenida: pensada para moverse tal cual a su propio repositorio.

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción en dist/
npm run build:map # regenerar los paths SVG del mapa (solo si cambia la cartografía)
```

Sin dependencias en runtime: todo es HTML/CSS/JS vanilla servido por Vite.

## Estructura

- `src/data/mapa-ccaa.js` — paths SVG de las CCAA, **generado** por `tools/build-map.mjs`
  a partir de es-atlas (IGN/INE) con la proyección cónica conforme compuesta de España
  (Canarias recolocada en su recuadro).
- `src/data/productos.js` — dataset de productos. **Muestra inicial curada (~200)**,
  pendiente de cotejo completo con los listados del
  [MAPA](https://www.mapa.gob.es/es/alimentacion/temas/calidad-diferenciada/dop-igp)
  hasta las 393 indicaciones registradas.
- `src/main.js` — mapa interactivo, filtros por categoría, buscador, panel de región y
  ficha de producto.
- `src/style.css` — tema oscuro cálido; paleta de insignias DOP/IGP/ETG validada para
  daltonismo y contraste (las insignias llevan siempre etiqueta de texto).

## Estado

MVP de frontend. Pendiente (ver `PLAN.md`): dataset completo del Ministerio, vídeos de
elaboración con permisos, convenios de compra directa.
