import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

/**
 * Spinner de una sección por su texto. `getByRole("status", { name })` no sirve: el rol status
 * no toma el nombre de su contenido, así que nunca encuentra nada y `toBeHidden()` pasa siempre.
 */
export function spinner(scope: Page | Locator, label: string) {
  return scope.getByRole("status").filter({ hasText: label });
}

export function fieldSelect(page: Page, label: string) {
  return page.locator("label").filter({ has: page.getByText(label, { exact: true }) }).locator("select");
}

export const PLATFORM = { email: "admin@plataforma", password: "admin123" };
export const VENUE_ADMIN = { email: "admin@ccs-001", password: "admin123" };
export const CASHIER = { email: "cajero@ccs-001", password: "caja123" };

export function stamp() {
  return Date.now().toString(36);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function loginVenue(page: Page) {
  await login(page, VENUE_ADMIN.email, VENUE_ADMIN.password);
  await expect(page).toHaveURL(/\/recintos\/ccs-001\/eventos$/);
  await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
}

export function acceptDialogs(page: Page) {
  page.on("dialog", (dialog) => dialog.accept());
}

async function venueToken(request: APIRequestContext) {
  const res = await request.post("/api/Admin/Login", { data: VENUE_ADMIN });
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error("No se pudo entrar para limpiar la prueba");
  return body.token;
}

export async function adminHeaders(request: APIRequestContext) {
  return { "x-operator-token": await venueToken(request) };
}

/** Evento, tarifa, sesión y terminal fijos de ccs-001 para probar reglas con ventas. Se reutilizan entre corridas. */
export const SALES = {
  titulo: "E2E ventas",
  slug: "e2e-ventas",
  tarifa: "General E2E",
  pvp: 1000,
  fecha: "2035-06-01",
  hora: "20:00",
  terminal: "E2E-VENTAS",
} as const;

export type SalesFixture = { eventId: string; tariffId: number; sessionId: string };

async function okJson<T>(res: Awaited<ReturnType<APIRequestContext["get"]>>, what: string): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

export async function ensureSalesFixture(request: APIRequestContext): Promise<SalesFixture> {
  const headers = await adminHeaders(request);
  const events = await okJson<{ id: string; titulo: string }[]>(
    await request.get("/api/Admin/Events?tenantId=ccs-001", { headers }),
    "Listar eventos"
  );
  let event = events.find((row) => row.titulo === SALES.titulo);
  if (!event) {
    event = await okJson<{ id: string; titulo: string }>(
      await request.post("/api/Admin/Events", {
        headers,
        data: {
          tenantId: "ccs-001",
          titulo: SALES.titulo,
          categoria: "Música",
          descripcion: "Evento fijo de las pruebas E2E.",
          descripcionLarga: "Lo usan las pruebas que necesitan una venta. No borrar.",
          duracion: "1 h",
          ubicacion: "Sala de pruebas",
          textoAmigable: SALES.slug,
          minimoPrecio: SALES.pvp,
          icon: "music",
          gradient: "from-slate-900 via-slate-700 to-blue-800",
          imagen: "",
        },
      }),
      "Crear evento de ventas"
    );
  }

  const tariffs = await okJson<{ id: number; nombre: string }[]>(
    await request.get(`/api/Admin/Tariffs?eventId=${encodeURIComponent(event.id)}`, { headers }),
    "Listar tarifas"
  );
  let tariff = tariffs.find((row) => row.nombre === SALES.tarifa);
  if (!tariff) {
    await okJson(
      await request.post("/api/Admin/Tariffs", {
        headers,
        data: { eventId: event.id, nombre: SALES.tarifa, pvp: SALES.pvp, pvpBoxOffice: null, descripcion: "" },
      }),
      "Crear tarifa de ventas"
    );
    const again = await okJson<{ id: number; nombre: string }[]>(
      await request.get(`/api/Admin/Tariffs?eventId=${encodeURIComponent(event.id)}`, { headers }),
      "Listar tarifas"
    );
    tariff = again.find((row) => row.nombre === SALES.tarifa)!;
  }

  type Row = { id: string; fecha: string; hora: string; cupo: number; disponible: number };
  const sessions = await okJson<Row[]>(
    await request.get(`/api/Admin/Sessions?eventId=${encodeURIComponent(event.id)}`, { headers }),
    "Listar sesiones"
  );
  let session = sessions.find((row) => row.fecha === SALES.fecha && row.hora.startsWith(SALES.hora));
  if (!session) {
    session = await okJson<Row>(
      await request.post("/api/Admin/Sessions", {
        headers,
        data: { eventId: event.id, fecha: SALES.fecha, hora: SALES.hora, cupo: 1000 },
      }),
      "Crear sesión de ventas"
    );
  } else if (session.disponible < 5) {
    await okJson(
      await request.put("/api/Admin/Sessions", { headers, data: { id: session.id, cupo: session.cupo + 1000 } }),
      "Subir cupo"
    );
  }

  const terminals = await okJson<{ code: string }[]>(
    await request.get("/api/Admin/Terminals?tenantId=ccs-001", { headers }),
    "Listar terminales"
  );
  if (!terminals.some((row) => row.code === SALES.terminal)) {
    await okJson(
      await request.post("/api/Admin/Terminals", {
        headers,
        data: { tenantId: "ccs-001", code: SALES.terminal, name: "Terminal de pruebas E2E" },
      }),
      "Crear terminal de ventas"
    );
  }

  return { eventId: event.id, tariffId: tariff.id, sessionId: session.id };
}

/** Vende una entrada en efectivo por la API de la taquilla y devuelve el localizador TQ-. */
export async function sellOneTicket(request: APIRequestContext, fixture: SalesFixture) {
  const base = { "x-conexion-id": "ccs-001" };
  const login = await okJson<{ token: string }>(
    await request.post("/api/Taquilla/Login", { headers: base, data: CASHIER }),
    "Login de cajero"
  );
  const headers = { ...base, "x-operator-token": login.token };
  const terminal = { terminalCode: SALES.terminal };

  const opened = await request.post("/api/Taquilla/ShiftOpen", { headers, data: { ...terminal, openingCash: 0 } });
  if (!opened.ok() && opened.status() !== 409) throw new Error(`Abrir turno: ${opened.status()} ${await opened.text()}`);

  try {
    const sale = await okJson<{ localizador: string }>(
      await request.post("/api/Taquilla/Venta", {
        headers,
        data: {
          ...terminal,
          eventoId: fixture.eventId,
          fecha: SALES.fecha,
          hora: SALES.hora,
          items: [{ tarifaId: fixture.tariffId, cantidad: 1 }],
          payments: [{ method: "cash", amount: SALES.pvp }],
        },
      }),
      "Vender"
    );
    return sale.localizador;
  } finally {
    await request.post("/api/Taquilla/ShiftClose", { headers, data: terminal });
  }
}

export async function removeEventByTitle(page: Page, titulo: string) {
  const token = await venueToken(page.request);
  const headers = { "x-operator-token": token };
  const listed = await page.request.get("/api/Admin/Events?tenantId=ccs-001", { headers });
  const rows = (await listed.json()) as { id: string; titulo: string }[];
  const found = rows.find((row) => row.titulo === titulo);
  if (!found) return;
  const deleted = await page.request.delete(`/api/Admin/Events?id=${encodeURIComponent(found.id)}`, { headers });
  if (!deleted.ok()) throw new Error(`No se pudo borrar el evento de prueba: ${deleted.status()}`);
}

export async function removeTerminalByCode(page: Page, code: string) {
  const token = await venueToken(page.request);
  const headers = { "x-operator-token": token };
  const listed = await page.request.get("/api/Admin/Terminals?tenantId=ccs-001", { headers });
  const rows = (await listed.json()) as { id: string; code: string }[];
  const found = rows.find((row) => row.code === code);
  if (!found) return;
  const deleted = await page.request.delete(`/api/Admin/Terminals?id=${encodeURIComponent(found.id)}`, { headers });
  if (!deleted.ok()) throw new Error(`No se pudo borrar la terminal de prueba: ${deleted.status()}`);
}
