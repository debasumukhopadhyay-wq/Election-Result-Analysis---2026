import { create } from 'zustand';
import type { PredictionResult, PredictRequest } from '../types/prediction';
import type { Candidate } from '../types/constituency';

type PredictionStatus = 'idle' | 'loading' | 'success' | 'error';

interface PredictionState {
  status: PredictionStatus;
  result: PredictionResult | null;
  error: string | null;
  contextText: string;
  candidateAdjustments: Record<string, Partial<Candidate>>;
  customWeights: Record<string, number> | null;
  setContextText: (text: string) => void;
  setCandidateAdjustment: (candidateId: string, field: string, value: number) => void;
  setCustomWeights: (weights: Record<string, number> | null) => void;
  setLoading: () => void;
  setResult: (result: PredictionResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  status: 'idle',
  result: null,
  error: null,
  contextText: '',
  candidateAdjustments: {},
  customWeights: null,
  setContextText: (text) => set({ contextText: text }),
  setCandidateAdjustment: (candidateId, field, value) => set((state) => ({
    candidateAdjustments: {
      ...state.candidateAdjustments,
      [candidateId]: { ...(state.candidateAdjustments[candidateId] || {}), [field]: value }
    }
  })),
  setCustomWeights: (weights) => set({ customWeights: weights }),
  setLoading: () => set({ status: 'loading', error: null }),
  setResult: (result) => set({ status: 'success', result }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', result: null, error: null, contextText: '', candidateAdjustments: {} })
}));
