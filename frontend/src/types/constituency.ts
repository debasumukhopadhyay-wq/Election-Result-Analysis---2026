export interface Constituency {
  id: string;
  name: string;
  district: string;
  region: 'North Bengal' | 'South Bengal' | 'Kolkata';
  reservedCategory: 'GEN' | 'SC' | 'ST';
  totalVoters: number;
  totalBooths: number;
  historicalWinners: HistoricalWinner[];
  partyStrength: PartyStrength;
  demographics: Demographics;
  localLeadershipAlignment: Record<string, number>;
}

export interface HistoricalWinner {
  year: number;
  party: string;
  candidate: string;
  voteShare: number;
}

export interface PartyStrength {
  TMC: number;
  BJP: number;
  CPM: number;
  INC: number;
  ISF: number;
  [key: string]: number;
}

export interface Demographics {
  hinduPercent: number;
  muslimPercent: number;
  otherPercent: number;
  scPercent: number;
  stPercent: number;
  obcPercent: number;
}

export interface Candidate {
  id: string;
  constituencyId: string;
  name: string;
  party: PartyName;
  age: number;
  education: 'Below Matric' | 'Matric' | 'Graduate' | 'Post-Graduate';
  criminalCases: number;
  isLocalResident: boolean;
  termCount: number;
  oratoryScore: number;
  popularityIndex: number;
  developmentScore: number;
  antiIncumbencyRisk: number;
  demographicAlignmentScore: number;
}

export type PartyName = 'TMC' | 'BJP' | 'CPM' | 'INC' | 'ISF' | 'IND';

export const PARTY_COLORS: Record<string, string> = {
  TMC: '#20B2AA',
  BJP: '#FF6B00',
  CPM: '#DC2626',
  INC: '#1E40AF',
  ISF: '#7C3AED',
  JUP: '#166534',
  AIMIM: '#065F46',
  'CPM+ISF': '#B91C1C',
  IND: '#6B7280'
};

export const PARTY_FULL_NAMES: Record<string, string> = {
  TMC: 'All India Trinamool Congress',
  BJP: 'Bharatiya Janata Party',
  CPM: 'Communist Party of India (Marxist)',
  INC: 'Indian National Congress',
  ISF: 'Indian Secular Front',
  JUP: 'Jamiat Ulema Party',
  AIMIM: 'All India Majlis-e-Ittehadul Muslimeen',
  IND: 'Independent'
};
