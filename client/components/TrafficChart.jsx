import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

export function TrafficChart({ stats, algorithm, rpsLimit }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const dataRef = useRef({
    labels: [],
    allowed: [],
    denied: []
  });

  // Plugin to draw horizontal line for RPS limit
  const limitLinePlugin = {
    id: 'limitLine',
    beforeDraw: (chart) => {
      if (algorithm === 'fixedWindow') {
        const { ctx, chartArea, scales } = chart;
        const yScale = scales.y;
        const y = yScale.getPixelForValue(rpsLimit);

        // Only draw if within chart area
        if (y >= chartArea.top && y <= chartArea.bottom) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y);
          ctx.lineTo(chartArea.right, y);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgb(255, 99, 132)';
          ctx.stroke();

          // Add label
          ctx.fillStyle = 'rgb(255, 99, 132)';
          ctx.font = '12px Arial';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Лимит RPS', chartArea.right, y - 2);

          ctx.restore();
        }
      }
    }
  };

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(ctx, {
      // Код остается без изменений
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [algorithm, rpsLimit]);

  useEffect(() => {
    // Код остается без изменений
  }, [stats, algorithm, rpsLimit]);

  return (
    <div className="traffic-chart">
      <h3 className="traffic-chart__title">📈 Динамика запросов</h3>
      <div className="traffic-chart__container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}