import L from 'leaflet';
import proj4 from 'proj4';
import { supabase, MEDIA_BUCKET } from './supabaseClient.js';

proj4.defs("EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");

const parcelas = [
    { ref: "18-03-0911-00-0000-0000-LU", seccion: "03", nombre: "MURABE", numero: "1", superficie: "1.698,27", xmin: 519959.351, ymin: 4758238.643, xmax: 520183.924, ymax: 4758350.212 },
    { ref: "18-03-1782-00-0000-0000-HZ", seccion: "03", nombre: "LA DEHESA", numero: "2", superficie: "3.627,60", xmin: 519985.119, ymin: 4757738.252, xmax: 520374.441, ymax: 4757931.67 },
    { ref: "18-03-1781-00-0000-0000-BR", seccion: "03", nombre: "LA DEHESA", numero: "3", superficie: "327,45", xmin: 520059.34, ymin: 4757845.348, xmax: 520246.483, ymax: 4757938.322 },
    { ref: "18-02-0624-00-0000-0000-KV", seccion: "02", nombre: "STA MARINA", numero: "5", superficie: "951,54", xmin: 519225.005, ymin: 4756350.634, xmax: 519519.533, ymax: 4756496.958 },
    { ref: "18-02-0865-00-0000-0000-IR", seccion: "02", nombre: "LA TEJERA", numero: "6", superficie: "11.265,81", xmin: 519202.863, ymin: 4756834.564, xmax: 519619.465, ymax: 4757041.535 },
    { ref: "18-02-0873-00-0000-0000-DX", seccion: "02", nombre: "LA TEJERA CHAVOLABARRI", numero: "7", superficie: "1.913,40", xmin: 519048.465, ymin: 4757391.545, xmax: 519313.136, ymax: 4757523.035 },
    { ref: "18-02-1789-00-0000-0000-IQ", seccion: "02", nombre: "AIDEGUI", numero: "9", superficie: "3.415,61", xmin: 518979.793, ymin: 4756536.379, xmax: 519338.573, ymax: 4756714.623 },
    { ref: "18-03-1783-00-0000-0000-AU", seccion: "03", nombre: "LA DEHESA", numero: "10", superficie: "514,89", xmin: 520018.883, ymin: 4757844.438, xmax: 520223.384, ymax: 4757946.036 },
    { ref: "18-02-0342-00-0000-0000-BR", seccion: "02", nombre: "ARRIZURI", numero: "11", superficie: "14.536,42", xmin: 519577.812, ymin: 4756374.028, xmax: 520180.945, ymax: 4756673.669 },
    { ref: "18-03-0695-00-0000-0000-CO", seccion: "03", nombre: "IZUA", numero: "12", superficie: "1.227,09", xmin: 518855.179, ymin: 4756809.513, xmax: 521106.739, ymax: 4757928.104 },
    { ref: "18-03-0930-00-0000-0000-GR", seccion: "03", nombre: "MURABE", numero: "13", superficie: "665,07", xmin: 519831.856, ymin: 4758068.721, xmax: 520049.687, ymax: 4758176.941 }
];

// =========================================================================
// Identidad del usuario (solo nombre, sin contraseña)
// =========================================================================
const NOMBRE_KEY = "catastro_nombre_usuario";
function getNombreUsuario() { return localStorage.getItem(NOMBRE_KEY) || ""; }
function setNombreUsuario(nombre) { localStorage.setItem(NOMBRE_KEY, nombre); }

function pedirNombre() {
    const actual = getNombreUsuario();
    const nombre = window.prompt("¿Cómo te llamas? Aparecerá junto a tus comentarios, fotos y vídeos.", actual);
    if (nombre && nombre.trim()) {
        setNombreUsuario(nombre.trim());
        actualizarBotonUsuario();
    }
    return getNombreUsuario();
}

function actualizarBotonUsuario() {
    const span = document.getElementById('nombreActual');
    const nombre = getNombreUsuario();
    span.textContent = nombre || "Identificarse";
}

