import { expect, test } from "@playwright/test";
import { acceptDialogs, fieldSelect, loginVenue, removeEventByTitle, stamp } from "./helpers";

test("el menú del evento explica ficha, tarifas y sesiones", async ({ page }) => {
  await loginVenue(page);
  await expect(page.getByRole("status", { name: "Cargando eventos" })).toBeHidden();
  const tango = page.locator("article").filter({ has: page.getByRole("heading", { name: "Tango en el Patio" }) });
  await tango.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar evento" })).toBeVisible();
  await expect(page.getByLabel("Título")).toHaveValue("Tango en el Patio");
  await expect(page.getByRole("link", { name: "Ficha Datos de este evento" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tarifas Precios web y de taquilla" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sesiones Fechas, hora y cupo" })).toBeVisible();
  await expect(page.getByText(/\/ 80/)).toBeVisible();
  await expect(page.getByText("Se guarda como")).toBeVisible();
  await expect(page.getByLabel("Horas")).toHaveValue("2");
  await expect(page.getByLabel("Minutos")).toHaveValue("30");

  const help = page.getByRole("button", { name: /Identificador de la dirección pública/ });
  await help.hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
});

test("se crea un evento, su tarifa y una sesión, y se pueden borrar", async ({ page }) => {
  acceptDialogs(page);
  const mark = stamp();
  const titulo = `Ensayo ${mark}`;
  const slug = `ensayo-${mark}`;

  await loginVenue(page);
  try {
  await page.getByRole("link", { name: "Nuevo evento" }).click();
  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Categoría").selectOption("Música");
  await page.getByLabel("Descripción corta").fill("Función de prueba del panel.");
  await page.getByLabel("Descripción larga").fill("Texto largo de la función de prueba. No se publica en la muestra.");
  await page.getByLabel("Horas").selectOption("2");
  await page.getByLabel("Minutos").selectOption("30");
  await expect(page.getByText("Se guarda como 2 h 30 min.")).toBeVisible();
  await page.getByPlaceholder("Sala del recinto o una dirección").fill("Sala de ensayo");
  await page.getByLabel("Texto amigable").fill(slug);
  await page.getByLabel("Precio mínimo").fill("1500");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page).toHaveURL(/\/tarifas$/);
  await expect(page.getByRole("heading", { name: "Tarifas" })).toBeVisible();
  await page.getByLabel("Nombre").fill(`Platea ${mark}`);
  await page.getByLabel("Precio web").fill("1500");
  await page.getByLabel("Precio taquilla").fill("1200");
  await page.getByRole("button", { name: "Agregar tarifa" }).click();
  await expect(page.getByText(`Platea ${mark}`)).toBeVisible();
  await expect(page.getByRole("cell", { name: /1\.200/ })).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Precio web").fill("1800");
  await page.getByRole("button", { name: "Actualizar tarifa" }).click();
  await expect(page.getByRole("cell", { name: /1\.800/ })).toBeVisible();
  await page.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText("Sin tarifas.")).toBeVisible();

  await page.getByRole("link", { name: "Sesiones Fechas, hora y cupo" }).click();
  await expect(page.getByText("Sin sesiones publicadas.")).toBeVisible();
  await page.getByLabel("Fecha").fill("2030-01-15");
  await page.getByLabel("Hora").fill("11:00");
  await page.getByLabel("Cupo").fill("25");
  await page.getByRole("button", { name: "Publicar sesión" }).click();
  await expect(page.locator("option[value='2030-01']")).toBeAttached();
  await fieldSelect(page, "Mes").selectOption("2030-01");
  await expect(page.getByRole("cell", { name: "11:00" })).toBeVisible();
  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Cupo").fill("10");
  await page.getByRole("button", { name: "Actualizar sesión" }).click();
  await expect(page.getByRole("cell", { name: "10" })).toHaveCount(2);

  await page.getByLabel("Fecha").fill("2030-01-15");
  await page.getByLabel("Hora").fill("11:00");
  await page.getByRole("button", { name: "Publicar sesión" }).click();
  await expect(page.getByText("Ya hay una sesión en esa fecha y hora")).toBeVisible();

  await page.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText("Sin sesiones publicadas.")).toBeVisible();

  await page.getByRole("link", { name: "Ficha Datos de este evento" }).click();
  await expect(page.getByLabel("Título")).toHaveValue(titulo);
  await page.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Cargando eventos" })).toBeHidden();
  await expect(page.getByRole("heading", { name: titulo })).toHaveCount(0);
  } finally {
    await removeEventByTitle(page, titulo);
  }
});
