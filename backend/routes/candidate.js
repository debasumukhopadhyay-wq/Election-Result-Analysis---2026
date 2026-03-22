const express = require('express');
const router = express.Router();
const { allCandidates } = require('../data/candidates');

// GET /api/candidate/:id
router.get('/:id', (req, res) => {
  const candidate = allCandidates.find(c => c.id === req.params.id);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }
  res.json(candidate);
});

// GET /api/candidates/constituency/:constituencyId
router.get('/constituency/:constituencyId', (req, res) => {
  const { getCandidatesForConstituency } = require('../data/candidates');
  const candidates = getCandidatesForConstituency(req.params.constituencyId);
  res.json({ candidates, total: candidates.length });
});

module.exports = router;
