# tcgplayer-pokemon-prices

Scraper independiente en Node.js/TypeScript para consultar precios de productos Pokemon en TCGplayer usando el endpoint publico de busqueda:

`https://mp-search-api.tcgplayer.com/v1/search/request`

El proyecto esta pensado para guardar respuestas crudas en `data/raw/` y exportaciones normalizadas en `data/exports/`.

## Estado del proyecto

El scraper esta implementado como CLI TypeScript. Usa el endpoint de busqueda que carga la pagina de TCGplayer, pagina con `from`/`size`, normaliza productos Pokemon y exporta CSV/JSON por corrida.

## Uso esperado

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno, si aplica:

```bash
cp .env.example .env
```

3. Ejecutar el scraper:

```bash
npm run scrape
```

4. Ejecutar una muestra pequena para validar conectividad:

```bash
npm run scrape:sample
```

5. Validar el proyecto:

```bash
npm run qa
```

Opciones utiles:

```bash
npm run dev -- scrape -- --max-pages 2 --page-size 24
npm run dev -- scrape -- --set sv-prismatic-evolutions --rarity "Special Illustration Rare"
npm run dev -- scrape -- --dry-run
```

## Alcance de busqueda

El scraper debe consultar la API de busqueda de TCGplayer con:

- `productLineName`: `pokemon`
- Paginacion mediante `from` y `size`
- Respuestas crudas persistidas en `data/raw/`
- Datos intermedios normalizados en `data/normalized/`
- Exportaciones finales en `data/exports/`

Cada corrida crea carpetas con `runId`:

```text
data/raw/<runId>/page-0001.json
data/normalized/<runId>/pokemon-products.json
data/exports/<runId>/pokemon-prices.csv
data/manifests/<runId>/manifest.json
```

La documentacion tecnica esta en:

- [Arquitectura](docs/architecture.md)
- [Contrato de datos](docs/data-contract.md)
- [Operaciones](docs/operations.md)
- [Scraping responsable](docs/responsible-scraping.md)

## Estructura esperada

```text
tcgplayer-pokemon-prices/
  README.md
  docs/
  data/
    raw/
    normalized/
    exports/
    manifests/
  src/
  tests/
```

`data/raw/` debe contener evidencia reproducible de las respuestas recibidas. `data/normalized/` puede contener datos intermedios estables. `data/exports/` debe contener archivos listos para consumo por analisis, reportes o integraciones. `data/manifests/` debe guardar metadatos de ejecucion.

## Principios operativos

- No depender de scraping HTML cuando el endpoint de busqueda cubra el caso.
- Limitar concurrencia y volumen de solicitudes.
- Conservar datos crudos para auditoria.
- Registrar parametros, tiempos, conteos y errores recuperables.
- No almacenar secretos ni tokens en archivos versionados.
