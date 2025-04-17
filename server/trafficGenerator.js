import fetch from 'node-fetch';

let intervalId = null;
let isRunning = false;

export function startTrafficSimulation(rps = 5) {
  // Остановить предыдущую симуляцию, если запущена
  stopTrafficSimulation();
  
  // Проверка корректности RPS - не менее 1
  const actualRps = Math.max(1, rps);
  const delay = 1000 / actualRps;

  isRunning = true;
  
  intervalId = setInterval(() => {
    if (isRunning) {
      fetch('http://localhost:3000/simulated')
        .then(() => {})
        .catch(() => {});
    }
  }, delay);
}

export function stopTrafficSimulation() {
  isRunning = false;
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
