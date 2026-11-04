import { expect, test, type Page, type Route } from "@playwright/test";
import { login, loginVenue, PLATFORM, spinner } from "./helpers";

/** Intercepta solo los GET a /api/Admin/<endpoint>; el resto sigue a la API real. */
async function onGet(page: Page, endpoint: string, handler: (route: Route) => Promise<void>) {
  await page.route(
    (url) => url.pathname === `/api/Admin/${endpoint}`,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await handler(route);
    }
  );
}

function gate() {
  let open!: () => void;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { open, opened };
}

const LISTS = [
  { name: "Recintos", path: "/recintos", endpoint: "Tenants", loading: "Cargando recintos", empty: "Todavía no hay recintos.", platform: true },
  { name: "Eventos", path: "/recintos/ccs-001/eventos", endpoint: "Events", loading: "Cargando eventos", empty: "Este recinto todavía no tiene eventos." },
  { name: "Tarifas", path: "/recintos/ccs-001/eventos/tango-patio/tarifas", endpoint: "Tariffs", loading: "Cargando tarifas", empty: "Sin tarifas." },
  { name: "Sesiones", path: "/recintos/ccs-001/eventos/tango-patio/sesiones", endpoint: "Sessions", loading: "Cargando sesiones", empty: "Sin sesiones publicadas." },
  { name: "Cajeros", path: "/recintos/ccs-001/cajeros", endpoint: "Operators", loading: "Cargando cajeros", empty: "Sin cajeros." },
  { name: "Terminales", path: "/recintos/ccs-001/terminales", endpoint: "Terminals", loading: "Cargando terminales", empty: "Sin terminales." },
  { name: "Entradas", path: "/recintos/ccs-001/entradas", endpoint: "Entradas", loading: "Cargando entradas", empty: "No hay entradas para mostrar." },
];

for (const list of LISTS) {
  test.describe(list.name, () => {
    test.beforeEach(async ({ page }) => {
      if (list.platform) {
        await login(page, PLATFORM.email, PLATFORM.password);
        await expect(page).toHaveURL(/\/recintos$/);
      } else {
        await loginVenue(page);
      }
    });

    test("muestra el spinner mientras espera y lo quita al responder", async ({ page }) => {
      const wait = gate();
      await onGet(page, list.endpoint, async (route) => {
        await wait.opened;
        await route.continue();
      });
      await page.goto(list.path);
      const loader = spinner(page.getByRole("main"), list.loading);
      await expect(loader).toBeVisible();
      await expect(page.getByText(list.empty)).toHaveCount(0);
      wait.open();
      await expect(loader).toBeHidden();
    });

    test("muestra el error de la API", async ({ page }) => {
      await onGet(page, list.endpoint, (route) => route.fulfill({ status: 500, json: { error: "Falla simulada" } }));
      await page.goto(list.path);
      await expect(page.getByText("Falla simulada")).toBeVisible();
      await expect(spinner(page.getByRole("main"), list.loading)).toHaveCount(0);
    });

    test("muestra el vacío solo cuando terminó y no hay filas", async ({ page }) => {
      await onGet(page, list.endpoint, (route) => route.fulfill({ json: [] }));
      await page.goto(list.path);
      await expect(page.getByText(list.empty)).toBeVisible();
    });
  });
}

test.describe("Formularios", () => {
  test("el evento muestra el spinner y después sus datos", async ({ page }) => {
    await loginVenue(page);
    const wait = gate();
    await onGet(page, "Events", async (route) => {
      await wait.opened;
      await route.continue();
    });
    await page.goto("/recintos/ccs-001/eventos/tango-patio");
    await expect(spinner(page.getByRole("main"), "Cargando el evento")).toBeVisible();
    wait.open();
    await expect(page.getByLabel("Título")).toHaveValue("Tango en el Patio");
  });

  test("el evento muestra el error de carga", async ({ page }) => {
    await loginVenue(page);
    await onGet(page, "Events", (route) => route.fulfill({ status: 500, json: { error: "Falla simulada" } }));
    await page.goto("/recintos/ccs-001/eventos/tango-patio");
    await expect(page.getByRole("main").getByText("Falla simulada")).toBeVisible();
  });

  test("el recinto muestra el spinner y después sus datos", async ({ page }) => {
    await login(page, PLATFORM.email, PLATFORM.password);
    await expect(page).toHaveURL(/\/recintos$/);
    const wait = gate();
    await onGet(page, "Tenants", async (route) => {
      await wait.opened;
      await route.continue();
    });
    await page.goto("/recintos/ccs-001/datos");
    await expect(spinner(page.getByRole("main"), "Cargando el recinto")).toBeVisible();
    wait.open();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Centro Cultural del Sur");
  });
});

test("al guardar una tarifa la lista vuelve a mostrar el spinner", async ({ page }) => {
  await loginVenue(page);
  const row = { id: 999001, eventId: "tango-patio", nombre: "Tarifa simulada", pvp: 1000, pvpBoxOffice: null, descripcion: "" };
  let saved = false;
  const wait = gate();
  await page.route(
    (url) => url.pathname === "/api/Admin/Tariffs",
    async (route) => {
      if (route.request().method() === "POST") {
        saved = true;
        return route.fulfill({ status: 201, json: row });
      }
      if (!saved) return route.fulfill({ json: [] });
      await wait.opened;
      return route.fulfill({ json: [row] });
    }
  );
  await page.goto("/recintos/ccs-001/eventos/tango-patio/tarifas");
  await expect(page.getByText("Sin tarifas.")).toBeVisible();

  await page.getByLabel("Nombre").fill(row.nombre);
  await page.getByLabel("Precio web").fill(String(row.pvp));
  await page.getByRole("button", { name: "Agregar tarifa" }).click();
  const loader = spinner(page.getByRole("main"), "Cargando tarifas");
  await expect(loader).toBeVisible();
  wait.open();
  await expect(loader).toBeHidden();
  await expect(page.getByText(row.nombre)).toBeVisible();
});
