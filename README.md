# AdministracionArgentina

Tercera cara del sistema de entradas. Configura lo que comparten VentaOnlineArgentina y TaquillaArgentina: recintos, eventos, tarifas, sesiones, cajeros y terminales.

No vende, no abre turno y no imprime. La base y la API siguen en Venta Online.

## Repos hermanos

Este panel no tiene backend propio. Los tres repos van clonados uno al lado del otro, porque `playwright.config.ts` levanta la API desde `../VentaOnlineArgentina`:

```text
Documents/
├── AdministracionArgentina/   ← este repo
├── VentaOnlineArgentina/      ← API Next.js + Postgres (Admin/*)
└── TaquillaArgentina/
```

## Arranque

Hace falta Node 20+ y la API de Venta Online en el puerto 3000, con Postgres (`npm run db:push` y `npm run db:seed` en ese repo).

```bash
npm install
npm run dev
```

Panel: [http://localhost:5174](http://localhost:5174)

## Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Panel en el puerto 5174, con proxy de `/api` a `VO_API_ORIGIN` (por defecto `:3000`) |
| `npm run build` | Chequeo de tipos (`tsc -b`) y build de producción en `dist/` |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (necesita el repo hermano y Postgres) |

La CI (`.github/workflows/ci.yml`) corre `lint` y `build` en cada push y PR. Los E2E no corren ahí.

## Estructura

```text
src/
├── components/   Shell (layout + menú), ui.tsx (botones, campos, Spinner), formulario de evento
├── lib/          api.ts (fetch a Admin/*), session.ts (sesión en sessionStorage), helpers
├── pages/        una página por ruta (recintos, eventos, tarifas, sesiones, cajeros, terminales, entradas)
└── types.ts      tipos del contrato
e2e/              caminos del panel con Playwright
docs/admin/       contrato con Venta Online
```

## Tests

Los caminos del panel están en `e2e/` (Playwright), igual que la tienda y la taquilla. Levantan la API en el puerto 3003 y el panel en el 5175, sin usar el `npm run dev` del puerto 5174.

```bash
npx playwright install chromium
npm run test:e2e
```

Demo: `admin@plataforma` / `admin123` (todos los recintos) o `admin@ccs-001` / `admin123` (Centro Cultural). Son usuarios del seed local: el seed nunca debe correr contra producción.

## Contrato

Los endpoints viven en Venta Online, bajo `Admin/*`. El contrato de este panel está en [docs/admin](docs/admin/00-LEEME.md) y se mantiene igual en `VentaOnlineArgentina/docs/admin/`.
