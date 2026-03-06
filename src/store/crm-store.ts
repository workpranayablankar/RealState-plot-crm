import { create } from "zustand";
import { Lead } from "@/types/crm";
import { SAMPLE_LEADS, AGENTS } from "@/data/crm-data";

interface CRMStore {
  leads: Lead[];
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  currentUser: { role: "admin" | "agent"; agentId?: string };
  setCurrentUser: (user: { role: "admin" | "agent"; agentId?: string }) => void;
}

export const useCRMStore = create<CRMStore>((set) => ({
  leads: SAMPLE_LEADS,
  currentUser: { role: "admin" },
  setCurrentUser: (user) => set({ currentUser: user }),
  addLead: (lead) =>
    set((state) => ({
      leads: [
        {
          ...lead,
          id: String(state.leads.length + 1),
          createdAt: new Date().toISOString(),
        },
        ...state.leads,
      ],
    })),
  updateLead: (id, updates) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  deleteLead: (id) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
    })),
}));
