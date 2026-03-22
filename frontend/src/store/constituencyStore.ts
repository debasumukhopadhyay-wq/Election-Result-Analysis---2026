import { create } from 'zustand';
import type { Constituency, Candidate } from '../types/constituency';

interface ConstituencyState {
  constituencies: Constituency[];
  selectedConstituencyId: string | null;
  selectedConstituency: Constituency | null;
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  setConstituencies: (list: Constituency[]) => void;
  selectConstituency: (id: string, constituency: Constituency, candidates: Candidate[]) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useConstituencyStore = create<ConstituencyState>((set) => ({
  constituencies: [],
  selectedConstituencyId: null,
  selectedConstituency: null,
  candidates: [],
  loading: false,
  error: null,
  setConstituencies: (list) => set({ constituencies: list }),
  selectConstituency: (id, constituency, candidates) => set({
    selectedConstituencyId: id,
    selectedConstituency: constituency,
    candidates
  }),
  clearSelection: () => set({
    selectedConstituencyId: null,
    selectedConstituency: null,
    candidates: []
  }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