// =========================================================================
// Lightbox para imágenes / vídeos a pantalla completa
// =========================================================================
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
document.getElementById('lightboxClose').addEventListener('click', cerrarLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) cerrarLightbox(); });

function abrirLightbox(url, tipo) {
    lightboxContent.innerHTML = tipo === 'video'
        ? `<video src="${url}" controls autoplay></video>`
        : `<img src="${url}" alt="" />`;
    lightbox.classList.add('open');
}
function cerrarLightbox() {
    lightbox.classList.remove('open');
    lightboxContent.innerHTML = '';
}
window.abrirLightbox = abrirLightbox;

function utmToLatLon(x, y) {
    const point = proj4("EPSG:25830", "EPSG:4326", [x, y]);
    return [point[1], point[0]];
}

function openNavigation(lat, lon, ref, nombre) {
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const destination = `${nombre} - ${ref.replace(/-/g, ' ')}`;
    if (isIOS) window.open(`https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(destination)}&dirflg=d`, '_blank');
    else window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
}
window.openNavigation = openNavigation;

// =========================================================================
// Mapa: zoom amplio (alejar/acercar mucho mejor que antes) y dos capas
// =========================================================================
const map = L.map('map', { minZoom: 9, maxZoom: 22, zoomSnap: 0.5 }).setView([42.85, -2.67], 12);

const capaCalle = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 22,
    maxNativeZoom: 19
});
const capaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri',
    maxZoom: 22,
    maxNativeZoom: 19
});
const capaLinderosCatastro = L.tileLayer.wms('https://geo.araba.eus/WMS_INSPIRE_CP', {
    layers: 'CP.CadastralParcel',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    attribution: 'Diputación Foral de Álava · GeoAraba',
    maxZoom: 22,
    maxNativeZoom: 21
});

capaCalle.addTo(map);
capaLinderosCatastro.addTo(map);
L.control.layers(
    { "Calle": capaCalle, "Satélite": capaSatelite },
    { "Linderos oficiales (Catastro)": capaLinderosCatastro }
).addTo(map);
L.control.scale({ metric: true, imperial: false }).addTo(map);

const colors = { "02": "#2a5298", "03": "#2a5298" };
let allBounds = null;
const markers = [];

function formatoFecha(iso) {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    return (str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function cargarPublicaciones(numero, contenedor) {
    contenedor.innerHTML = '<div style="font-size:0.55rem;color:#999;">Cargando…</div>';
    const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .eq('parcela_numero', numero)
        .order('created_at', { ascending: false });

    if (error) {
        contenedor.innerHTML = '<div style="font-size:0.55rem;color:#c0392b;">Error al cargar.</div>';
        return;
    }
    if (!data || data.length === 0) {
        contenedor.innerHTML = '<div style="font-size:0.55rem;color:#999;">Aún no hay comentarios, fotos ni vídeos.</div>';
        return;
    }

    contenedor.innerHTML = data.map(item => {
        let media = '';
        if (item.archivo_url && item.tipo === 'foto') {
            media = `<div class="publicacion-media"><img src="${item.archivo_url}" onclick="abrirLightbox('${item.archivo_url}','foto')" /></div>`;
        } else if (item.archivo_url && item.tipo === 'video') {
            media = `<div class="publicacion-media"><video src="${item.archivo_url}" onclick="abrirLightbox('${item.archivo_url}','video')" muted></video></div>`;
        }
        return `
            <div class="publicacion-item">
                <div class="publicacion-meta">
                    <span class="autor">${escapeHtml(item.nombre)}</span>
                    <span class="publicacion-meta-derecha">
                        <span>${formatoFecha(item.created_at)}</span>
                        <button class="btn-borrar" data-id="${item.id}" data-path="${item.archivo_path || ''}">🗑️ Eliminar</button>
                    </span>
                </div>
                ${item.texto ? `<div class="publicacion-texto">${escapeHtml(item.texto)}</div>` : ''}
                ${media}
            </div>
        `;
    }).join('');

    contenedor.querySelectorAll('.btn-borrar').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const path = btn.getAttribute('data-path');
            eliminarPublicacion(numero, id, path, contenedor);
        });
    });
}

