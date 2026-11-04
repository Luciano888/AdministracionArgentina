import { describe, expect, it } from "vitest";
import { dayKey, monthKey, parseDay, weekLabel, weekStart } from "@/lib/sessionDates";

describe("parseDay / dayKey", () => {
  it("ida y vuelta sin correrse de día", () => {
    for (const fecha of ["2030-01-01", "2030-02-28", "2032-02-29", "2030-12-31"]) {
      expect(dayKey(parseDay(fecha))).toBe(fecha);
    }
  });
});

describe("monthKey", () => {
  it("toma año y mes", () => {
    expect(monthKey("2035-06-01")).toBe("2035-06");
  });
});

describe("weekStart", () => {
  it("un lunes es su propio inicio", () => {
    expect(weekStart("2030-01-14")).toBe("2030-01-14");
  });

  it("un miércoles vuelve al lunes", () => {
    expect(weekStart("2030-01-16")).toBe("2030-01-14");
  });

  it("un domingo pertenece a la semana del lunes anterior", () => {
    expect(weekStart("2030-01-20")).toBe("2030-01-14");
  });

  it("cruza el cambio de mes y de año", () => {
    expect(weekStart("2030-03-02")).toBe("2030-02-25");
    expect(weekStart("2030-01-01")).toBe("2029-12-31");
  });
});

describe("weekLabel", () => {
  it("muestra de lunes a domingo", () => {
    expect(weekLabel("2030-01-14", "es-AR")).toMatch(/^14 .+ – 20 .+$/);
  });
});
