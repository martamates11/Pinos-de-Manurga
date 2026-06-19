import L from 'leaflet';
import proj4 from 'proj4';
import { supabase, MEDIA_BUCKET } from './supabaseClient.js';

proj4.defs("EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");

// =========================================================================
// Imágenes catastrales oficiales (referencia fija, no subidas por usuarios)
// =========================================================================
const imagenesParcelas = {
    "1": "https://images2.imgbox.com/f4/77/xIeGNVPK_o.png",
    "2": "https://images2.imgbox.com/e8/2a/bkVQtSwo_o.png",
    "3": "https://images2.imgbox.com/c8/06/DWUx31k8_o.png",
    "5": "https://i.imgur.com/zV2qED9.png",
    "6": "https://images2.imgbox.com/40/82/yoZGnVO6_o.png",
    "7": "https://images2.imgbox.com/18/31/ofcI4swk_o.png",
    "9": "https://images2.imgbox.com/1b/5d/qWQAExPX_o.png",
    "10": "https://images2.imgbox.com/28/41/wQISYIkz_o.png",
    "11": "https://i.imgur.com/stX20iY.png",
    "12": "https://images2.imgbox.com/1f/52/UmHk0MQO_o.png",
    "13": "https://images2.imgbox.com/96/a0/7bZvegKO_o.png"
};

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
const capaLinderosCatastro = L.tileLayer.wms('https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx', {
    layers: 'Catastro',
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: 'Sede Electrónica del Catastro',
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

    const imagenUrl = imagenesParcelas[parcela.numero] || null;
    const imagenHtml = imagenUrl ? `
        <div class="popup-imagen" onclick="abrirLightbox('${imagenUrl}','foto')">
            <img src="${imagenUrl}" alt="Forma catastral de ${parcela.nombre}" />
            <div class="zoom-icon">🔍 Haz clic para ampliar</div>
        </div>
    ` : '';

    const listaId = `lista_${parcela.numero}`;
    const textareaId = `texto_${parcela.numero}`;
    const fileId = `file_${parcela.numero}`;
    const statusId = `status_${parcela.numero}`;
    const btnId = `btn_${parcela.numero}`;

    const popupContent = `
        <div class="popup-info">
            ${imagenHtml}
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

    markers.push({ marker, etiqueta: numeroEtiqueta, bounds, center: [centerLat, centerLon], parcela, index });

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
    const tieneImagen = imagenesParcelas[parcela.numero] ? ' 🖼️' : '';
    item.innerHTML = `
        <div class="dropdown-nombre">${parcela.nombre}${tieneImagen}</div>
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
