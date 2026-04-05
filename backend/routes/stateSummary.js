const express = require('express');
const router = express.Router();
const { getCacheStats, getCache } = require('../services/predictionCache');
const { parseContextAdjustments } = require('../services/predictionEngine');

function buildSummary(partySeats, partyVoteShare, districtData) {
  const totalConstituencies = 294;
  const normalizedVoteShare = {};
  for (const party in partyVoteShare) {
    normalizedVoteShare[party] = Math.round((partyVoteShare[party] / totalConstituencies) * 1000) / 1000;
  }
  const projections = {};
  for (const [party, seats] of Object.entries(partySeats)) {
    const variance = Math.round(seats * 0.12);
    projections[party] = {
      seats,
      minSeats: Math.max(0, seats - variance),
      maxSeats: Math.min(294, seats + variance),
      voteShare: normalizedVoteShare[party] || 0
    };
  }
  const tmcSeats = partySeats.TMC || 0;
  const bjpSeats = partySeats.BJP || 0;
  const majority = 148;
  const tmcMajorityProb = Math.min(0.98, Math.max(0.02, (tmcSeats - majority + 30) / 60));
  const bjpMajorityProb = Math.min(0.98, Math.max(0.02, (bjpSeats - majority + 30) / 60));
  const hungProb = Math.max(0.01, 1 - tmcMajorityProb - bjpMajorityProb);
  return {
    totalSeats: 294,
    projections,
    majorityThreshold: majority,
    majorityProbability: {
      TMC: Math.round(tmcMajorityProb * 100) / 100,
      BJP: Math.round(bjpMajorityProb * 100) / 100,
      hung: Math.round(hungProb * 100) / 100
    },
    districtBreakdown: Object.values(districtData).sort((a, b) => b.seats - a.seats),
    lastUpdated: new Date().toISOString()
  };
}

// GET — no context, use baseline cache
router.get('/', (req, res) => {
  const { partySeats, partyVoteShare, districtData } = getCacheStats();
  res.json(buildSummary(partySeats, partyVoteShare, districtData));
});

// POST — accepts { contextText } and applies context adjustments to cached scores
router.post('/', (req, res) => {
  const { contextText } = req.body || {};
  if (!contextText || contextText.trim().length < 3) {
    const { partySeats, partyVoteShare, districtData } = getCacheStats();
    return res.json(buildSummary(partySeats, partyVoteShare, districtData));
  }

  const { scoreAdj, signals } = parseContextAdjustments(contextText);
  const cache = getCache();

  const partySeats = {};
  const partyVoteShare = {};
  const districtData = {};
  const seatPredictions = {};

  for (const entry of Object.values(cache)) {
    // Apply context score deltas to each candidate's totalScore
    const adjusted = entry.allCandidates.map(c => ({
      ...c,
      adjustedScore: Math.min(100, Math.max(0, c.totalScore + (scoreAdj[c.party] || 0)))
    }));

    // Re-run softmax with adjusted scores (same temperature as engine)
    const expScores = adjusted.map(c => Math.exp((c.adjustedScore - 40) / 15));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    const withShares = adjusted.map((c, i) => ({
      ...c,
      predictedVoteShare: expScores[i] / sumExp
    }));
    withShares.sort((a, b) => b.adjustedScore - a.adjustedScore);
    const leader = withShares[0];

    partySeats[leader.party] = (partySeats[leader.party] || 0) + 1;
    withShares.forEach(c => {
      partyVoteShare[c.party] = (partyVoteShare[c.party] || 0) + c.predictedVoteShare;
    });

    if (!districtData[entry.district]) {
      districtData[entry.district] = { district: entry.district, seats: 0, partySeats: {} };
    }
    districtData[entry.district].seats++;
    districtData[entry.district].partySeats[leader.party] =
      (districtData[entry.district].partySeats[leader.party] || 0) + 1;

    seatPredictions[entry.constituencyId] = {
      leadingParty: leader.party,
      predictedWinner: { name: leader.name, party: leader.party }
    };
  }

  const summary = buildSummary(partySeats, partyVoteShare, districtData);
  summary.contextSignals = signals;
  summary.contextApplied = true;
  summary.seatPredictions = seatPredictions;
  res.json(summary);
});

module.exports = router;
