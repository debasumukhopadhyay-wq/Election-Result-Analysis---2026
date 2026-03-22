const {
  FACTOR_WEIGHTS, PARTY_POPULARITY, PARTY_CADRE_STRENGTH, PARTY_FUNDING,
  PARTY_DIGITAL, ALLIANCE_BONUS, PARTY_MEDIA, normalizeWeights
} = require('./scoringWeights');

// Seeded random for deterministic results
function seed(n) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}
function seededRandFloat(n, min, max) {
  return parseFloat((seed(n) * (max - min) + min).toFixed(3));
}

// Helper: get local party share from constituency.partyStrength
function localShare(candidate, constituency) {
  return (constituency?.partyStrength || {})[candidate.party];
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
function scoreAntiIncumbency(candidate) {
  const terms = candidate.termCount || 0;
  if (terms === 0) return 70;
  const risk = candidate.antiIncumbencyRisk || 0.3;
  const incumbencyPenalty = Math.min(60, terms * 10 + risk * 40);
  return Math.max(10, 100 - incumbencyPenalty);
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
  // Muslim-majority districts
  if (religion.muslim > 0.40) {
    if (candidate.party === 'TMC') s += 22;
    else if (candidate.party === 'ISF') s += 15;
    else if (candidate.party === 'CPM') s += 8;
    else if (candidate.party === 'BJP') s -= 12;
  } else if (religion.muslim > 0.25) {
    if (candidate.party === 'TMC') s += 12;
    else if (candidate.party === 'CPM') s += 6;
  }
  // Hindu-dominant areas — BJP gains
  if (religion.hindu > 0.85) {
    if (candidate.party === 'BJP') s += 15;
    else if (candidate.party === 'TMC') s += 4;
  } else if (religion.hindu > 0.75) {
    if (candidate.party === 'BJP') s += 8;
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

  // Party-specific community bonuses (based on religion/caste profile)
  if (candidate.party === 'TMC') {
    s += religion.muslim > 0.30 ? 15 : (religion.muslim > 0.15 ? 8 : 4);
  } else if (candidate.party === 'BJP') {
    s += religion.hindu > 0.80 ? 15 : (religion.hindu > 0.70 ? 10 : 5);
  } else if (candidate.party === 'CPM') {
    s += caste.sc > 0.20 ? 10 : 5;
  } else if (candidate.party === 'ISF') {
    s += religion.muslim > 0.40 ? 18 : 5;
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
function scoreAllianceStrategy(candidate, constituency) {
  const base = 50 + (ALLIANCE_BONUS[candidate.party] || 0);
  const constNum = parseInt(constituency.id.replace('WB-', ''));
  const variation = seededRandFloat(constNum * 61 + (candidate.party.charCodeAt(0) * 11), -8, 8);
  return Math.min(100, Math.max(0, base + variation));
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
  // Swing trend: positive = rising, negative = falling
  if (historicalData && historicalData.swingTrend) {
    const trend = historicalData.swingTrend[candidate.party];
    if (typeof trend === 'number') {
      if (trend > 0.05) s += 12;
      else if (trend < -0.05) s -= 8;
    }
  }
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
  if (!contextText || contextText.trim().length < 5) return { scoreAdj: {}, signals: [] };
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

  // Convert factorAdj into total score deltas per party
  const scoreAdj = {};
  Object.entries(factorAdj).forEach(([party, factors]) => {
    let totalDelta = 0;
    Object.entries(factors).forEach(([factor, delta]) => {
      totalDelta += delta * (CTX_WEIGHTS[factor] || 3) / 100;
    });
    scoreAdj[party] = Math.min(18, Math.max(-18, Math.round(totalDelta * 10) / 10));
  });

  // Update each signal's scoreDelta to reflect the capped party total where relevant
  // (individual signal deltas already computed at signal() time — keep them as-is for display)

  return { scoreAdj, signals };
}

// ─── Main prediction function ───────────────────────────────────────────────

function predictConstituency({ constituency, candidates, historicalData, demographics, weights, contextText }) {
  const W = normalizeWeights(weights);
  // Parse free-text context into per-party score adjustments + signal log
  const { scoreAdj: ctxAdj, signals: contextSignals } = parseContextAdjustments(contextText);

  const scoredCandidates = candidates.map(candidate => {
    // Compute all 25 factor scores
    const factorScores = {
      candidateImage:         { score: scoreCandidateImage(candidate, constituency),                              weight: W.candidateImage },
      partyBrand:             { score: scorePartyBrand(candidate, constituency),                                  weight: W.partyBrand },
      antiIncumbency:         { score: scoreAntiIncumbency(candidate),                                            weight: W.antiIncumbency },
      casteEquation:          { score: scoreCasteEquation(candidate, constituency, demographics),                 weight: W.casteEquation },
      communityCoalition:     { score: scoreCommunityCoalition(candidate, constituency, demographics),            weight: W.communityCoalition },
      localIssuesFit:         { score: scoreLocalIssuesFit(candidate, constituency),                             weight: W.localIssuesFit },
      boothNetwork:           { score: scoreBoothNetwork(candidate, constituency),                               weight: W.boothNetwork },
      groundIntelligence:     { score: scoreGroundIntelligence(candidate, constituency),                         weight: W.groundIntelligence },
      campaignNarrative:      { score: scoreCampaignNarrative(candidate, constituency),                          weight: W.campaignNarrative },
      leadershipSupport:      { score: scoreLeadershipSupport(candidate, constituency, demographics),            weight: W.leadershipSupport },
      funding:                { score: scoreFunding(candidate),                                                   weight: W.funding },
      volunteerStrength:      { score: scoreVolunteerStrength(candidate, constituency),                          weight: W.volunteerStrength },
      socialMediaStrategy:    { score: scoreSocialMedia(candidate, constituency, demographics),                  weight: W.socialMediaStrategy },
      whatsappNetworks:       { score: scoreWhatsapp(candidate, constituency, demographics),                     weight: W.whatsappNetworks },
      oppositionWeakness:     { score: scoreOppositionWeakness(candidate, candidates, constituency),             weight: W.oppositionWeakness },
      allianceStrategy:       { score: scoreAllianceStrategy(candidate, constituency),                           weight: W.allianceStrategy },
      candidateAccessibility: { score: scoreCandidateAccessibility(candidate, constituency),                     weight: W.candidateAccessibility },
      pastPerformance:        { score: scorePastPerformance(candidate, historicalData, constituency),            weight: W.pastPerformance },
      manifestoCredibility:   { score: scoreManifestoCredibility(candidate, constituency),                       weight: W.manifestoCredibility },
      mediaManagement:        { score: scoreMediaManagement(candidate),                                          weight: W.mediaManagement },
      crisisHandling:         { score: scoreCrisisHandling(candidate, constituency),                             weight: W.crisisHandling },
      voterTurnoutStrategy:   { score: scoreVoterTurnoutStrategy(candidate, constituency),                       weight: W.voterTurnoutStrategy },
      electionDayManagement:  { score: scoreElectionDayMgmt(candidate, constituency),                           weight: W.electionDayManagement },
      microTargeting:         { score: scoreMicroTargeting(candidate, constituency),                             weight: W.microTargeting },
      momentum:               { score: scoreMomentum(candidate, constituency, historicalData),                   weight: W.momentum },
    };

    // Weighted total score (0-100)
    const baseScore = Object.values(factorScores).reduce((sum, { score, weight }) => {
      return sum + (score * weight) / 100;
    }, 0);

    // Apply context text adjustment: user-supplied signals shift total score directly
    const contextBonus = ctxAdj[candidate.party] || 0;
    const totalScore = Math.min(100, Math.max(0, baseScore + contextBonus));

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

module.exports = { predictConstituency };
