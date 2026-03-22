import client from './client';
import type { Constituency, Candidate } from '../types/constituency';

export interface ConstituencyListItem {
  id: string;
  name: string;
  district: string;
  region: string;
  reservedCategory: string;
  totalVoters: number;
  partyStrength?: Record<string, number>;
  leadingParty?: string;
  predictedWinner?: { name: string; party: string; predictedVoteShare: number } | null;
}

export async function fetchConstituencies(params?: {
  district?: string;
  region?: string;
  search?: string;
}): Promise<ConstituencyListItem[]> {
  const response = await client.get('/constituencies', { params });
  return response.data.constituencies;
}

export async function fetchConstituencyById(id: string): Promise<Constituency> {
  const response = await client.get(`/constituencies/${id}`);
  return response.data;
}

export async function fetchDistricts(): Promise<string[]> {
  const response = await client.get('/constituencies/meta/districts');
  return response.data.districts;
}

export async function fetchCandidates(constituencyId: string): Promise<Candidate[]> {
  const response = await client.get(`/candidates/constituency/${constituencyId}`);
  return response.data.candidates;
}
