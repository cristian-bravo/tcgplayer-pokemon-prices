# Scraping responsable

## Principio

Este proyecto debe usar el endpoint de busqueda disponible para el caso de uso y evitar scraping de paginas HTML cuando no sea necesario.

Endpoint:

```text
https://mp-search-api.tcgplayer.com/v1/search/request
```

## Limites recomendados

Valores iniciales conservadores:

| Configuracion | Valor recomendado |
| --- | --- |
| Concurrencia | `1` |
| Espera minima entre requests | `10000 ms` por defecto |
| Tamano de pagina | `24` por defecto, maximo configurado `48` |
| Reintentos | `3` maximo |
| Timeout | `30000 ms` |

Si aparecen respuestas 429, timeouts frecuentes o errores intermitentes, reducir ritmo y revisar si el volumen de consulta es necesario.

## Conductas permitidas

- Consultar solo datos necesarios para productos Pokemon.
- Usar paginacion `from` y `size` de forma secuencial o con concurrencia muy baja.
- Guardar raw para evitar repetir solicitudes.
- Reusar datos crudos para regenerar exportaciones.
- Registrar fecha, parametros y conteos para auditoria.

## Conductas que deben evitarse

- Aumentar concurrencia para compensar errores de rate limit.
- Reintentar en bucle infinito.
- Descargar paginas completas repetidamente sin cache local.
- Consultar lineas de producto fuera del alcance documentado.
- Evadir controles de acceso, CAPTCHA, bloqueos o limites.
- Registrar o versionar credenciales, cookies o tokens.

## Datos y privacidad

El scraper debe limitarse a informacion de productos y precios. No debe recolectar datos personales, informacion de cuentas, datos de vendedores individuales si no son necesarios, ni contenido fuera del objetivo del proyecto.

## Cambios del proveedor

TCGplayer puede cambiar el endpoint, el contrato de respuesta o los limites de uso. Ante cambios:

1. Detener ejecuciones automatizadas si empiezan a fallar de forma repetida.
2. Revisar logs y muestras raw.
3. Ajustar validadores y contrato de datos.
4. Actualizar documentacion.
5. Reanudar con limites conservadores.

## Responsabilidad de operacion

El operador debe confirmar que el uso del endpoint cumple las politicas vigentes de TCGplayer y cualquier requisito legal o contractual aplicable. Esta documentacion no sustituye una revision de terminos de servicio.
