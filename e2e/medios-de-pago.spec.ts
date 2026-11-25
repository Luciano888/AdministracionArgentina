import { expect, test, type APIRequestContext } from "@playwright/test";
import { PLATFORM, login, loginVenue, spinner } from "./helpers";

/**
 * «Medios de pago»: la plataforma fija el cargo por servicio de cada recinto; el admin del recinto solo lo ve.
 * La conexión con Mercado Pago usa la página simulada de la API (MP_MOCK=1) y el recinto mdr-002.
 * Al terminar, ccs-001 queda sin cargo y mdr-002 sin cuenta conectada, para no cambiar las otras pruebas.
 */

async function cleanUp(request: APIRequestContext) {
  const res = await request.post("/api/Admin/Login", { data: PLATFORM });
  const headers = { "x-operator-token": ((await res.json()) as { token: string }).token };
  const put = await request.put("/api/Admin/PaymentSettings", {
    headers,
    data: { tenantId: "ccs-001", serviceFee: { percent: 0, minimum: 0 } },
  });
  expect(put.status()).toBe(200);
  const off = await request.post("/api/Admin/MercadoPago/Disconnect", { headers, data: { tenantId: "mdr-002" } });
  expect(off.status()).toBe(200);
}

test.describe.serial("medios de pago", () => {
  test.afterAll(async ({ request }) => {
    await cleanUp(request);
  });

  test("la plataforma conecta y desconecta la cuenta de Mercado Pago", async ({ page }) => {
    await login(page, PLATFORM.email, PLATFORM.password);
    await expect(page).toHaveURL(/\/recintos$/);
    await page.goto("/recintos/mdr-002/medios-de-pago");
    await expect(spinner(page, "Cargando medios de pago")).toBeHidden();
    await expect(page.getByText(/todavía no conectó su cuenta de Mercado Pago/)).toBeVisible();

    await page.getByRole("button", { name: "Conectar Mercado Pago" }).click();
    await expect(page).toHaveURL(/\/e2e\/mp-oauth\?state=/);
    await page.getByRole("link", { name: "Autorizar" }).click();

    await expect(page).toHaveURL(/\/recintos\/mdr-002\/medios-de-pago$/);
    await expect(page.getByText("Cuenta de Mercado Pago conectada")).toBeVisible();
    await expect(page.getByText("Cuenta conectada")).toBeVisible();
    await expect(page.getByText(/Cuenta de Mercado Pago e2e-mdr-002\. El permiso vence el/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reconectar" })).toBeVisible();

    await page.getByRole("button", { name: "Desconectar" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Desconectar" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Mercado Pago desconectado")).toBeVisible();
    await expect(page.getByText(/todavía no conectó su cuenta de Mercado Pago/)).toBeVisible();
  });

  test("si el recinto cancela en Mercado Pago, vuelve con el aviso y no conecta nada", async ({ page }) => {
    await loginVenue(page);
    await page.getByRole("link", { name: "Medios de pago" }).first().click();
    await expect(spinner(page, "Cargando medios de pago")).toBeHidden();
    await page.getByRole("button", { name: "Conectar Mercado Pago" }).click();
    await expect(page).toHaveURL(/\/e2e\/mp-oauth\?state=/);
    await page.getByRole("link", { name: "Cancelar" }).click();

    await expect(page).toHaveURL(/\/recintos\/ccs-001\/medios-de-pago\?mp=error&motivo=denegado$/);
    await expect(page.getByText("Se canceló la autorización en Mercado Pago. La cuenta no se conectó.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Conectar Mercado Pago" })).toBeVisible();
  });

  test("la plataforma fija el cargo por servicio y ve un ejemplo", async ({ page }) => {
    await login(page, PLATFORM.email, PLATFORM.password);
    await expect(page).toHaveURL(/\/recintos$/);
    await page.goto("/recintos/ccs-001/medios-de-pago");
    await expect(page.getByRole("heading", { name: "Medios de pago" })).toBeVisible();
    await expect(spinner(page, "Cargando medios de pago")).toBeHidden();

    await page.getByLabel("Porcentaje por entrada").fill("31");
    await expect(page.getByText("El porcentaje va de 0 a 30, con hasta dos decimales.")).toBeVisible();

    await page.getByLabel("Porcentaje por entrada").fill("8");
    await page.getByLabel("Mínimo por entrada (en pesos)").fill("300");
    await expect(page.getByText(/Ejemplo: una entrada de \$\s?10\.000 paga \$\s?800 de cargo\./)).toBeVisible();
    await page.getByRole("button", { name: "Guardar cargo" }).click();
    await expect(page.getByText("Cargo por servicio guardado")).toBeVisible();

    await page.reload();
    await expect(spinner(page, "Cargando medios de pago")).toBeHidden();
    await expect(page.getByLabel("Porcentaje por entrada")).toHaveValue("8");
    await expect(page.getByLabel("Mínimo por entrada (en pesos)")).toHaveValue("300");
  });

  test("el admin del recinto ve su cargo pero no lo edita", async ({ page }) => {
    await loginVenue(page);
    await page.getByRole("link", { name: "Medios de pago" }).first().click();
    await expect(page.getByRole("heading", { name: "Medios de pago" })).toBeVisible();
    await expect(spinner(page, "Cargando medios de pago")).toBeHidden();
    await expect(page.getByText(/8% por entrada, con un mínimo de \$\s?300\./)).toBeVisible();
    await expect(page.getByLabel("Porcentaje por entrada")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Guardar cargo" })).toHaveCount(0);
  });
});
