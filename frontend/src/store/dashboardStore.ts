import { create } from 'zustand';
import type { StateSummary } from '../types/dashboard';

interface DashboardState {
  summary: StateSummary | null;
  loading: boolean;
  error: string | null;
  selectedDistrict: string | null;
  setSummary: (summary: StateSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedDistrict: (district: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,
  selectedDistrict: null,
  setSummary: (summary) => set({ summary }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedDistrict: (district) => set({ selectedDistrict: district })
}));
