const {
  FACTOR_WEIGHTS, PARTY_POPULARITY, PARTY_CADRE_STRENGTH, PARTY_FUNDING,
  PARTY_DIGITAL, ALLIANCE_BONUS, PARTY_MEDIA, normalizeWeights
} = require('./scoringWeights');
const { REAL_2021_NUMS } = require('../data/real2021Results');

// Seeded random for deterministic results
function seed(n) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}
function seededRandFloat(n, min, max) {
  return parseFloat((seed(n) * (max - min) + min).toFixed(3));
}

// Helper: get local party share from constituency.partyStrength
// CPM-ISF SEAT SHARING: In ISF seats, ISF inherits CPM's local share (and vice versa).
// This models the alliance correctly — they don't split the Left-Muslim vote.
function localShare(candidate, constituency) {
  const ps = constituency?.partyStrength || {};
  const own = ps[candidate.party];
  // Seat-sharing alliance: the contesting partner inherits ~40% of the absent partner's local share
  // This reflects real voter transfer when one partner steps aside
  if (candidate.party === 'CPM') {
    const isfShare = ps['ISF'] || 0;
    return (own || 0) + isfShare * 0.35; // CPM inherits portion of ISF's Muslim mobilization
  }
  if (candidate.party === 'ISF') {
    const cpmShare = ps['CPM'] || 0;
    return (own || 0) + cpmShare * 0.30; // ISF inherits portion of CPM's Left cadre vote
  }
  return own;
}

// ─── Individual factor scorers (each returns 0–100) ───────────────────────

// F1: Candidate Image — credibility + local party backing
function scoreCandidateImage(candidate, constituency) {
  const ls = localShare(candidate, constituency);
  // Local party presence is primary driver (up to 50 pts)
  let s = ls !== undefined ? Math.min(50, ls * 110) : 25;
  // Candidate personal quality adds up to 45 more
  s += (candidate.popularityIndex || 5) * 3.5;
  const crimPenalty = Math.min(candidate.criminalCases * 3, 12);
  s += Math.max(0, 12 - crimPenalty);
  s += candidate.education === 'Post-Graduate' ? 7 : candidate.education === 'Graduate' ? 4 : 1;
  if (candidate.isLocalResident) s += 5;
  return Math.min(100, Math.max(0, s));
}

// F2: Party Brand — local brand strength (not just state-level)
function scorePartyBrand(candidate, constituency) {
  const statePopularity = PARTY_POPULARITY[candidate.party] || 15;
  const ls = localShare(candidate, constituency);
  if (ls === undefined) return statePopularity;
  // 60% local constituency strength + 40% state-level brand
  return Math.min(100, Math.max(0, ls * 100 * 0.6 + statePopularity * 0.4));
}

// F3: Anti-Incumbency — being incumbent is risky
// Includes systemic ruling-party penalty: TMC has ruled WB for 15 yrs (since 2011).
// Even a new TMC candidate inherits voter frustration with the ruling establishment.
// BJP faces milder central-government fatigue in state elections.
function scoreAntiIncumbency(candidate) {
  const terms = candidate.termCount || 0;
  let s;
  if (terms === 0) {
    s = 70;
  } else {
    const risk = candidate.antiIncumbencyRisk || 0.3;
    const incumbencyPenalty = Math.min(60, terms * 10 + risk * 40);
    s = Math.max(10, 100 - incumbencyPenalty);
  }
  // Systemic ruling party penalty — structural, not personal
  // 15 years of continuous rule (2011–2026) creates deep anti-incumbency in many pockets
  if (candidate.party === 'TMC') s = Math.max(10, s - 18); // 15 yrs: corruption scandals, local grievances, voter fatigue
  if (candidate.party === 'BJP') s = Math.max(10, s - 5);  // Central govt fatigue; NDA 3rd term weariness
  return Math.min(100, Math.max(0, s));
}

// F4: Caste Equation — MOST DECISIVE (weight=9)
function scoreCasteEquation(candidate, constituency, demographics) {
  let s = 45;
  const dem = demographics || {};
  const caste = dem.caste || {};
  const religion = dem.religion || {};

  // SC reserved seats
  if (constituency.reservedCategory === 'SC') {
    if (candidate.party === 'TMC') s += 20;
    else if (candidate.party === 'CPM') s += 15;
    else if (candidate.party === 'BJP') s += 10;
  }
  // ST reserved seats
  if (constituency.reservedCategory === 'ST') {
    if (candidate.party === 'TMC') s += 18;
    else if (candidate.party === 'CPM') s += 12;
    else if (candidate.party === 'BJP') s += 10;
  }
  // Muslim-majority constituencies (>40% Muslim)
  // TMC retains majority of Muslim vote; ISF/CPM alliance is marginal
  // In 2021, TMC swept virtually all Muslim-majority seats despite alliance
  if (religion.muslim > 0.40) {
    if (candidate.party === 'TMC') s += 20;   // TMC remains first choice for Muslim voters — welfare + anti-BJP shield
    else if (candidate.party === 'ISF') s += 8;  // ISF has some mosque network but limited electoral pull
    else if (candidate.party === 'CPM') s += 4;  // CPM has residual Left vote but minimal Muslim traction
    else if (candidate.party === 'INC') s += 5;  // Congress has traditional Muslim pockets in Murshidabad
    else if (candidate.party === 'JUP') s += 18; // JUP — strong Muslim identity politics; ulema network
    else if (candidate.party === 'AIMIM') s += 15; // AIMIM — Owaisi's Muslim identity appeal
    else if (candidate.party === 'BJP') s -= 18; // BJP polarisation drives Muslim voters away
  } else if (religion.muslim > 0.25) {
    // Significant Muslim minority — TMC still dominant
    if (candidate.party === 'TMC') s += 14;   // TMC's Muslim vote bank intact in mixed seats
    else if (candidate.party === 'ISF') s += 4;  // ISF marginal outside S24P
    else if (candidate.party === 'CPM') s += 3;  // CPM negligible Muslim traction
    else if (candidate.party === 'JUP') s += 10; // JUP has some reach
    else if (candidate.party === 'AIMIM') s += 8;
    else if (candidate.party === 'BJP') s -= 8;
  } else if (religion.muslim > 0.15) {
    if (candidate.party === 'TMC') s += 8;
    else if (candidate.party === 'CPM') s += 2;
    else if (candidate.party === 'ISF') s += 1;
  }
  // Hindu-dominant areas — BJP benefits from religious polarisation strategy
  if (religion.hindu > 0.85) {
    if (candidate.party === 'BJP') s += 24;   // Strong Hindu consolidation; polarisation effect
    else if (candidate.party === 'TMC') s += 3; // TMC retains some Hindu vote but loses ground
  } else if (religion.hindu > 0.75) {
    if (candidate.party === 'BJP') s += 16;   // Moderate Hindu consolidation
    else if (candidate.party === 'TMC') s += 2;
  }
  // Candidate demographic alignment
  s += (candidate.demographicAlignmentScore || 0.5) * 18;
  return Math.min(100, Math.max(0, s));
}

