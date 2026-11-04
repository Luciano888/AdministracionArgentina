import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EventCover } from "@/components/EventCover";
import { DurationField, HelpMark, ImageField, LocationField } from "@/components/EventFormFields";
import { Area, Banner, Card, Field, GhostButton, PageTitle, PrimaryButton, SelectField, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { formatDuracion, parseDuracion, TEXTO_AMIGABLE_AYUDA } from "@/lib/eventFields";
import { useConfirm, useToast } from "@/lib/feedback";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";
import { useVenueConfig } from "@/lib/venueConfig";
import { GRADIENTS, ICONS } from "@/lib/visual";
import type { ShowEvent } from "@/types";

export function EventFormPage() {
  const { tenantId = "", eventId } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const navigate = useNavigate();
  const { config } = useVenueConfig();
  const confirm = useConfirm();
  const toast = useToast();
  const creating = !eventId;
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [descripcionLarga, setDescripcionLarga] = useState("");
  const [libre, setLibre] = useState(false);
  const [horas, setHoras] = useState(1);
  const [minutos, setMinutos] = useState(0);
  const [ubicacion, setUbicacion] = useState("");
  const [textoAmigable, setTextoAmigable] = useState("");
  const [minimoPrecio, setMinimoPrecio] = useState("0");
  const [icon, setIcon] = useState("theater");
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [imagen, setImagen] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: rows, loading, error: loadError } = useAdminQuery<ShowEvent[]>("Admin/Events", { tenantId }, { enabled: !creating });
  const loaded = !creating && !loading && rows ? (rows.find((row) => row.id === eventId) ?? null) : undefined;
  const [filledFrom, setFilledFrom] = useState<ShowEvent | null | undefined>(undefined);

  // Al llegar el evento se copia una vez al formulario (ajuste de estado en el render, sin efecto).
  if (loaded && loaded !== filledFrom) {
    setFilledFrom(loaded);
    const duracion = parseDuracion(loaded.duracion);
    setTitulo(loaded.titulo);
    setCategoria(loaded.categoria);
    setDescripcion(loaded.descripcion);
    setDescripcionLarga(loaded.descripcionLarga);
    setLibre(duracion.libre);
    setHoras(duracion.horas);
    setMinutos(duracion.minutos);
    setUbicacion(loaded.ubicacion);
    setTextoAmigable(loaded.textoAmigable);
    setMinimoPrecio(String(loaded.minimoPrecio));
    setIcon(loaded.icon);
    setGradient(loaded.gradient || GRADIENTS[0]);
    setImagen(loaded.imagen || "");
  }
  const loadProblem = loadError || (loaded === null ? "Evento no encontrado" : "");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const duracion = formatDuracion(libre, horas, minutos);
    if (!duracion) {
      setError("Indicá horas y minutos, o marcá sin duración fija");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await adminFetch<ShowEvent>("Admin/Events", {
        method: creating ? "POST" : "PUT",
        token,
        body: {
          id: eventId,
          tenantId,
          titulo,
          categoria,
          descripcion,
          descripcionLarga,
          duracion,
          ubicacion,
          textoAmigable,
          minimoPrecio: Number(minimoPrecio || 0),
          icon,
          gradient,
          imagen,
        },
      });
      toast("Evento guardado");
      navigate(`/recintos/${tenantId}/eventos/${saved.id}/tarifas`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!eventId) return;
    if (!(await confirm({ title: "¿Borrar este evento?", message: "Solo se puede si no tiene ventas." }))) return;
    setBusy(true);
    setError("");
    try {
      await adminFetch("Admin/Events", { method: "DELETE", token, query: { id: eventId } });
      toast("Evento borrado");
      navigate(`/recintos/${tenantId}/eventos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar");
      setBusy(false);
    }
  }

  const categorias = categoria && !config.categorias.includes(categoria) ? [categoria, ...config.categorias] : config.categorias;
  const duracionVista = formatDuracion(libre, horas, minutos);

  if (!creating && loading) {
    return (
      <div className="space-y-6">
        <PageTitle kicker="Evento">Editar evento</PageTitle>
        <Spinner label="Cargando el evento" className="py-4" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_18rem]">
      <form onSubmit={onSubmit} className="space-y-6">
        <PageTitle kicker="Evento">{creating ? "Nuevo evento" : "Editar evento"}</PageTitle>
        <Card className="space-y-4">
          <Field label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          <SelectField label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
            <option value="">Elegí una categoría</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
          <Area
            label="Descripción corta"
            value={descripcion}
            maxLength={config.descripcionMax}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <Area
            label="Descripción larga"
            value={descripcionLarga}
            maxLength={config.descripcionLargaMax}
            onChange={(e) => setDescripcionLarga(e.target.value)}
          />
          <DurationField
            libre={libre}
            horas={horas}
            minutos={minutos}
            onLibre={setLibre}
            onHoras={setHoras}
            onMinutos={setMinutos}
          />
          {duracionVista && !libre ? <p className="-mt-2 text-xs text-slate-500">Se guarda como {duracionVista}.</p> : null}
          <LocationField value={ubicacion} onChange={setUbicacion} country={config.geocoderCountry} />
          <Field
            label="Texto amigable"
            labelExtra={<HelpMark />}
            value={textoAmigable}
            onChange={(e) => setTextoAmigable(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            title={TEXTO_AMIGABLE_AYUDA}
          />
          <Field label="Precio mínimo" type="number" min={0} value={minimoPrecio} onChange={(e) => setMinimoPrecio(e.target.value)} />
          <SelectField label="Ícono" value={icon} onChange={(e) => setIcon(e.target.value)}>
            {ICONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </SelectField>
          <ImageField imagen={imagen} onChange={setImagen} onError={setError} maxBytes={config.imagenMaxBytes} />
          {error || loadProblem ? <Banner>{error || loadProblem}</Banner> : null}
          <div className="flex gap-3">
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </PrimaryButton>
            {eventId ? (
              <GhostButton type="button" onClick={remove} disabled={busy}>
                Borrar
              </GhostButton>
            ) : null}
          </div>
        </Card>
      </form>
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Así se ve en la tienda</p>
        <EventCover gradient={gradient} icon={icon} imagen={imagen} className="mt-4 h-36 w-full rounded-2xl p-4" iconClassName="size-10 text-white" />
        <p className="mt-3 text-xs uppercase tracking-wide text-primary">{categoria || "Categoría"}</p>
        <h2 className="text-lg font-semibold">{titulo || "Título del evento"}</h2>
        <p className="mt-1 text-sm text-slate-500">{descripcion || "La descripción corta aparece en el catálogo."}</p>
      </Card>
    </div>
  );
}
