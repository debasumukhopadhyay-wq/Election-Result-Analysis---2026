const express = require('express');
const router = express.Router();
const { getCacheStats } = require('../services/predictionCache');

router.get('/', (req, res) => {
  const { partySeats, partyVoteShare, districtData } = getCacheStats();

  const totalConstituencies = 294;

  // Normalize vote shares
  const normalizedVoteShare = {};
  for (const party in partyVoteShare) {
    normalizedVoteShare[party] = Math.round((partyVoteShare[party] / totalConstituencies) * 1000) / 1000;
  }

  // Build projections
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

  res.json({
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
  });
});

module.exports = router;
