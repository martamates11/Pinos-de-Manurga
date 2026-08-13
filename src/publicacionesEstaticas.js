// Copia estática de las publicaciones que había en Supabase en el momento de la
// migración (13/08/2026), para que la app pueda mostrarlas sin depender de la
// base de datos. Las publicaciones nuevas se siguen guardando y leyendo desde
// Supabase (ver cargarPublicaciones en main.js), que las combina con esta lista
// evitando duplicados por "id".
export const publicacionesEstaticas = [
    { id: "35ed78c8-9ca1-4c27-a768-ddf02cb49b4f", parcela_numero: "1", nombre: "Aita", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-1-a.jpg", created_at: "2026-06-27T08:37:13.335283+00:00" },
    { id: "0fbed33e-03c2-463b-baf1-f60adffe9563", parcela_numero: "1", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-1-b.jpg", created_at: "2026-07-04T09:12:22.772582+00:00" },
    { id: "cc04e0a8-9738-493c-8760-b92f48e8a9ae", parcela_numero: "2", nombre: "Aita", tipo: "comentario", texto: "La forma no coincide; es más cuadrada", archivo_url: null, created_at: "2026-06-25T18:56:12.251753+00:00" },
    { id: "859cff01-8416-4e4f-8a6d-cf5cd0aaabde", parcela_numero: "2", nombre: "Aita", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-2-a.jpg", created_at: "2026-06-27T08:39:24.549294+00:00" },
    { id: "3baa25a3-ba2f-4415-ac72-e9782b364e45", parcela_numero: "3", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-3-a.jpg", created_at: "2026-07-04T09:47:52.534603+00:00" },
    { id: "2699cf5c-245c-4432-8b7f-bd6ccb309b71", parcela_numero: "5", nombre: "Marta", tipo: "comentario", texto: "M", archivo_url: null, created_at: "2026-07-06T12:10:08.998238+00:00" },
    { id: "0c69c6ff-f384-430d-9355-851589bc0920", parcela_numero: "7", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-7-a.jpg", created_at: "2026-07-03T15:43:49.14991+00:00" },
    { id: "ff4120f3-4fa0-4662-ba2d-777414e6f817", parcela_numero: "9", nombre: "Marta", tipo: "comentario", texto: "Participación del 20 %", archivo_url: null, created_at: "2026-07-04T10:09:46.906377+00:00" },
    { id: "b8e0ad2c-c171-4a5a-8c1a-bbc363aa0805", parcela_numero: "11", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-11-a.jpg", created_at: "2026-07-03T15:52:39.89338+00:00" },
    { id: "1b765bbe-dc40-487e-b366-4226bf0f099f", parcela_numero: "12", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-12-a.jpg", created_at: "2026-07-03T16:19:59.346474+00:00" },
    { id: "e07fccd0-22a4-4ec1-b509-fc8d2cd73d52", parcela_numero: "12", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-12-b.jpg", created_at: "2026-07-03T16:20:17.888663+00:00" },
    { id: "b8b6f76b-cee3-4479-bc74-cfe1ff1217ec", parcela_numero: "12", nombre: "Marta", tipo: "comentario", texto: "Pasando la casa de Félix, camino Aldape, hay un murete", archivo_url: null, created_at: "2026-07-03T16:21:02.48683+00:00" },
    { id: "faa0d0b0-e4d4-4c02-94cd-51be5ce5d4b5", parcela_numero: "12", nombre: "Marta", tipo: "foto", texto: null, archivo_url: "/fotos-parcelas/parcela-12-c.jpg", created_at: "2026-07-03T19:03:28.490595+00:00" }
];

export function publicacionesEstaticasDeParcela(numero) {
    return publicacionesEstaticas.filter(p => p.parcela_numero === numero);
}
