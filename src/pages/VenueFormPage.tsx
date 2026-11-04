import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Banner, Card, Field, PageTitle, PrimaryButton, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";
import type { Features, Theme, Venue } from "@/types";

const EMPTY_THEME: Theme = { primary: "#2563eb", primaryDark: "#1d4ed8", primaryForeground: "#ffffff" };
const EMPTY_FEATURES: Features = { nominacion: false, factura: false, login: true };

export function VenueFormPage() {
  const { tenantId } = useParams();
  const session = useAdmin((s) => s.session)!;
  const navigate = useNavigate();
  const creating = !tenantId;
  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [logo, setLogo] = useState("");
  const [theme, setTheme] = useState<Theme>(EMPTY_THEME);
  const [features, setFeatures] = useState<Features>(EMPTY_FEATURES);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: rows, loading, error: loadError } = useAdminQuery<Venue[]>("Admin/Tenants", {}, { enabled: !creating });
  const loaded = !creating && !loading && rows ? (rows.find((row) => row.id === tenantId) ?? null) : undefined;
  const [filledFrom, setFilledFrom] = useState<Venue | null | undefined>(undefined);

  // Al llegar el recinto se copia una vez al formulario (ajuste de estado en el render, sin efecto).
  if (loaded && loaded !== filledFrom) {
    setFilledFrom(loaded);
    setId(loaded.id);
    setSlug(loaded.slug);
    setName(loaded.name);
    setShortName(loaded.shortName);
    setTagline(loaded.tagline);
    setCity(loaded.city);
    setLogo(loaded.logo);
    setTheme(loaded.theme);
    setFeatures(loaded.features);
  }
  const loadProblem = loadError || (loaded === null ? "Recinto no encontrado" : "");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = { id: id || tenantId, slug, name, shortName, tagline, city, logo, theme, features };
    try {
      const saved = await adminFetch<Venue>("Admin/Tenants", {
        method: creating ? "POST" : "PUT",
        token: session.token,
        body,
      });
      navigate(`/recintos/${saved.id}/eventos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  if (creating && session.role !== "platform") {
    return <Banner>Solo la plataforma puede crear recintos.</Banner>;
  }

  if (!creating && loading) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageTitle kicker="Recinto">Datos del recinto</PageTitle>
        <Spinner label="Cargando el recinto" className="py-4" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-6">
      <PageTitle kicker="Recinto">{creating ? "Nuevo recinto" : "Datos del recinto"}</PageTitle>
      <Card className="space-y-4">
        {creating ? (
          <>
            <Field label="Id de conexión" value={id} onChange={(e) => setId(e.target.value)} placeholder="ccs-003" required />
            <Field label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="centro-norte" required />
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {slug} · {id}
          </p>
        )}
        <Field label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field label="Nombre corto" value={shortName} onChange={(e) => setShortName(e.target.value)} required />
        <Field label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
        <Field label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        <Field label="Logo (ruta)" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="/tenants/centro-cultural/logo.svg" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Primario" type="color" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} />
          <Field label="Oscuro" type="color" value={theme.primaryDark} onChange={(e) => setTheme({ ...theme, primaryDark: e.target.value })} />
          <Field label="Texto" type="color" value={theme.primaryForeground} onChange={(e) => setTheme({ ...theme, primaryForeground: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={features.nominacion} onChange={(e) => setFeatures({ ...features, nominacion: e.target.checked })} />
            Nominación
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={features.factura} onChange={(e) => setFeatures({ ...features, factura: e.target.checked })} />
            Factura
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={features.login} onChange={(e) => setFeatures({ ...features, login: e.target.checked })} />
            Login de compradores
          </label>
        </div>
        {error || loadProblem ? <Banner>{error || loadProblem}</Banner> : null}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Guardar"}
        </PrimaryButton>
      </Card>
    </form>
  );
}
