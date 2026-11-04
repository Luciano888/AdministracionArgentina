import { type ReactNode, useSyncExternalStore } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FeedbackProvider } from "@/components/Feedback";
import { RequireSession, Shell } from "@/components/Shell";
import { Spinner } from "@/components/ui";
import { useAdmin } from "@/lib/session";
import { EventFormPage } from "@/pages/EventFormPage";
import { EventsPage } from "@/pages/EventsPage";
import { LoginPage } from "@/pages/LoginPage";
import { OperatorsPage } from "@/pages/OperatorsPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { TariffsPage } from "@/pages/TariffsPage";
import { TerminalsPage } from "@/pages/TerminalsPage";
import { TicketsPage } from "@/pages/TicketsPage";
import { VenueFormPage } from "@/pages/VenueFormPage";
import { VenuesPage } from "@/pages/VenuesPage";

function Hydrate({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(useAdmin.persist.onFinishHydration, useAdmin.persist.hasHydrated);
  if (!ready) return <div className="p-8"><Spinner label="Cargando la sesión" /></div>;
  return children;
}

export default function App() {
  return (
    <Hydrate>
      <BrowserRouter>
        <FeedbackProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireSession>
                <Shell />
              </RequireSession>
            }
          >
            <Route path="/recintos" element={<VenuesPage />} />
            <Route path="/recintos/nuevo" element={<VenueFormPage />} />
            <Route path="/recintos/:tenantId/datos" element={<VenueFormPage />} />
            <Route path="/recintos/:tenantId/eventos" element={<EventsPage />} />
            <Route path="/recintos/:tenantId/eventos/nuevo" element={<EventFormPage />} />
            <Route path="/recintos/:tenantId/eventos/:eventId" element={<EventFormPage />} />
            <Route path="/recintos/:tenantId/eventos/:eventId/tarifas" element={<TariffsPage />} />
            <Route path="/recintos/:tenantId/eventos/:eventId/sesiones" element={<SessionsPage />} />
            <Route path="/recintos/:tenantId/cajeros" element={<OperatorsPage />} />
            <Route path="/recintos/:tenantId/terminales" element={<TerminalsPage />} />
            <Route path="/recintos/:tenantId/entradas" element={<TicketsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/recintos" replace />} />
        </Routes>
        </FeedbackProvider>
      </BrowserRouter>
    </Hydrate>
  );
}