// F5: Community Coalition — uses local party support as primary signal
function scoreCommunityCoalition(candidate, constituency, demographics) {
  const ls = localShare(candidate, constituency);
  // Local party support drives community backing (0-50 pts)
  let s = ls !== undefined ? Math.min(50, ls * 100) : 25;

  const dem = demographics || {};
  const religion = dem.religion || {};
  const caste = dem.caste || {};

  // Party-specific community coalition bonuses
  // TMC retains broadest coalition — Muslim + SC + OBC; BJP consolidates Hindu vote
  if (candidate.party === 'TMC') {
    s += religion.muslim > 0.30 ? 16 : (religion.muslim > 0.15 ? 10 : 6); // TMC's broadest coalition
  } else if (candidate.party === 'BJP') {
    // BJP Hindu consolidation — strong polarisation strategy
    s += religion.hindu > 0.80 ? 18 : (religion.hindu > 0.70 ? 13 : 6);
  } else if (candidate.party === 'CPM') {
    // CPM has limited community coalition; traditional Left vote in industrial/SC areas
    s += caste.sc > 0.20 ? 8 : (religion.muslim > 0.30 ? 4 : 3);
  } else if (candidate.party === 'ISF') {
    // ISF niche Muslim mobilisation — only effective in S24P pockets
    s += religion.muslim > 0.40 ? 10 : (religion.muslim > 0.25 ? 4 : 1);
  } else if (candidate.party === 'JUP') {
    // JUP — strong Muslim community coalition in Murshidabad
    s += religion.muslim > 0.40 ? 20 : (religion.muslim > 0.25 ? 12 : 2);
  } else if (candidate.party === 'AIMIM') {
    // AIMIM — Owaisi's Muslim identity appeal
    s += religion.muslim > 0.40 ? 16 : (religion.muslim > 0.25 ? 10 : 2);
  } else if (candidate.party === 'INC') {
    s += religion.muslim > 0.35 ? 6 : 2;
  }
  s += (candidate.demographicAlignmentScore || 0.5) * 10;
  return Math.min(100, Math.max(0, s));
}

// F6: Local Issues Fit — local presence + development record + constituency support
function scoreLocalIssuesFit(candidate, constituency) {
  const ls = localShare(candidate, constituency);
  let s = (candidate.developmentScore || 5) * 6;
  s += (ls || 0.2) * 30;
  if (candidate.isLocalResident) s += 10;
  return Math.min(100, Math.max(0, s));
}

// F7: Booth-Level Network (weight=8) — VERY DECISIVE
function scoreBoothNetwork(candidate, constituency) {
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const stateBase = PARTY_CADRE_STRENGTH[candidate.party] || 20;
  const ls = localShare(candidate, constituency);
  // Local constituency presence is 65% of booth strength
  const localBase = ls !== undefined ? Math.min(100, ls * 120) : stateBase;
  const base = stateBase * 0.35 + localBase * 0.65;
  const variation = seededRandFloat(constNum * 31 + (candidate.party.charCodeAt(0)), -6, 6);
  return Math.min(100, Math.max(0, base + variation));
}

// F8: Ground Intelligence — cadre network + local presence
function scoreGroundIntelligence(candidate, constituency) {
  const stateBase = (PARTY_CADRE_STRENGTH[candidate.party] || 20) * 0.7;
  const ls = localShare(candidate, constituency);
  return Math.min(100, Math.max(0, stateBase * 0.4 + (ls || 0.2) * 100 * 0.6));
}

// F9: Campaign Narrative — oratory + local momentum
function scoreCampaignNarrative(candidate, constituency) {
  const ls = localShare(candidate, constituency);
  let s = (candidate.oratoryScore || 5) * 6;
  s += (ls || 0.2) * 25;
  s += (PARTY_POPULARITY[candidate.party] || 20) * 0.15;
  return Math.min(100, Math.max(0, s));
}

// F10: Leadership Support
function scoreLeadershipSupport(candidate, constituency, demographics) {
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const base = PARTY_POPULARITY[candidate.party] || 20;
  const localAlign = (constituency.localLeadershipAlignment || {})[candidate.party];
  const alignBonus = localAlign !== undefined ? localAlign * 30 : 10;
  const urbanBase = demographics?.urbanRural?.urban || 0.3;
  const urbanBonus = urbanBase > 0.5 ? 8 : 0;
  const variation = seededRandFloat(constNum * 47 + (candidate.party.charCodeAt(0) * 3), -6, 6);
  return Math.min(100, Math.max(0, base * 0.5 + alignBonus + urbanBonus + variation));
}

// F11: Funding
function scoreFunding(candidate) {
  return Math.min(100, PARTY_FUNDING[candidate.party] || 15);
}

// F12: Volunteer Strength — local cadre presence
function scoreVolunteerStrength(candidate, constituency) {
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const stateBase = PARTY_CADRE_STRENGTH[candidate.party] || 20;
  const ls = localShare(candidate, constituency);
  const localBase = ls !== undefined ? Math.min(100, ls * 120) : stateBase;
  // 30% state strength + 70% local presence
  const base = stateBase * 0.3 + localBase * 0.7;
  const variation = seededRandFloat(constNum * 53 + (candidate.party.charCodeAt(0) * 7), -6, 6);
  return Math.min(100, Math.max(0, base + variation));
}

// F13: Social Media Strategy
function scoreSocialMedia(candidate, constituency, demographics) {
  const base = PARTY_DIGITAL[candidate.party] || 15;
  const urbanBase = demographics?.urbanRural?.urban || 0.3;
  const urbanFactor = urbanBase * 20;
  return Math.min(100, Math.max(0, base * 0.7 + urbanFactor));
}

// F14: WhatsApp Networks
function scoreWhatsapp(candidate, constituency, demographics) {
  const base = PARTY_DIGITAL[candidate.party] || 15;
  const urbanBase = demographics?.urbanRural?.urban || 0.3;
  return Math.min(100, Math.max(0, base * 0.6 + urbanBase * 15));
}

// F15: Opposition Weakness
function scoreOppositionWeakness(candidate, allCandidates, constituency) {
  const rivals = allCandidates.filter(c => c.party !== candidate.party);
  const maxRivalPop = Math.max(...rivals.map(r => PARTY_POPULARITY[r.party] || 10));
  const rivalWeakness = 100 - maxRivalPop;
  const splitBonus = rivals.length >= 3 ? 10 : 0;
  // Party with strongest local presence benefits most when opposition splits
  const ls = localShare(candidate, constituency) || 0.2;
  return Math.min(100, Math.max(0, 35 + rivalWeakness * 0.35 + splitBonus + ls * 20));
}

// F16: Alliance Strategy (weight=6)
// CPM + ISF are formal allies in 2026 — both get synergy bonus by default
function scoreAllianceStrategy(candidate, constituency) {
  const base = 50 + (ALLIANCE_BONUS[candidate.party] || 0);
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const variation = seededRandFloat(constNum * 61 + (candidate.party.charCodeAt(0) * 11), -8, 8);
  // CPM+ISF alliance synergy: marginal — alliance failed to win seats in 2021
  let allianceSynergy = 0;
  const muslim = constituency?.demographics?.religion?.muslim || 0;
  if (candidate.party === 'CPM' || candidate.party === 'ISF') {
    allianceSynergy = muslim > 0.30 ? 3 : (muslim > 0.15 ? 2 : 1);
  }
  return Math.min(100, Math.max(0, base + variation + allianceSynergy));
}

// F17: Candidate Accessibility — local presence + popularity
function scoreCandidateAccessibility(candidate, constituency) {
  const ls = localShare(candidate, constituency);
  let s = (candidate.popularityIndex || 5) * 4;
  s += (ls || 0.2) * 35;
  if (candidate.isLocalResident) s += 15;
  const crimPenalty = Math.min(candidate.criminalCases * 3, 12);
  s -= crimPenalty;
  return Math.min(100, Math.max(0, s));
}

// F18: Past Performance (weight=5) — local strength is primary indicator
function scorePastPerformance(candidate, historicalData, constituency) {
  // Local 2026 party strength is the strongest past-performance indicator
  const ls = localShare(candidate, constituency);
  let s = ls !== undefined ? ls * 75 : 35;

  if (historicalData && historicalData.elections) {
    historicalData.elections.forEach((election, idx) => {
      // Much lower recency weights — past elections are less predictive for 2026
      const recency = idx === 0 ? 0.4 : idx === 1 ? 0.2 : 0.1;
      const partyResult = election.results.find(r => r.party === candidate.party);
      if (partyResult) {
        if (partyResult.winner) s += 6 * recency;
        s += Math.max(-3, (partyResult.voteShare - 0.3) * 10 * recency);
      }
    });
  }
  s += (candidate.developmentScore || 5) * 1.5;
  s += Math.min(5, (candidate.termCount || 0) * 1.5);
  return Math.min(100, Math.max(0, s));
}

