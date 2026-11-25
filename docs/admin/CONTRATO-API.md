# Contrato Admin/*

Header: `x-operator-token`. Origen permitido: `http://localhost:5174` (y `127.0.0.1`).

Precios y cupo son enteros en pesos. `pvpBoxOffice` null significa que la taquilla cobra `pvp`.

## Recintos

- `GET Admin/Tenants` — la plataforma ve todos; un admin ve el suyo.
- `POST Admin/Tenants` — solo `platform`. Body: `id`, `slug`, `name`, `shortName`, `tagline`, `city`, `logo`, `theme` (`primary`, `primaryDark`, `primaryForeground` en `#rrggbb`), `features` (`nominacion`, `factura`, `login`).
- `PUT Admin/Tenants` — mismos campos editables. `id` y `slug` no cambian.

## Medios de pago

- `GET Admin/PaymentSettings?tenantId=` — la plataforma, de cualquier recinto; un admin, del suyo (`tenantId` opcional). Respuesta: `{ tenantId, serviceFee: { percent, minimum }, mercadoPago: { status, accountId, tokenExpiresAt } }`.
- `PUT Admin/PaymentSettings` — solo `platform`. Body: `{ tenantId, serviceFee: { percent, minimum } }`. Devuelve lo mismo que el GET.

`serviceFee` es el cargo por servicio de la venta online, que paga el comprador (`docs/MARKETPLACE.md` en VentaOnlineArgentina). Por cada entrada paga se cobra `max(redondeo(precio × percent / 100), minimum)`. Las entradas gratis no llevan cargo y la taquilla nunca lo cobra. `percent` va de 0 a 30 con hasta dos decimales; `minimum` es un entero en pesos. `0` y `0` significa sin cargo, que es el valor por defecto. Un valor fuera de rango responde 400.

- `POST Admin/MercadoPago/Connect` — el admin, de su recinto; la plataforma, de cualquiera. Body: `{ tenantId }`. Respuesta: `{ authorizationUrl }`: el panel lleva ahí al navegador. 409 si la API no tiene su aplicación de Mercado Pago (`MP_CLIENT_ID` / `MP_CLIENT_SECRET`) o `CONFIG_ENCRYPTION_KEY`.
- `POST Admin/MercadoPago/Disconnect` — mismos permisos. Body: `{ tenantId }`. Borra las credenciales; devuelve lo mismo que el GET.

`mercadoPago.status`: `oauth` (cuenta conectada con el botón; `accountId` es la cuenta de Mercado Pago y `tokenExpiresAt` el vencimiento del permiso), `manual` (token cargado a mano, solo desarrollo) o `none` (no cobra con Mercado Pago).

Después de autorizar en Mercado Pago, la API vuelve a `{ADMIN_APP_URL}/recintos/{tenantId}/medios-de-pago` con `?mp=ok` o `?mp=error&motivo=` y uno de estos motivos: `estado` (enlace vencido o inválido; en ese caso vuelve a `/recintos`), `denegado` (se canceló en Mercado Pago), `permiso` (el operador ya no administra el recinto), `canje` (Mercado Pago rechazó el código) o `guardado` (no se pudo guardar).

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

## Propuesto: config por recinto

> **Todavía no está en la API.** El panel ya lo lee y, si no viene, usa los valores por defecto. Cuando se implemente en Venta Online, esta sección se copia a `VentaOnlineArgentina/docs/admin/` y deja de ser propuesta.

Cada recinto de `GET Admin/Tenants` puede traer un campo opcional `config`. Todo es opcional; lo que falta o no es válido toma el valor por defecto.

| Campo | Por defecto | Uso en el panel |
|-------|-------------|-----------------|
| `categorias` | Música, Teatro, Taller, Cine, Exposición, Visita, Conferencia | Select de categoría del evento |
| `descripcionMax` | 80 | Tope y contador de la descripción corta |
| `descripcionLargaMax` | 280 | Tope y contador de la descripción larga |
| `imagenMaxBytes` | 900000 | Peso máximo de la imagen del evento |
| `locale` | `es-AR` | Formato de fechas y montos |
| `currency` | `ARS` | Moneda de precios y totales |
| `geocoderCountry` | `ar` | País del buscador de ubicación (Nominatim) |

La API hoy valida categorías y topes con constantes propias (`src/lib/db/admin.ts`: `CATEGORIAS`, `DESCRIPCION_MAX`, `DESCRIPCION_LARGA_MAX`). Para que la config sirva, esa validación tiene que leer la del recinto. Si no, el panel ofrece una categoría y la API la rechaza con 400. Además, `publicTenant` tiene que incluir `config` en la respuesta.
