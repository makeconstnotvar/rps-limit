import fetch from 'node-fetch';

let intervalId = null;

export function startTrafficSimulation(rps = 5) {
  stopTrafficSimulation(); // на случай повторного запуска

  const delay = 1000 / rps;

  intervalId = setInterval(() => {
    fetch('http://localhost:3000/simulated') // фейковый маршрут
      .then(() => {})
      .catch(() => {});
  }, delay);
}

export function stopTrafficSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
