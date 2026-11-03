# Criterios

## Vigentes

- Con Postgres, un recinto creado en el panel aparece en la portada de la tienda y en `GET /api/tenants`.
- Un evento nuevo se lista en la tienda y en la taquilla del mismo recinto.
- Una tarifa con `pvp` y `pvpBoxOffice` distintos se cobra así en cada canal.
- Un día sin sesión publicada no se puede reservar ni vender. La API responde 404, no inventa cupo.
- Bajar el cupo por debajo de lo ya vendido o retenido responde 409.
- Borrar un evento o una tarifa con ventas responde 409.
- `admin@ccs-001` no ve el Museo del Río. `admin@plataforma` sí.
- Un cajero no entra al panel. Un admin no abre turno en la taquilla.
- La consulta de entradas muestra compras `VO-` y `TQ-` y no las anula.

## Formulario de evento

Detalle en [EVENTOS.md](./EVENTOS.md).

- La categoría se elige de una lista cerrada.
- La descripción corta muestra `usados / 80` y la larga `usados / 280`.
- La duración se carga con horas y minutos, o como Libre.
- La ubicación ofrece lugares de Argentina y un mapa al elegir uno.
- Texto amigable tiene un signo de interrogación que explica el slug.
- La imagen del evento se puede cambiar. Sin imagen, queda el gradiente anterior.
