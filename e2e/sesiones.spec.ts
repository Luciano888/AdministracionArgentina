import { expect, test } from "@playwright/test";
import { fieldSelect, loginVenue, spinner } from "./helpers";

test("las sesiones se filtran por mes y por semana", async ({ page }) => {
  await loginVenue(page);
  const tango = page.locator("article").filter({ has: page.getByRole("heading", { name: "Tango en el Patio" }) });
  await tango.getByRole("link", { name: "Sesiones" }).click();
  const months = fieldSelect(page, "Mes");
  await expect(months).toBeVisible({ timeout: 30_000 });
  await expect(spinner(page, "Cargando sesiones")).toBeHidden();

  const week = fieldSelect(page, "Semana");
  await expect(week).toBeVisible();
  const weekCount = await week.locator("option").count();
  expect(weekCount).toBeGreaterThan(1);

  await week.selectOption("");
  await expect.poll(async () => page.getByRole("row").count()).toBeGreaterThan(2);
  const monthTotal = await page.getByRole("row").count();

  await week.selectOption({ index: 1 });
  await expect.poll(async () => page.getByRole("row").count()).toBeLessThan(monthTotal);

  const lastMonth = await months.locator("option").last().getAttribute("value");
  await months.selectOption(lastMonth!);
  await expect(week.locator("option")).not.toHaveCount(1);
});
