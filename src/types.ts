import type { VenueConfig } from "@/lib/venueConfig";

export type Theme = {
  primary: string;
  primaryDark: string;
  primaryForeground: string;
};

export type Features = {
  nominacion: boolean;
  factura: boolean;
  login: boolean;
};

export type Venue = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  city: string;
  theme: Theme;
  logo: string;
  features: Features;
  /** Propuesto: reglas propias del recinto. Si no viene, rigen los valores por defecto. */
  config?: Partial<VenueConfig> | null;
};

export type AdminSession = {
  token: string;
  operatorId: string;
  nombre: string;
  email: string;
  role: "admin" | "platform";
  tenantId: string | null;
  expiresAt: string;
};

export type EventIconName = "theater" | "music" | "palette" | "film" | "landmark" | "ship" | "users" | "microscope";

export type ShowEvent = {
  id: string;
  tenantId: string;
  enlaceMenuId: number;
  titulo: string;
  descripcion: string;
  descripcionLarga: string;
  minimoPrecio: number;
  categoria: string;
  duracion: string;
  ubicacion: string;
  textoAmigable: string;
  icon: EventIconName;
  gradient: string;
  imagen?: string;
};

export type Tariff = {
  id: number;
  eventId: string;
  nombre: string;
  pvp: number;
  pvpBoxOffice: number | null;
  descripcion: string;
};

export type ShowSession = {
  id: string;
  eventId: string;
  fecha: string;
  hora: string;
  cupo: number;
  consumed: number;
  disponible: number;
};

export type Staff = {
  id: string;
  tenantId: string | null;
  email: string;
  nombre: string;
  role: "cashier" | "supervisor";
  active: boolean;
};

export type Terminal = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
};

export type IssuedTicket = {
  code: string;
  status: string;
  tariffName: string | null;
  price: number;
};

export type IssuedOrder = {
  localizador: string;
  canal: string;
  estado: string;
  email: string;
  total: number;
  fecha: string;
  titulo: string;
  tickets: IssuedTicket[];
};
