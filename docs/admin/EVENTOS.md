# Formulario de evento

Estado: el formulario del panel ya carga la categoría, las descripciones, la duración, la ubicación, el texto amigable y la imagen como está escrito acá. La API valida categoría, topes, duración y texto amigable. Ver [CONTRATO-API.md](./CONTRATO-API.md).

## Categoría

Select. Valores que ya usa el catálogo de muestra:

| Categoría | Ícono habitual |
|-----------|----------------|
| Música | `music` |
| Teatro | `theater` |
| Taller | `palette` |
| Cine | `film` |
| Exposición | `landmark` |
| Visita | `ship` o `users` |
| Conferencia | `users` |

El ícono sigue siendo otro select (`theater`, `music`, `palette`, `film`, `landmark`, `ship`, `users`, `microscope`). La categoría no se deduce del ícono.

## Descripciones

Las dos muestran el contador `usados / tope` mientras se escribe. En Postgres son `text` sin límite; el tope es de producto, para que la tarjeta y la ficha no se desborden.

| Campo | Dónde se ve | Tope | En la muestra |
|-------|-------------|------|----------------|
| Descripción corta | Catálogo | 80 | 35–49 caracteres |
| Descripción larga | Ficha del evento | 280 | alrededor de 120–180 |

Al llegar al tope no entra más texto.

## Duración

Horas y minutos, no un campo de texto. Se guarda el mismo formato que ya tiene la tienda:

- `2 h 30 min` si hay horas y minutos
- `3 h` si los minutos son 0
- `45 min` si las horas son 0

Horas de 0 a 12. Minutos de 0 a 59. La colección permanente de la muestra usa `Libre`: es una opción explícita del control, no un texto escrito a mano.

## Ubicación

El operador elige un lugar con un geocodificador (OpenStreetMap Nominatim, sin clave, acotado a Argentina). El campo muestra sugerencias y, al elegir una, el texto de la ubicación.

Hoy `ubicacion` sigue siendo solo texto (`Sala Mayor`, `Patio central · Barracas`). No hay latitud ni longitud en `events`: se guarda el rótulo elegido. Las salas internas del recinto se pueden escribir igual; el mapa aparece cuando se elige una sugerencia.

## Texto amigable

Es el tramo legible de la URL del evento. En la muestra: `tango-en-el-patio`, `rios-del-sur`. Minúsculas, números y guiones.

Al lado del rótulo, un `?`. Al pasar el mouse: «Identificador de la dirección pública del evento. Minúsculas, números y guiones. Ejemplo: tango-en-el-patio.»

## Imagen de la tarjeta

La tarjeta se edita con una imagen (`events.imagen`, JPEG, PNG o WebP, menos de 900 KB). Si no hay imagen, la tienda sigue mostrando el gradiente y el ícono que ya tenía el evento. El formulario ya no pide el gradiente.
