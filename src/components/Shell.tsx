import { Building2, CalendarClock, LogOut, Monitor, Ticket, Users, Wallet, type LucideIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { Spinner } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { useAdmin } from "@/lib/session";
import { useAdminQuery } from "@/lib/useAdminQuery";
import type { ShowEvent, Venue } from "@/types";

function EventMenu({
  title,
  loading,
  links,
}: {
  title: string;
  loading: boolean;
  links: { to: string; label: string; hint: string; icon: LucideIcon; end: boolean }[];
}) {
  if (links.length === 0) {
    return <p className="px-3 pb-2 text-xs leading-5 text-slate-500">Abrí un evento para ver sus tarifas y sus sesiones.</p>;
  }

  return (
    <div className="mb-2 ml-4 border-l border-slate-200 pl-2">
      {loading ? (
        <Spinner label="Cargando el evento" className="px-3 py-1 text-xs" />
      ) : (
        <p className="truncate px-3 py-1 text-xs font-medium text-slate-900">{title || "Este evento"}</p>
      )}
      {links.map((link) => (
        <NavLink
          key={link.label}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `block rounded-xl px-3 py-1.5 ${isActive ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <link.icon className="size-3.5" />
            {link.label}
          </span>
          <span className="mt-0.5 block pl-5 text-xs text-slate-500">{link.hint}</span>
        </NavLink>
      ))}
    </div>
  );
}

function applyTheme(theme?: Venue["theme"]) {
  const root = document.documentElement;
  root.style.setProperty("--tenant-primary", theme?.primary ?? "#2563eb");
  root.style.setProperty("--tenant-primary-dark", theme?.primaryDark ?? "#1d4ed8");
  root.style.setProperty("--tenant-primary-foreground", theme?.primaryForeground ?? "#ffffff");
}

export function RequireSession({ children }: { children: ReactNode }) {
  const session = useAdmin((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function Shell() {
  const session = useAdmin((s) => s.session)!;
  const venue = useAdmin((s) => s.venue);
  const setVenue = useAdmin((s) => s.setVenue);
  const logout = useAdmin((s) => s.logout);
  const { tenantId = "", eventId = "" } = useParams();

  useEffect(() => {
    if (!tenantId) {
      setVenue(null);
      applyTheme();
      return;
    }
    let cancelled = false;
    adminFetch<Venue[]>("Admin/Tenants", { token: session.token })
      .then((rows) => {
        if (cancelled) return;
        const found = rows.find((row) => row.id === tenantId) ?? null;
        setVenue(found);
        applyTheme(found?.theme);
      })
      .catch(() => {
        if (!cancelled) applyTheme();
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, session.token, setVenue]);

  const eventQuery = useAdminQuery<ShowEvent[]>("Admin/Events", { tenantId }, { enabled: Boolean(tenantId && eventId) });
  const eventLoading = eventQuery.loading;
  const eventTitle = eventLoading ? "" : (eventQuery.data?.find((row) => row.id === eventId)?.titulo ?? "Este evento");

  if (session.role === "admin" && session.tenantId && tenantId && tenantId !== session.tenantId) {
    return <Navigate to={`/recintos/${session.tenantId}/eventos`} replace />;
  }

  const base = tenantId ? `/recintos/${tenantId}` : "";
  const links: { to: string; label: string; icon: LucideIcon; end: boolean }[] = [
    { to: "/recintos", label: "Recintos", icon: Building2, end: true },
    ...(base
      ? [
          { to: `${base}/eventos`, label: "Eventos", icon: Ticket, end: true },
          { to: `${base}/cajeros`, label: "Cajeros", icon: Users, end: false },
          { to: `${base}/terminales`, label: "Terminales", icon: Monitor, end: false },
          { to: `${base}/entradas`, label: "Entradas emitidas", icon: Ticket, end: false },
        ]
      : []),
  ];
  const eventLinks = eventId
    ? [
        { to: `${base}/eventos/${eventId}`, label: "Ficha", hint: "Datos de este evento", icon: Ticket, end: true },
        { to: `${base}/eventos/${eventId}/tarifas`, label: "Tarifas", hint: "Precios web y de taquilla", icon: Wallet, end: false },
        { to: `${base}/eventos/${eventId}/sesiones`, label: "Sesiones", hint: "Fechas, hora y cupo", icon: CalendarClock, end: false },
      ]
    : [];
  const eventosIndex = links.findIndex((link) => link.label === "Eventos");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-primary" />
      <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-6xl">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-sm font-semibold text-slate-900">Administración</p>
            <p className="mt-1 truncate text-xs text-slate-500">{venue?.name ?? session.nombre}</p>
          </div>
          <nav className="space-y-1 p-3">
            {links.map((link, index) => (
              <div key={link.label}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? "bg-primary/10 font-medium text-primary" : "text-slate-600 hover:bg-slate-50"}`
                  }
                >
                  <link.icon className="size-4" />
                  {link.label}
                </NavLink>
                {index === eventosIndex ? (
                  <EventMenu title={eventTitle} loading={eventLoading} links={eventLinks} />
                ) : null}
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
            <p className="truncate text-sm text-slate-500">{venue ? `${venue.city} · ${venue.shortName}` : "Configuración compartida"}</p>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
              <LogOut className="size-4" />
              Salir
            </button>
          </header>
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-xs ${isActive ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {eventLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-xs ${isActive ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"}`
                }
              >
                {link.label}: {link.hint}
              </NavLink>
            ))}
          </nav>
          <main className="px-4 py-8 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