async function eliminarPublicacion(numero, id, path, contenedor) {
    if (!window.confirm('¿Seguro que quieres eliminar esta publicación?')) return;
    if (!window.confirm('Esta acción no se puede deshacer. ¿Confirmas que quieres eliminarla definitivamente?')) return;

    try {
        if (path) {
            await supabase.storage.from(MEDIA_BUCKET).remove([path]);
        }
        const { error } = await supabase.from('publicaciones').delete().eq('id', id);
        if (error) throw error;
        await cargarPublicaciones(numero, contenedor);
    } catch (e) {
        console.error(e);
        window.alert('No se ha podido eliminar. Inténtalo de nuevo.');
    }
}

async function publicar(numero, texto, archivo, contenedorLista, statusEl) {
    let nombre = getNombreUsuario();
    if (!nombre) nombre = pedirNombre();
    if (!nombre) return;

    if (!texto && !archivo) {
        statusEl.textContent = 'Escribe un comentario o adjunta un archivo.';
        return;
    }

    statusEl.textContent = 'Publicando…';

    let archivo_url = null, archivo_path = null, tipo = 'comentario';
    try {
        if (archivo) {
            tipo = archivo.type.startsWith('video') ? 'video' : 'foto';
            const path = `${numero}/${Date.now()}_${archivo.name}`;
            const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, archivo);
            if (uploadError) throw uploadError;
            const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
            archivo_url = pub.publicUrl;
            archivo_path = path;
        }

        const { error: insertError } = await supabase.from('publicaciones').insert({
            parcela_numero: numero,
            nombre,
            tipo,
            texto: texto || null,
            archivo_url,
            archivo_path
        });
        if (insertError) throw insertError;

        statusEl.textContent = '';
        await cargarPublicaciones(numero, contenedorLista);
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Error al publicar. Inténtalo de nuevo.';
    }
}

