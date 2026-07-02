# D.O. El Mapa del Sabor — Plan de proyecto

> **Nota de ubicación**: este documento vive temporalmente dentro del repositorio
> `Pinos-de-Manurga` (carpeta autocontenida, sin dependencias del resto del repo)
> porque la sesión de trabajo actual solo tiene acceso a este repositorio. La
> decisión de producto es que este proyecto debe acabar en **su propio
> repositorio** (`do-mapa-del-sabor` o similar) en cuanto se pueda crear. Esta
> carpeta está pensada para copiarse/moverse tal cual a ese repo nuevo.

## 1. Concepto

Aplicación web pedagógica: un mapa interactivo de España en el que, al
seleccionar una comunidad autónoma, se despliegan los productos con
Denominación de Origen Protegida (DOP), Indicación Geográfica Protegida (IGP)
o Especialidad Tradicional Garantizada (ETG) de esa región. Cada producto
tiene una ficha explicativa y, cuando exista convenio comercial, un enlace de
compra directa a tiendas asociadas. El vídeo explicativo del proceso de
elaboración se contempla como fase posterior, no en el MVP.

## 2. Fuente de datos

Ministerio de Agricultura, Pesca y Alimentación (MAPA):
`https://www.mapa.gob.es/es/alimentacion/temas/calidad-diferenciada/dop-igp`

- Dataset a diciembre de 2025: **393 indicaciones geográficas** — 216 DOP +
  174 IGP + 3 ETG.
- Publicado como **PDFs**, no como API/dataset estructurado:
  - Listado general por CCAA (`04_igs_por_ccaa.pdf`)
  - Listados por categoría de producto (vinos `02_vinos.pdf`, quesos, etc.)
- El sitio bloquea peticiones automatizadas (403 a fetchers), así que la
  descarga y conversión inicial de los PDF a datos estructurados debe hacerse
  manualmente (o semi-manualmente, con un script de scraping/parsing de PDF
  ejecutado localmente por una persona, no desde este entorno).
- Los datos habrá que revisarlos periódicamente: el Ministerio da de alta y
  de baja denominaciones con cierta frecuencia.

## 3. Decisiones de producto ya tomadas

| Decisión | Resultado |
|---|---|
| Repositorio | Repo nuevo e independiente (pendiente de creación) |
| Vídeo pedagógico en el MVP | **No** — se añade en una fase posterior |
| Alcance de datos del MVP | **Completo**: los 393 productos desde el inicio, aunque muchas fichas empiecen con contenido mínimo |

## 4. Funcionalidades

| Módulo | MVP | Fase posterior |
|---|---|---|
| Mapa dinámico de España por CCAA | Sí | — |
| Ficha de producto (nombre, tipo, CCAA, categoría DOP/IGP/ETG, descripción) | Sí | Enriquecer contenido progresivamente |
| Buscador/filtro (por tipo, por región) | Sí | Filtro "con vídeo" / "disponible para comprar" |
| Vídeo del proceso de elaboración | No | Sí, empezando por 10-20 productos estrella |
| Enlaces de compra directa (afiliación con tiendas) | No | Sí, según convenios comerciales cerrados |
| Rutas gastronómicas / turismo | No | Fase de escalado |

## 5. Modelo de datos propuesto (borrador)

```
Producto
├── id
├── nombre
├── tipo_indicacion        # DOP | IGP | ETG
├── categoria_producto     # queso, vino, aceite, carne, miel, fruta_hortaliza, ...
├── ccaa                   # comunidad autónoma
├── descripcion
├── anio_reconocimiento
├── video_url              # null en MVP
├── tienda_afiliada_url    # null hasta que haya convenio
└── estado_convenio        # sin_contactar | en_negociacion | acuerdo_cerrado
```

`ccaa` como clave de filtrado principal del mapa; `categoria_producto` como
filtro secundario.

## 6. Fases

**Fase 0 — Fundaciones**
- Crear el repositorio definitivo del proyecto.
- Descargar y transcribir manualmente los PDF del MAPA a un dataset limpio
  (CSV/JSON) con los 393 productos.
- Definir stack técnico definitivo (mapa interactivo tipo Leaflet/Mapbox +
  frontend ligero; dado que ya se usa Leaflet en otro proyecto del mismo
  equipo, es una opción natural por familiaridad).

**Fase 1 — MVP**
- Mapa interactivo por CCAA + listado de productos.
- Fichas de producto con los 393 registros (contenido mínimo: nombre, tipo,
  categoría, CCAA, descripción breve).
- Sin vídeo, sin tienda todavía.

**Fase 2 — Contenido pedagógico (vídeo)**
- Selección/producción de vídeo para productos prioritarios.
- Gestión de permisos si se usan vídeos de terceros (consejos reguladores,
  cooperativas): no basta con que el vídeo esté en YouTube, hace falta
  autorización de reutilización/embed.

**Fase 3 — Comercial (en paralelo a Fase 2, y cuanto antes mejor)**
- Contactar tiendas y consejos reguladores para convenios de venta/afiliación.
- Es trabajo de negociación humana, no de desarrollo: es el cuello de botella
  más probable del proyecto y conviene arrancarlo ya, en paralelo al MVP.

**Fase 4 — Activación comercial**
- Añadir enlaces de compra solo a los productos con convenio cerrado.

**Fase 5 — Escalado**
- Rutas turísticas, newsletter, posible app móvil.

## 7. Riesgos e inconvenientes

1. **Dato no estructurado (PDF)**: conversión inicial manual, sin atajo fiable
   automatizado.
2. **Nombres y sellos DOP/IGP protegidos**: se puede informar sobre ellos,
   pero no se puede usar el logotipo oficial ni sugerir aval institucional sin
   autorización del consejo regulador correspondiente. Revisar con asesoría
   antes de publicar.
3. **Derechos de vídeo de terceros**: necesitan permiso explícito de
   reutilización, no solo estar publicados en abierto.
4. **Convenios comerciales**: cuello de botella real del proyecto; no depende
   del desarrollo técnico.
5. **Mantenimiento del dato**: altas/bajas periódicas de DOP/IGP en el
   Ministerio: hace falta un proceso de revisión, no es "cargar una vez y
   olvidar".
6. **Alcance completo desde el MVP**: cargar los 393 productos de golpe
   significa que muchas fichas estarán vacías de contenido al principio;
   asumir que la fase de enriquecimiento de contenido será larga.

## 8. Próximos pasos concretos

1. Crear el repositorio nuevo del proyecto.
2. Descargar y transcribir los PDF del MAPA (`04_igs_por_ccaa.pdf` y los
   listados por categoría) a un dataset estructurado.
3. Empezar en paralelo el contacto con consejos reguladores/tiendas para
   convenios comerciales (Fase 3), dado que es lo que más tiempo tardará.
4. Con el dataset listo, arrancar el desarrollo del MVP (Fase 1).
