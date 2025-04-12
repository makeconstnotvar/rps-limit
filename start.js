import express from 'express';
import cors from 'cors';
import path from "path";
import bodyParser from 'body-parser';
import tokenBucket from './server/tokenBucket.js';
import leakyBucket from './server/leakyBucket.js';
import slidingCounter from "./server/slidingCounter.js";
import slidingLog from "./server/slidingLog.js";
import { getRateLimiter } from './server/getRateLimiter.js';
import { startTrafficSimulation, stopTrafficSimulation } from './server/trafficGenerator.js';


const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
let currentAlgorithmName = 'fixedWindow';
let currentLimiter = getRateLimiter(currentAlgorithmName);
let stats = { allowed: 0, denied: 0 };
const distPath = path.resolve('dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  currentLimiter(req, res, (err) => {
    if (err) return next(err);

    const denied = res.headersSent;
    if (denied) stats.denied++;
    else stats.allowed++;

    next();
  });
});

app.post('/api/algorithm', (req, res) => {
  const { algorithm } = req.body;
  try {
    currentLimiter = getRateLimiter(algorithm);
    currentAlgorithmName = algorithm;
    stats = { allowed: 0, denied: 0 };
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Unknown algorithm' });
  }
});

app.get('/api/state', (req, res) => {
  if (currentAlgorithmName === 'tokenBucket') return res.json(tokenBucket.getState());
  if (currentAlgorithmName === 'leakyBucket') return res.json(leakyBucket.getState());
  if (currentAlgorithmName === 'slidingLog') return res.json(slidingLog.getState()); // Импорт отсутствует
  if (currentAlgorithmName === 'slidingCounter') return res.json(slidingCounter.getState()); // Импорт отсутствует
  res.json({});
});

app.post('/api/simulator', (req, res) => {
  const { action, rps } = req.body;
  if (action === 'start') {
    startTrafficSimulation(rps);
    res.json({ started: true });
  } else if (action === 'stop') {
    stopTrafficSimulation();
    res.json({ stopped: true });
  } else {
    res.status(400).json({ error: 'Unknown action' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.use('/simulated', (req, res, next) => {
  currentLimiter(req, res, (err) => {
    if (err) return next(err);

    const denied = res.headersSent;
    if (denied) stats.denied++;
    else stats.allowed++;

    next();
  });
});

app.get('/simulated', (req, res) => {
  res.send('ok');
});

let temp = path.resolve('dist/index.html')
app.get('/', (req, res) => {
  res.sendFile(temp);
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
