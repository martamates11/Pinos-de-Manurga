import './style.css';
import { MAPA_VIEWBOX, CANARIAS_INSET, CCAA_PATHS } from './data/mapa-ccaa.js';
import { PRODUCTOS, CATEGORIAS, NOMBRES_CCAA } from './data/productos.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Rampa secuencial (magnitud = nº de productos) sobre fondo oscuro: de tierra a azafrán.
const RAMPA = ['#3a2418', '#6b431d', '#95621d', '#c08420', '#eab04a'];
const SIN_PRODUCTOS = '#2a1c21';

const estado = {
  regionSeleccionada: null, // id de CCAA o null
  categoria: null,          // clave de CATEGORIAS o null (todas)
  busqueda: '',
};

const $ = (sel) => document.querySelector(sel);

// ——— utilidades de datos ———

function productosFiltrados() {
  const q = estado.busqueda.trim().toLowerCase();
  return PRODUCTOS.filter((p) => {
    if (estado.categoria && p.c !== estado.categoria) return false;
    if (q && !`${p.n} ${p.d}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function productosDeRegion(id, lista = productosFiltrados()) {
  return lista.filter((p) => p.ccaa.includes(id));
}

function colorPorCuenta(cuenta, max) {
  if (!cuenta) return SIN_PRODUCTOS;
  const t = Math.min(1, cuenta / max);
  const pos = t * (RAMPA.length - 1);
  const i = Math.min(RAMPA.length - 2, Math.floor(pos));
  return mezclar(RAMPA[i], RAMPA[i + 1], pos - i);
}

function mezclar(a, b, t) {
  const ca = hex(a), cb = hex(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hex(h) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function escapar(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ——— estadísticas del hero ———

function pintarStats() {
  const total = PRODUCTOS.length;
  const dop = PRODUCTOS.filter((p) => p.t === 'DOP').length;
  const igp = PRODUCTOS.filter((p) => p.t === 'IGP').length;
  const etg = PRODUCTOS.filter((p) => p.t === 'ETG').length;
  $('#stats-row').innerHTML = [
    [total, 'productos en la muestra'],
    [dop, 'DOP'],
    [igp, 'IGP'],
    [etg, 'ETG'],
    [17, 'comunidades'],
  ]
    .map(([n, l]) => `<div class="stat"><span class="num">${n}</span><span class="lbl">${l}</span></div>`)
    .join('');
}

// ——— chips de categoría ———

function pintarChips() {
  const chips = [
    `<button class="chip" data-cat="" aria-pressed="${!estado.categoria}">✦ Todas</button>`,
    ...Object.entries(CATEGORIAS).map(
      ([clave, c]) =>
        `<button class="chip" data-cat="${clave}" aria-pressed="${estado.categoria === clave}">${c.icono} ${c.nombre}</button>`
    ),
  ];
  $('#chips').innerHTML = chips.join('');
}

$('#chips').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  estado.categoria = btn.dataset.cat || null;
  pintarChips();
  pintarMapa();
  pintarPanel();
});

// ——— mapa ———

const svg = $('#mapa');
svg.setAttribute('viewBox', MAPA_VIEWBOX);

const capaRegiones = document.createElementNS(SVG_NS, 'g');
svg.appendChild(capaRegiones);

const inset = document.createElementNS(SVG_NS, 'path');
inset.setAttribute('d', CANARIAS_INSET);
inset.setAttribute('class', 'inset-canarias');
svg.appendChild(inset);

const elementosCCAA = new Map();

for (const region of CCAA_PATHS) {
  if (!region.d) continue;
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', region.d);
  p.setAttribute('class', 'ccaa');
  p.setAttribute('tabindex', '0');
  p.setAttribute('role', 'button');
  p.dataset.id = region.id;
  capaRegiones.appendChild(p);
  elementosCCAA.set(region.id, p);
}

function pintarMapa() {
  const lista = productosFiltrados();
  const cuentas = new Map();
  let max = 1;
  for (const [id] of elementosCCAA) {
    const n = productosDeRegion(id, lista).length;
    cuentas.set(id, n);
    if (n > max) max = n;
  }
  for (const [id, el] of elementosCCAA) {
    el.setAttribute('fill', colorPorCuenta(cuentas.get(id), max));
    const nombre = NOMBRES_CCAA[id] || id;
    el.setAttribute('aria-label', `${nombre}: ${cuentas.get(id)} productos`);
    el.classList.toggle('seleccionada', estado.regionSeleccionada === id);
  }
  svg.classList.toggle('mapa-atenuado', !!estado.regionSeleccionada);
}

// tooltip
const tooltip = $('#tooltip');

svg.addEventListener('pointermove', (e) => {
  const el = e.target.closest('.ccaa');
  if (!el) return ocultarTooltip();
  const id = el.dataset.id;
  const n = productosDeRegion(id).length;
  const nombre = NOMBRES_CCAA[id] || id;
  tooltip.innerHTML = `<span class="t-nombre">${escapar(nombre)}</span><span class="t-detalle">${
    n ? `${n} producto${n === 1 ? '' : 's'} con sello de calidad` : 'Sin registros en la muestra actual'
  }</span>`;
  const caja = svg.getBoundingClientRect();
  const x = e.clientX - caja.left;
  const y = e.clientY - caja.top;
  tooltip.style.left = `${Math.min(x + 14, caja.width - 220)}px`;
  tooltip.style.top = `${y + 16}px`;
  tooltip.classList.add('visible');
});

svg.addEventListener('pointerleave', ocultarTooltip);

function ocultarTooltip() {
  tooltip.classList.remove('visible');
}

function activarRegion(id) {
  estado.regionSeleccionada = estado.regionSeleccionada === id ? null : id;
  pintarMapa();
  pintarPanel();
  if (window.matchMedia('(max-width: 940px)').matches && estado.regionSeleccionada) {
    $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

svg.addEventListener('click', (e) => {
  const el = e.target.closest('.ccaa');
  if (el) activarRegion(el.dataset.id);
});

svg.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('.ccaa');
  if (el) {
    e.preventDefault();
    activarRegion(el.dataset.id);
  }
});

// ——— panel lateral ———

function pintarPanel() {
  const panel = $('#panel');
  const q = estado.busqueda.trim();

  // búsqueda global activa y sin región: resultados en toda España
  if (q && !estado.regionSeleccionada) {
    const resultados = productosFiltrados();
    panel.innerHTML = `
      <div class="panel-region">
        <h2>Resultados</h2>
        <p class="panel-sub">${resultados.length} producto${resultados.length === 1 ? '' : 's'} para «${escapar(q)}» en toda España</p>
        ${resultados.length ? listaProductos(resultados, true) : '<p class="sin-datos">Nada por aquí… prueba con otro nombre.</p>'}
      </div>`;
    return;
  }

  if (!estado.regionSeleccionada) {
    const lista = productosFiltrados();
    const ranking = [...elementosCCAA.keys()]
      .map((id) => [id, productosDeRegion(id, lista).length])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    panel.innerHTML = `
      <div class="panel-vacio">
        <h2>Elige una región del mapa</h2>
        <p>Cada comunidad guarda quesos, vinos, aceites y dulces que solo pueden nacer allí.
        Cuanto más dorada aparece en el mapa, más tesoros reúne.</p>
        <p class="pista">O empieza por las más ricas en denominaciones:</p>
        <ol class="ranking">
          ${ranking
            .map(
              ([id, n]) =>
                `<li><button data-region="${id}"><span>${escapar(NOMBRES_CCAA[id] || id)}</span><span class="r-num">${n}</span></button></li>`
            )
            .join('')}
        </ol>
      </div>`;
    return;
  }

  const id = estado.regionSeleccionada;
  const nombre = NOMBRES_CCAA[id] || id;
  const productos = productosDeRegion(id);

  panel.innerHTML = `
    <div class="panel-region">
      <button class="volver" data-volver>← Ver toda España</button>
      <h2>${escapar(nombre)}</h2>
      <p class="panel-sub">${
        productos.length
          ? `${productos.length} producto${productos.length === 1 ? '' : 's'} con sello de calidad europea`
          : 'Sin registros con los filtros actuales'
      }</p>
      ${productos.length ? listaProductos(productos) : `<p class="sin-datos">Prueba a quitar filtros o revisa otra categoría.</p>`}
    </div>`;
}

function listaProductos(productos, mostrarRegion = false) {
  const porCategoria = new Map();
  for (const p of productos) {
    if (!porCategoria.has(p.c)) porCategoria.set(p.c, []);
    porCategoria.get(p.c).push(p);
  }
  return [...porCategoria.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(
      ([cat, items]) => `
      <div class="grupo-cat">
        <h3>${CATEGORIAS[cat].icono} ${CATEGORIAS[cat].nombre}</h3>
        ${items
          .map((p) => {
            const idx = PRODUCTOS.indexOf(p);
            const region = mostrarRegion
              ? `<span class="resultado-region">${escapar(NOMBRES_CCAA[p.ccaa[0]] || '')}${p.ccaa.length > 1 ? ' +' + (p.ccaa.length - 1) : ''}</span>`
              : '';
            return `<button class="producto" data-producto="${idx}">
              <span class="p-nombre">${escapar(p.n)}</span>${region}
              <span class="badge badge-${p.t}">${p.t}</span>
            </button>`;
          })
          .join('')}
      </div>`
    )
    .join('');
}

$('#panel').addEventListener('click', (e) => {
  const volver = e.target.closest('[data-volver]');
  if (volver) {
    estado.regionSeleccionada = null;
    pintarMapa();
    pintarPanel();
    return;
  }
  const regionBtn = e.target.closest('[data-region]');
  if (regionBtn) {
    activarRegion(regionBtn.dataset.region);
    return;
  }
  const prodBtn = e.target.closest('[data-producto]');
  if (prodBtn) abrirFicha(PRODUCTOS[Number(prodBtn.dataset.producto)]);
});

// ——— buscador ———

$('#buscador').addEventListener('input', (e) => {
  estado.busqueda = e.target.value;
  if (estado.busqueda.trim()) estado.regionSeleccionada = null;
  pintarMapa();
  pintarPanel();
});

// ——— ficha de producto ———

const ficha = $('#ficha');

function abrirFicha(p) {
  const cat = CATEGORIAS[p.c];
  const regiones = p.ccaa.map((id) => NOMBRES_CCAA[id] || id);
  const listaRegiones =
    regiones.length > 3 ? `${regiones.slice(0, 3).join(' · ')} y ${regiones.length - 3} más` : regiones.join(' · ');
  ficha.innerHTML = `
    <div class="ficha-cuerpo">
      <div class="ficha-cats">
        <span class="ficha-icono" aria-hidden="true">${cat.icono}</span>
        <span class="badge badge-${p.t}">${p.t}</span>
      </div>
      <h2>${escapar(p.n)}</h2>
      <p class="ficha-region">📍 ${escapar(listaRegiones)} · ${cat.nombre}</p>
      <p class="ficha-desc">${escapar(p.d)}</p>
      <div class="ficha-proximamente">
        <div class="proximo"><span class="px-icono">🎬</span><span><strong>Vídeo del proceso de elaboración</strong>Disponible próximamente en esta ficha.</span></div>
        <div class="proximo"><span class="px-icono">🛒</span><span><strong>Compra directa al productor</strong>En preparación: convenios con tiendas y consejos reguladores.</span></div>
      </div>
      <button class="cerrar" data-cerrar>Seguir explorando</button>
    </div>`;
  ficha.showModal();
}

ficha.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar]') || e.target === ficha) ficha.close();
});

// ——— arranque ———

pintarStats();
pintarChips();
pintarMapa();
pintarPanel();
