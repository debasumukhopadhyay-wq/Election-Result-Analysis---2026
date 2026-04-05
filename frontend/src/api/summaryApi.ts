import client from './client';
import type { StateSummary } from '../types/dashboard';

export async function fetchStateSummary(): Promise<StateSummary> {
  const response = await client.get('/state-summary');
  return response.data;
}

export async function fetchStateSummaryWithContext(contextText: string): Promise<StateSummary & { contextSignals?: any[]; contextApplied?: boolean }> {
  const response = await client.post('/state-summary', { contextText });
  return response.data;
}
