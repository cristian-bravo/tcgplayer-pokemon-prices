# Arquitectura

## Objetivo

El sistema obtiene listados de productos Pokemon desde el endpoint de busqueda de TCGplayer, conserva las respuestas originales y produce exportaciones normalizadas para analisis de precios.

Endpoint base:

```text
https://mp-search-api.tcgplayer.com/v1/search/request
```

## Flujo principal

1. Cargar configuracion de entorno y opciones de CLI.
2. Construir una solicitud de busqueda con filtro `productLineName = pokemon`.
3. Ejecutar paginas con `from` y `size`.
4. Guardar cada respuesta sin modificar en `data/raw/`.
5. Validar y normalizar registros.
6. Escribir datos normalizados en `data/normalized/<runId>/pokemon-products.json`.
7. Escribir CSV final en `data/exports/<runId>/pokemon-prices.csv`.
8. Guardar manifiestos de ejecucion en `data/manifests/`.
9. Emitir logs estructurados con conteos, duracion y errores.

## Componentes

### CLI

Responsable de leer flags como limite de paginas, tamano de pagina, directorio de salida, filtros y modo dry-run. Delega la logica de scraping y exportacion a modulos internos.

### Cliente TCGplayer

Responsable de construir solicitudes HTTP al endpoint de busqueda, aplicar timeouts, reintentos acotados y registrar metadatos de respuesta.

### Paginador

Responsable de controlar `from` y `size`.

Reglas recomendadas:

- `from` inicia en `0`.
- `size` debe ser configurable y tener un valor por defecto conservador.
- La siguiente pagina usa `from + size`.
- El proceso se detiene al alcanzar el total reportado, una pagina vacia o un limite configurado.

### Persistencia raw

Guarda cada respuesta completa en `data/raw/` con nombre deterministico que permita reconstruir la ejecucion.

Ejemplo:

```text
data/raw/2026-05-21T20-41-00-000Z/page-0001.json
```

### Normalizador

Transforma productos encontrados en un formato estable para exportacion. Debe tolerar campos faltantes y conservar referencias al archivo raw de origen. Si se materializa el resultado intermedio, debe escribirse en `data/normalized/`.

### Exportador

Escribe resultados en `data/exports/`, preferentemente en JSONL o CSV. El formato elegido debe quedar documentado en `docs/data-contract.md`.

### Manifiestos

Guarda resumenes por corrida en `data/manifests/`: parametros, inicio y fin, conteos, archivos generados, errores recuperables y version del contrato de exportacion.

## Configuracion

Variables sugeridas:

```text
TCGPLAYER_MAX_PAGE_SIZE=48
TCGPLAYER_MIN_DELAY_MS=10000
TCGPLAYER_TIMEOUT_MS=30000
TCGPLAYER_RETRY_ATTEMPTS=3
TCGPLAYER_SHIPPING_COUNTRY=US
```

Los valores por defecto deben priorizar estabilidad y bajo impacto sobre velocidad.

## Dependencias actuales

El manifiesto inicial incluye librerias utiles para este diseno:

- `commander`: interfaz CLI.
- `dotenv`: carga de variables de entorno.
- `bottleneck`: limitacion de ritmo y concurrencia.
- `pino`: logs estructurados.
- `zod`: validacion de configuracion y datos.
- `tsx`, `typescript`, `vitest` y `eslint`: base esperada para desarrollo TypeScript, pruebas y linting.

## Fronteras del sistema

- El scraper no debe modificar `package.json`, `src/` o tests desde tareas de documentacion.
- Los datos crudos y exportados son artefactos generados, no codigo fuente.
- El endpoint externo puede cambiar sin aviso; los validadores deben fallar con mensajes claros.
