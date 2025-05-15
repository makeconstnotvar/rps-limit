import { useEffect, useRef, useState } from 'preact/hooks';

export function SlidingCounterIllustration({ rpsLimit, rps, running, algorithmState }) {
  const canvasRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const animationFrameRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  
  // Константы для анимации
  const WINDOW_DURATION = 1000; // 1 секунда
  const BUCKET_SIZE = 100; // 100 мс
  const BALL_RADIUS = 10;
  const CONTAINER_PADDING = 20;
  const BUCKET_WIDTH = 40;
  const BUCKET_GAP = 10;
  const BUCKET_HEIGHT = 150;
  
  // Добавление нового запроса
  useEffect(() => {
    if (!running) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      lastRequestTimeRef.current = now;
      
      // Получаем бакеты из состояния алгоритма
      const buckets = algorithmState && 'buckets' in algorithmState 
        ? algorithmState.buckets 
        : [];
      
      // Определяем текущий бакет
      const currentBucketId = Math.floor(now / BUCKET_SIZE);
      
      // Подсчитываем общее количество запросов в окне
      const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);
      
      // Определяем, будет ли запрос принят
      const accepted = totalCount < rpsLimit;
      
      // Добавляем новый запрос
      setRequests(prev => [
        ...prev,
        {
          id: now,
          bucketId: currentBucketId,
          x: Math.random() * 0.8 + 0.1, // Позиция по X (от 0.1 до 0.9)
          y: 0, // Начальная позиция по Y
          velocity: 0, // Начальная скорость
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
    const gravity = 0.5; // Гравитация для анимации падения
    
    function animate() {
      const now = Date.now();
      const currentBucketId = Math.floor(now / BUCKET_SIZE);
      
      // Очищаем холст
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем заголовок
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Sliding Window Counter',
        canvas.width / 2,
        30
      );
      
      // Получаем бакеты из состояния алгоритма
      const buckets = algorithmState && 'buckets' in algorithmState 
        ? algorithmState.buckets 
        : [];
      
      // Рисуем бакеты
      const sortedBuckets = [...buckets].sort((a, b) => a.id - b.id);
      const maxCount = Math.max(...sortedBuckets.map(b => b.count), 1);
      const totalCount = sortedBuckets.reduce((sum, b) => sum + b.count, 0);
      const isOverLimit = totalCount > rpsLimit;
      
      // Рассчитываем позицию для отрисовки бакетов
      const totalWidth = sortedBuckets.length * (BUCKET_WIDTH + BUCKET_GAP) - BUCKET_GAP;
      const startX = (canvas.width - totalWidth) / 2;
      const baseY = canvas.height - CONTAINER_PADDING - 50;
      
      // Рисуем бакеты
      sortedBuckets.forEach((bucket, index) => {
        const x = startX + index * (BUCKET_WIDTH + BUCKET_GAP);
        const height = (bucket.count / maxCount) * BUCKET_HEIGHT;
        const age = (currentBucketId - bucket.id) * BUCKET_SIZE;
        const agePercent = age / WINDOW_DURATION;
        const opacity = 1 - agePercent;
        
        // Рисуем бакет
        ctx.fillStyle = `rgba(100, 149, 237, ${opacity})`;
        ctx.strokeStyle = `rgba(51, 51, 51, ${opacity})`;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.rect(x, baseY - height, BUCKET_WIDTH, height);
        ctx.fill();
        ctx.stroke();
        
        // Рисуем счетчик
        ctx.fillStyle = `rgba(51, 51, 51, ${opacity})`;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          bucket.count.toString(),
          x + BUCKET_WIDTH / 2,
          baseY - height - 5
        );
        
        // Рисуем метку времени
        ctx.fillText(
          `${Math.floor(age / 100) / 10}s`,
          x + BUCKET_WIDTH / 2,
          baseY + 15
        );
      });
      
      // Рисуем общий счетчик
      ctx.fillStyle = isOverLimit ? 'red' : '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Всего: ${totalCount} / ${rpsLimit}`,
        canvas.width / 2,
        baseY + 40
      );
      
      // Рисуем линию лимита
      const limitHeight = (rpsLimit / maxCount) * BUCKET_HEIGHT;
      
      ctx.strokeStyle = 'red';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX - 10, baseY - limitHeight);
      ctx.lineTo(startX + totalWidth + 10, baseY - limitHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Обновляем и рисуем запросы
      setRequests(prev => 
        prev
          .map(req => {
            // Физика движения
            let { x, y, velocity, accepted, bucketId } = req;
            
            // Находим позицию бакета
            const bucketIndex = sortedBuckets.findIndex(b => b.id === bucketId);
            if (bucketIndex === -1) return req; // Бакет уже удален
            
            const bucketX = startX + bucketIndex * (BUCKET_WIDTH + BUCKET_GAP);
            const targetX = bucketX + BUCKET_WIDTH / 2;
            
            // Преобразуем относительные координаты в абсолютные
            const absX = CONTAINER_PADDING + x * (canvas.width - 2 * CONTAINER_PADDING);
            
            // Плавно перемещаем к целевой позиции по X
            x = x + (targetX / canvas.width - x) * 0.1;
            
            // Если запрос принят и достиг бакета, останавливаем его
            const bucketY = baseY - (sortedBuckets[bucketIndex].count / maxCount) * BUCKET_HEIGHT;
            
            if (accepted && y >= bucketY - BALL_RADIUS) {
              return { ...req, x, y: bucketY - BALL_RADIUS, velocity: 0 };
            }
            
            // Если запрос отклонен и достиг определенной высоты, отскакиваем
            if (!accepted && y >= baseY - BUCKET_HEIGHT - BALL_RADIUS) {
              return { 
                ...req, 
                x, 
                y: baseY - BUCKET_HEIGHT - BALL_RADIUS, 
                velocity: -velocity * 0.6 // Отскок с потерей энергии
              };
            }
            
            // Применяем гравитацию
            velocity += gravity;
            y += velocity;
            
            return { ...req, x, y, velocity };
          })
          .filter(req => {
            // Удаляем старые запросы (старше 3 секунд)
            return now - req.created < 3000;
          })
      );
      
      // Рисуем запросы
      requests.forEach(req => {
        const absX = CONTAINER_PADDING + req.x * (canvas.width - 2 * CONTAINER_PADDING);
        
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
      <h3 className="illustration__title">🧱 Sliding Counter</h3>
      <div className="illustration__canvas-container">
        <canvas ref={canvasRef} className="illustration__canvas" />
      </div>
      <p className="illustration__description">
        Разбивает временное окно на сегменты (бакеты) и подсчитывает запросы в каждом. 
        Общее количество запросов - сумма по всем бакетам в окне.
      </p>
    </div>
  );
}
