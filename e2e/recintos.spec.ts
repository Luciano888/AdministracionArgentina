import { expect, test } from "@playwright/test";
import { login, loginVenue, PLATFORM, stamp } from "./helpers";

test("solo la plataforma crea recintos", async ({ page }) => {
  await loginVenue(page);
  await page.goto("/recintos/nuevo");
  await expect(page.getByText("Solo la plataforma puede crear recintos.")).toBeVisible();
});

test("la plataforma crea un recinto y edita sus datos", async ({ page }) => {
  const id = `e2e-${stamp()}`;
  await login(page, PLATFORM.email, PLATFORM.password);
  await page.getByRole("link", { name: "Nuevo recinto" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo recinto" })).toBeVisible();

  await page.getByLabel("Id de conexión").fill(id);
  await page.getByLabel("Slug").fill(id);
  await page.getByLabel("Nombre", { exact: true }).fill(`Recinto ${id}`);
  await page.getByLabel("Nombre corto").fill("E2E");
  await page.getByLabel("Ciudad").fill("Rosario");
  await page.getByLabel("Tagline").fill("Sala de prueba");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page).toHaveURL(new RegExp(`/recintos/${id}/eventos$`));
  await expect(page.getByText("Este recinto todavía no tiene eventos.")).toBeVisible();

  await page.goto(`/recintos/${id}/datos`);
  await expect(page.getByRole("heading", { name: "Datos del recinto" })).toBeVisible();
  await expect(page.getByLabel("Ciudad")).toHaveValue("Rosario");
  await page.getByLabel("Ciudad").fill("Córdoba");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page).toHaveURL(new RegExp(`/recintos/${id}/eventos$`));

  await page.goto(`/recintos/${id}/datos`);
  await expect(page.getByLabel("Ciudad")).toHaveValue("Córdoba");

  await page.goto("/recintos/nuevo");
  await page.getByLabel("Id de conexión").fill(id);
  await page.getByLabel("Slug").fill(id);
  await page.getByLabel("Nombre", { exact: true }).fill(`Otro ${id}`);
  await page.getByLabel("Nombre corto").fill("E2E");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Ya existe un recinto con ese id o slug")).toBeVisible();
});

test("el id y el slug del recinto se normalizan al escribir", async ({ page }) => {
  await login(page, PLATFORM.email, PLATFORM.password);
  await expect(page).toHaveURL(/\/recintos$/);
  await page.goto("/recintos/nuevo");
  await page.getByLabel("Id de conexión").fill("Centro Norte 03");
  await expect(page.getByLabel("Id de conexión")).toHaveValue("centronorte03");
  await page.getByLabel("Slug").fill("Centro_Norte!");
  await expect(page.getByLabel("Slug")).toHaveValue("centronorte");
});
