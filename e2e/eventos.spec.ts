import { expect, test, type Page } from "@playwright/test";
import { acceptDialogs, fieldSelect, loginVenue, removeEventByTitle, stamp, spinner } from "./helpers";

test("el menú del evento explica ficha, tarifas y sesiones", async ({ page }) => {
  await loginVenue(page);
  await expect(spinner(page, "Cargando eventos")).toBeHidden();
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

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

async function openNewEvent(page: Page) {
  await loginVenue(page);
  await page.getByRole("link", { name: "Nuevo evento" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo evento" })).toBeVisible();
}

test("la categoría es una lista cerrada y la descripción larga corta en 280", async ({ page }) => {
  await openNewEvent(page);
  await expect(page.getByLabel("Categoría").locator("option")).toHaveText([
    "Elegí una categoría",
    "Música",
    "Teatro",
    "Taller",
    "Cine",
    "Exposición",
    "Visita",
    "Conferencia",
  ]);

  const larga = page.getByLabel("Descripción larga");
  await larga.fill("a".repeat(300));
  await expect(larga).toHaveValue("a".repeat(280));
  await expect(page.getByText("280 / 280")).toBeVisible();
});

test("la ubicación ofrece lugares del mapa y avisa si el mapa falla", async ({ page }) => {
  await page.route("https://www.openstreetmap.org/**", (route) => route.fulfill({ contentType: "text/html", body: "<p>mapa</p>" }));
  let fail = false;
  await page.route("https://nominatim.openstreetmap.org/**", (route) => {
    if (fail) return route.fulfill({ status: 503, body: "" });
    return route.fulfill({
      json: [{ place_id: 1, display_name: "Teatro de prueba, Rosario, Santa Fe", lat: "-32.95", lon: "-60.64" }],
    });
  });
  await openNewEvent(page);

  const ubicacion = page.getByPlaceholder("Sala del recinto o una dirección");
  await ubicacion.fill("Teatro de prueba");
  await page.getByRole("button", { name: "Teatro de prueba, Rosario, Santa Fe" }).click();
  await expect(ubicacion).toHaveValue("Teatro de prueba, Rosario, Santa Fe");
  await expect(page.locator("iframe[title='Ubicación en el mapa']")).toBeVisible();

  fail = true;
  await ubicacion.fill("Otra sala");
  await expect(page.getByText("No se pudo consultar el mapa. Podés dejar el nombre de la sala.")).toBeVisible();
});

test("una imagen de más de 900 KB no se acepta", async ({ page }) => {
  await openNewEvent(page);
  await page.locator("input[type='file']").setInputFiles({
    name: "grande.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(950_000),
  });
  await expect(page.getByText("La imagen tiene que pesar menos de 900 KB")).toBeVisible();
  await expect(page.getByRole("button", { name: "Quitar imagen" })).toHaveCount(0);
});

test("un evento Libre con imagen guarda todo y toma el menor precio de sus tarifas", async ({ page }) => {
  acceptDialogs(page);
  const mark = stamp();
  const titulo = `Libre ${mark}`;
  await openNewEvent(page);
  try {
    await page.getByLabel("Título").fill(titulo);
    await page.getByLabel("Categoría").selectOption("Exposición");
    await page.getByLabel("Descripción corta").fill("Muestra de prueba del panel.");
    await page.getByLabel("Sin duración fija").check();
    await expect(page.getByText("Se guarda como Libre.")).toBeVisible();
    await page.getByLabel("Texto amigable").fill(`libre-${mark}`);
    await page.getByLabel("Precio mínimo").fill("0");
    await page.locator("input[type='file']").setInputFiles({ name: "chica.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.getByRole("button", { name: "Quitar imagen" })).toBeVisible();
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/tarifas$/);
    await expect(page.getByText("Sin tarifas.")).toBeVisible();
    await page.getByLabel("Nombre").fill(`Entrada ${mark}`);
    await page.getByLabel("Precio web").fill("2000");
    await page.getByRole("button", { name: "Agregar tarifa" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`Entrada ${mark}`) })).toContainText("Igual que web");

    await page.getByLabel("Nombre").fill(`Reducida ${mark}`);
    await page.getByLabel("Precio web").fill("1500");
    await page.getByLabel("Precio taquilla").fill("1200");
    await page.getByRole("button", { name: "Agregar tarifa" }).click();
    await expect(page.getByRole("row", { name: new RegExp(`Reducida ${mark}`) })).toBeVisible();

    await page.getByRole("link", { name: "Eventos" }).click();
    await expect(spinner(page, "Cargando eventos")).toBeHidden();
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: titulo }) });
    await expect(card).toContainText(/desde \$\s*1\.500/);

    await card.getByRole("link", { name: "Editar" }).click();
    await expect(page.getByLabel("Título")).toHaveValue(titulo);
    await expect(page.getByLabel("Sin duración fija")).toBeChecked();
    await expect(page.getByRole("button", { name: "Quitar imagen" })).toBeVisible();
  } finally {
    await removeEventByTitle(page, titulo);
  }
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
  await expect(spinner(page, "Cargando eventos")).toBeHidden();
  await expect(page.getByRole("heading", { name: titulo })).toHaveCount(0);
  } finally {
    await removeEventByTitle(page, titulo);
  }
});
