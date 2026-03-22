const express = require('express');
const router = express.Router();
const constituencies = require('../data/constituencies');
const { getCachedPrediction } = require('../services/predictionCache');

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
    return {
      id: c.id,
      name: c.name,
      district: c.district,
      region: c.region,
      reservedCategory: c.reservedCategory,
      totalVoters: c.totalVoters,
      partyStrength: c.partyStrength,
      leadingParty: cached ? cached.leadingParty : (Object.entries(c.partyStrength || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TMC'),
      predictedWinner: cached ? cached.predictedWinner : null
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
