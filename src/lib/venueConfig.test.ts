import { describe, expect, it } from "vitest";
import { DEFAULT_VENUE_CONFIG, resolveVenueConfig } from "@/lib/venueConfig";

describe("resolveVenueConfig", () => {
  it("sin config del recinto usa los valores por defecto", () => {
    expect(resolveVenueConfig()).toEqual(DEFAULT_VENUE_CONFIG);
    expect(resolveVenueConfig(null)).toEqual(DEFAULT_VENUE_CONFIG);
  });

  it("toma lo que manda el recinto y completa el resto", () => {
    const config = resolveVenueConfig({ categorias: ["Danza", "Infantil"], descripcionMax: 120, currency: "usd" });
    expect(config.categorias).toEqual(["Danza", "Infantil"]);
    expect(config.descripcionMax).toBe(120);
    expect(config.currency).toBe("USD");
    expect(config.descripcionLargaMax).toBe(DEFAULT_VENUE_CONFIG.descripcionLargaMax);
    expect(config.locale).toBe("es-AR");
  });

  it("limpia categorías vacías y repetidas", () => {
    expect(resolveVenueConfig({ categorias: [" Danza ", "", "Danza"] }).categorias).toEqual(["Danza"]);
  });

  it("descarta valores que no sirven", () => {
    const config = resolveVenueConfig({
      categorias: [],
      descripcionMax: -5,
      imagenMaxBytes: Number.NaN,
      currency: "no-es-moneda",
      locale: "   ",
      geocoderCountry: "",
    });
    expect(config).toEqual(DEFAULT_VENUE_CONFIG);
  });

  it("normaliza el país del geocodificador", () => {
    expect(resolveVenueConfig({ geocoderCountry: "UY" }).geocoderCountry).toBe("uy");
  });
});
