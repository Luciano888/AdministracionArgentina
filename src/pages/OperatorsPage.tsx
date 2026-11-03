import { type FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Banner, Card, Field, GhostButton, PageTitle, PrimaryButton, SelectField, Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";
import type { Staff } from "@/types";

const EMPTY = { id: "", nombre: "", email: "", password: "", role: "cashier" as Staff["role"], active: true };

export function OperatorsPage() {
  const { tenantId = "" } = useParams();
  const token = useAdmin((s) => s.session)!.token;
  const [rows, setRows] = useState<Staff[]>([]);
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    return adminFetch<Staff[]>("Admin/Operators", { token, query: { tenantId } })
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los cajeros"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("Admin/Operators", {
        method: draft.id ? "PUT" : "POST",
        token,
        body: {
          id: draft.id || undefined,
          tenantId,
          nombre: draft.nombre,
          email: draft.email,
          password: draft.password || undefined,
          role: draft.role,
          active: draft.active,
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

  return (
    <div className="space-y-6">
      <PageTitle kicker="Caja">Cajeros</PageTitle>
      <p className="text-sm text-slate-500">Entran a la taquilla. No administran este panel.</p>
      {error ? <Banner>{error}</Banner> : null}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Nombre</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Rol</th>
              <th className="pb-2 font-medium">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="py-3">{row.nombre}</td>
                <td>{row.email}</td>
                <td>{row.role === "supervisor" ? "Supervisor" : "Cajero"}</td>
                <td>{row.active ? "Activo" : "Inactivo"}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="text-primary"
                    onClick={() => setDraft({ id: row.id, nombre: row.nombre, email: row.email, password: "", role: row.role, active: row.active })}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <Spinner label="Cargando cajeros" className="py-4" /> : null}
        {!loading && rows.length === 0 ? <p className="pt-3 text-sm text-slate-500">Sin cajeros.</p> : null}
      </Card>
      <form onSubmit={onSubmit}>
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} required />
          <Field label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required disabled={Boolean(draft.id)} />
          <Field
            label={draft.id ? "Clave nueva (opcional)" : "Clave"}
            type="password"
            value={draft.password}
            onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            required={!draft.id}
          />
          <SelectField label="Rol" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Staff["role"] })}>
            <option value="cashier">Cajero</option>
            <option value="supervisor">Supervisor</option>
          </SelectField>
          {draft.id ? (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Activo
            </label>
          ) : null}
          <div className="flex gap-3 sm:col-span-2">
            <PrimaryButton type="submit" disabled={busy}>
              {draft.id ? "Actualizar" : "Crear cajero"}
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