parcelas.forEach((parcela, index) => {
    const minLatLon = utmToLatLon(parcela.xmin, parcela.ymin);
    const maxLatLon = utmToLatLon(parcela.xmax, parcela.ymax);
    const bounds = [[minLatLon[0], minLatLon[1]], [maxLatLon[0], maxLatLon[1]]];
    const centerLat = (minLatLon[0] + maxLatLon[0]) / 2;
    const centerLon = (minLatLon[1] + maxLatLon[1]) / 2;

    const listaId = `lista_${parcela.numero}`;
    const textareaId = `texto_${parcela.numero}`;
    const fileId = `file_${parcela.numero}`;
    const statusId = `status_${parcela.numero}`;
    const btnId = `btn_${parcela.numero}`;

    const popupContent = `
        <div class="popup-info">
            <div class="popup-nombre">${parcela.nombre}</div>
            <div class="popup-info-row">
                <span class="popup-numero">Nº ${parcela.numero}</span>
                <span class="popup-superficie">📐 ${parcela.superficie} m²</span>
            </div>
            <div class="popup-ref">📋 ${parcela.ref}</div>
            <div class="popup-coords">
                <div>📍 Coordenadas (WGS84):</div>
                <div>Latitud: ${centerLat.toFixed(6)}°</div>
                <div>Longitud: ${centerLon.toFixed(6)}°</div>
            </div>
            <button class="popup-nav-button" onclick="window.openNavigation(${centerLat}, ${centerLon}, '${parcela.ref}', '${parcela.nombre}')">
                🧭 Navegar hasta la parcela
            </button>
            <div class="publicaciones">
                <h4>💬 Comentarios, fotos y vídeos</h4>
                <div class="publicaciones-lista" id="${listaId}"></div>
                <div class="form-publicar">
                    <textarea id="${textareaId}" rows="2" placeholder="Escribe un comentario…"></textarea>
                    <input type="file" id="${fileId}" accept="image/*,video/*" />
                    <button class="btn-guardar" id="${btnId}" data-numero="${parcela.numero}">📤 Publicar</button>
                    <div id="${statusId}" style="font-size:0.55rem;color:#c0392b;margin-top:4px;"></div>
                </div>
            </div>
        </div>
    `;

    const marker = L.circleMarker([centerLat, centerLon], {
        radius: 10,
        fillColor: colors[parcela.seccion],
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.85
    }).addTo(map).bindPopup(popupContent, {
        maxWidth: Math.min(window.innerWidth - 24, 520),
        minWidth: Math.min(window.innerWidth - 24, 340),
        maxHeight: Math.round(window.innerHeight * 0.75)
    });

    const numeroEtiqueta = L.marker([centerLat, centerLon], {
        icon: L.divIcon({
            className: 'numero-etiqueta',
            html: `${parcela.numero}`,
            iconSize: [24, 18],
            popupAnchor: [0, -8]
        })
    }).addTo(map);

    numeroEtiqueta.on('click', () => { marker.openPopup(); });

    marker.on('popupopen', () => {
        const lista = document.getElementById(listaId);
        cargarPublicaciones(parcela.numero, lista);

        const btn = document.getElementById(btnId);
        btn.addEventListener('click', () => {
            const texto = document.getElementById(textareaId).value.trim();
            const archivo = document.getElementById(fileId).files[0];
            const statusEl = document.getElementById(statusId);
            publicar(parcela.numero, texto, archivo, lista, statusEl).then(() => {
                document.getElementById(textareaId).value = '';
                document.getElementById(fileId).value = '';
            });
        });
    });

    const rectLindero = L.rectangle(bounds, {
        color: '#d4af37',
        weight: 5,
        fillOpacity: 0,
        opacity: 0,
        interactive: false
    }).addTo(map);

    markers.push({ marker, etiqueta: numeroEtiqueta, bounds, center: [centerLat, centerLon], parcela, index, rectLindero, cercaLindero: false });

    if (!allBounds) allBounds = L.latLngBounds(bounds);
    else allBounds.extend(bounds);
});

if (allBounds) map.fitBounds(allBounds, { padding: [40, 40] });

document.getElementById('btnVerTodas').addEventListener('click', () => {
    if (allBounds) map.fitBounds(allBounds, { padding: [40, 40] });
});

document.getElementById('btnUsuario').addEventListener('click', pedirNombre);
actualizarBotonUsuario();

function activateParcela(index) {
    const markerData = markers[index];
    if (!markerData) return;
    map.fitBounds(markerData.bounds, { padding: [50, 50] });
    markerData.marker.openPopup();
    document.querySelectorAll('.dropdown-parcela').forEach(item => item.classList.remove('active'));
    const items = document.querySelectorAll('.dropdown-parcela');
    if (items[index]) items[index].classList.add('active');
    dropdownList.classList.remove('open');
    dropdownButton.classList.remove('open');
}

const dropdownItems = document.getElementById('dropdownItems');
parcelas.forEach((parcela, index) => {
    const item = document.createElement('div');
    item.className = 'dropdown-parcela';
    item.innerHTML = `
        <div class="dropdown-nombre">${parcela.nombre}</div>
        <div class="dropdown-numero">Nº ${parcela.numero} · Sección ${parcela.seccion}</div>
        <div class="dropdown-ref">${parcela.ref}</div>
    `;
    item.addEventListener('click', () => { activateParcela(index); });
    dropdownItems.appendChild(item);
});
document.querySelector('.dropdown-button').innerHTML = `📋 Parcelas (${parcelas.length}) <span class="dropdown-arrow">▼</span>`;

const dropdownButton = document.getElementById('dropdownButton');
const dropdownList = document.getElementById('dropdownList');

dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownList.classList.toggle('open');
    dropdownButton.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!dropdownButton.contains(e.target) && !dropdownList.contains(e.target)) {
        dropdownList.classList.remove('open');
        dropdownButton.classList.remove('open');
    }
});

