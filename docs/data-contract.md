# Contrato de datos

## Entradas

La entrada principal es una solicitud al endpoint:

```text
POST https://mp-search-api.tcgplayer.com/v1/search/request
```

La solicitud debe incluir filtros para limitar resultados a Pokemon.

Campos esperados de consulta:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `productLineName` | string | si | Debe ser `pokemon`. |
| `from` | number | si | Desplazamiento inicial de la pagina. |
| `size` | number | si | Cantidad maxima de resultados solicitados. |

La forma exacta del cuerpo debe seguir el contrato aceptado por TCGplayer al momento de implementacion. Si la API cambia, actualizar este documento y los validadores juntos.

## Raw

Cada pagina recibida debe guardarse completa en `data/raw/`.

Requisitos:

- Archivo JSON valido.
- Sin alterar ni eliminar campos de la respuesta original.
- Nombre que incluya fecha de ejecucion, pagina, `from` y `size`.
- Metadatos de ejecucion guardados junto a la respuesta o en un archivo manifest.

Manifest recomendado en `data/manifests/`:

```json
{
  "runId": "2026-05-21T20-41-00Z",
  "endpoint": "https://mp-search-api.tcgplayer.com/v1/search/request",
  "filters": {
    "productLineName": "pokemon"
  },
  "pagination": {
    "from": 0,
    "size": 24
  },
  "startedAt": "2026-05-21T20:41:00.000Z",
  "completedAt": "2026-05-21T20:42:00.000Z"
}
```

## Exportacion normalizada

La exportacion debe contener un registro por producto o variante de producto, segun lo permita la respuesta de TCGplayer. Cuando exista ambiguedad, conservar el dato original y evitar inferencias destructivas.

Si el pipeline usa una etapa intermedia, `data/normalized/` debe seguir el mismo contrato de campos que la exportacion final o declarar explicitamente sus diferencias en el manifest de ejecucion.

Campos recomendados:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `runId` | string | si | Identificador de la corrida. |
| `scrapedAt` | string | si | Fecha ISO-8601 de captura. |
| `source` | string | si | Valor fijo `tcgplayer-search-api`. |
| `productLineName` | string | si | Nombre de linea devuelto por TCGplayer, normalmente `Pokemon`. |
| `productLineId` | number | no | Identificador de linea de producto. |
| `productId` | number | si | Identificador del producto en TCGplayer. |
| `productName` | string | si | Nombre visible del producto. |
| `cleanName` | string | si | Nombre sin sufijo de numero cuando aplica. |
| `setName` | string | no | Nombre del set o expansion si esta disponible. |
| `setCode` | string | no | Codigo de set si esta disponible. |
| `setId` | number | no | Identificador del set si esta disponible. |
| `rarity` | string | no | Rareza si esta disponible. |
| `cardNumber` | string | no | Numero de carta si esta disponible. |
| `cardType` | string[] | si | Tipos de carta devueltos por el endpoint. |
| `sealed` | boolean | si | Indica si el producto es sellado. |
| `releaseDate` | string | no | Fecha de lanzamiento devuelta por TCGplayer. |
| `productUrl` | string | si | URL canonica construida con `productId`. |
| `imageUrl` | string | si | Imagen de producto en CDN. |
| `thumbnailUrl` | string | si | Miniatura de producto en CDN. |
| `marketPrice` | number | no | Precio de mercado. |
| `lowestPrice` | number | no | Precio mas bajo sin envio. |
| `lowestPriceWithShipping` | number | no | Precio mas bajo con envio cuando el endpoint lo provee. |
| `medianPrice` | number | no | Precio mediano. |
| `listingsCount` | number | si | Conteo de listings reportado. |
| `availability` | string | si | `Available` u `Out of Stock`. |
| `currency` | string | si | Valor fijo `USD`. |
| `lowestListing` | object | no | Resumen del primer listing devuelto: condicion, idioma, vendedor, cantidad y precio. |

## Formatos de salida

Formatos generados:

- `data/normalized/<runId>/pokemon-products.json`: arreglo JSON normalizado.
- `data/exports/<runId>/pokemon-prices.csv`: exportacion tabular para hojas de calculo.
- `data/manifests/<runId>/manifest.json`: resumen de ejecucion y parametros.

## Validacion

La normalizacion debe validar:

- Tipos basicos de identificadores, nombres y precios.
- Fechas ISO-8601.
- Que `productLineName` sea `pokemon`.
- Que precios numericos no sean negativos.
- Que la corrida tenga archivos raw, normalizados, exportados y manifest relacionados por el mismo `runId`.

Los campos desconocidos de la API no deben romper el proceso raw. Solo deben afectar la exportacion si son necesarios para el contrato normalizado.
