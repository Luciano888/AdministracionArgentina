# AdministracionArgentina

Tercera cara del sistema de entradas. Configura lo que comparten [VentaOnlineArgentina](../VentaOnlineArgentina) y [TaquillaArgentina](../TaquillaArgentina): recintos, eventos, tarifas, sesiones, cajeros y terminales.

No vende, no abre turno y no imprime. La base y la API siguen en Venta Online.

## Arranque

Hace falta Node 20+ y la API de Venta Online en el puerto 3000, con Postgres (`npm run db:push` y `npm run db:seed` en ese repo).

```bash
npm install
npm run dev
```

Panel: [http://localhost:5174](http://localhost:5174)

## Tests

Los caminos del panel están en `e2e/` (Playwright), igual que la tienda y la taquilla. Levantan la API en el puerto 3003 y el panel en el 5175, sin usar el `npm run dev` del puerto 5174.

```bash
npx playwright install chromium
npm run test:e2e
```

Demo: `admin@plataforma` / `admin123` (todos los recintos) o `admin@ccs-001` / `admin123` (Centro Cultural).

## Contrato

Los endpoints viven en Venta Online, bajo `Admin/*`. El contrato de este panel está en [docs/admin](docs/admin/00-LEEME.md) y se mantiene igual en `VentaOnlineArgentina/docs/admin/`.
