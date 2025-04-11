import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as token from './server/tokenBucket.js';
import * as leaky from './server/leakyBucket.js';
import { getRateLimiter } from './server/getRateLimiter.js';
import { startTrafficSimulation, stopTrafficSimulation } from './server/trafficGenerator.js';
import path from "path";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
let currentAlgorithmName = 'fixed';
let currentLimiter = getRateLimiter('fixed');
let stats = { allowed: 0, denied: 0 };
const distPath = path.resolve('dist');
app.use(express.static(distPath));
// Middleware для выбранного алгоритма
app.use((req, res, next) => {
  currentLimiter(req, res, (err) => {
    if (err) return next(err);

    const denied = res.headersSent;
    if (denied) stats.denied++;
    else stats.allowed++;

    next();
  });
});

// API: обновить алгоритм
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

// API: статистика
app.get('/api/state', (req, res) => {
  if (currentAlgorithmName === 'token') return res.json(token.getState());
  if (currentAlgorithmName === 'leaky') return res.json(leaky.getState());
  if (currentAlgorithmName === 'sliding-log') return res.json(sliding.getState());
  if (currentAlgorithmName === 'sliding-counter') return res.json(slidingCount.getState());
  res.json({});
});

// API: запуск/остановка генератора
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