// F19: Manifesto Credibility — local track record + party promise
function scoreManifestoCredibility(candidate, constituency) {
  const stateBase = PARTY_POPULARITY[candidate.party] || 20;
  const ls = localShare(candidate, constituency);
  return Math.min(100, Math.max(0,
    stateBase * 0.25 + (ls || 0.2) * 100 * 0.45 + (candidate.developmentScore || 5) * 4
  ));
}

// F20: Media Management
function scoreMediaManagement(candidate) {
  return Math.min(100, PARTY_MEDIA[candidate.party] || 15);
}

// F21: Crisis Handling — local strength moderates criminal case impact
function scoreCrisisHandling(candidate, constituency) {
  const ls = localShare(candidate, constituency);
  let s = 38 + (ls || 0.2) * 35;
  const crimPenalty = Math.min(candidate.criminalCases * 5, 20);
  s -= crimPenalty;
  s += (PARTY_POPULARITY[candidate.party] || 20) * 0.18;
  return Math.min(100, Math.max(0, s));
}

// F22: Voter Turnout Strategy (weight=5)
function scoreVoterTurnoutStrategy(candidate, constituency) {
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const stateBase = PARTY_CADRE_STRENGTH[candidate.party] || 20;
  const ls = localShare(candidate, constituency);
  const localBase = ls !== undefined ? Math.min(100, ls * 120) : stateBase;
  const base = stateBase * 0.3 + localBase * 0.7;
  const variation = seededRandFloat(constNum * 67 + (candidate.party.charCodeAt(0) * 13), -6, 6);
  return Math.min(100, Math.max(0, base + variation));
}

// F23: Election Day Management (weight=5) — booth agents, logistics
function scoreElectionDayMgmt(candidate, constituency) {
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const stateBase = PARTY_CADRE_STRENGTH[candidate.party] || 20;
  const ls = localShare(candidate, constituency);
  const localBase = ls !== undefined ? Math.min(100, ls * 120) : stateBase;
  const base = stateBase * 0.3 + localBase * 0.7;
  const variation = seededRandFloat(constNum * 71 + (candidate.party.charCodeAt(0) * 17), -6, 6);
  return Math.min(100, Math.max(0, base + variation));
}

// F24: Micro-targeting — digital + local cadre + local strength
function scoreMicroTargeting(candidate, constituency) {
  const base = PARTY_DIGITAL[candidate.party] || 15;
  const cadre = PARTY_CADRE_STRENGTH[candidate.party] || 20;
  const ls = localShare(candidate, constituency);
  return Math.min(100, Math.max(0, base * 0.25 + cadre * 0.25 + (ls || 0.2) * 70));
}

// F25: Momentum — last 10 days finishing push (weight=6)
function scoreMomentum(candidate, constituency, historicalData) {
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const ls = localShare(candidate, constituency);
  // Local party strength drives campaign energy
  let s = ls !== undefined
    ? Math.min(80, ls * 100 + 18)
    : (PARTY_POPULARITY[candidate.party] || 20);
  const variation = seededRandFloat(constNum * 79 + (candidate.party.charCodeAt(0) * 19), -8, 8);
  return Math.min(100, Math.max(0, s + variation));
}

// ─── Context Signal Parser ────────────────────────────────────────────────────
// Returns { scoreAdj: {party→delta}, signals: [{party,label,reason,scoreDelta,factors}] }
// Each signal fires at most ONCE. Factor-level impacts are weighted to produce a calibrated
// total score delta so no single context phrase dominates unrealistically.
// ─────────────────────────────────────────────────────────────────────────────
const CTX_WEIGHTS = {
  candidateImage:7, partyBrand:6, antiIncumbency:5, casteEquation:9, communityCoalition:4,
  localIssuesFit:3, boothNetwork:8, groundIntelligence:2, campaignNarrative:2, leadershipSupport:4,
  funding:2, volunteerStrength:3, socialMediaStrategy:2, whatsappNetworks:1, oppositionWeakness:4,
  allianceStrategy:6, candidateAccessibility:3, pastPerformance:5, manifestoCredibility:2,
  mediaManagement:2, crisisHandling:2, voterTurnoutStrategy:5, electionDayManagement:5,
  microTargeting:2, momentum:6
};

