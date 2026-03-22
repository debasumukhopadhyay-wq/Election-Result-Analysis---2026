// 25-Factor Election Prediction Model — WB Assembly Election 2026
// Total weight = 100 points

const FACTOR_WEIGHTS = {
  candidateImage:        7,   // #1  Clean, credible, relatable
  partyBrand:            6,   // #2  Strong party backing
  antiIncumbency:        5,   // #3  Voter fatigue vs opponent anger
  casteEquation:         9,   // #4  MOST DECISIVE — dominant caste alignment
  communityCoalition:    4,   // #5  Broad social alliance
  localIssuesFit:        3,   // #6  Campaign matches ground reality
  boothNetwork:          8,   // #7  Cadre at every booth
  groundIntelligence:    2,   // #8  Real-time voter feedback
  campaignNarrative:     2,   // #9  Clear emotional storyline
  leadershipSupport:     4,   // #10 Star campaigners, top leaders
  funding:               2,   // #11 Adequate, well-managed funds
  volunteerStrength:     3,   // #12 Energized loyal workers
  socialMediaStrategy:   2,   // #13 Targeted digital outreach
  whatsappNetworks:      1,   // #14 Local micro-networking
  oppositionWeakness:    4,   // #15 Divided or weak rivals
  allianceStrategy:      6,   // #16 Smart seat-sharing
  candidateAccessibility:3,   // #17 Reachable, visible candidate
  pastPerformance:       5,   // #18 Delivered tangible results
  manifestoCredibility:  2,   // #19 Realistic appealing promises
  mediaManagement:       2,   // #20 Positive coverage
  crisisHandling:        2,   // #21 Confident response to controversy
  voterTurnoutStrategy:  5,   // #22 GOTV efficiency
  electionDayManagement: 5,   // #23 Booth agents, logistics
  microTargeting:        2,   // #24 Tailored outreach to segments
  momentum:              6,   // #25 Strong finishing push (last 10 days)
};

// Verify total = 100
const TOTAL_WEIGHT = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
if (TOTAL_WEIGHT !== 100) console.warn(`Factor weights sum to ${TOTAL_WEIGHT}, expected 100`);

// Base party popularity in WB 2026 (0-100 scale)
// TMC is dominant, BJP second, CPM declined significantly
const PARTY_POPULARITY = {
  TMC:  72,   // Ruling party, Mamata dominance
  BJP:  55,   // Strong opposition
  CPM:  32,   // Declining but organized cadre
  INC:  25,   // Very weak in WB
  ISF:  22,   // Limited to pockets of S24P
  RSP:  20,   // Left Front ally, limited
  CPI:  18,   // Left Front ally, limited
  AIFB: 18,   // Left Front ally, limited
  IND:  12,   // Independents rarely win
};

// Party booth/cadre strength in WB (0-100)
const PARTY_CADRE_STRENGTH = {
  TMC:  85,   // Strongest booth network in WB
  BJP:  60,   // Improved since 2019 but still weaker
  CPM:  55,   // Old cadre base still functional
  INC:  20,   // Very weak
  ISF:  35,   // Strong only in specific pockets
  RSP:  25,   // Declining
  CPI:  22,
  AIFB: 22,
  IND:  10,
};

// Party funding/resources (0-100)
const PARTY_FUNDING = {
  TMC:  80,   // Ruling party resources
  BJP:  85,   // National party with deep pockets
  CPM:  35,   // Party fund, declining
  INC:  30,
  ISF:  20,
  RSP:  18,
  CPI:  18,
  AIFB: 18,
  IND:  10,
};

// Party social media & digital strength (0-100)
const PARTY_DIGITAL = {
  TMC:  70,
  BJP:  80,   // Strong national IT cell
  CPM:  40,
  INC:  35,
  ISF:  25,
  RSP:  20,
  CPI:  20,
  AIFB: 20,
  IND:  10,
};

// Alliance bonus — parties in formal alliances in 2026 WB
// Left Front (CPM+CPI+RSP+AIFB) gets alliance synergy
// TMC alone, BJP alone, Left Front together
const ALLIANCE_BONUS = {
  TMC:  0,    // No formal alliance
  BJP:  0,    // No formal alliance
  CPM:  15,   // Left Front alliance
  INC:  5,    // Very weak, limited seats
  ISF:  8,    // Limited alliance
  RSP:  15,   // Left Front alliance
  CPI:  15,   // Left Front alliance
  AIFB: 15,   // Left Front alliance
  IND:  0,
};

// Media coverage advantage (0-100)
const PARTY_MEDIA = {
  TMC:  75,   // Controls state media
  BJP:  70,   // National media coverage
  CPM:  35,
  INC:  30,
  ISF:  20,
  RSP:  18,
  CPI:  18,
  AIFB: 18,
  IND:  8,
};

function normalizeWeights(customWeights) {
  if (!customWeights) return FACTOR_WEIGHTS;
  const merged = { ...FACTOR_WEIGHTS, ...customWeights };
  const total = Object.values(merged).reduce((a, b) => a + b, 0);
  const normalized = {};
  for (const [k, v] of Object.entries(merged)) {
    normalized[k] = (v / total) * 100;
  }
  return normalized;
}

module.exports = {
  FACTOR_WEIGHTS,
  PARTY_POPULARITY,
  PARTY_CADRE_STRENGTH,
  PARTY_FUNDING,
  PARTY_DIGITAL,
  ALLIANCE_BONUS,
  PARTY_MEDIA,
  normalizeWeights,
  TOTAL_WEIGHT
};
