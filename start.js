import express from 'express';
import cors from 'cors';
import path from "path";
import bodyParser from 'body-parser';
import {tokenBucket, tokenBucketState,} from './server/limiters/tokenBucket.js';
import {leakyBucket, leakyBucketState   } from './server/limiters/leakyBucket.js';
import {slidingCounter, slidingCounterState} from "./server/limiters/slidingCounter.js";
import {slidingLog, slidingLogState} from "./server/limiters/slidingLog.js";
import { getRateLimiter } from './server/getRateLimiter.js';
import { startTrafficSimulation, stopTrafficSimulation } from './server/trafficGenerator.js';
import {fixedWindowState} from "./server/limiters/fixedWindow.js";


const app = express();
const PORT = 3000;
let currentAlgorithmName = 'fixedWindow';
let currentLimiter = getRateLimiter(currentAlgorithmName);
// Track requests per second
let stats = { allowed: 0, denied: 0 };
let requestsPerSecond = [];

// Initialize with empty data for the last 20 seconds
for (let i = 0; i < 20; i++) {
  requestsPerSecond.push({ allowed: 0, denied: 0, timestamp: Date.now() - (20 - i) * 1000 });
}

// Function to update requests per second
function updateRequestsPerSecond(allowed, denied) {
  const now = Date.now();
  const currentSecond = Math.floor(now / 1000) * 1000;

  // Find or create entry for current second
  let entry = requestsPerSecond.find(e => e.timestamp === currentSecond);

  if (!entry) {
    // Remove oldest entry if we have 20 entries
    if (requestsPerSecond.length >= 20) {
      requestsPerSecond.shift();
    }

    // Add new entry
    entry = { allowed: 0, denied: 0, timestamp: currentSecond };
    requestsPerSecond.push(entry);
  }

  // Update counts
  if (allowed) entry.allowed++;
  if (denied) entry.denied++;
}
const distPath = path.resolve('dist');

app.use(cors());

app.use(bodyParser.json());

app.use(express.static(distPath));

app.use((req, res, next) => {
  // Исключаем маршрут /simulated, так как для него есть отдельный middleware
  if (req.path === '/simulated') {
    return next();
  }

  currentLimiter(req, res, (err) => {
    if (err) return next(err);

    const denied = res.headersSent;
    if (denied) {
      stats.denied++;
      updateRequestsPerSecond(false, true);
    } else {
      stats.allowed++;
      updateRequestsPerSecond(true, false);
    }

    next();
  });
});

app.post('/api/algorithm', (req, res) => {
  const { algorithm, rpsLimit } = req.body;
  try {
    stopTrafficSimulation();

    currentLimiter = getRateLimiter(algorithm, rpsLimit);
    currentAlgorithmName = algorithm;

    stats = { allowed: 0, denied: 0 };

    // Reset per-second data
    requestsPerSecond = [];
    for (let i = 0; i < 20; i++) {
      requestsPerSecond.push({ allowed: 0, denied: 0, timestamp: Date.now() - (20 - i) * 1000 });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при смене алгоритма:', error);
    res.status(400).json({ error: 'Unknown algorithm' });
  }
});

app.get('/api/state', (req, res) => {
  if (currentAlgorithmName === 'leakyBucket') return res.json(leakyBucketState());
  if (currentAlgorithmName === 'slidingLog') return res.json(slidingLogState());
  if (currentAlgorithmName === 'slidingCounter') return res.json(slidingCounterState());
  if (currentAlgorithmName === 'tokenBucket') return res.json(tokenBucketState());
  if (currentAlgorithmName === 'fixedWindow') return res.json(fixedWindowState());
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
  // Get the latest entry
  const latestEntry = requestsPerSecond[requestsPerSecond.length - 1];

  // Return the latest per-second data
  res.json({
    allowed: latestEntry.allowed,
    denied: latestEntry.denied,
    // Include the full history for debugging
    history: requestsPerSecond
  });
});

app.use('/simulated', (req, res, next) => {
  currentLimiter(req, res, (err) => {
    if (err) return next(err);

    const denied = res.headersSent;
    if (denied) {
      stats.denied++;
      updateRequestsPerSecond(false, true);
    } else {
      stats.allowed++;
      updateRequestsPerSecond(true, false);
    }

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
