// Genera src/data/mapa-ccaa.js con los paths SVG de las CCAA precalculados.
// Fuente: es-atlas (IGN/INE) + proyección cónica conforme compuesta de España,
// que recoloca Canarias junto a la península. Ejecutar: node tools/build-map.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { feature, mesh } from 'topojson-client';
import { geoPath } from 'd3-geo';
import geoConicConformalSpain from 'd3-composite-projections/src/conicConformalSpain.js';

const W = 960;
const H = 620;

const topo = JSON.parse(
  readFileSync(new URL('../node_modules/es-atlas/es/autonomous_regions.json', import.meta.url))
);

const regions = feature(topo, topo.objects.autonomous_regions);
const projection = geoConicConformalSpain().fitExtent(
  [[8, 8], [W - 8, H - 8]],
  regions
);
const path = geoPath(projection);

// Gibraltar (id 20) no es una comunidad autónoma: se excluye.
const features = regions.features.filter((f) => f.id !== '20');

const ccaa = features.map((f) => ({
  id: f.id,
  nombre: f.properties.name,
  d: path(f),
  centroide: path.centroid(f).map((v) => Math.round(v * 10) / 10),
}));

// Marco del recuadro de Canarias que dibuja la proyección compuesta.
const inset = projection.getCompositionBorders();

const out = `// Generado por tools/build-map.mjs — no editar a mano.
export const MAPA_VIEWBOX = '0 0 ${W} ${H}';
export const CANARIAS_INSET = ${JSON.stringify(inset)};
export const CCAA_PATHS = ${JSON.stringify(ccaa)};
`;

writeFileSync(new URL('../src/data/mapa-ccaa.js', import.meta.url), out);
console.log(`OK: ${ccaa.length} comunidades escritas en src/data/mapa-ccaa.js`);
