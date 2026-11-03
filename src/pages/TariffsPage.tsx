import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Banner, Card, Field, GhostButton, PageTitle, PrimaryButton, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { formatARS } from "@/lib/format";
import { useAdmin } from "@/lib/session";
import type { Tariff } from "@/types";

const EMPTY = { id: 0, nombre: "", pvp: "", pvpBoxOffice: "", descripcion: "" };

export function TariffsPage() {
  const { tenantId = "", eventId = "" } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const [rows, setRows] = useState<Tariff[]>([]);
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    return adminFetch<Tariff[]>("Admin/Tariffs", { token, query: { eventId } })
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las tarifas"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const editing = draft.id > 0;
    try {
      await adminFetch("Admin/Tariffs", {
        method: editing ? "PUT" : "POST",
        token,
        body: {
          id: editing ? draft.id : undefined,
          eventId,
          nombre: draft.nombre,
          pvp: Number(draft.pvp),
          pvpBoxOffice: draft.pvpBoxOffice === "" ? null : Number(draft.pvpBoxOffice),
          descripcion: draft.descripcion,
        },
      });
      setDraft(EMPTY);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Borrar esta tarifa? Solo se puede si no tiene ventas.")) return;
    setError("");
    try {
      await adminFetch("Admin/Tariffs", { method: "DELETE", token, query: { id } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar");
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle kicker="Precios">Tarifas</PageTitle>
      <p className="text-sm text-slate-500">
        El precio web es el de la tienda. Si el de taquilla queda vacío, la caja cobra el mismo.{" "}
        <Link to={`/recintos/${tenantId}/eventos/${eventId}`} className="text-primary">
          Volver al evento
        </Link>
      </p>
      {error ? <Banner>{error}</Banner> : null}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Nombre</th>
              <th className="pb-2 font-medium">Web</th>
              <th className="pb-2 font-medium">Taquilla</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="py-3">
                  <p className="font-medium">{row.nombre}</p>
                  <p className="text-slate-500">{row.descripcion}</p>
                </td>
                <td>{formatARS(row.pvp)}</td>
                <td>{row.pvpBoxOffice == null ? "Igual que web" : formatARS(row.pvpBoxOffice)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="mr-3 text-primary"
                    onClick={() =>
                      setDraft({
                        id: row.id,
                        nombre: row.nombre,
                        pvp: String(row.pvp),
                        pvpBoxOffice: row.pvpBoxOffice == null ? "" : String(row.pvpBoxOffice),
                        descripcion: row.descripcion,
                      })
                    }
                  >
                    Editar
                  </button>
                  <button type="button" className="text-slate-500" onClick={() => remove(row.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <Spinner label="Cargando tarifas" className="py-4" /> : null}
        {!loading && rows.length === 0 ? <p className="pt-3 text-sm text-slate-500">Sin tarifas.</p> : null}
      </Card>
      <form onSubmit={onSubmit}>
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} required />
          <Field label="Descripción" value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} />
          <Field label="Precio web" type="number" min={0} value={draft.pvp} onChange={(e) => setDraft({ ...draft, pvp: e.target.value })} required />
          <Field
            label="Precio taquilla"
            type="number"
            min={0}
            value={draft.pvpBoxOffice}
            onChange={(e) => setDraft({ ...draft, pvpBoxOffice: e.target.value })}
            placeholder="Vacío = precio web"
          />
          <div className="flex gap-3 sm:col-span-2">
            <PrimaryButton type="submit" disabled={busy}>
              {draft.id ? "Actualizar tarifa" : "Agregar tarifa"}
            </PrimaryButton>
            {draft.id ? (
              <GhostButton type="button" onClick={() => setDraft(EMPTY)}>
                Cancelar
              </GhostButton>
            ) : null}
          </div>
        </Card>
      </form>
    </div>
  );
}
