import { describe, expect, it } from "vitest";
import { formatMoney, formatWhen } from "@/lib/format";

describe("formatMoney", () => {
  it("pesos argentinos sin decimales", () => {
    expect(formatMoney(1500, "es-AR", "ARS")).toMatch(/^\$\s?1\.500$/);
  });

  it("respeta otra moneda y otro locale", () => {
    expect(formatMoney(1500, "en-US", "USD")).toBe("$1,500");
    expect(formatMoney(1500, "es-UY", "UYU")).toMatch(/1\.500/);
  });

  it("redondea a entero", () => {
    expect(formatMoney(1499.6, "es-AR", "ARS")).toMatch(/1\.500/);
  });
});

describe("formatWhen", () => {
  it("devuelve el texto original si no es una fecha", () => {
    expect(formatWhen("no-es-fecha", "es-AR")).toBe("no-es-fecha");
  });

  it("formatea fecha y hora cortas en el locale pedido", () => {
    const iso = new Date(2030, 0, 15, 20, 5).toISOString();
    // El reloj de 12 o 24 h depende de la versión de ICU (Node vs. navegador): solo se fija fecha y minutos.
    expect(formatWhen(iso, "es-AR")).toMatch(/15\/1\/30.*\b(20|8):05/);
  });
});
