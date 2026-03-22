const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const constituencies = require('../data/constituencies');
const { getCandidatesForConstituency } = require('../data/candidates');
const historicalResults = require('../data/historicalResults');
const demographics = require('../data/demographics');
const { predictConstituency } = require('../services/predictionEngine');
const { simulateBooths } = require('../services/boothSimulator');
const { generateAIReasoning } = require('../services/claudeService');
const { predictLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validate');

const predictValidation = [
  body('constituencyId').notEmpty().matches(/^WB-\d{3}$/),
  body('contextText').optional().isString().isLength({ max: 1000 }),
  body('candidateAdjustments').optional().isObject(),
  body('weights').optional().isObject()
];

// POST /api/predict
router.post('/', predictLimiter, predictValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const { constituencyId, contextText, candidateAdjustments, weights } = req.body;

    // Find constituency
    const constituency = constituencies.find(c => c.id === constituencyId);
    if (!constituency) {
      return res.status(404).json({ error: 'Constituency not found' });
    }

    // Get candidates
    const candidates = getCandidatesForConstituency(constituencyId);
    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ error: 'No candidates found for this constituency' });
    }

    // Get supporting data
    const histData = historicalResults[constituencyId] || null;
    const demData = demographics[constituencyId] || null;

    // Run prediction engine (synchronous, deterministic)
    const prediction = predictConstituency({
      constituency,
      candidates,
      historicalData: histData,
      demographics: demData,
      weights,
      contextText,
      candidateAdjustments
    });

    // Booth simulation (synchronous)
    const boothSimulation = simulateBooths({
      constituency,
      candidateScores: prediction.allCandidates
    });

    // AI reasoning (async, with fallback)
    const aiReasoning = await generateAIReasoning({
      constituency,
      candidateScores: prediction.allCandidates,
      historicalData: histData,
      demographics: demData,
      contextText
    });

    // Adjust confidence with Claude's adjustment
    const finalConfidence = Math.min(95, Math.max(20,
      prediction.confidenceScore + (aiReasoning.confidenceAdjustment || 0)
    ));

    res.json({
      ...prediction,
      boothSimulation,
      aiReasoning,
      confidenceScore: finalConfidence
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
