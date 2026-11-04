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

Hace falta Node 22 (está en `.nvmrc`: `nvm use`) y la API de Venta Online en el puerto 3000, con su base (`npm run db:push` y `npm run db:seed` en ese repo).

```bash
nvm use
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
| `npm test` | Tests unitarios (Vitest + jsdom, `src/**/*.test.ts(x)`) |
| `npm run test:e2e` | Playwright (necesita el repo hermano y su base de datos) |

La CI (`.github/workflows/ci.yml`) corre `lint`, `test` y `build` en cada push y PR. Los E2E no corren ahí. Dependabot propone actualizaciones de dependencias y de Actions una vez por semana.

## Estructura

```text
src/
├── components/   Shell (layout + menú), ui.tsx (botones, campos, Spinner), Feedback.tsx (diálogo de confirmación y avisos), formulario de evento
├── lib/          api.ts (fetch a Admin/*), useAdminQuery.ts (GET con spinner/error/recarga), session.ts (sesión en sessionStorage),
│                 venueConfig.ts (reglas por recinto), feedback.ts (useConfirm/useToast), sessionDates.ts, format.ts
├── pages/        una página por ruta (recintos, eventos, tarifas, sesiones, cajeros, terminales, entradas)
└── types.ts      tipos del contrato
e2e/              caminos del panel con Playwright
docs/admin/       contrato con Venta Online
```

### Multi-tenant

Cada recinto es un cliente. Las reglas que pueden cambiar entre clientes (categorías, topes de texto e imagen, moneda, idioma y país del mapa) se leen con `useVenueConfig()` y nunca están fijas en las páginas. Hoy la API no manda esa config y rigen los valores por defecto de `src/lib/venueConfig.ts`. La propuesta para la API está en [docs/admin/CONTRATO-API.md](docs/admin/CONTRATO-API.md#propuesto-config-por-recinto).

Para confirmar un borrado se usa `useConfirm()`, no `window.confirm`. Para avisar que algo se guardó, `useToast()`.

## Tests

Los caminos del panel están en `e2e/` (Playwright), igual que la tienda y la taquilla. Levantan la API en el puerto 3003 y el panel en el 5175, sin usar el `npm run dev` del puerto 5174.

```bash
npx playwright install chromium
npm run test:e2e
```

Para cargar datos, las páginas usan `useAdminQuery` y cada sección muestra un `Spinner` mientras espera. En los tests, ese spinner se busca con `spinner(page, "Cargando …")` de `e2e/helpers.ts`. Los borrados se confirman con `confirmDelete(page)`.

| Spec | Qué cubre |
|------|-----------|
| `auth` | Login, roles, alcance por recinto, token vencido y rechazos de la API |
| `carga` | Spinner, error y vacío de cada lista y formulario, con respuestas simuladas (no escribe en la base) |
| `eventos` | Formulario del evento (categoría, topes, duración, mapa simulado, imagen) y CRUD con tarifas y sesiones |
| `sesiones` | Filtros por mes y semana |
| `caja` | Cajeros, terminales y consulta de entradas |
| `recintos` | Alta y edición de recintos (solo la plataforma) |
| `ventas` | Reglas que necesitan una venta: 409 al borrar o bajar el cupo, compra `TQ-` en entradas |

**Los E2E escriben en la base que configura VentaOnlineArgentina** (su `.env` / `.env.local`). Datos que quedan después de cada corrida:

- un recinto `e2e-…` (`recintos.spec`) y un cajero `cajero-…@ccs-001` (`caja.spec`);
- siempre los mismos evento «E2E ventas» (`e2e-ventas`) y terminal `E2E-VENTAS` en ccs-001, que `ventas.spec` reutiliza y a los que suma una venta por corrida. Con ventas no se pueden borrar.

Los eventos que crean `eventos.spec` y las terminales de `caja.spec` se borran al terminar.

Demo: `admin@plataforma` / `admin123` (todos los recintos) o `admin@ccs-001` / `admin123` (Centro Cultural). Son usuarios del seed local: el seed nunca debe correr contra producción.

## Contrato

Los endpoints viven en Venta Online, bajo `Admin/*`. El contrato de este panel está en [docs/admin](docs/admin/00-LEEME.md) y se mantiene igual en `VentaOnlineArgentina/docs/admin/`.