function parseContextAdjustments(contextText) {
  if (!contextText || contextText.trim().length < 5) return { scoreAdj: {}, signals: [], partyExcluded: {} };
  const tx = contextText;

  const factorAdj = {};   // party → { factor → delta }
  const signals   = [];   // human-readable signal log
  const fired     = new Set();

  function signal(id, party, impacts, label, reason) {
    const key = `${id}:${party}`;
    if (fired.has(key)) return;
    fired.add(key);
    if (!factorAdj[party]) factorAdj[party] = {};
    let rawDelta = 0;
    Object.entries(impacts).forEach(([f, d]) => {
      factorAdj[party][f] = Math.min(40, Math.max(-40, (factorAdj[party][f] || 0) + d));
      rawDelta += d * (CTX_WEIGHTS[f] || 3) / 100;
    });
    signals.push({
      party,
      label,
      reason,
      direction: rawDelta >= 0 ? 'positive' : 'negative',
      scoreDelta: Math.round(rawDelta * 10) / 10,
      factors: Object.keys(impacts),
    });
  }

  // ── Former / exiting / ex-leader not supporting ──────────────────────────
  // Rationale: ex-MLA's network sits out; party brand and caste math unchanged
  const formerLeaderNoSupport =
    /(former|ex|outgoing|exiting|ex-)[\s-]?(mla|mp|minister|leader).{0,60}(not support|withh|silent|won't campaign|against)/i.test(tx)
    || /(mla|mp|minister|leader).{0,40}(not support|withh|silent|won't campaign).{0,30}(tmc|bjp|cpm|congress|inc)/i.test(tx);

  if (formerLeaderNoSupport) {
    if (/tmc|trinamool/i.test(tx)) signal('former_nosupport', 'TMC',
      { leadershipSupport: -20, boothNetwork: -12, volunteerStrength: -12, momentum: -8 },
      'Former/Exiting TMC leader not supporting',
      'Ex-leader\'s booth agents and volunteers likely to stay passive. Momentum hurt by news of non-support. Party brand and caste equation unaffected.'
    );
    if (/bjp/i.test(tx)) signal('former_nosupport', 'BJP',
      { leadershipSupport: -18, boothNetwork: -10, volunteerStrength: -10, momentum: -8 },
      'Former/Exiting BJP leader not supporting',
      'Ex-leader network sits out; booth coverage and volunteer turnout weakened.'
    );
    if (/cpm|cpim|left/i.test(tx)) signal('former_nosupport', 'CPM',
      { leadershipSupport: -15, boothNetwork: -8, volunteerStrength: -8, momentum: -6 },
      'Former/Exiting Left leader not supporting',
      'Partial cadre disengagement expected; limited impact on broader Left vote base.'
    );
  }

  // ── Sitting / current MLA actively rebelling ─────────────────────────────
  const sittingRebel =
    /(sitting|current|incumbent|in-power).{0,20}(mla|mp|minister).{0,50}(rebel|against|opposing|campaign against)/i.test(tx)
    || /(mla|mp).{0,30}(rebel|cross.vot|campaign(ing)? against|open(ly)? oppos)/i.test(tx);

  if (sittingRebel) {
    if (/tmc|trinamool/i.test(tx)) signal('sitting_rebel', 'TMC',
      { leadershipSupport: -25, boothNetwork: -18, volunteerStrength: -18, momentum: -12, candidateImage: -8 },
      'Sitting TMC MLA actively rebelling',
      'Active rebel controls existing booth infrastructure and loyal cadre — significantly undermines new candidate\'s ground game and public image.'
    );
    if (/bjp/i.test(tx)) signal('sitting_rebel', 'BJP',
      { leadershipSupport: -22, boothNetwork: -15, volunteerStrength: -15, momentum: -10 },
      'Sitting BJP MLA rebelling',
      'Rebel MLA\'s cadre may campaign against party candidate, splitting booth-level operations.'
    );
    if (/cpm|cpim|left/i.test(tx)) signal('sitting_rebel', 'CPM',
      { leadershipSupport: -20, boothNetwork: -12, volunteerStrength: -12, momentum: -8 },
      'Sitting Left MLA rebelling',
      'Internal conflict weakens Left\'s tightly coordinated booth machinery.'
    );
  }

  // ── Cross-party alliance / support ───────────────────────────────────────
  // e.g. "CPM will help BJP beat TMC", "Left supporting BJP", "opposition unity"
  const cpmHelpsBJP = /(cpm|cpim|left).{0,40}(help|support|back|assist|vote for).{0,20}bjp/i.test(tx)
    || /bjp.{0,40}(getting|has|getting support from).{0,20}(cpm|cpim|left)/i.test(tx);
  if (cpmHelpsBJP) {
    signal('cpm_helps_bjp', 'BJP',
      { allianceStrategy: +22, oppositionWeakness: +15, boothNetwork: +10, communityCoalition: +10, momentum: +10 },
      'CPM/Left voters supporting BJP candidate',
      'Left vote transfer to BJP is a significant tactical shift — boosts BJP\'s booth numbers, broadens coalition, and signals TMC can be defeated.'
    );
    signal('cpm_helps_bjp', 'TMC',
      { oppositionWeakness: -20, allianceStrategy: -15, momentum: -10 },
      'Opposition uniting against TMC (Left+BJP)',
      'Combined Left+BJP vote pool poses a direct threat; TMC loses the benefit of a split opposition.'
    );
    signal('cpm_helps_bjp', 'CPM',
      { allianceStrategy: +12, oppositionWeakness: +8 },
      'CPM leveraging alliance strategy against TMC',
      'CPM gains indirect political relevance by influencing seat outcome even without winning.'
    );
  }

  const bjpHelpsCPM = /bjp.{0,40}(help|support|back|assist).{0,20}(cpm|cpim|left)/i.test(tx);
  if (bjpHelpsCPM) {
    signal('bjp_helps_cpm', 'CPM',
      { allianceStrategy: +20, oppositionWeakness: +15, boothNetwork: +8, momentum: +10 },
      'BJP voters supporting CPM/Left candidate',
      'BJP-to-Left vote transfer strengthens Left\'s total tally and widens booth coverage.'
    );
    signal('bjp_helps_cpm', 'TMC',
      { oppositionWeakness: -18, allianceStrategy: -12, momentum: -8 },
      'Opposition unity against TMC (BJP+Left)',
      'Consolidated anti-TMC vote reduces TMC\'s advantage from a divided opposition.'
    );
  }

  const cpmHelpsTMC = /(cpm|cpim|left).{0,40}(help|support|back).{0,20}tmc/i.test(tx);
  if (cpmHelpsTMC) {
    signal('cpm_helps_tmc', 'TMC',
      { allianceStrategy: +18, communityCoalition: +12, boothNetwork: +10, momentum: +8 },
      'CPM/Left supporting TMC',
      'Tactical Left support broadens TMC\'s vote base and booth presence — rare but impactful.'
    );
  }

  const oppositionUnity = /opposition unity|mahagathbandhan|grand alliance|united opposition|all parties against tmc/i.test(tx);
  if (oppositionUnity) {
    signal('opp_unity', 'TMC',
      { oppositionWeakness: -25, allianceStrategy: -18, momentum: -12 },
      'Broad opposition unity against TMC',
      'Consolidated opposition eliminates vote split benefit — the single biggest structural risk for ruling party.'
    );
    signal('opp_unity', 'BJP',
      { allianceStrategy: +20, oppositionWeakness: +15 },
      'BJP benefiting from opposition unity',
      'Unified opposition typically channels votes to the strongest non-TMC party (BJP in most seats).'
    );
  }

  // ── Party internal split / faction ───────────────────────────────────────
  const partySplit = /(infight|faction|split|group war|divided|two camps|rival group)/i.test(tx);
  if (partySplit) {
    if (/tmc|trinamool/i.test(tx)) signal('party_split', 'TMC',
      { leadershipSupport: -20, volunteerStrength: -15, boothNetwork: -15, momentum: -12, allianceStrategy: -8 },
      'TMC internal factional split',
      'Two camps create contradictory campaign messages, demobilize shared volunteers, and expose booth network gaps.'
    );
    if (/bjp/i.test(tx)) signal('party_split', 'BJP',
      { leadershipSupport: -18, volunteerStrength: -14, boothNetwork: -14, momentum: -10 },
      'BJP internal factional split',
      'Divided BJP cadre reduces operational efficiency on election day.'
    );
    if (/cpm|cpim|left/i.test(tx)) signal('party_split', 'CPM',
      { leadershipSupport: -15, volunteerStrength: -12, boothNetwork: -12, momentum: -8 },
      'Left internal division',
      'Left\'s strength lies in disciplined cadre unity — factional splits disproportionately hurt them.'
    );
  }

  // ── Anti-incumbency ───────────────────────────────────────────────────────
  const antiInc = /anti.?incumbency|ruling party.{0,25}(losing|backlash|anger|unpopular)|voters?.{0,20}(angry|frustrated|upset|fed up|against ruling)/i.test(tx);
  if (antiInc) signal('anti_incumbency', 'TMC',
    { antiIncumbency: -18, pastPerformance: -12, manifestoCredibility: -8, momentum: -8 },
    'Anti-incumbency wave against ruling TMC',
    'Voters frustrated with incumbents typically penalize the ruling party\'s performance and credibility scores most.'
  );

  // ── Corruption / scam ────────────────────────────────────────────────────
  if (/tmc.{0,30}(corrupt|scam|arrested|chargesheet|controversy|criminal)/i.test(tx))
    signal('corruption_tmc', 'TMC',
      { candidateImage: -20, manifestoCredibility: -15, candidateAccessibility: -10, momentum: -10 },
      'TMC candidate linked to corruption/controversy',
      'Credibility and image take the biggest hit; voters punish directly on candidate image and manifesto trust.'
    );
  if (/bjp.{0,30}(corrupt|scam|arrested|chargesheet)/i.test(tx))
    signal('corruption_bjp', 'BJP',
      { candidateImage: -18, manifestoCredibility: -12, momentum: -10 },
      'BJP candidate linked to controversy',
      'Candidate image and manifesto credibility damaged; momentum reverses near election.'
    );

  // ── Wave / dominance signals ──────────────────────────────────────────────
  if (/tmc.{0,20}(wave|strong|popular|dominant|sweep|winning big)/i.test(tx) || /mamata.{0,20}(popular|wave|strong)/i.test(tx))
    signal('tmc_wave', 'TMC',
      { momentum: +18, partyBrand: +12, campaignNarrative: +10, voterTurnoutStrategy: +8 },
      'TMC wave / Mamata popularity surge',
      'Party brand and momentum factors amplified; high-turnout operations benefit the popular wave.'
    );
  if (/bjp.{0,20}(wave|surge|dominant|sweep)|modi.{0,20}(wave|factor|popular)/i.test(tx))
    signal('bjp_wave', 'BJP',
      { momentum: +18, partyBrand: +12, campaignNarrative: +10, leadershipSupport: +8 },
      'BJP wave / Modi factor',
      'National-level leadership boost amplifies local BJP momentum and campaign narrative.'
    );
  if (/(cpm|cpim|left).{0,25}(wave|surge|comeback|revival|resurgence|strong momentum)/i.test(tx)) {
    signal('left_wave', 'CPM',
      { momentum: +18, partyBrand: +12, campaignNarrative: +10, volunteerStrength: +8 },
      'Left Front revival / CPM resurgence',
      'Left\'s volunteer network is re-energized; brand and narrative strengthened by comeback narrative.'
    );
    ['RSP','CPI','AIFB'].forEach(p => signal('left_wave', p, { momentum: +10, partyBrand: +8 }, `${p} benefits from Left revival`, 'Allied Left parties share in the resurgence wave.'));
  }

  // ── Good / popular candidate ──────────────────────────────────────────────
  if (/tmc.{0,25}(good|strong|popular|credible|clean|experienced).{0,15}candidate|candidate.{0,25}(good|strong|popular|credible|clean).{0,15}tmc/i.test(tx))
    signal('good_cand_tmc', 'TMC',
      { candidateImage: +15, candidateAccessibility: +10, campaignNarrative: +8 },
      'TMC has a strong/credible candidate',
      'Well-regarded candidate boosts personal image scores and grassroots campaign effectiveness.'
    );
  if (/bjp.{0,25}(good|strong|popular|credible|clean|experienced).{0,15}candidate|candidate.{0,25}(good|strong|popular|credible|clean).{0,15}bjp/i.test(tx))
    signal('good_cand_bjp', 'BJP',
      { candidateImage: +15, candidateAccessibility: +10, campaignNarrative: +8 },
      'BJP has a strong/credible candidate',
      'Strong candidate compensates for lower local party strength through personal vote.'
    );
  if (/(cpm|cpim|left).{0,25}(good|strong|popular|credible|clean|experienced).{0,15}candidate|(candidate|mla).{0,25}(good|strong|popular|credible|clean).{0,15}(cpm|cpim|left)/i.test(tx))
    signal('good_cand_cpm', 'CPM',
      { candidateImage: +18, candidateAccessibility: +12, campaignNarrative: +10, momentum: +8 },
      'CPM/Left has a strong/credible candidate',
      'Credible Left candidate energizes dormant voter base and attracts swing voters.'
    );

  // ── Popular candidate (grassroots connect) ────────────────────────────────
  if (/(cpm|cpim|left).{0,30}(popular|well.liked|well.known|ground connect|grassroot)/i.test(tx))
    signal('popular_cand_cpm', 'CPM',
      { communityCoalition: +15, localIssuesFit: +12, boothNetwork: +10, volunteerStrength: +8 },
      'CPM candidate has strong grassroots connect',
      'Deep ground connect translates directly into community coalition building and volunteer mobilization.'
    );
  if (/bjp.{0,30}(popular|well.liked|ground connect|strong local)/i.test(tx))
    signal('popular_cand_bjp', 'BJP',
      { communityCoalition: +12, localIssuesFit: +10, boothNetwork: +8 },
      'BJP candidate has local popularity',
      'Local connect strengthens BJP\'s community outreach beyond the party\'s booth network base.'
    );

  // ── Left general positive ──────────────────────────────────────────────────
  if (/(cpm|cpim|left front|left).{0,30}(good|winning|strong|gaining|popular)/i.test(tx))
    signal('left_positive', 'CPM',
      { momentum: +12, communityCoalition: +10, volunteerStrength: +8 },
      'Left/CPM performing well in this area',
      'Positive local performance signals feed into momentum and community support metrics.'
    );

  // ── Weak party signals ────────────────────────────────────────────────────
  if (/bjp.{0,20}(weak|divided|disarray|no strong candidate)/i.test(tx))
    signal('weak_bjp', 'BJP',
      { boothNetwork: -12, volunteerStrength: -10, momentum: -10, candidateImage: -8 },
      'BJP appears weak / without strong candidate',
      'Organisational weakness reduces booth coverage and dampens voter enthusiasm.'
    );
  if (/(cpm|cpim|left).{0,20}(weak|declining|poor|no presence)/i.test(tx))
    signal('weak_cpm', 'CPM',
      { boothNetwork: -12, volunteerStrength: -10, momentum: -10 },
      'Left/CPM weak in this constituency',
      'Poor local presence limits cadre-based voter mobilization.'
    );

  // ── Communal / demographic signals ────────────────────────────────────────
  if (/muslim.{0,30}(consolidat|swing|shift|moving to|going to|support(ing)?).{0,15}(cpm|left)/i.test(tx))
    signal('muslim_to_left', 'CPM',
      { casteEquation: +15, communityCoalition: +15, voterTurnoutStrategy: +8 },
      'Muslim voters consolidating behind Left/CPM',
      'Community consolidation is the highest-weighted demographic signal; directly boosts caste equation (wt 9) and coalition (wt 4).'
    );
  if (/muslim.{0,30}(consolidat|swing|shift|moving to|going to|support(ing)?).{0,15}tmc/i.test(tx))
    signal('muslim_to_tmc', 'TMC',
      { casteEquation: +12, communityCoalition: +12 },
      'Muslim voters consolidating behind TMC',
      'TMC benefits from Muslim community vote bank consolidation in Muslim-plurality areas.'
    );
  if (/(hindu|hindutva).{0,20}(wave|polarisation|factor|strong)/i.test(tx))
    signal('hindu_wave', 'BJP',
      { casteEquation: +15, communityCoalition: +12, momentum: +8 },
      'Hindu consolidation / Hindutva wave',
      'Religious consolidation boosts BJP\'s caste equation — highest-weight factor (wt 9).'
    );

  // ── INC ───────────────────────────────────────────────────────────────────
  if (/congress.{0,20}(strong|popular|winning|wave)/i.test(tx)) signal('inc_positive', 'INC', { momentum: +12, partyBrand: +10, communityCoalition: +8 }, 'Congress performing strongly', 'Congress brand and momentum improving locally.');
  if (/congress.{0,20}(weak|absent|poor|no candidate)/i.test(tx)) signal('inc_weak', 'INC', { momentum: -10, boothNetwork: -8 }, 'Congress weak / absent', 'Congress vote may transfer to nearest opposition alternative.');
  if (/rahul.{0,10}gandhi.{0,20}(wave|factor|popular)/i.test(tx)) signal('rahul_wave', 'INC', { momentum: +10, leadershipSupport: +12 }, 'Rahul Gandhi wave / Congress national factor', 'National Congress leadership boost amplifies local momentum.');

  // ── ISF ───────────────────────────────────────────────────────────────────
  if (/isf.{0,20}(strong|popular|winning)|siddiqui.{0,20}(popular|wave|factor)/i.test(tx))
    signal('isf_positive', 'ISF', { momentum: +15, communityCoalition: +18, candidateImage: +10 }, 'ISF/Abbas Siddiqui factor', 'ISF\'s community mobilization is strongest in Muslim-plurality areas.');
  if (/isf.{0,20}(weak|split|losing)/i.test(tx))
    signal('isf_weak', 'ISF', { momentum: -10, communityCoalition: -12 }, 'ISF weakening', 'ISF vote may transfer to TMC or Left in Muslim-majority areas.');

  // ── Party absent / No candidate / Vote-transfer alliances ────────────────
  // When a party fields no candidate, its votes transfer to the alliance partner.
  // This is modelled differently from a score nudge — the absent party is
  // completely excluded from the race and their vote share flows to the beneficiary.
  // Transfer rate: ~70-75% (Indian alliance transfer literature).
  // We express this as a very large score bonus to the beneficiary (uncapped).
  const partyExcluded = {};  // party → beneficiary

  // ISF + CPM/Left alliance (no ISF candidate) → ISF votes → CPM
  const txFlat = tx.replace(/\n/g, ' ');
  const mentionsISF = /\bisf\b/i.test(txFlat);
  const mentionsCPM = /\b(cpm|cpim|left front|left)\b/i.test(txFlat);
  const mentionsINC = /\b(congress|inc)\b/i.test(txFlat);
  const mentionsBJP = /\bbjp\b/i.test(txFlat);
  const hasAllianceKeyword = /\b(allies|allied|alliance|allying|ally|together|joint|seat.?shar|seat.?adjust|no.*candidate|not.*contest|withdraw|absent|support|back|deal|pact|partner|join)/i.test(txFlat);
  const noISFCandidate = /(no isf candidate|isf.{0,20}(will not|won.t|not).{0,10}contest|isf.{0,20}(withdraw|absent|not fielding))/i.test(txFlat);

  const isfCpmAlliance = (mentionsISF && mentionsCPM && hasAllianceKeyword) || noISFCandidate;
  if (isfCpmAlliance) {
    // Detect partial alliance: "ally in few seats", "ally in 30% of the seats", "ally in N seats", "partial ally"
    // Percentage pattern handles: "30% seats", "30% of seats", "30% of the seats"
    const pctPattern = /(\d+)\s*%\s*(of\s+(the\s+)?)?seats?/i;
    const isPartialAlliance = /\b(few seats?|some seats?|partial|select seats?|limited seats?|only in|in\s+\w+\s*only)\b/i.test(txFlat)
      || pctPattern.test(txFlat)
      || /ally.{0,40}(\d+)\s+seats?\b/i.test(txFlat);

    let allianceScale = 1.0;
    if (isPartialAlliance && !noISFCandidate) {
      const percentMatch = txFlat.match(pctPattern);
      const countMatch = txFlat.match(/ally.{0,40}?(\d+)\s+seats?\b/i);
      if (percentMatch) {
        allianceScale = Math.max(0.05, Math.min(1.0, parseInt(percentMatch[1]) / 100));
      } else if (countMatch) {
        allianceScale = Math.max(0.05, Math.min(1.0, parseInt(countMatch[1]) / 294));
      } else if (/\bfew\b/i.test(txFlat)) {
        allianceScale = 0.20;  // "few seats" ≈ 20% of constituencies
      } else {
        allianceScale = 0.35;  // "some seats" / "partial" ≈ 35%
      }
    }

    // ≥75% alliance is treated as full — majority of seats have alliance, apply full bonuses
    const isFullAlliance = allianceScale >= 0.75;
    // Effective scale for bonuses: full for majority alliances, proportional otherwise
    const effectiveScale = isFullAlliance ? 1.0 : allianceScale;

    // Only exclude ISF (no candidate) when it's a full/complete alliance
    if (isFullAlliance) partyExcluded['ISF'] = 'CPM';

    if (!factorAdj['CPM']) factorAdj['CPM'] = {};
    factorAdj['CPM']['communityCoalition'] = (factorAdj['CPM']['communityCoalition'] || 0) + Math.round(80 * effectiveScale);
    factorAdj['CPM']['allianceStrategy']   = (factorAdj['CPM']['allianceStrategy']   || 0) + Math.round(60 * effectiveScale);
    factorAdj['CPM']['casteEquation']      = (factorAdj['CPM']['casteEquation']       || 0) + Math.round(50 * effectiveScale);
    factorAdj['CPM']['momentum']           = (factorAdj['CPM']['momentum']            || 0) + Math.round(40 * effectiveScale);
    if (!factorAdj['TMC']) factorAdj['TMC'] = {};
    factorAdj['TMC']['oppositionWeakness'] = (factorAdj['TMC']['oppositionWeakness'] || 0) - Math.round(40 * effectiveScale);

    const pctLabel = isFullAlliance ? '~70%' : `~${Math.round(allianceScale * 70)}%`;
    const scopeLabel = isFullAlliance ? '' : ` (partial — ~${Math.round(allianceScale * 100)}% of seats)`;
    if (isFullAlliance) {
      signals.push({ party: 'ISF', label: 'No ISF candidate — votes transfer to CPM/Left', scoreDelta: -99, direction: 'negative', reason: 'ISF-CPM alliance: ISF withdraws, ~70% of ISF votes transfer to CPM/Left.', factors: ['allianceStrategy', 'communityCoalition'] });
    } else {
      signals.push({ party: 'ISF', label: `ISF-CPM partial alliance${scopeLabel}`, scoreDelta: Math.round(-99 * allianceScale), direction: 'negative', reason: `ISF-CPM partial alliance: ISF contests most seats but cedes ~${Math.round(allianceScale * 100)}% to CPM. Proportional vote transfer effect applied.`, factors: ['allianceStrategy', 'communityCoalition'] });
    }
    signals.push({ party: 'CPM', label: `ISF vote transfer to CPM (${pctLabel} transfer rate)${scopeLabel}`, scoreDelta: Math.round(30 * allianceScale), direction: 'positive', reason: `ISF-CPM alliance${scopeLabel}: CPM absorbs ISF's Muslim-minority vote bank in allied seats.`, factors: ['communityCoalition', 'allianceStrategy', 'casteEquation', 'momentum'] });
  }

  // ISF + Congress alliance (no ISF candidate) → ISF votes → INC
  const isfIncAlliance = (mentionsISF && mentionsINC && hasAllianceKeyword) || (noISFCandidate && mentionsINC);
  if (isfIncAlliance && !isfCpmAlliance) {
    const incPctPattern = /(\d+)\s*%\s*(of\s+(the\s+)?)?seats?/i;
    const isPartialIncAlliance = /\b(few seats?|some seats?|partial|select seats?|limited seats?|only in|in\s+\w+\s*only)\b/i.test(txFlat)
      || incPctPattern.test(txFlat)
      || /ally.{0,40}(\d+)\s+seats?\b/i.test(txFlat);

    let incAllianceScale = 1.0;
    if (isPartialIncAlliance && !noISFCandidate) {
      const percentMatch = txFlat.match(incPctPattern);
      const countMatch = txFlat.match(/ally.{0,40}?(\d+)\s+seats?\b/i);
      if (percentMatch) {
        incAllianceScale = Math.max(0.05, Math.min(1.0, parseInt(percentMatch[1]) / 100));
      } else if (countMatch) {
        incAllianceScale = Math.max(0.05, Math.min(1.0, parseInt(countMatch[1]) / 294));
      } else if (/\bfew\b/i.test(txFlat)) {
        incAllianceScale = 0.20;
      } else {
        incAllianceScale = 0.35;
      }
    }

    const isFullIncAlliance = incAllianceScale >= 0.75;
    const effectiveIncScale = isFullIncAlliance ? 1.0 : incAllianceScale;
    if (isFullIncAlliance) partyExcluded['ISF'] = 'INC';

    if (!factorAdj['INC']) factorAdj['INC'] = {};
    factorAdj['INC']['communityCoalition'] = (factorAdj['INC']['communityCoalition'] || 0) + Math.round(80 * effectiveIncScale);
    factorAdj['INC']['allianceStrategy']   = (factorAdj['INC']['allianceStrategy']   || 0) + Math.round(60 * effectiveIncScale);
    factorAdj['INC']['momentum']           = (factorAdj['INC']['momentum']            || 0) + Math.round(40 * effectiveIncScale);

    const incPctLabel = isFullIncAlliance ? '~70%' : `~${Math.round(incAllianceScale * 70)}%`;
    const incScopeLabel = isFullIncAlliance ? '' : ` (partial — ~${Math.round(incAllianceScale * 100)}% of seats)`;
    if (isFullIncAlliance) {
      signals.push({ party: 'ISF', label: 'No ISF candidate — votes transfer to Congress', scoreDelta: -99, direction: 'negative', reason: 'ISF-Congress alliance: ISF withdraws, ~70% of ISF votes transfer to INC.', factors: ['allianceStrategy', 'communityCoalition'] });
    } else {
      signals.push({ party: 'ISF', label: `ISF-Congress partial alliance${incScopeLabel}`, scoreDelta: Math.round(-99 * incAllianceScale), direction: 'negative', reason: `ISF-Congress partial alliance: ISF contests most seats but cedes ~${Math.round(incAllianceScale * 100)}% to INC.`, factors: ['allianceStrategy', 'communityCoalition'] });
    }
    signals.push({ party: 'INC', label: `ISF vote transfer to INC (${incPctLabel} transfer rate)${incScopeLabel}`, scoreDelta: Math.round(30 * incAllianceScale), direction: 'positive', reason: `ISF-INC alliance${incScopeLabel}: Congress absorbs ISF's minority vote bank in allied seats.`, factors: ['communityCoalition', 'allianceStrategy', 'momentum'] });
  }

  // BJP not contesting / BJP absent → votes split between CPM and TMC (anti-TMC tactical)
  const noBJPCandidate = /(no bjp candidate|bjp.{0,20}(will not|won.t|not).{0,10}contest|bjp.{0,20}(withdraw|absent|not fielding))/i.test(txFlat);
  const bjpAbsent = noBJPCandidate || (mentionsBJP && hasAllianceKeyword && mentionsCPM && !mentionsISF);
  if (bjpAbsent) {
    partyExcluded['BJP'] = 'CPM';
    if (!factorAdj['CPM']) factorAdj['CPM'] = {};
    factorAdj['CPM']['allianceStrategy']   = (factorAdj['CPM']['allianceStrategy']   || 0) + 60;
    factorAdj['CPM']['boothNetwork']       = (factorAdj['CPM']['boothNetwork']        || 0) + 40;
    factorAdj['CPM']['momentum']           = (factorAdj['CPM']['momentum']            || 0) + 30;
    signals.push({ party: 'BJP', label: 'No BJP candidate — votes split (mostly CPM anti-TMC)', scoreDelta: -99, direction: 'negative', reason: 'BJP absent: anti-TMC BJP voters tactically shift to the strongest opposition (CPM/Left).', factors: ['allianceStrategy', 'boothNetwork'] });
    signals.push({ party: 'CPM', label: 'BJP vote transfer to CPM/Left', scoreDelta: 25, direction: 'positive', reason: 'BJP absence benefits CPM as the main anti-TMC alternative.', factors: ['allianceStrategy', 'boothNetwork', 'momentum'] });
  }

  // CPM not contesting / CPM absent → votes split
  const cpmAbsent = /(no cpm candidate|no cpim candidate|cpm.{0,20}(not contest|withdraw|absent|no candidate))/i.test(tx);
  if (cpmAbsent && !isfCpmAlliance && !bjpAbsent) {
    partyExcluded['CPM'] = 'ISF';
    if (!factorAdj['ISF']) factorAdj['ISF'] = {};
    factorAdj['ISF']['communityCoalition'] = (factorAdj['ISF']['communityCoalition'] || 0) + 60;
    factorAdj['ISF']['allianceStrategy']   = (factorAdj['ISF']['allianceStrategy']   || 0) + 50;
    signals.push({ party: 'CPM', label: 'No CPM candidate — Left votes transfer to ISF', scoreDelta: -99, direction: 'negative', reason: 'CPM absent: Left votes transfer to ISF as the main minority-opposition alternative.', factors: ['allianceStrategy', 'communityCoalition'] });
    signals.push({ party: 'ISF', label: 'CPM vote transfer to ISF', scoreDelta: 25, direction: 'positive', reason: 'CPM absence lets ISF consolidate the Left-minority vote bank.', factors: ['communityCoalition', 'allianceStrategy', 'momentum'] });
  }

  // Convert factorAdj into total score deltas per party
  // Use a higher cap (50) for parties receiving vote-transfer alliance bonuses
  const scoreAdj = {};
  Object.entries(factorAdj).forEach(([party, factors]) => {
    let totalDelta = 0;
    Object.entries(factors).forEach(([factor, delta]) => {
      totalDelta += delta * (CTX_WEIGHTS[factor] || 3) / 100;
    });
    const cap = Object.values(partyExcluded).includes(party) ? 50 : 18;
    scoreAdj[party] = Math.min(cap, Math.max(-cap, Math.round(totalDelta * 10) / 10));
  });

  return { scoreAdj, signals, partyExcluded };
}

// ─── Main prediction function ───────────────────────────────────────────────

function predictConstituency({ constituency, candidates, historicalData, demographics, weights, contextText }) {
  const W = normalizeWeights(weights);
  // Parse free-text context into per-party score adjustments + signal log
  const { scoreAdj: ctxAdj, signals: contextSignals, partyExcluded } = parseContextAdjustments(contextText);

  // Blend 2021 real vote shares into partyStrength — ONLY for constituencies with verified real data.
  // Weight: 30% actual 2021 result + 70% constituency field estimate.
  // Reduced from 60/40 because 2021 was 5 years ago — anti-incumbency, demographic shifts,
  // and alliance changes make current ground reality more predictive than past results.
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  let effectiveConstituency = constituency;
  if (REAL_2021_NUMS.has(constNum) && historicalData && historicalData.elections) {
    const e2021 = historicalData.elections.find(e => e.year === 2021);
    if (e2021 && e2021.results.length > 0) {
      const blended = { ...(constituency.partyStrength || {}) };
      e2021.results.forEach(r => {
        const existing = blended[r.party];
        blended[r.party] = existing !== undefined
          ? parseFloat((r.voteShare * 0.30 + existing * 0.70).toFixed(3))
          : parseFloat((r.voteShare * 0.30).toFixed(3));
      });
      effectiveConstituency = { ...constituency, partyStrength: blended };
    }
  }

  const scoredCandidates = candidates.map(candidate => {
    // Compute all 25 factor scores
    const factorScores = {
      candidateImage:         { score: scoreCandidateImage(candidate, effectiveConstituency),                              weight: W.candidateImage },
      partyBrand:             { score: scorePartyBrand(candidate, effectiveConstituency),                                  weight: W.partyBrand },
      antiIncumbency:         { score: scoreAntiIncumbency(candidate),                                                     weight: W.antiIncumbency },
      casteEquation:          { score: scoreCasteEquation(candidate, effectiveConstituency, demographics),                 weight: W.casteEquation },
      communityCoalition:     { score: scoreCommunityCoalition(candidate, effectiveConstituency, demographics),            weight: W.communityCoalition },
      localIssuesFit:         { score: scoreLocalIssuesFit(candidate, effectiveConstituency),                             weight: W.localIssuesFit },
      boothNetwork:           { score: scoreBoothNetwork(candidate, effectiveConstituency),                               weight: W.boothNetwork },
      groundIntelligence:     { score: scoreGroundIntelligence(candidate, effectiveConstituency),                         weight: W.groundIntelligence },
      campaignNarrative:      { score: scoreCampaignNarrative(candidate, effectiveConstituency),                          weight: W.campaignNarrative },
      leadershipSupport:      { score: scoreLeadershipSupport(candidate, effectiveConstituency, demographics),            weight: W.leadershipSupport },
      funding:                { score: scoreFunding(candidate),                                                            weight: W.funding },
      volunteerStrength:      { score: scoreVolunteerStrength(candidate, effectiveConstituency),                          weight: W.volunteerStrength },
      socialMediaStrategy:    { score: scoreSocialMedia(candidate, effectiveConstituency, demographics),                  weight: W.socialMediaStrategy },
      whatsappNetworks:       { score: scoreWhatsapp(candidate, effectiveConstituency, demographics),                     weight: W.whatsappNetworks },
      oppositionWeakness:     { score: scoreOppositionWeakness(candidate, candidates, effectiveConstituency),             weight: W.oppositionWeakness },
      allianceStrategy:       { score: scoreAllianceStrategy(candidate, effectiveConstituency),                           weight: W.allianceStrategy },
      candidateAccessibility: { score: scoreCandidateAccessibility(candidate, effectiveConstituency),                     weight: W.candidateAccessibility },
      pastPerformance:        { score: scorePastPerformance(candidate, historicalData, effectiveConstituency),            weight: W.pastPerformance },
      manifestoCredibility:   { score: scoreManifestoCredibility(candidate, effectiveConstituency),                       weight: W.manifestoCredibility },
      mediaManagement:        { score: scoreMediaManagement(candidate),                                                    weight: W.mediaManagement },
      crisisHandling:         { score: scoreCrisisHandling(candidate, effectiveConstituency),                             weight: W.crisisHandling },
      voterTurnoutStrategy:   { score: scoreVoterTurnoutStrategy(candidate, effectiveConstituency),                       weight: W.voterTurnoutStrategy },
      electionDayManagement:  { score: scoreElectionDayMgmt(candidate, effectiveConstituency),                           weight: W.electionDayManagement },
      microTargeting:         { score: scoreMicroTargeting(candidate, effectiveConstituency),                             weight: W.microTargeting },
      momentum:               { score: scoreMomentum(candidate, effectiveConstituency, historicalData),                   weight: W.momentum },
    };

    // Weighted total score (0-100)
    const baseScore = Object.values(factorScores).reduce((sum, { score, weight }) => {
      return sum + (score * weight) / 100;
    }, 0);

    // ── Structural bonuses — strongholds, alliances, anti-incumbency pockets ──

    const dem = demographics || {};
    const muslimPct = (dem.religion || {}).muslim || 0;
    let allianceBonus = 0;

    // CPM+ISF Alliance bonus — seat-sharing consolidates Left+Muslim vote
    // Kept modest: alliance failed in 2021 (0 CPM seats); only marginal benefit
    if (candidate.party === 'CPM') {
      allianceBonus = muslimPct > 0.40 ? 4 : (muslimPct > 0.25 ? 2 : (muslimPct > 0.15 ? 1 : 0));
    } else if (candidate.party === 'ISF') {
      allianceBonus = muslimPct > 0.40 ? 6 : (muslimPct > 0.25 ? 3 : 1);
    }

    // INC stronghold bonus — Baharampur/Murshidabad (Adhir Chowdhury belt)
    // Constituencies 63-70 in Murshidabad are Congress's strongest pockets
    // Kept modest: INC won 0 seats in 2021 even in these areas
    const INC_STRONGHOLD_SEATS = new Set([63, 64, 65, 66, 67, 68, 69, 70]);
    const INC_INFLUENCE_SEATS = new Set([55, 56, 57, 58, 71, 72, 73, 74, 75, 76]);
    if (candidate.party === 'INC') {
      if (INC_STRONGHOLD_SEATS.has(constNum)) allianceBonus += 10; // Adhir's core belt
      else if (INC_INFLUENCE_SEATS.has(constNum)) allianceBonus += 4; // Extended Murshidabad influence
      // Malda pockets — Congress has traditional presence
      if (constNum >= 43 && constNum <= 54) allianceBonus += 3;
    }

    // CPM stronghold bonus — industrial belt, traditional Left pockets
    const CPM_STRONGHOLD_SEATS = new Set([
      26,  // Siliguri — Left stronghold
      271, 272, 273, 274, 275, // Paschim Bardhaman — industrial belt (Asansol/Durgapur)
      259, 260, 261,           // Purba Bardhaman — industrial pockets
      223, 224, 225, 226,      // Jhargram — tribal/Left base
      238, 239, 240,           // Bankura — tribal/Left belt
    ]);
    const CPM_INFLUENCE_SEATS = new Set([
      127, 128, 129, 130, 131, // Kolkata — urban Left cadre pockets
      191, 192, 193,           // Howrah — industrial belt
      250, 251, 252,           // Purulia — tribal/Left base
    ]);
    if (candidate.party === 'CPM') {
      if (CPM_STRONGHOLD_SEATS.has(constNum)) allianceBonus += 6;
      else if (CPM_INFLUENCE_SEATS.has(constNum)) allianceBonus += 3;
    }

    // JUP+AIMIM alliance bonus in Muslim-majority Murshidabad/Malda seats
    if (candidate.party === 'JUP' || candidate.party === 'AIMIM') {
      if (muslimPct > 0.50) allianceBonus += 6;
      else if (muslimPct > 0.35) allianceBonus += 3;
    }

    // Apply context text adjustment: user-supplied signals shift total score directly
    const contextBonus = ctxAdj[candidate.party] || 0;
    // If party has no candidate (excluded via alliance), set score to near-zero so softmax eliminates them
    const excluded = partyExcluded && partyExcluded[candidate.party];
    const totalScore = excluded ? 0 : Math.min(100, Math.max(0, baseScore + contextBonus + allianceBonus));

    return {
      ...candidate,
      candidateId: candidate.id,
      factorScores,
      totalScore: parseFloat(totalScore.toFixed(2)),
      contextAdjusted: contextBonus !== 0 ? contextBonus : undefined,
    };
  });

  // Sort by totalScore descending
  scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

  // Convert scores to vote shares (softmax-like normalization)
  // Temperature=12 — concentrates vote share toward top parties (TMC/BJP) as in real WB elections
  // where top-2 parties capture ~85% of vote. (10-pt gap ≈ 2.3x ratio, 20-pt gap ≈ 5.3x ratio)
  const expScores = scoredCandidates.map(c => Math.exp((c.totalScore - 40) / 12));
  const sumExp = expScores.reduce((a, b) => a + b, 0);

  const allCandidates = scoredCandidates.map((c, i) => ({
    ...c,
    predictedVoteShare: parseFloat((expScores[i] / sumExp).toFixed(3)),
  }));

  const winner = allCandidates[0];
  const runnerUp = allCandidates[1];

  // Confidence based on margin between winner and runner-up
  const margin = winner.totalScore - (runnerUp ? runnerUp.totalScore : 0);
  const confidenceScore = Math.min(92, Math.max(25, 45 + margin * 3.5));

  // Estimated vote margin
  const estimatedVoteDiff = winner.predictedVoteShare - (runnerUp ? runnerUp.predictedVoteShare : 0);
  const estimatedMargin = constituency.totalVoters
    ? Math.round(estimatedVoteDiff * constituency.totalVoters * 0.82)
    : 0;

  return {
    constituencyId: constituency.id,
    constituencyName: constituency.name,
    district: constituency.district,
    contextSignals,
    predictedWinner: {
      candidateId: winner.candidateId,
      name: winner.name,
      party: winner.party,
      predictedVoteShare: winner.predictedVoteShare,
      winProbability: parseFloat(Math.min(0.95, Math.max(0.35, 0.5 + margin / 60)).toFixed(2)),
      margin: estimatedMargin,
    },
    allCandidates,
    confidenceScore: parseFloat(confidenceScore.toFixed(1)),
    explainabilityScore: 88,
    topFactors: Object.entries(winner.factorScores)
      .sort((a, b) => (b[1].score * b[1].weight) - (a[1].score * a[1].weight))
      .slice(0, 5)
      .map(([name]) => name),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { predictConstituency, parseContextAdjustments };
