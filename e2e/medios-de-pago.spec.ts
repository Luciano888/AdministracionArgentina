import { expect, test, type APIRequestContext } from "@playwright/test";
import { PLATFORM, login, loginVenue, spinner } from "./helpers";

/**
 * «Medios de pago»: la plataforma fija el cargo por servicio de cada recinto; el admin del recinto solo lo ve.
 * La prueba deja ccs-001 sin cargo al terminar, para no cambiar los totales de las otras pruebas.
 */

async function resetFee(request: APIRequestContext) {
  const res = await request.post("/api/Admin/Login", { data: PLATFORM });
  const { token } = (await res.json()) as { token: string };
  const put = await request.put("/api/Admin/PaymentSettings", {
    headers: { "x-operator-token": token },
    data: { tenantId: "ccs-001", serviceFee: { percent: 0, minimum: 0 } },
  });
  expect(put.status()).toBe(200);
}

test.describe.serial("medios de pago", () => {
  test.afterAll(async ({ request }) => {
    await resetFee(request);
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