// =========================================================================
// Herramienta de medición de distancias
// =========================================================================
const btnMedir = document.getElementById('btnMedir');
let midiendo = false;
let puntosMedicion = [];
let lineaMedicion = null;
const marcadoresMedicion = [];
const etiquetasMedicion = [];

function distanciaMetros(latlng1, latlng2) {
    return map.distance(latlng1, latlng2);
}

function formatoDistancia(metros) {
    return metros >= 1000 ? `${(metros / 1000).toFixed(2)} km` : `${metros.toFixed(1)} m`;
}

function limpiarMedicion() {
    puntosMedicion = [];
    indicePuntoArrastrado = null;
    map.dragging.enable();
    if (lineaMedicion) { map.removeLayer(lineaMedicion); lineaMedicion = null; }
    marcadoresMedicion.forEach(m => map.removeLayer(m));
    marcadoresMedicion.length = 0;
    etiquetasMedicion.forEach(e => map.removeLayer(e));
    etiquetasMedicion.length = 0;
}

function activarMedicion() {
    midiendo = true;
    limpiarMedicion();
    btnMedir.classList.add('activo');
    btnMedir.textContent = '✖️ Cancelar medición';
    map.getContainer().style.cursor = 'crosshair';
}

function desactivarMedicion() {
    midiendo = false;
    btnMedir.classList.remove('activo');
    btnMedir.textContent = '📏 Medir distancia';
    map.getContainer().style.cursor = '';
}

btnMedir.addEventListener('click', () => {
    if (midiendo) {
        desactivarMedicion();
        limpiarMedicion();
    } else {
        activarMedicion();
    }
});

function redibujarMedicion() {
    if (lineaMedicion) { map.removeLayer(lineaMedicion); lineaMedicion = null; }
    etiquetasMedicion.forEach(e => map.removeLayer(e));
    etiquetasMedicion.length = 0;

    if (puntosMedicion.length < 2) return;

    lineaMedicion = L.polyline(puntosMedicion, { color: '#0050ff', weight: 3, dashArray: '6 6' }).addTo(map);

    let total = 0;
    for (let i = 1; i < puntosMedicion.length; i++) {
        const a = puntosMedicion[i - 1];
        const b = puntosMedicion[i];
        const tramo = distanciaMetros(a, b);
        total += tramo;

        const midLat = (a.lat + b.lat) / 2;
        const midLng = (a.lng + b.lng) / 2;
        const etiqueta = L.marker([midLat, midLng], {
            icon: L.divIcon({
                className: 'etiqueta-distancia',
                html: puntosMedicion.length === 2
                    ? formatoDistancia(tramo)
                    : `${formatoDistancia(tramo)} <span class="etiqueta-distancia-total">(total: ${formatoDistancia(total)})</span>`
            }),
            interactive: false
        }).addTo(map);
        etiquetasMedicion.push(etiqueta);
    }
}

map.on('click', (e) => {
    if (!midiendo) return;

    const indice = puntosMedicion.length;
    puntosMedicion.push(e.latlng);

    const punto = L.marker(e.latlng, {
        icon: L.divIcon({ className: 'punto-medicion', iconSize: [18, 18], iconAnchor: [9, 9] }),
        draggable: true
    }).addTo(map);

    punto.on('drag', () => {
        puntosMedicion[indice] = punto.getLatLng();
        redibujarMedicion();
    });

    marcadoresMedicion.push(punto);
    redibujarMedicion();
});

// =========================================================================
// Geolocalización: el lindero se pone dorado al acercarse sobre el terreno
// =========================================================================
const UMBRAL_CERCA_METROS = 15;

function distanciaPuntoSegmento(p, a, b) {
    const origen = a;
    const ax = 0, ay = 0;
    const bx = (b.lng - origen.lng) * 111320 * Math.cos(origen.lat * Math.PI / 180);
    const by = (b.lat - origen.lat) * 110540;
    const px = (p.lng - origen.lng) * 111320 * Math.cos(origen.lat * Math.PI / 180);
    const py = (p.lat - origen.lat) * 110540;

    const dx = bx - ax, dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    let t = largo2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / largo2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
}

