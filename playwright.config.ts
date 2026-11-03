import { defineConfig, devices } from "@playwright/test";

const uiOrigin = "http://localhost:5175";
const apiOrigin = "http://localhost:3003";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: uiOrigin,
    trace: "on-first-retry",
    locale: "es-AR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx next dev --turbopack --port 3003",
      cwd: "../VentaOnlineArgentina",
      url: `${apiOrigin}/api/tenants`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      env: {
        ...process.env,
        MP_MOCK: "1",
        MP_ACCESS_TOKEN: "e2e-mock",
        APP_URL: apiOrigin,
        RESEND_API_KEY: "",
        MAIL_DUMP: "",
        MAIL_SMTP_HOST: "",
      } as Record<string, string>,
    },
    {
      command: "npx vite --port 5175 --strictPort",
      url: uiOrigin,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      env: {
        ...process.env,
        VO_API_ORIGIN: apiOrigin,
      } as Record<string, string>,
    },
  ],
});
