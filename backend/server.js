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
  'http://localhost:3001',
  'http://localhost:3002',
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
    if (err) {
      // In dev mode, frontend is served separately — show helpful landing page
      if (req.path === '/') {
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WB Election 2026 Prediction API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 600px; padding: 2.5rem; background: #1e293b; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.4); }
    h1 { font-size: 1.8rem; margin-bottom: .5rem; color: #f8fafc; }
    .badge { display: inline-block; background: #22c55e; color: #052e16; font-size: .75rem; font-weight: 700; padding: 2px 10px; border-radius: 999px; margin-left: 8px; vertical-align: middle; }
    p.sub { color: #94a3b8; margin-bottom: 1.5rem; }
    h2 { font-size: 1rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
    ul { list-style: none; margin-bottom: 1.5rem; }
    li { margin-bottom: .5rem; }
    a { color: #60a5fa; text-decoration: none; font-family: 'Consolas', monospace; font-size: .9rem; }
    a:hover { text-decoration: underline; color: #93c5fd; }
    .note { background: #334155; padding: 1rem; border-radius: 8px; font-size: .85rem; color: #cbd5e1; line-height: 1.5; }
    .note code { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>WB Election 2026 Prediction API <span class="badge">Running</span></h1>
    <p class="sub">Backend server is live on port ${PORT}</p>
    <h2>API Endpoints</h2>
    <ul>
      <li><a href="/health">/health</a> &mdash; Health check</li>
      <li><a href="/api/constituencies">/api/constituencies</a> &mdash; All constituencies</li>
      <li><a href="/api/predict/1">/api/predict/:no</a> &mdash; Prediction by constituency</li>
      <li><a href="/api/candidate/1">/api/candidate/:no</a> &mdash; Candidates by constituency</li>
      <li><a href="/api/state-summary">/api/state-summary</a> &mdash; Statewide summary</li>
    </ul>
    <div class="note">
      To view the full frontend, run <code>npm run dev</code> in the <code>frontend/</code> folder and open <a href="http://localhost:5173">http://localhost:5173</a>
    </div>
  </div>
</body>
</html>`);
      }
      res.status(404).json({ error: `Route ${req.path} not found` });
    }
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
