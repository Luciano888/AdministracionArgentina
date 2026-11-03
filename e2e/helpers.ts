import { expect, type APIRequestContext, type Page } from "@playwright/test";

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
