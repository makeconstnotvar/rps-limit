import { useEffect, useRef, useState } from 'preact/hooks';

export function SlidingLogIllustration({ rpsLimit, rps, running, algorithmState }) {
  const canvasRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const animationFrameRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  
  // Константы для анимации
  const WINDOW_DURATION = 1000; // 1 секунда
  const BALL_RADIUS = 10;
  const TIMELINE_HEIGHT = 60;
  const CONTAINER_PADDING = 20;
  
  // Добавление нового запроса
  useEffect(() => {
    if (!running) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      lastRequestTimeRef.current = now;
      
      // Получаем метки времени из состояния алгоритма
      const timestamps = algorithmState && 'timestamps' in algorithmState 
        ? algorithmState.timestamps 
        : [];
      
      // Определяем, будет ли запрос принят
      const accepted = timestamps.length < rpsLimit;
      
      // Добавляем новый запрос
      setRequests(prev => [
        ...prev,
        {
          id: now,
          x: 0.9, // Начальная позиция по X (правый край)
          y: Math.random() * 0.5 + 0.25, // Позиция по Y (от 0.25 до 0.75)
          accepted,
          created: now
        }
      ]);
    }, 10000 / rps);
    
    return () => clearInterval(interval);
  }, [running, rps, rpsLimit, algorithmState]);
  
  // Анимация
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    function animate() {
      const now = Date.now();
      
      // Очищаем холст
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем временную шкалу
      const timelineWidth = canvas.width - 2 * CONTAINER_PADDING;
      const timelineTop = canvas.height / 2 - TIMELINE_HEIGHT / 2;
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        CONTAINER_PADDING, 
        timelineTop, 
        timelineWidth, 
        TIMELINE_HEIGHT
      );
      
      // Рисуем метки времени
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // Рисуем деления на шкале (каждые 100 мс)
      for (let i = 0; i <= 10; i++) {
        const x = CONTAINER_PADDING + (timelineWidth * i / 10);
        
        // Рисуем деление
        ctx.beginPath();
        ctx.moveTo(x, timelineTop);
        ctx.lineTo(x, timelineTop + 10);
        ctx.stroke();
        
        // Подписываем время
        ctx.fillText(
          `${i * 100}ms`,
          x,
          timelineTop + 25
        );
      }
      
      // Рисуем лимит
      const limitX = CONTAINER_PADDING + timelineWidth * 0.1; // 10% от левого края
      
      ctx.strokeStyle = 'red';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(limitX, timelineTop - 20);
      ctx.lineTo(limitX, timelineTop + TIMELINE_HEIGHT + 20);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Лимит: ${rpsLimit}`,
        limitX,
        timelineTop - 5
      );
      
      // Получаем метки времени из состояния алгоритма
      const timestamps = algorithmState && 'timestamps' in algorithmState 
        ? algorithmState.timestamps 
        : [];
      
      // Обновляем и рисуем метки запросов на шкале
      timestamps.forEach(ts => {
        const age = now - ts;
        const progress = 1 - age / WINDOW_DURATION; // От 1 до 0
        const x = CONTAINER_PADDING + timelineWidth * progress;
        
        ctx.beginPath();
        ctx.arc(x, timelineTop + TIMELINE_HEIGHT / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'limegreen';
        ctx.fill();
        ctx.closePath();
      });
      
      // Рисуем счетчик
      const isOverLimit = timestamps.length > rpsLimit;
      
      ctx.fillStyle = isOverLimit ? 'red' : '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${timestamps.length} / ${rpsLimit} запросов в окне`,
        canvas.width / 2,
        timelineTop + TIMELINE_HEIGHT + 40
      );
      
      // Обновляем и рисуем запросы
      setRequests(prev => 
        prev
          .map(req => {
            // Обновляем позицию запроса (движение влево)
            const age = now - req.created;
            const progress = age / WINDOW_DURATION;
            const x = Math.max(0.1, 0.9 - progress); // От 0.9 до 0.1
            
            return { ...req, x };
          })
          .filter(req => {
            // Удаляем старые запросы (старше 1.5 секунд)
            return now - req.created < 1500;
          })
      );
      
      // Рисуем запросы
      requests.forEach(req => {
        const absX = CONTAINER_PADDING + req.x * timelineWidth;
        const absY = timelineTop - BALL_RADIUS * 2;
        
        if (!req.accepted) {
          // Рисуем отклоненный запрос (отскакивает вверх)
          const age = now - req.created;
          const bounceHeight = Math.sin(age / 100) * 30 * Math.exp(-age / 500);
          
          ctx.beginPath();
          ctx.arc(absX, absY - bounceHeight, BALL_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = 'tomato';
          ctx.fill();
          ctx.closePath();
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [requests, algorithmState, rpsLimit]);
  
  // Обновляем размер холста при изменении размера окна
  useEffect(() => {
    function handleResize() {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = 300;
      }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="illustration">
      <h3 className="illustration__title">📜 Sliding Log</h3>
      <div className="illustration__canvas-container">
        <canvas ref={canvasRef} className="illustration__canvas" />
      </div>
      <p className="illustration__description">
        Хранит временные метки всех запросов в скользящем окне. 
        Старые метки удаляются по мере выхода из окна.
      </p>
    </div>
  );
}
