import { useEffect, useRef, useState } from 'preact/hooks';

export function LeakyBucketIllustration({ rpsLimit, rps, running }) {
  const canvasRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const [queue, setQueue] = useState([]);
  const [leakingDrops, setLeakingDrops] = useState([]);
  const animationFrameRef = useRef(null);
  const lastLeakTimeRef = useRef(Date.now());
  
  // Константы для анимации
  const BALL_RADIUS = 10;
  const BUCKET_WIDTH = 120;
  const BUCKET_HEIGHT = 180;
  const CONTAINER_PADDING = 20;
  const PROCESS_RATE = rpsLimit; // Скорость обработки запросов (равна лимиту)
  
  // Добавление нового запроса и обработка очереди
  useEffect(() => {
    if (!running) return;
    
    // Обработка очереди (утечка)
    const leakInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - lastLeakTimeRef.current) / 1000;
      
      // Обрабатываем запросы с заданной скоростью
      if (queue.length > 0) {
        // Удаляем запрос из начала очереди (FIFO)
        setQueue(prev => {
          if (prev.length === 0) return prev;
          return prev.slice(1);
        });
        
        // Добавляем анимацию утекающей капли
        setLeakingDrops(prev => [
          ...prev,
          {
            id: now,
            created: now
          }
        ]);
      }
      
      lastLeakTimeRef.current = now;
    }, 1000 / PROCESS_RATE);
    
    // Добавление запросов
    const requestInterval = setInterval(() => {
      const now = Date.now();
      
      // Определяем, будет ли запрос принят
      const accepted = queue.length < rpsLimit;
      
      // Добавляем новый запрос
      setRequests(prev => [
        ...prev,
        {
          id: now,
          x: Math.random() * 0.8 + 0.1, // Позиция по X (от 0.1 до 0.9)
          y: 0, // Начальная позиция по Y
          velocity: 0, // Начальная скорость
          accepted,
          created: now
        }
      ]);
      
      // Добавляем запрос в очередь, если он принят
      if (accepted) {
        setQueue(prev => [...prev, { id: now }]);
      }
    }, 1000 / rps);
    
    return () => {
      clearInterval(leakInterval);
      clearInterval(requestInterval);
    };
  }, [running, rps, rpsLimit, queue.length]);
  
  // Анимация
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gravity = 0.5; // Гравитация для анимации падения
    
    function animate() {
      const now = Date.now();
      
      // Очищаем холст
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем ведро (контейнер)
      const bucketX = (canvas.width - BUCKET_WIDTH) / 2;
      const bucketY = canvas.height - BUCKET_HEIGHT - CONTAINER_PADDING;
      
      // Рисуем контур ведра
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bucketX, bucketY);
      ctx.lineTo(bucketX, bucketY + BUCKET_HEIGHT);
      ctx.lineTo(bucketX + BUCKET_WIDTH, bucketY + BUCKET_HEIGHT);
      ctx.lineTo(bucketX + BUCKET_WIDTH, bucketY);
      ctx.stroke();
      
      // Рисуем отверстие в дне ведра
      ctx.fillStyle = '#f5f5f5';
      const holeWidth = 20;
      const holeHeight = 10;
      ctx.fillRect(
        bucketX + (BUCKET_WIDTH - holeWidth) / 2, 
        bucketY + BUCKET_HEIGHT - holeHeight / 2, 
        holeWidth, 
        holeHeight
      );
      
      // Рисуем запросы в очереди
      const queueHeight = (queue.length / rpsLimit) * BUCKET_HEIGHT;
      
      if (queueHeight > 0) {
        // Рисуем "жидкость" в ведре
        ctx.fillStyle = queue.length > rpsLimit * 0.7 ? '#ff5722' : 'dodgerblue';
        ctx.fillRect(
          bucketX, 
          bucketY + BUCKET_HEIGHT - queueHeight, 
          BUCKET_WIDTH, 
          queueHeight
        );
      }
      
      // Рисуем счетчик запросов в очереди
      ctx.fillStyle = queue.length === rpsLimit ? 'red' : '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${queue.length} / ${rpsLimit} в очереди`,
        canvas.width / 2,
        bucketY + BUCKET_HEIGHT + 30
      );
      
      // Рисуем скорость обработки
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText(
        `Обработка: ${PROCESS_RATE} запросов/сек`,
        canvas.width / 2,
        bucketY + BUCKET_HEIGHT + 50
      );
      
      // Обновляем и рисуем утекающие капли
      setLeakingDrops(prev => 
        prev
          .map(drop => {
            // Вычисляем прогресс анимации (от 0 до 1)
            const age = now - drop.created;
            const progress = Math.min(1, age / 500); // 500 мс на анимацию
            
            return { ...drop, progress };
          })
          .filter(drop => drop.progress < 1) // Удаляем завершенные анимации
      );
      
      // Рисуем утекающие капли
      leakingDrops.forEach(drop => {
        const dropX = bucketX + BUCKET_WIDTH / 2;
        const dropY = bucketY + BUCKET_HEIGHT + drop.progress * 30;
        
        ctx.beginPath();
        ctx.arc(dropX, dropY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'dodgerblue';
        ctx.fill();
        ctx.closePath();
      });
      
      // Обновляем и рисуем запросы
      setRequests(prev => 
        prev
          .map(req => {
            // Физика движения
            let { x, y, velocity, accepted } = req;
            
            // Преобразуем относительные координаты в абсолютные
            const absX = bucketX + x * BUCKET_WIDTH;
            
            // Если запрос принят и достиг верха ведра или уровня жидкости
            const liquidLevel = bucketY + BUCKET_HEIGHT - queueHeight;
            const targetY = Math.max(bucketY, liquidLevel) - BALL_RADIUS;
            
            if (accepted && y >= targetY) {
              return null; // Удаляем запрос, который был принят и достиг ведра
            }
            
            // Если запрос отклонен и достиг верха ведра, отскакиваем
            if (!accepted && y >= bucketY - BALL_RADIUS) {
              return { 
                ...req, 
                y: bucketY - BALL_RADIUS, 
                velocity: -velocity * 0.6 // Отскок с потерей энергии
              };
            }
            
            // Применяем гравитацию
            velocity += gravity;
            y += velocity;
            
            return { ...req, y, velocity };
          })
          .filter(Boolean) // Удаляем null (принятые запросы, достигшие ведра)
          .filter(req => {
            // Удаляем старые запросы (старше 3 секунд)
            return now - req.created < 3000;
          })
      );
      
      // Рисуем запросы
      requests.forEach(req => {
        const absX = bucketX + req.x * BUCKET_WIDTH;
        
        ctx.beginPath();
        ctx.arc(absX, req.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = req.accepted ? 'limegreen' : 'tomato';
        ctx.fill();
        ctx.closePath();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [requests, leakingDrops, queue, rpsLimit]);
  
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
  
  // Сбрасываем состояние при изменении лимита
  useEffect(() => {
    setQueue([]);
  }, [rpsLimit]);
  
  return (
    <div className="illustration">
      <h3 className="illustration__title">💧 Leaky Bucket</h3>
      <div className="illustration__canvas-container">
        <canvas ref={canvasRef} className="illustration__canvas" />
      </div>
      <p className="illustration__description">
        Очередь запросов с фиксированной скоростью обработки. 
        Новые запросы добавляются в очередь, если она не переполнена. 
        Запросы обрабатываются с постоянной скоростью.
      </p>
    </div>
  );
}
