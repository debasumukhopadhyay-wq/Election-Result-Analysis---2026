import client from './client';
import type { StateSummary } from '../types/dashboard';

export async function fetchStateSummary(): Promise<StateSummary> {
  const response = await client.get('/state-summary');
  return response.data;
}
