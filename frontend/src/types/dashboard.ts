export interface PartyProjection {
  seats: number;
  minSeats: number;
  maxSeats: number;
  voteShare: number;
}

export interface DistrictBreakdown {
  district: string;
  seats: number;
  partySeats: Record<string, number>;
}

export interface StateSummary {
  totalSeats: number;
  projections: Record<string, PartyProjection>;
  majorityThreshold: number;
  majorityProbability: {
    TMC: number;
    BJP: number;
    hung: number;
  };
  districtBreakdown: DistrictBreakdown[];
  lastUpdated: string;
}
