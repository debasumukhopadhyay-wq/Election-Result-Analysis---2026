const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const constituencies = require('../data/constituencies');
const { getCandidatesForConstituency } = require('../data/candidates');
const { predictConstituency } = require('../services/predictionEngine');
const historicalResults = require('../data/historicalResults');
const demographics = require('../data/demographics');

// POST /api/improve
// Body: { constituencyId, party, candidateName }
router.post('/', async (req, res) => {
  try {
    const { constituencyId, party, candidateName, contextText } = req.body;
    if (!constituencyId || !party) {
      return res.status(400).json({ error: 'constituencyId and party required' });
    }

    const constituency = constituencies.find(c => c.id === constituencyId);
    if (!constituency) return res.status(404).json({ error: 'Constituency not found' });

    const candidates = getCandidatesForConstituency(constituencyId);
    const histData = historicalResults[constituencyId] || null;
    const demData = demographics[constituencyId] || null;

    // Run prediction WITH the same contextText so signals are applied
    const prediction = predictConstituency({ constituency, candidates, historicalData: histData, demographics: demData, contextText });
    const contextSignals = prediction.contextSignals || [];

    const targetCandidate = prediction.allCandidates.find(c => c.party === party) || prediction.allCandidates[0];
    const winner = prediction.allCandidates[0];
    // Runner-up = highest scorer that is NOT the target candidate
    const runnerUp = prediction.allCandidates.find(c => c.party !== targetCandidate.party);
    const isWinning = targetCandidate.party === winner.party;
    const voteGap = isWinning
      ? Math.round((targetCandidate.predictedVoteShare - (runnerUp?.predictedVoteShare || 0)) * 100)
      : Math.round((winner.predictedVoteShare - targetCandidate.predictedVoteShare) * 100);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json(generateFallbackImprovement(targetCandidate, winner, runnerUp, prediction.allCandidates, constituency, voteGap, isWinning, contextSignals));
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are an expert West Bengal political consultant. Generate a detailed improvement strategy report for ${candidateName || targetCandidate.name} (${party}) in ${constituency.name}, ${constituency.district}.

CONTEXT:
- Constituency: ${constituency.name} (${constituency.reservedCategory || 'GEN'}, ${constituency.district})
- Target candidate: ${targetCandidate.name} (${party}) - Predicted vote share: ${Math.round(targetCandidate.predictedVoteShare * 100)}%
- Current predicted result: ${isWinning ? 'WINNING' : 'LOSING by ' + voteGap + '% vote share'}
- Leading candidate: ${winner.name} (${winner.party}) with ${Math.round(winner.predictedVoteShare * 100)}%
- Total voters: ${constituency.totalVoters?.toLocaleString()}
- Reserved category: ${constituency.reservedCategory || 'General'}

FACTOR SCORES for ${party}:
${JSON.stringify(targetCandidate.factorScores, null, 2)}

ALL CANDIDATES:
${prediction.allCandidates.map(c => `${c.party}: ${Math.round(c.predictedVoteShare * 100)}%`).join(', ')}

Generate a JSON response with this exact structure:
{
  "executiveSummary": "2-3 sentence summary of current position and what's needed",
  "voteGapAnalysis": {
    "currentVoteShare": ${Math.round(targetCandidate.predictedVoteShare * 100)},
    "targetVoteShare": ${Math.round(winner.predictedVoteShare * 100) + (isWinning ? 5 : 2)},
    "votesNeeded": <estimated additional votes needed as integer>,
    "feasibility": "high" | "medium" | "low"
  },
  "keyWeaknesses": [
    { "factor": "factor name", "score": <0-100>, "impact": "high|medium|low", "description": "explanation" }
  ],
  "boothStrategy": {
    "priorityBooths": "description of which booths to prioritize",
    "weakBoothsApproach": "strategy for converting weak booths",
    "strongBoothsApproach": "strategy for maximizing strong booth margins"
  },
  "voterOutreach": [
    { "segment": "voter segment", "approach": "specific outreach strategy", "potentialVotes": <estimated integer> }
  ],
  "campaignActions": [
    { "priority": "high|medium|low", "action": "specific action item", "timeline": "when to do this", "expectedImpact": "expected outcome" }
  ],
  "allianceOpportunities": "any alliance or vote transfer opportunities",
  "riskFactors": ["risk 1", "risk 2", "risk 3"],
  "confidenceOfTurnaround": <0-100 integer representing % chance of converting loss to win>
}

Respond with ONLY valid JSON, no markdown.`;

    let report;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }]
      });
      const responseText = message.content[0].text;
      try {
        report = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        report = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
    } catch (aiErr) {
      console.warn('Claude API unavailable, using data-driven fallback:', aiErr.message);
      report = null;
    }

    if (!report) {
      report = generateFallbackImprovement(targetCandidate, winner, runnerUp, prediction.allCandidates, constituency, voteGap, isWinning, contextSignals);
    }

    res.json({ ...report, candidateName: targetCandidate.name, party, constituencyName: constituency.name });
  } catch (error) {
    console.error('Improve API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Factor label map ──────────────────────────────────────────────────────────
const FACTOR_LABELS = {
  candidateImage: 'Candidate Image', partyBrand: 'Party Brand', antiIncumbency: 'Anti-Incumbency',
  casteEquation: 'Caste Equation', communityCoalition: 'Community Coalition', localIssuesFit: 'Local Issues Fit',
  boothNetwork: 'Booth Network', groundIntelligence: 'Ground Intelligence', campaignNarrative: 'Campaign Narrative',
  leadershipSupport: 'Leadership Support', funding: 'Funding', volunteerStrength: 'Volunteer Strength',
  socialMediaStrategy: 'Social Media Strategy', whatsappNetworks: 'WhatsApp Networks',
  oppositionWeakness: 'Opposition Weakness', allianceStrategy: 'Alliance Strategy',
  candidateAccessibility: 'Candidate Accessibility', pastPerformance: 'Past Performance',
  manifestoCredibility: 'Manifesto Credibility', mediaManagement: 'Media Management',
  crisisHandling: 'Crisis Handling', voterTurnoutStrategy: 'Voter Turnout Strategy',
  electionDayManagement: 'Election Day Management', microTargeting: 'Micro-Targeting', momentum: 'Momentum'
};

// ── Factor-specific advice ────────────────────────────────────────────────────
const FACTOR_ADVICE = {
  candidateImage:       { action: 'Launch intensive personal branding campaign — village padyatras, jan sampark, and direct voter contact', impact: 'Can add 3-5% through personal credibility' },
  partyBrand:           { action: 'Leverage state leadership appearances and party symbol visibility across all booths', impact: 'Strengthen party affiliation among soft supporters' },
  antiIncumbency:       { action: 'Proactively address local grievances; hold public meetings on unfulfilled promises', impact: 'Convert anti-incumbency into a swing factor for challenger' },
  casteEquation:        { action: 'Engage community leaders (panchayat/union level) from dominant castes; organize community-specific events', impact: 'Caste consolidation worth 5-8% if achieved' },
  communityCoalition:   { action: 'Build inter-community coalition through joint events; leverage mosque/temple committees', impact: 'Coalition arithmetic can flip marginal seats' },
  localIssuesFit:       { action: 'Publish a local charter addressing top 5 constituency issues; corner-meeting blitz on roads, water, jobs', impact: '+2-4% from issue ownership' },
  boothNetwork:         { action: 'Appoint dedicated booth president + 5 agents per booth; daily status reporting; booth-level micro-management', impact: 'Strong booth network adds 3-6% through mobilization' },
  groundIntelligence:   { action: 'Set up real-time booth-level voter tracking; daily WhatsApp reporting from each booth captain', impact: 'Better intelligence prevents last-minute surprises' },
  campaignNarrative:    { action: 'Craft a single compelling narrative — development vs. incumbent failure; repeat across all media', impact: 'Unified message amplifies reach by 40%' },
  leadershipSupport:    { action: 'Request senior party leader rally in constituency; flag key seats for state leadership attention', impact: 'Star campaigner visit worth +2-3% in marginal seats' },
  funding:              { action: 'Mobilize party fund allocation for voter outreach materials, transport, and election day logistics', impact: 'Adequate funding ensures no gap in operations' },
  volunteerStrength:    { action: 'Recruit 20 volunteers per booth; organize training camps this week for election day deployment', impact: '400+ active volunteers can cover entire constituency' },
  socialMediaStrategy:  { action: 'Run targeted Facebook/Instagram ads in constituency; create WhatsApp status campaign for 48hrs pre-poll', impact: 'Digital outreach reaches 25-30% of younger voters' },
  whatsappNetworks:     { action: 'Build tiered WhatsApp network: 1 state → 5 district → 20 block → 200 booth-level groups', impact: 'Fastest information channel on election day' },
  oppositionWeakness:   { action: 'Research opponent\'s local failures; highlight in corner meetings and social media without personal attacks', impact: 'Exploiting opposition weakness can shift 3-5% undecideds' },
  allianceStrategy:     { action: 'Formalize seat-sharing understanding with allied parties; negotiate vote transfer through shared events', impact: 'Alliance vote transfer worth 4-7% in favourable seats' },
  candidateAccessibility: { action: 'Candidate must visit every village at least once; maintain open-door policy at campaign office', impact: 'Accessibility builds trust and reduces protest votes' },
  pastPerformance:      { action: 'Publicize past work done (roads, pensions, schemes); create performance report card for distribution', impact: 'Performance record reduces anti-incumbency' },
  manifestoCredibility: { action: 'Release specific, costed local manifesto commitments; hold press conference with local media', impact: 'Credible promises attract swing voters +2%' },
  mediaManagement:      { action: 'Regular press briefings; engage local cable TV channels and Bengali news portals', impact: 'Media presence sets the narrative frame' },
  crisisHandling:       { action: 'Set up rapid response team for any controversy; designate party spokesperson for local media', impact: 'Poor crisis handling can cost 3-5% in final days' },
  voterTurnoutStrategy: { action: 'Map favorable booths; organize transport for voters; morning reminder calls via phone bank', impact: 'Each 5% increase in turnout in strong booths adds ~2% net' },
  electionDayManagement: { action: 'Dedicated booth agent + counting agent for every booth; micro-observer for postal ballots; command center', impact: 'Strong election day ops prevents booth capture and ensures counting' },
  microTargeting:       { action: 'Identify swing voter households using voter list analysis; assign personal follow-up to each household', impact: 'Micro-targeting can convert 30-40% of swing households' },
  momentum:             { action: 'Create visible momentum — large rallies, social media virality, auto processions in final 10 days', impact: 'Momentum shifts undecided voters in final 72 hours' }
};

function generateFallbackImprovement(candidate, winner, runnerUp, allCandidates, constituency, voteGap, isWinning, contextSignals = []) {
  const scores = candidate.factorScores || {};
  const totalVoters = constituency.totalVoters || 150000;
  const currentShare = Math.round(candidate.predictedVoteShare * 100);

  // When candidate IS the winner, compare vs runner-up — not vs themselves
  const rival = isWinning ? (runnerUp || allCandidates.find(c => c.party !== candidate.party)) : winner;
  const rivalShare = Math.round((rival?.predictedVoteShare || 0) * 100);
  const rivalScores = rival?.factorScores || {};
  const marginVsRival = Math.abs(currentShare - rivalShare);

  // Sort factors by score ascending (weakest first), comparing vs rival
  const allFactorsSorted = Object.entries(scores)
    .map(([key, data]) => ({ key, score: data.score ?? 0, weight: data.weight ?? 1, rivalScore: rivalScores[key]?.score ?? 0 }))
    .sort((a, b) => a.score - b.score);

  // Key weaknesses: bottom 5 factors by score
  const weakFactors = allFactorsSorted.slice(0, 5);

  // Factors where rival significantly outscores (gap > 10)
  const exploitableGaps = allFactorsSorted
    .filter(f => f.rivalScore - f.score > 10)
    .sort((a, b) => (b.rivalScore - b.score) * b.weight - (a.rivalScore - a.score) * a.weight)
    .slice(0, 4);

  // Factors where candidate leads rival (strengths)
  const strengths = allFactorsSorted
    .filter(f => f.score > f.rivalScore)
    .sort((a, b) => (b.score - b.rivalScore) * b.weight - (a.score - a.rivalScore) * a.weight)
    .slice(0, 3);

  // Other candidates for vote transfer
  const others = allCandidates.filter(c => c.party !== candidate.party && c.party !== rival?.party && c.predictedVoteShare > 0.03);

  // ── Context-aware actions (from signals about this party) ──────────────────
  const contextActions = [];
  const mySignals = contextSignals.filter(s => s.party === candidate.party);
  const signalIds = new Set(mySignals.map(s => s.signalId || s.label));

  // Exiting / former leader not supporting
  if (mySignals.some(s => /former_nosupport|not support|exiting|outgoing/i.test(s.signalId || s.label))) {
    contextActions.push({
      priority: 'high',
      factor: 'Leadership Support (Context Alert)',
      action: `Immediately reach out to the exiting/former MLA or leader — request at minimum public neutrality; offer a dignified campaign role, constituency-level advisory position, or post-election consideration. Even passive non-interference from them could recover lost booth agent cooperation.`,
      timeline: 'Immediately — within 24 hours',
      expectedImpact: 'Can recover 1–2 pts in Leadership Support and Booth Network; prevents active vote sabotage',
      contextDriven: true
    });
    contextActions.push({
      priority: 'high',
      factor: 'Volunteer Strength (Context Alert)',
      action: `Directly engage booth agents and volunteers from the ex-MLA's network — hold a dedicated meeting acknowledging their past contribution and asking for their participation. Do not assume they will campaign without re-activation.`,
      timeline: 'This week',
      expectedImpact: 'Prevents loss of trained booth infrastructure; critical for election day operations',
      contextDriven: true
    });
  }

  // Sitting MLA rebelling
  if (mySignals.some(s => /sitting_rebel|rebel|campaign against/i.test(s.signalId || s.label))) {
    contextActions.push({
      priority: 'high',
      factor: 'Crisis Handling (Context Alert)',
      action: `Contain the rebel narrative — engage state party leadership to issue a public statement; avoid open confrontation with the rebel MLA as it amplifies the story. Simultaneously build an alternate cadre network not dependent on the rebel's booth infrastructure.`,
      timeline: 'Immediately — next 48 hours',
      expectedImpact: 'Limits damage to 2–3 pts vs potential 6–8 pt swing if left unchecked',
      contextDriven: true
    });
  }

  // Opposition alliance forming against this party
  if (mySignals.some(s => /opp_unity|cpm_helps_bjp|bjp_helps_cpm|coalition against/i.test(s.signalId || s.label))) {
    contextActions.push({
      priority: 'high',
      factor: 'Alliance Strategy (Context Alert)',
      action: `Counter opposition unity by peeling away at least one alliance partner — identify if CPM or BJP voters have local grievances with each other; amplify any public disagreement between them to fracture the alliance narrative.`,
      timeline: 'This week',
      expectedImpact: 'Breaking alliance unity can restore 3–5 pts in opposition weakness factor',
      contextDriven: true
    });
  }

  // ── Factor-based actions ───────────────────────────────────────────────────
  const actionSet = new Map();

  // Context actions take priority (inserted first)
  contextActions.forEach((a, i) => actionSet.set(`ctx_${i}`, a));

  [...weakFactors.slice(0, 3), ...exploitableGaps.slice(0, 2)].forEach((f, i) => {
    const advice = FACTOR_ADVICE[f.key];
    if (advice && !actionSet.has(f.key)) {
      const priority = i < 2 ? 'high' : f.weight >= 5 ? 'high' : 'medium';
      const timelines = ['Immediately — next 48 hours', 'This week (Days 1–7)', 'Weeks 2–3', 'Final 10 days', 'Election eve'];
      actionSet.set(f.key, {
        priority,
        factor: FACTOR_LABELS[f.key] || f.key,
        action: advice.action,
        timeline: timelines[Math.min(i, 4)],
        expectedImpact: advice.impact,
        currentScore: Math.round(f.score),
        rivalScore: Math.round(f.rivalScore)
      });
    }
  });

  if (!actionSet.has('electionDayManagement')) {
    actionSet.set('electionDayManagement', {
      priority: 'high',
      factor: 'Election Day Management',
      action: FACTOR_ADVICE.electionDayManagement.action,
      timeline: 'Plan now; execute on poll day',
      expectedImpact: FACTOR_ADVICE.electionDayManagement.impact,
      currentScore: Math.round(scores.electionDayManagement?.score ?? 50),
      rivalScore: Math.round(rivalScores.electionDayManagement?.score ?? 50)
    });
  }

  const campaignActions = Array.from(actionSet.values());

  // Feasibility (based on gap vs rival)
  const feasibility = marginVsRival < 5 ? 'high' : marginVsRival < 12 ? 'medium' : 'low';
  const confidence = isWinning
    ? (marginVsRival > 15 ? 82 : marginVsRival > 8 ? 72 : 60)
    : (marginVsRival < 5 ? 60 : marginVsRival < 12 ? 38 : marginVsRival < 20 ? 20 : 10);

  const votesNeeded = isWinning ? 0 : Math.round((rival.predictedVoteShare - candidate.predictedVoteShare) * totalVoters * 0.72);
  const targetShare = isWinning ? Math.min(currentShare + 5, 70) : rivalShare + 2;

  // Voter outreach
  const muslim = constituency.demographics?.religion?.muslim || constituency.demographics?.muslim || 0;
  const sc = constituency.reservedCategory === 'SC' ? 0.22 : 0.12;
  const st = constituency.reservedCategory === 'ST' ? 0.28 : 0.06;
  const voterOutreach = [
    { segment: 'Undecided / swing voters (~12%)', approach: 'Door-to-door contact by candidate + senior leaders; resolution of local complaints', potentialVotes: Math.round(totalVoters * 0.12) },
    { segment: 'Youth voters (18–30 yrs, ~28%)', approach: 'Employment-focused rallies, social media engagement, WhatsApp groups', potentialVotes: Math.round(totalVoters * 0.28 * 0.35) },
    { segment: 'Women voters (~50%)', approach: 'Scheme-oriented outreach (Lakshmir Bhandar, Kanyashree); SHG meetings', potentialVotes: Math.round(totalVoters * 0.5 * 0.18) },
    muslim > 0.25
      ? { segment: `Muslim community (${Math.round(muslim * 100)}% of voters)`, approach: 'Engage through mosque committees; clarify secular credentials and past work', potentialVotes: Math.round(totalVoters * muslim * 0.25) }
      : { segment: `SC/ST voters (${Math.round((sc + st) * 100)}%)`, approach: 'Welfare scheme outreach; engage local panchayat leaders and self-help groups', potentialVotes: Math.round(totalVoters * (sc + st) * 0.2) },
  ];

  // Alliance opportunities
  let allianceText = 'No significant third-party vote pools available for alliance leverage.';
  if (others.length > 0) {
    const transferable = others.reduce((sum, o) => sum + o.predictedVoteShare, 0);
    allianceText = `${others.map(o => `${o.party} (${Math.round(o.predictedVoteShare * 100)}%)`).join(', ')} combined represent ${Math.round(transferable * 100)}% (~${Math.round(transferable * totalVoters).toLocaleString()} votes). Explore informal understandings for vote transfer in the final week.`;
  }

  const strengthSummary = strengths.length > 0
    ? ` ${candidate.name} leads on ${strengths.map(f => FACTOR_LABELS[f.key]).join(', ')} — amplify these in the campaign narrative.`
    : '';

  // Context-aware risk factors
  const contextRisks = mySignals.map(s => s.reason || s.label).filter(Boolean);

  // Executive summary — correctly compares candidate vs nearest rival
  const rivalDesc = rival ? `nearest rival ${rival.name} (${rival.party}) at ${rivalShare}%` : 'opposition';
  const positionSummary = isWinning
    ? `${candidate.name} (${candidate.party}) is currently leading in ${constituency.name} with ${currentShare}% vote share, ahead of ${rivalDesc} — a ${marginVsRival}% margin.`
    : `${candidate.name} (${candidate.party}) is currently trailing in ${constituency.name} with ${currentShare}% against ${rivalDesc} — a gap of ${marginVsRival}%.`;

  const contextWarning = contextActions.length > 0
    ? ` ⚠ Ground intelligence flags: ${mySignals.map(s => s.label).join('; ')} — addressed as priority actions below.`
    : '';

  const executiveSummary = isWinning
    ? `${positionSummary} The priority is to consolidate this lead through strong booth management and turnout maximization.${strengthSummary}${contextWarning} Key risk: complacency allowing the opposition to close this gap.`
    : `${positionSummary} Closing this gap requires a structured, high-intensity sprint across booth mobilization, targeted outreach, and exploiting the opponent's weak factors.${strengthSummary}${contextWarning} Feasibility of a turnaround is rated ${feasibility.toUpperCase()}.`;

  return {
    candidateName: candidate.name,
    party: candidate.party,
    constituencyName: constituency.name,
    isWinning,
    executiveSummary,
    voteGapAnalysis: {
      currentVoteShare: currentShare,
      targetVoteShare: targetShare,
      votesNeeded,
      feasibility,
      totalVoters,
      marginInVotes: Math.round(marginVsRival / 100 * totalVoters)
    },
    keyWeaknesses: weakFactors.map(f => ({
      factor: FACTOR_LABELS[f.key] || f.key,
      score: Math.round(f.score),
      winnerScore: Math.round(f.rivalScore),
      gap: Math.round(f.rivalScore - f.score),
      weight: f.weight,
      impact: f.score < 35 ? 'high' : f.score < 55 ? 'medium' : 'low',
      description: FACTOR_ADVICE[f.key]?.action || `Improve ${FACTOR_LABELS[f.key] || f.key} through structured campaign intervention.`
    })),
    exploitableGaps: exploitableGaps.map(f => ({
      factor: FACTOR_LABELS[f.key] || f.key,
      candidateScore: Math.round(f.score),
      winnerScore: Math.round(f.rivalScore),
      gap: Math.round(f.rivalScore - f.score),
      advice: FACTOR_ADVICE[f.key]?.action || '',
      impact: FACTOR_ADVICE[f.key]?.impact || ''
    })),
    strengthsToCapitalize: strengths.map(f => ({
      factor: FACTOR_LABELS[f.key] || f.key,
      candidateScore: Math.round(f.score),
      winnerScore: Math.round(f.rivalScore),
      advantage: Math.round(f.score - f.rivalScore),
      advice: `Amplify ${FACTOR_LABELS[f.key] || f.key} advantage in all campaign communications — this is your competitive edge.`
    })),
    boothStrategy: {
      priorityBooths: `Focus on swing-sensitive booths (estimated ~35% of total). Deploy senior agents to booths won by < 100 votes in 2021. Run daily booth-level status calls.`,
      weakBoothsApproach: 'For booths where current share < 30%: assign candidate personal visit, 3 door-to-door rounds, local leader endorsement. Aim to convert 60% of weak booths to competitive.',
      strongBoothsApproach: 'For booths with > 55% strength: maximize turnout through transport, voter list cleanup, and 100% voter contact. Strong booth turnout is the margin buffer.',
      electionDayPlan: 'Booth agent + micro-observer at every booth; 2-hour turnout reports to command center; vehicle pool for voter pickup; legal team on standby.'
    },
    voterOutreach,
    campaignActions,
    allianceOpportunities: allianceText,
    riskFactors: [
      ...contextRisks,
      isWinning
        ? `${rival?.name} (${rival?.party}) at ${rivalShare}% is the nearest threat — any mobilization drop can close this ${marginVsRival}% margin`
        : `Vote gap of ${marginVsRival}% vs ${rival?.name} (${rival?.party}) requires exceptional execution to overcome`,
      'Vote split with allied parties reducing effective tally',
      'Low turnout in favorable demographic pockets (youth, minority) if mobilization is weak',
      exploitableGaps.length > 0
        ? `Rival's strength on ${FACTOR_LABELS[exploitableGaps[0]?.key] || 'key factors'} could widen the gap if not countered`
        : 'Opponent consolidating their existing vote base in final week',
      'Last-minute negative campaigning or booth-capture attempts in hostile areas'
    ].filter(Boolean).slice(0, 6),
    confidenceOfTurnaround: confidence,
    generatedBy: 'data-driven-model'
  };
}

module.exports = router;
