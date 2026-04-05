const express = require('express');
const router = express.Router();
const constituencies = require('../data/constituencies');
const { getCachedPrediction } = require('../services/predictionCache');
const { REAL_2021_NUMS } = require('../data/real2021Results');
const historicalResults = require('../data/historicalResults');

// 2021 WB actual result (incl. bypolls): TMC 215, BJP 77, ISF 1 (Bhangar #172), IND 1 (Kalimpong #1 — GJM-Tamang)
// CPM 0, INC 0, RSP 0 (Keshpur was won by TMC's Seuli Saha, not RSP)
// For verified seats, use the real data. For generated data, apply the known 2021 outcome:
// only TMC/BJP actually won seats (except Bhangar=ISF, Kalimpong=IND/GJM).
function get2021Winner(c) {
  const constNum = parseInt(c.id.replace('WB-', ''));
  const hist = historicalResults[c.id];
  const e2021 = hist && hist.elections.find(e => e.year === 2021);
  if (!e2021) return null;

  const topResult = e2021.results.find(r => r.winner);
  if (!topResult) return null;

  if (REAL_2021_NUMS.has(constNum)) {
    // Verified real data — use as-is (includes ISF Bhangar etc.)
    return { party: topResult.party, candidate: topResult.candidate, voteShare: topResult.voteShare, verified: true };
  }

  // Known special seats in 2021
  if (constNum === 172) return { party: 'ISF', candidate: 'Naushad Siddiqui', voteShare: 0.41 }; // Bhangar — ISF's only win
  if (constNum === 22) return { party: 'IND', candidate: 'Ruden Sada Lepcha', voteShare: 0.40 }; // Kalimpong — GJM-Tamang backed Independent

  // For generated data: only TMC or BJP won in 2021
  const validParties = ['TMC', 'BJP'];
  if (validParties.includes(topResult.party)) {
    return { party: topResult.party, candidate: topResult.candidate, voteShare: topResult.voteShare };
  }
  const fallback = e2021.results
    .filter(r => validParties.includes(r.party))
    .sort((a, b) => b.voteShare - a.voteShare)[0];
  return fallback
    ? { party: fallback.party, candidate: fallback.candidate, voteShare: fallback.voteShare }
    : { party: 'TMC', candidate: 'TMC Candidate', voteShare: 0 };
}

// GET /api/constituencies - List all constituencies
router.get('/', (req, res) => {
  const { district, region, reservedCategory, search } = req.query;

  let filtered = constituencies;

  if (district) {
    filtered = filtered.filter(c => c.district.toLowerCase() === district.toLowerCase());
  }
  if (region) {
    filtered = filtered.filter(c => c.region.toLowerCase() === region.toLowerCase());
  }
  if (reservedCategory) {
    filtered = filtered.filter(c => c.reservedCategory === reservedCategory.toUpperCase());
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.district.toLowerCase().includes(searchLower)
    );
  }

  // Return slim list for dropdown
  const result = filtered.map(c => {
    const cached = getCachedPrediction(c.id);
    // Compute estimated vote margin (votes) from predicted vote share gap
    let predictedMargin = null;
    if (cached && cached.allCandidates && cached.allCandidates.length >= 2) {
      const sorted = [...cached.allCandidates].sort((a, b) => b.totalScore - a.totalScore);
      const vsGap = sorted[0].predictedVoteShare - sorted[1].predictedVoteShare;
      predictedMargin = Math.round(vsGap * (c.totalVoters || 180000) * 0.78); // ~78% turnout
    }
    return {
      id: c.id,
      name: c.name,
      district: c.district,
      region: c.region,
      reservedCategory: c.reservedCategory,
      totalVoters: c.totalVoters,
      partyStrength: c.partyStrength,
      leadingParty: cached ? cached.leadingParty : (Object.entries(c.partyStrength || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TMC'),
      predictedWinner: cached ? cached.predictedWinner : null,
      predictedMargin,
      winner2021: get2021Winner(c),
      historicalWinners: c.historicalWinners || []
    };
  });

  res.json({ constituencies: result, total: result.length });
});

// GET /api/constituencies/:id - Get single constituency detail
router.get('/:id', (req, res) => {
  const constituency = constituencies.find(c => c.id === req.params.id);
  if (!constituency) {
    return res.status(404).json({ error: 'Constituency not found' });
  }
  res.json(constituency);
});

// GET /api/constituencies/districts/list - Get unique districts
router.get('/meta/districts', (req, res) => {
  const districts = [...new Set(constituencies.map(c => c.district))].sort();
  res.json({ districts });
});

module.exports = router;
