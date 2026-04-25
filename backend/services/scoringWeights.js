// 25-Factor Election Prediction Model — WB Assembly Election 2026
// Total weight = 100 points

const FACTOR_WEIGHTS = {
  candidateImage:        7,   // #1  Clean, credible, relatable
  partyBrand:            6,   // #2  Strong party backing
  antiIncumbency:        7,   // #3  Voter fatigue vs opponent anger — raised for 15-yr incumbency effect
  casteEquation:         7,   // #4  DECISIVE — dominant caste alignment
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
// 2021 results: TMC 213, BJP 77, ISF 1, INC 0, CPM 0
// 2026 adjustment: 5 years of anti-incumbency, opposition consolidation, Left revival in pockets
const PARTY_POPULARITY = {
  TMC:  50,   // Ruling party; strong org but 15-yr anti-incumbency eroding support
  BJP:  53,   // Main opposition; competitive in Hindu belt; 2021 vote share ~38%
  CPM:  20,   // Left Front got ~5.6% in 2021; some revival but still marginal statewide
  INC:  15,   // INC got ~2.9% in 2021; relevant only in Murshidabad/Malda pockets
  ISF:  22,   // Niche but growing; competitive in S24P, some Murshidabad Muslim pockets
  RSP:  16,   // Left Front ally, limited pockets
  CPI:  14,   // Left Front ally, negligible
  AIFB: 14,   // Left Front ally, negligible
  JUP:  22,   // Jamiat Ulema Party — Muslim identity party; strong in Murshidabad
  AIMIM: 20,  // AIMIM — Owaisi's party; presence in Malda/Murshidabad
  IND:  10,   // Independents rarely win
};

// Party booth/cadre strength in WB (0-100)
// TMC has the strongest booth-level machinery but others are rebuilding
const PARTY_CADRE_STRENGTH = {
  TMC:  62,   // Strongest org network; controls panchayats, municipalities; but fatigue setting in
  BJP:  56,   // Improved since 2019; strong in urban/Hindu belt; competitive cadre
  CPM:  24,   // Decimated since 2011; some cadre revival in industrial belt, N.Bengal
  INC:  14,   // Thin ground presence outside Murshidabad/Malda; Adhir's belt only
  ISF:  24,   // Mosque/madrasa network in S24P and parts of Murshidabad; alliance with CPM helps
  RSP:  18,   // Left Front ally, limited
  CPI:  16,
  AIFB: 16,
  JUP:  24,   // Strong mosque/madrasa network in Murshidabad
  AIMIM: 18,  // Owaisi's party — urban Muslim mobilization
  IND:  8,
};

// Party funding/resources (0-100)
const PARTY_FUNDING = {
  TMC:  80,   // Ruling party resources
  BJP:  85,   // National party with deep pockets
  CPM:  35,   // Party fund, declining
  INC:  30,
  ISF:  20,
  JUP:  15,
  AIMIM: 18,
  RSP:  18,
  CPI:  18,
  AIFB: 18,
  IND:  10,
};

// Party social media & digital strength (0-100)
const PARTY_DIGITAL = {
  TMC:  70,
  BJP:  80,   // Strong national IT cell
  CPM:  25,
  INC:  20,
  ISF:  25,
  JUP:  12,
  AIMIM: 22,
  RSP:  20,
  CPI:  20,
  AIFB: 20,
  IND:  10,
};

// Alliance bonus — parties in formal alliances in 2026 WB
// Left Front (CPM+CPI+RSP+AIFB) + ISF have seat-sharing alliance
// JUP + AIMIM informal alliance in some Muslim-majority seats
const ALLIANCE_BONUS = {
  TMC:  0,    // No formal alliance needed — dominates on own
  BJP:  0,    // No formal alliance in WB
  CPM:  5,    // Left Front + ISF alliance; but alliance failed to deliver in 2021
  INC:  1,    // No meaningful alliance; runs independently in limited pockets
  ISF:  7,    // Formal ally of CPM/Left Front; benefits from CPM cadre in seat-sharing arrangement
  JUP:  4,    // Informal JUP-AIMIM coordination in Murshidabad Muslim seats
  AIMIM: 4,   // Informal JUP-AIMIM coordination; Owaisi factor in Malda/Murshidabad
  RSP:  6,    // Left Front ally, seat-sharing benefit
  CPI:  5,    // Left Front ally
  AIFB: 5,    // Left Front ally
  IND:  0,
};

// Media coverage advantage (0-100)
const PARTY_MEDIA = {
  TMC:  68,   // Controls state media but national scrutiny rising
  BJP:  70,   // National media coverage
  CPM:  22,
  INC:  18,
  ISF:  20,
  JUP:  15,
  AIMIM: 18,
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
