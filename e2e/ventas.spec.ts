import { expect, test } from "@playwright/test";
import { acceptDialogs, ensureSalesFixture, fieldSelect, loginVenue, SALES, sellOneTicket, type SalesFixture, spinner } from "./helpers";

// Usan siempre el mismo evento «E2E ventas» de ccs-001: con ventas no se puede borrar,
// así que se reutiliza entre corridas en vez de crear uno nuevo cada vez.
test.describe.configure({ mode: "serial" });

let fixture: SalesFixture;
let localizador: string;

test.beforeAll(async ({ request }) => {
  fixture = await ensureSalesFixture(request);
  localizador = await sellOneTicket(request, fixture);
  expect(localizador).toMatch(/^TQ-/);
});

test("un evento con ventas no se borra", async ({ page }) => {
  acceptDialogs(page);
  await loginVenue(page);
  await page.goto(`/recintos/ccs-001/eventos/${fixture.eventId}`);
  await expect(page.getByLabel("Título")).toHaveValue(SALES.titulo);
  await page.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText("El evento tiene ventas y no se puede borrar")).toBeVisible();
});

test("una tarifa con ventas no se borra", async ({ page }) => {
  acceptDialogs(page);
  await loginVenue(page);
  await page.goto(`/recintos/ccs-001/eventos/${fixture.eventId}/tarifas`);
  const row = page.getByRole("row", { name: new RegExp(SALES.tarifa) });
  await row.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText("La tarifa tiene ventas y no se puede borrar")).toBeVisible();
  await expect(row).toBeVisible();
});

test("el cupo no baja de lo vendido y la sesión con ventas no se borra", async ({ page }) => {
  acceptDialogs(page);
  await loginVenue(page);
  await page.goto(`/recintos/ccs-001/eventos/${fixture.eventId}/sesiones`);
  await expect(spinner(page, "Cargando sesiones")).toBeHidden();
  await fieldSelect(page, "Mes").selectOption(SALES.fecha.slice(0, 7));
  const row = page.getByRole("row").filter({ has: page.getByRole("cell", { name: SALES.hora }) });

  await row.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Cupo").fill("0");
  await page.getByRole("button", { name: "Actualizar sesión" }).click();
  await expect(page.getByText(/El cupo no puede bajar de \d+/)).toBeVisible();

  await row.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText("La sesión tiene ventas y no se puede borrar")).toBeVisible();
});

test("la venta de taquilla aparece en entradas emitidas, sin anular", async ({ page }) => {
  await loginVenue(page);
  await page.getByRole("link", { name: "Entradas emitidas" }).click();
  await expect(spinner(page, "Cargando entradas")).toBeHidden();
  await page.getByLabel("Localizador, email o código").fill(localizador);
  await page.getByRole("button", { name: "Buscar" }).click();
  const order = page.locator("section").filter({ has: page.getByRole("heading", { name: localizador }) });
  await expect(order).toBeVisible();
  await expect(order).toContainText("Taquilla");
  await expect(order).toContainText(SALES.titulo);
  await expect(page.getByRole("button", { name: "Anular" })).toHaveCount(0);
});
