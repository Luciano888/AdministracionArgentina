import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AdminSession, Venue } from "@/types";

type AdminState = {
  session: AdminSession | null;
  venue: Venue | null;
  setSession: (session: AdminSession | null) => void;
  setVenue: (venue: Venue | null) => void;
  logout: () => void;
};

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      session: null,
      venue: null,
      setSession: (session) => set({ session, venue: null }),
      setVenue: (venue) => set({ venue }),
      logout: () => set({ session: null, venue: null }),
    }),
    { name: "admin-session", storage: createJSONStorage(() => sessionStorage) }
  )
);
