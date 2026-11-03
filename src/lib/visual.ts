import type { EventIconName } from "@/types";

export const ICONS: { id: EventIconName; label: string }[] = [
  { id: "theater", label: "Teatro" },
  { id: "music", label: "Música" },
  { id: "palette", label: "Taller" },
  { id: "film", label: "Cine" },
  { id: "landmark", label: "Museo" },
  { id: "ship", label: "Paseo" },
  { id: "users", label: "Grupo" },
  { id: "microscope", label: "Ciencia" },
];

/** Literals so Tailwind keeps these gradient utilities in the build. */
export const GRADIENTS = [
  "from-blue-700 via-indigo-600 to-slate-800",
  "from-slate-800 via-blue-800 to-blue-500",
  "from-slate-900 via-blue-900 to-amber-700",
  "from-amber-700 via-orange-600 to-slate-800",
  "from-emerald-800 via-blue-700 to-slate-900",
  "from-slate-900 via-slate-700 to-blue-800",
  "from-teal-800 via-cyan-700 to-slate-900",
  "from-slate-900 via-teal-900 to-cyan-600",
  "from-amber-600 via-teal-700 to-slate-800",
  "from-teal-700 via-emerald-700 to-slate-800",
  "from-cyan-800 via-teal-600 to-slate-900",
  "from-teal-600 via-slate-700 to-cyan-800",
];
