import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import { TEXTO_AMIGABLE_AYUDA } from "@/lib/eventFields";

type Place = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
};

export function HelpMark({ text = TEXTO_AMIGABLE_AYUDA }: { text?: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex size-5 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-800"
        aria-label={text}
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-7 left-0 z-20 hidden w-64 rounded-xl border border-slate-200 bg-white p-2 text-xs font-normal text-slate-600 shadow-md group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

export function DurationField({
  libre,
  horas,
  minutos,
  onLibre,
  onHoras,
  onMinutos,
}: {
  libre: boolean;
  horas: number;
  minutos: number;
  onLibre: (value: boolean) => void;
  onHoras: (value: number) => void;
  onMinutos: (value: number) => void;
}) {
  return (
    <fieldset className="space-y-2 text-sm">
      <legend className="font-medium text-slate-700">Duración</legend>
      <label className="flex items-center gap-2 text-slate-700">
        <input type="checkbox" checked={libre} onChange={(e) => onLibre(e.target.checked)} />
        Sin duración fija
      </label>
      {libre ? (
        <p className="text-slate-500">Se guarda como Libre.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-slate-600">Horas</span>
            <select
              value={horas}
              onChange={(e) => onHoras(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/30 focus:ring-2"
            >
              {Array.from({ length: 13 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-slate-600">Minutos</span>
            <select
              value={minutos}
              onChange={(e) => onMinutos(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/30 focus:ring-2"
            >
              {Array.from({ length: 60 }, (_, minute) => (
                <option key={minute} value={minute}>
                  {String(minute).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </fieldset>
  );
}

function mapSrc(place: Place) {
  const [south, north, west, east] = place.boundingbox ?? [];
  const bbox =
    west && south && east && north
      ? `${west},${south},${east},${north}`
      : `${Number(place.lon) - 0.01},${Number(place.lat) - 0.01},${Number(place.lon) + 0.01},${Number(place.lat) + 0.01}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${place.lat},${place.lon}`)}`;
}

export function LocationField({
  value,
  onChange,
  country,
}: {
  value: string;
  onChange: (value: string) => void;
  country: string;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [picked, setPicked] = useState<Place | null>(null);
  const [editing, setEditing] = useState(false);
  const [looking, setLooking] = useState(false);
  const [mapError, setMapError] = useState("");

  const query = value.trim();
  const searching = editing && query.length >= 3;
  const suggestions = searching ? places : [];

  useEffect(() => {
    if (!searching) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setLooking(true);
      setMapError("");
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("countrycodes", country);
        url.searchParams.set("limit", "5");
        url.searchParams.set("q", query);
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Place[];
        setPlaces(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPlaces([]);
        setMapError("No se pudo consultar el mapa. Podés dejar el nombre de la sala.");
      } finally {
        setLooking(false);
      }
    }, 700);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [searching, query, country]);

  return (
    <div className="space-y-1.5 text-sm">
      <span className="font-medium text-slate-700">Ubicación</span>
      <input
        value={value}
        onChange={(e) => {
          setPicked(null);
          setEditing(true);
          onChange(e.target.value);
        }}
        placeholder="Sala del recinto o una dirección"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/30 focus:ring-2"
        autoComplete="off"
      />
      {searching && looking ? <Spinner label="Buscando en el mapa…" className="text-xs" /> : null}
      {mapError ? <p className="text-xs text-slate-500">{mapError}</p> : null}
      {suggestions.length > 0 ? (
        <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {suggestions.map((place) => (
            <li key={place.place_id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditing(false);
                  setPicked(place);
                  setPlaces([]);
                  onChange(place.display_name);
                }}
              >
                {place.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {picked ? (
        <iframe title="Ubicación en el mapa" src={mapSrc(picked)} className="h-40 w-full rounded-xl border border-slate-200" />
      ) : null}
    </div>
  );
}

export function ImageField({
  imagen,
  onChange,
  onError,
  maxBytes,
}: {
  imagen: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  maxBytes: number;
}) {
  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium text-slate-700">Imagen del evento</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > maxBytes) {
            onError(`La imagen tiene que pesar menos de ${Math.round(maxBytes / 1000)} KB`);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result || ""));
          reader.onerror = () => onError("No se pudo leer la imagen");
          reader.readAsDataURL(file);
        }}
        className="block w-full text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800"
      />
      {imagen ? (
        <button type="button" className="text-sm text-slate-600 underline" onClick={() => onChange("")}>
          Quitar imagen
        </button>
      ) : (
        <p className="text-xs text-slate-500">Sin imagen, la tarjeta sigue con el color de fondo.</p>
      )}
    </div>
  );
}
