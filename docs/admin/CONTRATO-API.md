# Contrato Admin/*

Header: `x-operator-token`. Origen permitido: `http://localhost:5174` (y `127.0.0.1`).

Precios y cupo son enteros en pesos. `pvpBoxOffice` null significa que la taquilla cobra `pvp`.

## Recintos

- `GET Admin/Tenants` — la plataforma ve todos; un admin ve el suyo.
- `POST Admin/Tenants` — solo `platform`. Body: `id`, `slug`, `name`, `shortName`, `tagline`, `city`, `logo`, `theme` (`primary`, `primaryDark`, `primaryForeground` en `#rrggbb`), `features` (`nominacion`, `factura`, `login`).
- `PUT Admin/Tenants` — mismos campos editables. `id` y `slug` no cambian.

## Eventos

- `GET Admin/Events?tenantId=`
- `POST Admin/Events` — `tenantId`, `titulo`, `categoria`, `icon`, `gradient`, textos, `minimoPrecio`.
- `PUT Admin/Events` — `id` más los campos editables.
- `DELETE Admin/Events?id=` — 409 si hay ventas.

Íconos: `theater`, `music`, `palette`, `film`, `landmark`, `ship`, `users`, `microscope`.

`categoria` es una de: Música, Teatro, Taller, Cine, Exposición, Visita, Conferencia. Descripción corta hasta 80 caracteres, larga hasta 280. `duracion` sale del minutero: `2 h 30 min`, `3 h`, `45 min` o `Libre`. `textoAmigable`, si viene, es un slug. `imagen` es opcional (data URL, tope 1,5 MB en el cuerpo). `gradient` se conserva para los eventos sin imagen. Detalle del formulario: [EVENTOS.md](./EVENTOS.md).

## Tarifas

- `GET Admin/Tariffs?eventId=`
- `POST` / `PUT Admin/Tariffs` — `nombre`, `pvp`, `pvpBoxOffice` (null si va vacío), `descripcion`.
- `DELETE Admin/Tariffs?id=` — 409 si esa tarifa está en una venta.

Al guardar, `events.minimo_precio` pasa a ser el menor `pvp`.

## Sesiones

- `GET Admin/Sessions?eventId=` — incluye `cupo`, `consumed` y `disponible`.
- `POST Admin/Sessions` — `eventId`, `fecha` (`yyyy-MM-dd`), `hora`, `cupo`. 409 si ya existe esa fecha y hora.
- `PUT Admin/Sessions` — no permite un cupo menor a lo vendido o retenido.
- `DELETE Admin/Sessions?id=` — 409 si hay ventas o un hold vigente.

La tienda y la taquilla solo ofrecen estas filas. No se crea una sesión con cupo 40 al reservar.

## Caja

- `GET` / `POST` / `PUT Admin/Operators` — cajeros y supervisores del recinto. La clave nueva es opcional en el `PUT`.
- `GET` / `POST` / `PUT Admin/Terminals` — `code` y `name`.
- `DELETE Admin/Terminals?id=` — 409 si tiene turnos o ventas.

## Entradas

- `GET Admin/Entradas?tenantId=&q=` — órdenes con canal (`web` o `box_office`), estado y tickets. Solo lectura.
