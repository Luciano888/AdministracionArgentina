import { expect, test } from "@playwright/test";
import { adminHeaders, CASHIER, login, loginVenue, PLATFORM, VENUE_ADMIN } from "./helpers";

for (const path of [
  "/recintos",
  "/recintos/nuevo",
  "/recintos/ccs-001/eventos",
  "/recintos/ccs-001/eventos/tango-patio",
  "/recintos/ccs-001/eventos/tango-patio/tarifas",
  "/recintos/ccs-001/eventos/tango-patio/sesiones",
  "/recintos/ccs-001/cajeros",
  "/recintos/ccs-001/terminales",
  "/recintos/ccs-001/entradas",
]) {
  test(`${path} sin sesión vuelve al login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  });
}

test("una clave incorrecta no entra", async ({ page }) => {
  await login(page, PLATFORM.email, "clave-mala");
  await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("un cajero no administra el panel", async ({ page }) => {
  await login(page, CASHIER.email, CASHIER.password);
  await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();
});

test("la plataforma ve todos los recintos", async ({ page }) => {
  await login(page, PLATFORM.email, PLATFORM.password);
  await expect(page).toHaveURL(/\/recintos$/);
  await expect(page.getByRole("heading", { name: "Centro Cultural del Sur" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Museo del Río" })).toBeVisible();
});

test("el admin de un recinto solo ve el suyo", async ({ page }) => {
  await loginVenue(page);
  await expect(page.getByText("Abrí un evento para ver sus tarifas y sus sesiones.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tango en el Patio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Museo del Río" })).toHaveCount(0);

  await page.goto("/recintos/mdr-002/eventos");
  await expect(page).toHaveURL(/\/recintos\/ccs-001\/eventos$/);
});

test("un token vencido vuelve al login", async ({ page }) => {
  await loginVenue(page);
  await page.evaluate(() => {
    const raw = sessionStorage.getItem("admin-session");
    if (!raw) throw new Error("No hay sesión guardada");
    const stored = JSON.parse(raw);
    stored.state.session.token = "token-vencido-e2e";
    sessionStorage.setItem("admin-session", JSON.stringify(stored));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
});

test("la API no deja a un admin salir de su recinto ni abrir caja", async ({ page }) => {
  const headers = await adminHeaders(page.request);

  const otherVenue = await page.request.get("/api/Admin/Events?tenantId=mdr-002", { headers });
  expect(otherVenue.status()).toBe(403);

  const newVenue = await page.request.post("/api/Admin/Tenants", {
    headers,
    data: { id: "e2e-no-permitido", slug: "e2e-no-permitido", name: "No", shortName: "No" },
  });
  expect(newVenue.status()).toBe(403);

  const boxOffice = await page.request.post("/api/Taquilla/Login", {
    headers: { "x-conexion-id": "ccs-001" },
    data: VENUE_ADMIN,
  });
  expect(boxOffice.status()).toBe(403);
});

test("salir cierra la sesión", async ({ page }) => {
  await login(page, VENUE_ADMIN.email, VENUE_ADMIN.password);
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/recintos/ccs-001/eventos");
  await expect(page).toHaveURL(/\/login$/);
});
