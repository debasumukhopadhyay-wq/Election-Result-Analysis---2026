// Prediction cache — runs full scoring engine for all 294 constituencies at startup
// No Claude AI (synchronous only). The constituency page adds Claude reasoning on top.

const constituencies = require('../data/constituencies');
const { getCandidatesForConstituency } = require('../data/candidates');
const historicalResults = require('../data/historicalResults');
const demographics = require('../data/demographics');
const { predictConstituency } = require('./predictionEngine');

let _cache = null;

function buildCache() {
  console.log('⚙️  Building prediction cache for all 294 constituencies...');
  const start = Date.now();
  _cache = {};

  for (const c of constituencies) {
    try {
      const candidates = getCandidatesForConstituency(c.id);
      if (!candidates || candidates.length === 0) continue;

      const histData = historicalResults[c.id] || null;
      const demData = demographics[c.id] || null;

      const prediction = predictConstituency({
        constituency: c,
        candidates,
        historicalData: histData,
        demographics: demData
      });

      _cache[c.id] = {
        constituencyId: c.id,
        constituencyName: c.name,
        district: c.district,
        reservedCategory: c.reservedCategory,
        leadingParty: prediction.predictedWinner.party,
        predictedWinner: {
          name: prediction.predictedWinner.name,
          party: prediction.predictedWinner.party,
          predictedVoteShare: prediction.predictedWinner.predictedVoteShare
        },
        allCandidates: prediction.allCandidates.map(cand => ({
          candidateId: cand.candidateId,
          name: cand.name,
          party: cand.party,
          predictedVoteShare: cand.predictedVoteShare,
          totalScore: cand.totalScore
        })),
        confidenceScore: prediction.confidenceScore
      };
    } catch (err) {
      console.error(`Cache error for ${c.id} (${c.name}):`, err.message);
    }
  }

  const elapsed = Date.now() - start;
  console.log(`✅  Prediction cache ready: ${Object.keys(_cache).length} seats in ${elapsed}ms`);
  return _cache;
}

function getCache() {
  if (!_cache) buildCache();
  return _cache;
}

function getCachedPrediction(constituencyId) {
  return getCache()[constituencyId] || null;
}

// Aggregate stats used by state summary
function getCacheStats() {
  const cache = getCache();
  const partySeats = {};
  const partyVoteShare = {};
  const districtData = {};

  for (const entry of Object.values(cache)) {
    // Party seat count
    partySeats[entry.leadingParty] = (partySeats[entry.leadingParty] || 0) + 1;

    // Vote shares
    for (const cand of entry.allCandidates) {
      partyVoteShare[cand.party] = (partyVoteShare[cand.party] || 0) + cand.predictedVoteShare;
    }

    // District breakdown
    if (!districtData[entry.district]) {
      districtData[entry.district] = { district: entry.district, seats: 0, partySeats: {} };
    }
    districtData[entry.district].seats++;
    districtData[entry.district].partySeats[entry.leadingParty] =
      (districtData[entry.district].partySeats[entry.leadingParty] || 0) + 1;
  }

  return { partySeats, partyVoteShare, districtData };
}

module.exports = { buildCache, getCache, getCachedPrediction, getCacheStats };
