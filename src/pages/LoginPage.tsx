import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Banner, Card, Field, PrimaryButton } from "@/components/ui";
import { login } from "@/lib/api";
import { useAdmin } from "@/lib/session";

export function LoginPage() {
  const session = useAdmin((s) => s.session);
  const setSession = useAdmin((s) => s.setSession);
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@plataforma");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session?.role === "platform") return <Navigate to="/recintos" replace />;
  if (session?.role === "admin" && session.tenantId) return <Navigate to={`/recintos/${session.tenantId}/eventos`} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const next = await login(email, password);
      setSession(next);
      navigate(next.role === "admin" && next.tenantId ? `/recintos/${next.tenantId}/eventos` : "/recintos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Venta online y taquilla</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="mt-2 text-sm text-slate-500">Configurá recintos, precios y cupo. La caja sigue en la taquilla.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <Field label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {error ? <Banner>{error}</Banner> : null}
          <PrimaryButton type="submit" disabled={busy} className="w-full">
            {busy ? "Entrando…" : "Entrar"}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
