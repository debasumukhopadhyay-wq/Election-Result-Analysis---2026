require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Middleware — allow localhost in dev, any Render/custom domain in prod
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  /\.onrender\.com$/,   // all *.onrender.com subdomains
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser / server-to-server
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('CORS not allowed'), allowed);
  },
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

// Serve React frontend (built files) in production
const frontendDist = path.join(__dirname, 'public');
app.use(express.static(frontendDist));

// React Router catch-all — serve index.html for any non-API route
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: `Route ${req.path} not found` });
  });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🗳️  WB Election 2026 Prediction API running on port ${PORT}`);
  console.log(`📊  AI reasoning: ${process.env.ANTHROPIC_API_KEY ? 'enabled (Claude)' : 'fallback mode (no API key)'}`);
  console.log(`🔗  Health check: http://localhost:${PORT}/health`);
  // Build prediction cache after server starts
  setImmediate(() => buildCache());
});

module.exports = app;
