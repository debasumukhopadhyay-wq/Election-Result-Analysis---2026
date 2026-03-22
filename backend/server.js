require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const constituenciesRouter = require('./routes/constituencies');
const predictRouter = require('./routes/predict');
const candidateRouter = require('./routes/candidate');
const stateSummaryRouter = require('./routes/stateSummary');
const improveRouter = require('./routes/improve');
const { buildCache } = require('./services/predictionCache');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WB Election 2026 Prediction API',
    timestamp: new Date().toISOString(),
    aiEnabled: !!process.env.ANTHROPIC_API_KEY
  });
});

// Routes
app.use('/api/constituencies', constituenciesRouter);
app.use('/api/predict', predictRouter);
app.use('/api/candidate', candidateRouter);
app.use('/api/candidates', candidateRouter);
app.use('/api/state-summary', stateSummaryRouter);
app.use('/api/improve', improveRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🗳️  WB Election 2026 Prediction API running on port ${PORT}`);
  console.log(`📊  AI reasoning: ${process.env.ANTHROPIC_API_KEY ? 'enabled (Claude)' : 'fallback mode (no API key)'}`);
  console.log(`🔗  Health check: http://localhost:${PORT}/health`);
  // Build prediction cache after server starts
  setImmediate(() => buildCache());
});

module.exports = app;
