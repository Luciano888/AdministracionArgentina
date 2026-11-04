import { type FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { Banner, Card, Field, GhostButton, PageTitle, PrimaryButton, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useConfirm, useToast } from "@/lib/feedback";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";
import type { Terminal } from "@/types";

const EMPTY = { id: "", code: "", name: "" };

export function TerminalsPage() {
  const { tenantId = "" } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const { data: rows = [], loading, error: loadError, reload } = useAdminQuery<Terminal[]>("Admin/Terminals", { tenantId });
  const confirm = useConfirm();
  const toast = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove(id: string) {
    if (!(await confirm({ title: "¿Borrar esta terminal?", message: "Solo se puede si no tiene turnos ni ventas." }))) return;
    setError("");
    try {
      await adminFetch("Admin/Terminals", { method: "DELETE", token, query: { id } });
      if (draft.id === id) setDraft(EMPTY);
      toast("Terminal borrada");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("Admin/Terminals", {
        method: draft.id ? "PUT" : "POST",
        token,
        body: { id: draft.id || undefined, tenantId, code: draft.code, name: draft.name },
      });
      setDraft(EMPTY);
      toast("Terminal guardada");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle kicker="Caja">Terminales</PageTitle>
      <p className="text-sm text-slate-500">El código es el que elige el cajero al abrir el turno, por ejemplo TPV-01.</p>
      {error || loadError ? <Banner>{error || loadError}</Banner> : null}
      <Card>
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                <span className="font-medium">{row.code}</span>
                <span className="text-slate-500"> · {row.name}</span>
              </span>
              <span className="flex gap-3">
                <button type="button" className="text-primary" onClick={() => setDraft({ id: row.id, code: row.code, name: row.name })}>
                  Editar
                </button>
                <button type="button" className="text-slate-500" onClick={() => remove(row.id)}>
                  Borrar
                </button>
              </span>
            </li>
          ))}
        </ul>
        {loading ? <Spinner label="Cargando terminales" className="py-4" /> : null}
        {!loading && !loadError && rows.length === 0 ? <p className="text-sm text-slate-500">Sin terminales.</p> : null}
      </Card>
      <form onSubmit={onSubmit}>
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} required />
          <Field label="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          <div className="flex gap-3 sm:col-span-2">
            <PrimaryButton type="submit" disabled={busy}>
              {draft.id ? "Actualizar" : "Crear terminal"}
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
