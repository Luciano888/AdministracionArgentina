import { describe, expect, it } from "vitest";
import { formatDuracion, parseDuracion } from "@/lib/eventFields";

describe("formatDuracion", () => {
  it("usa el formato de la tienda", () => {
    expect(formatDuracion(false, 2, 30)).toBe("2 h 30 min");
    expect(formatDuracion(false, 3, 0)).toBe("3 h");
    expect(formatDuracion(false, 0, 45)).toBe("45 min");
  });

  it("Libre gana sobre horas y minutos", () => {
    expect(formatDuracion(true, 2, 30)).toBe("Libre");
  });

  it("sin horas ni minutos no hay duración", () => {
    expect(formatDuracion(false, 0, 0)).toBe("");
  });

  it("acota a 12 horas y 59 minutos", () => {
    expect(formatDuracion(false, 20, 90)).toBe("12 h 59 min");
    expect(formatDuracion(false, -1, 10)).toBe("10 min");
  });
});

describe("parseDuracion", () => {
  it("lee lo que guarda formatDuracion", () => {
    expect(parseDuracion("2 h 30 min")).toEqual({ libre: false, horas: 2, minutos: 30 });
    expect(parseDuracion("3 h")).toEqual({ libre: false, horas: 3, minutos: 0 });
    expect(parseDuracion("45 min")).toEqual({ libre: false, horas: 0, minutos: 45 });
  });

  it("reconoce Libre sin importar mayúsculas", () => {
    expect(parseDuracion("libre").libre).toBe(true);
    expect(parseDuracion(" Libre ").libre).toBe(true);
  });

  it("un texto vacío arranca en 1 hora", () => {
    expect(parseDuracion("")).toEqual({ libre: false, horas: 1, minutos: 0 });
  });

  it("ida y vuelta conserva el valor", () => {
    for (const value of ["1 h", "1 h 5 min", "12 h 59 min", "30 min", "Libre"]) {
      const parsed = parseDuracion(value);
      expect(formatDuracion(parsed.libre, parsed.horas, parsed.minutos)).toBe(value);
    }
  });
});
