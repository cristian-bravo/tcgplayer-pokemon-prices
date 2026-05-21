# Operaciones

## Preparacion

Instalar dependencias:

```bash
npm install
```

Crear configuracion local si existe una plantilla:

```bash
cp .env.example .env
```

Variables sugeridas:

```text
TCGPLAYER_SEARCH_ENDPOINT=https://mp-search-api.tcgplayer.com/v1/search/request
TCGPLAYER_MPFEV=5199
TCGPLAYER_SHIPPING_COUNTRY=US
TCGPLAYER_MIN_DELAY_MS=10000
TCGPLAYER_TIMEOUT_MS=30000
TCGPLAYER_RETRY_ATTEMPTS=3
TCGPLAYER_MAX_PAGE_SIZE=48
TCGPLAYER_USER_AGENT=tcgplayer-pokemon-prices/1.0
```

## Ejecucion

Comando:

```bash
npm run scrape
```

Opciones de CLI:

```bash
npm run dev -- scrape -- --page-size 24 --max-pages 10
npm run dev -- scrape -- --dry-run
npm run dev -- scrape -- --set sv-prismatic-evolutions --rarity "Special Illustration Rare"
```

## Exportaciones

El comando `scrape` genera las exportaciones directamente:

Salidas:

```text
data/raw/<runId>/page-0001.json
data/normalized/<runId>/pokemon-products.json
data/exports/<runId>/pokemon-prices.csv
data/manifests/<runId>/manifest.json
```

## Logs

Los logs deben ser estructurados y suficientes para auditar una ejecucion:

- `runId`
- `endpoint`
- `from`
- `size`
- `statusCode`
- `durationMs`
- `resultCount`
- `retryCount`
- rutas de raw, CSV, JSON y manifest

No registrar secretos, cookies, tokens ni encabezados sensibles.

## Reintentos y fallos

Politica recomendada:

- Reintentar errores transitorios de red y respuestas 429/5xx.
- Usar backoff progresivo con limite maximo.
- No reintentar indefinidamente.
- Detener la ejecucion con error claro si la respuesta deja de cumplir el contrato minimo.
- Conservar paginas raw ya descargadas aunque una pagina posterior falle.

## Reanudacion

El scraper debe poder reanudar una ejecucion sin duplicar trabajo:

- Detectar paginas raw existentes para el mismo `runId`.
- Permitir iniciar desde un `from` especifico.
- Exportar de nuevo desde raw sin volver a consultar la API.

## Verificacion

Antes de considerar valida una corrida:

```bash
npm run qa
```

Comprobaciones operativas minimas:

- Existen archivos en `data/raw/`.
- Existe un manifest de ejecucion en `data/manifests/`.
- Existen exportaciones en `data/exports/`.
- Los conteos de raw y exportacion son consistentes.
- Una muestra de registros exportados tiene `productLineName = pokemon`.

## Mantenimiento

Actualizar esta documentacion cuando cambien:

- Endpoint o metodo HTTP.
- Forma del filtro `productLineName`.
- Estrategia de paginacion `from`/`size`.
- Campos exportados.
- Limites de ritmo, concurrencia o reintentos.
