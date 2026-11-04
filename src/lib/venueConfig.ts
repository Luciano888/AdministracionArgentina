import { useMemo } from "react";
import { formatMoney, formatWhen } from "@/lib/format";
import { useAdmin } from "@/lib/session";

/**
 * Reglas y formatos que pueden cambiar de un recinto (cliente) a otro.
 * La API todavía no los manda: hasta entonces rigen los valores por defecto.
 * Ver «Propuesto: config por recinto» en docs/admin/CONTRATO-API.md.
 */
export type VenueConfig = {
  categorias: string[];
  descripcionMax: number;
  descripcionLargaMax: number;
  imagenMaxBytes: number;
  locale: string;
  currency: string;
  /** Código ISO de país para acotar el geocodificador (Nominatim `countrycodes`). */
  geocoderCountry: string;
};

export const DEFAULT_VENUE_CONFIG: VenueConfig = {
  categorias: ["Música", "Teatro", "Taller", "Cine", "Exposición", "Visita", "Conferencia"],
  descripcionMax: 80,
  descripcionLargaMax: 280,
  imagenMaxBytes: 900_000,
  locale: "es-AR",
  currency: "ARS",
  geocoderCountry: "ar",
};

function positive(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function nonEmpty(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function validLocale(value: unknown, fallback: string) {
  const locale = nonEmpty(value, fallback);
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length ? locale : fallback;
  } catch {
    return fallback;
  }
}

function validCurrency(value: unknown, fallback: string) {
  const currency = nonEmpty(value, fallback).toUpperCase();
  try {
    new Intl.NumberFormat("en", { style: "currency", currency });
    return currency;
  } catch {
    return fallback;
  }
}

/** Mezcla lo que mande la API con los valores por defecto, descartando lo que no sirve. */
export function resolveVenueConfig(partial?: Partial<VenueConfig> | null): VenueConfig {
  const base = DEFAULT_VENUE_CONFIG;
  if (!partial) return base;
  const categorias = Array.isArray(partial.categorias)
    ? [...new Set(partial.categorias.filter((c): c is string => typeof c === "string" && c.trim() !== "").map((c) => c.trim()))]
    : [];
  return {
    categorias: categorias.length ? categorias : base.categorias,
    descripcionMax: positive(partial.descripcionMax, base.descripcionMax),
    descripcionLargaMax: positive(partial.descripcionLargaMax, base.descripcionLargaMax),
    imagenMaxBytes: positive(partial.imagenMaxBytes, base.imagenMaxBytes),
    locale: validLocale(partial.locale, base.locale),
    currency: validCurrency(partial.currency, base.currency),
    geocoderCountry: nonEmpty(partial.geocoderCountry, base.geocoderCountry).toLowerCase(),
  };
}

/** Config del recinto abierto en el panel, con formateadores de dinero y fecha ya atados a ella. */
export function useVenueConfig() {
  const partial = useAdmin((s) => s.venue?.config);
  return useMemo(() => {
    const config = resolveVenueConfig(partial);
    return {
      config,
      money: (value: number) => formatMoney(value, config.locale, config.currency),
      when: (iso: string) => formatWhen(iso, config.locale),
    };
  }, [partial]);
}