function anilloBbox(bounds) {
    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    return [
        L.latLng(minLat, minLng), L.latLng(minLat, maxLng),
        L.latLng(maxLat, maxLng), L.latLng(maxLat, minLng),
        L.latLng(minLat, minLng)
    ];
}

function distanciaAlLindero(p, m) {
    const anillo = m.anillo || anilloBbox(m.bounds);
    let min = Infinity;
    for (let i = 0; i < anillo.length - 1; i++) {
        min = Math.min(min, distanciaPuntoSegmento(p, anillo[i], anillo[i + 1]));
    }
    return min;
}

// =========================================================================
// Polígonos exactos de las parcelas (WFS INSPIRE de GeoAraba)
// =========================================================================
const WFS_CADASTRO_URL = 'https://geo.araba.eus/WFS_INSPIRE_CP';

function referenciaNacional(ref) {
    return ref.split('-').slice(0, 3).join('');
}

async function obtenerPoligonoReal(parcela) {
    const margen = 5;
    const bbox = `${parcela.xmin - margen},${parcela.ymin - margen},${parcela.xmax + margen},${parcela.ymax + margen},urn:ogc:def:crs:EPSG::25830`;
    const url = `${WFS_CADASTRO_URL}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=INSPIRE_CP:CP.CadastralParcel&BBOX=${bbox}&outputFormat=application/json`;

    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('WFS no disponible');
    const datos = await respuesta.json();

    const refBuscada = referenciaNacional(parcela.ref);
    const feature = (datos.features || []).find(f => f.properties && f.properties.nationalCadastralReference === refBuscada);
    if (!feature) return null;

    const anilloUtm = feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates[0][0];

    return anilloUtm.map(([x, y]) => {
        const [lat, lon] = utmToLatLon(x, y);
        return L.latLng(lat, lon);
    });
}

async function cargarPoligonosReales() {
    for (const m of markers) {
        try {
            const anillo = await obtenerPoligonoReal(m.parcela);
            if (!anillo) continue;

            m.anillo = anillo;
            map.removeLayer(m.rectLindero);
            m.rectLindero = L.polygon(anillo, {
                color: '#d4af37',
                weight: 5,
                fillOpacity: 0,
                opacity: 0,
                interactive: false
            }).addTo(map);
        } catch (e) {
            console.error(`No se pudo obtener el polígono real de la parcela ${m.parcela.nombre}`, e);
        }
    }
}
cargarPoligonosReales();

let marcadorUbicacion = null;
let circuloPrecision = null;

function actualizarUbicacion(pos) {
    const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);

    if (!marcadorUbicacion) {
        marcadorUbicacion = L.marker(latlng, {
            icon: L.divIcon({ className: 'punto-ubicacion', iconSize: [16, 16], iconAnchor: [8, 8] }),
            zIndexOffset: 1000,
            interactive: false
        }).addTo(map);
        circuloPrecision = L.circle(latlng, { radius: pos.coords.accuracy || 0, color: '#2a5298', weight: 1, fillOpacity: 0.08, interactive: false }).addTo(map);
    } else {
        marcadorUbicacion.setLatLng(latlng);
        circuloPrecision.setLatLng(latlng);
        circuloPrecision.setRadius(pos.coords.accuracy || 0);
    }

    markers.forEach(m => {
        const distancia = distanciaAlLindero(latlng, m);
        const cerca = distancia <= UMBRAL_CERCA_METROS;
        if (cerca !== m.cercaLindero) {
            m.cercaLindero = cerca;
            m.rectLindero.setStyle({ opacity: cerca ? 0.95 : 0 });
            if (cerca) m.rectLindero.bringToFront();
        }
    });
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(actualizarUbicacion, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000
    });
}
