import { expect, test } from "@playwright/test";
import { loginVenue, removeTerminalByCode, stamp, spinner, confirmDelete } from "./helpers";

test("se crea y se edita un cajero", async ({ page }) => {
  const mark = stamp();
  await loginVenue(page);
  await page.getByRole("link", { name: "Cajeros" }).click();
  await expect(page.getByRole("heading", { name: "Cajeros" })).toBeVisible();
  await expect(spinner(page, "Cargando cajeros")).toBeHidden();

  await page.getByLabel("Nombre").fill(`Cajero ${mark}`);
  await page.getByLabel("Email").fill(`cajero-${mark}@ccs-001`);
  await page.getByLabel("Clave").fill("caja123");
  await page.getByLabel("Rol").selectOption("supervisor");
  await page.getByRole("button", { name: "Crear cajero" }).click();
  await expect(page.getByRole("cell", { name: `Cajero ${mark}` })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Supervisor" }).last()).toBeVisible();

  await page.getByRole("row", { name: new RegExp(mark) }).getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Nombre").fill(`Cajero editado ${mark}`);
  await page.getByRole("button", { name: "Actualizar" }).click();
  await expect(page.getByRole("cell", { name: `Cajero editado ${mark}` })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(mark) }).getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Activo").uncheck();
  await page.getByRole("button", { name: "Actualizar" }).click();
  await expect(page.getByRole("row", { name: new RegExp(mark) })).toContainText("Inactivo");

  await page.getByLabel("Nombre").fill(`Cajero ${mark}`);
  await page.getByLabel("Email").fill(`cajero-${mark}@ccs-001`);
  await page.getByLabel("Clave").fill("caja123");
  await page.getByRole("button", { name: "Crear cajero" }).click();
  await expect(page.getByText("Ese email ya existe en el recinto")).toBeVisible();
});

test("se crea una terminal y no se repite el código", async ({ page }) => {
  const mark = stamp().slice(-6).toUpperCase();
  const code = `E2E${mark}`;
  await loginVenue(page);
  try {
  await page.getByRole("link", { name: "Terminales" }).click();
  await expect(page.getByText("TPV-01")).toBeVisible();

  await page.getByLabel("Código").fill(code);
  await page.getByLabel("Nombre").fill(`Boletería ${code}`);
  await page.getByRole("button", { name: "Crear terminal" }).click();
  await expect(page.getByText("Terminal guardada")).toBeVisible();
  await expect(page.getByText(`${code} · Boletería ${code}`)).toBeVisible();
  await page.getByRole("listitem").filter({ hasText: code }).getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Nombre").fill(`Mostrador ${code}`);
  await page.getByRole("button", { name: "Actualizar" }).click();
  await expect(page.getByText(`${code} · Mostrador ${code}`)).toBeVisible();

  await page.getByLabel("Código").fill(code);
  await page.getByLabel("Nombre").fill("Otra");
  await page.getByRole("button", { name: "Crear terminal" }).click();
  await expect(page.getByText("Esa terminal ya existe")).toBeVisible();

  const item = page.getByRole("listitem").filter({ hasText: code });
  await item.getByRole("button", { name: "Borrar" }).click();
  const dialog = page.getByRole("dialog", { name: "¿Borrar esta terminal?" });
  await expect(dialog).toContainText("Solo se puede si no tiene turnos ni ventas.");
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toBeHidden();
  await expect(item).toBeVisible();

  await item.getByRole("button", { name: "Borrar" }).click();
  await confirmDelete(page);
  await expect(page.getByText("Terminal borrada")).toBeVisible();
  await expect(item).toHaveCount(0);
  } finally {
    await removeTerminalByCode(page, code);
  }
});

test("las entradas emitidas se consultan y no se anulan", async ({ page }) => {
  await loginVenue(page);
  await page.getByRole("link", { name: "Entradas emitidas" }).click();
  await expect(page.getByRole("heading", { name: "Entradas emitidas" })).toBeVisible();
  await expect(page.getByText("Anular y reimprimir se hace en la caja.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Anular" })).toHaveCount(0);

  await expect(spinner(page, "Cargando entradas")).toBeHidden();
  await page.getByLabel("Localizador, email o código").fill("ZZZ-NO-EXISTE");
  const filtered = page.waitForResponse(
    (res) => res.url().includes("Admin/Entradas") && res.url().includes("q=ZZZ-NO-EXISTE") && res.ok()
  );
  await page.getByRole("button", { name: "Buscar" }).click();
  await filtered;
  await expect(page.getByText("No hay entradas para mostrar.")).toBeVisible();
});
