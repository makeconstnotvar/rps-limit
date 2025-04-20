import express from 'express';
import cors from 'cors';
import path from "path";
import bodyParser from 'body-parser';
import { getRateLimiter } from './server/getRateLimiter.js';

const app = express();
const PORT = 3000;

let currentAlgorithmName = 'fixedWindow';
let currentLimiter = getRateLimiter(currentAlgorithmName);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.resolve('dist')));

app.post('/api/algorithm', (req, res) => {
  const { algorithm, rpsLimit } = req.body;
  try {
    currentLimiter = getRateLimiter(algorithm, rpsLimit);
    currentAlgorithmName = algorithm;
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при смене алгоритма:', error);
    res.status(400).json({ error: 'Unknown algorithm' });
  }
});

app.get('/api/test', currentLimiter, (req, res) => {
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve('dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});