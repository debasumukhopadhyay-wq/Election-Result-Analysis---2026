export interface FactorScore {
  score: number;
  weight: number;
  weightedScore: number;
}

export interface CandidateScore {
  candidateId: string;
  name: string;
  party: string;
  age?: number;
  education?: string;
  criminalCases?: number;
  termCount?: number;
  totalScore: number;
  predictedVoteShare: number;
  factorScores: {
    candidateImage:         { score: number; weight: number };
    partyBrand:             { score: number; weight: number };
    antiIncumbency:         { score: number; weight: number };
    casteEquation:          { score: number; weight: number };
    communityCoalition:     { score: number; weight: number };
    localIssuesFit:         { score: number; weight: number };
    boothNetwork:           { score: number; weight: number };
    groundIntelligence:     { score: number; weight: number };
    campaignNarrative:      { score: number; weight: number };
    leadershipSupport:      { score: number; weight: number };
    funding:                { score: number; weight: number };
    volunteerStrength:      { score: number; weight: number };
    socialMediaStrategy:    { score: number; weight: number };
    whatsappNetworks:       { score: number; weight: number };
    oppositionWeakness:     { score: number; weight: number };
    allianceStrategy:       { score: number; weight: number };
    candidateAccessibility: { score: number; weight: number };
    pastPerformance:        { score: number; weight: number };
    manifestoCredibility:   { score: number; weight: number };
    mediaManagement:        { score: number; weight: number };
    crisisHandling:         { score: number; weight: number };
    voterTurnoutStrategy:   { score: number; weight: number };
    electionDayManagement:  { score: number; weight: number };
    microTargeting:         { score: number; weight: number };
    momentum:               { score: number; weight: number };
  };
}

export interface PredictedWinner {
  candidateId: string;
  name: string;
  party: string;
  predictedVoteShare: number;
  winProbability: number;
  margin: number;
}

export interface BoothData {
  boothId: string;
  boothNumber: number;
  estimatedVoters: number;
  leadingParty: string;
  swingRisk: 'low' | 'medium' | 'high';
  margin: number;
  shares: Record<string, number>;
}

export interface BoothSimulation {
  totalBooths: number;
  booths: BoothData[];
  swingScenarios: {
    base: Record<string, number>;
    highTurnout: Record<string, number>;
    lowTurnout: Record<string, number>;
  };
  summary: {
    highSwingBooths: number;
    partyBoothCounts: Record<string, number>;
    swingSensitivePercent: number;
  };
}

export interface CandidateInsight {
  strengths: string[];
  weaknesses: string[];
  improvementStrategy: string;
}

export interface AIReasoning {
  narrative: string;
  keyFactors: string[];
  candidateInsights: Record<string, CandidateInsight>;
  confidenceAdjustment: number;
  dataQuality: 'high' | 'medium' | 'low';
  missingDataIndicators: string[];
}

export interface ContextSignal {
  party: string;
  label: string;
  reason: string;
  direction: 'positive' | 'negative';
  scoreDelta: number;
  factors: string[];
}

export interface PredictionResult {
  constituencyId: string;
  constituencyName: string;
  district: string;
  predictedWinner: PredictedWinner;
  allCandidates: CandidateScore[];
  boothSimulation: BoothSimulation;
  aiReasoning: AIReasoning;
  confidenceScore: number;
  explainabilityScore: number;
  generatedAt: string;
  contextSignals?: ContextSignal[];
}

export interface PredictRequest {
  constituencyId: string;
  contextText?: string;
  candidateAdjustments?: Record<string, Partial<import('./constituency').Candidate>>;
  weights?: Record<string, number>;
}

export const FACTOR_LABELS: Record<string, string> = {
  candidateImage:         'Candidate Image',
  partyBrand:             'Party Brand',
  antiIncumbency:         'Anti-Incumbency',
  casteEquation:          'Caste Equation',
  communityCoalition:     'Community Coalition',
  localIssuesFit:         'Local Issues Fit',
  boothNetwork:           'Booth Network',
  groundIntelligence:     'Ground Intelligence',
  campaignNarrative:      'Campaign Narrative',
  leadershipSupport:      'Leadership Support',
  funding:                'Funding',
  volunteerStrength:      'Volunteer Strength',
  socialMediaStrategy:    'Social Media',
  whatsappNetworks:       'WhatsApp Networks',
  oppositionWeakness:     'Opposition Weakness',
  allianceStrategy:       'Alliance Strategy',
  candidateAccessibility: 'Accessibility',
  pastPerformance:        'Past Performance',
  manifestoCredibility:   'Manifesto Credibility',
  mediaManagement:        'Media Management',
  crisisHandling:         'Crisis Handling',
  voterTurnoutStrategy:   'Turnout Strategy',
  electionDayManagement:  'Election Day Mgmt',
  microTargeting:         'Micro-Targeting',
  momentum:               'Momentum (Last 10 Days)',
};
