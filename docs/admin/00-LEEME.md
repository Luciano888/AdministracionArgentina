# Administración

Tercera cara del sistema. [AdministracionArgentina](../../README.md) configura la misma Postgres que usan la tienda y la taquilla. Este directorio es el contrato.

La misma carpeta vive en `VentaOnlineArgentina/docs/admin`. Si el contrato cambia, se actualizan las dos copias en el mismo cambio.

La tienda, la taquilla, facturación y los caminos de compra siguen documentados solo en Venta Online (`docs/`, `docs/taquilla/`). Acá está lo que configura este panel.

## Orden de lectura

1. Este archivo
2. [AUTH.md](./AUTH.md)
3. [CONTRATO-API.md](./CONTRATO-API.md)
4. [CRITERIOS.md](./CRITERIOS.md)
5. [EVENTOS.md](./EVENTOS.md) — formulario del evento

## Qué hace

Alta y edición de recintos, eventos, tarifas (precio web y precio de taquilla), sesiones con cupo, cajeros, terminales, y consulta de entradas emitidas.

No cobra, no abre turno y no anula. Eso sigue en Taquilla.

## Arranque local

En Venta Online, con Postgres:

```bash
npm run db:push
npm run db:seed
npm run dev
```

El panel corre aparte, en el puerto 5174. CORS ya incluye `http://localhost:5174`.

```bash
npm install
npm run dev
```

Demo: `admin@plataforma` / `admin123`, y `admin@ccs-001` / `admin123`.

Los caminos de este panel se cubren con Playwright en `e2e/` (`npm run test:e2e`).
