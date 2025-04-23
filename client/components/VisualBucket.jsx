import { useEffect, useState } from "preact/hooks";

// Компонент TokenRain для визуализации пополнения токенов
function TokenRain({ tokens, maxTokens, refillRate }) {
  const [raindrops, setRaindrops] = useState([]);
  
  // Добавление новых капель при пополнении токенов
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokens < maxTokens) {
        setRaindrops(prev => [
          ...prev, 
          { id: Date.now(), x: Math.random() * 100 }
        ]);
      }
    }, 1000 / refillRate);
    
    return () => clearInterval(interval);
  }, [tokens, maxTokens, refillRate]);
  
  // Удаление капель, достигших дна
  useEffect(() => {
    const interval = setInterval(() => {
      setRaindrops(prev => prev.filter(drop => 
        Date.now() - drop.id < 1000
      ));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="token-rain">
      {raindrops.map(drop => (
        <div 
          key={drop.id}
          className="token-rain__drop"
          style={{ left: `${drop.x}%` }}
        />
      ))}
    </div>
  );
}

// Компонент LeakyFlow для визуализации вытекания запросов
function LeakyFlow({ processRate }) {
  const [drops, setDrops] = useState([]);
  
  // Создание новых капель для анимации вытекания
  useEffect(() => {
    const interval = setInterval(() => {
      setDrops(prev => [
        ...prev,
        { id: Date.now(), progress: 0 }
      ]);
    }, 1000 / processRate);
    
    return () => clearInterval(interval);
  }, [processRate]);
  
  // Анимация движения капель и удаление старых
  useEffect(() => {
    const animationFrame = requestAnimationFrame(function animate() {
      setDrops(prev => 
        prev
          .map(drop => ({
            ...drop,
            progress: Math.min(100, drop.progress + 2)
          }))
          .filter(drop => drop.progress < 100)
      );
      
      requestAnimationFrame(animate);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  return (
    <div className="leaky-flow">
      {drops.map(drop => (
        <div 
          key={drop.id}
          className="leaky-flow__drop"
          style={{ top: `${drop.progress}%` }}
        />
      ))}
    </div>
  );
}

// Компонент подсказки
function InfoTooltip({ title, content }) {
  const [visible, setVisible] = useState(false);
  
  return (
    <div className="info-tooltip">
      <button 
        className="info-tooltip__trigger"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        ℹ️
      </button>
      
      {visible && (
        <div className="info-tooltip__content">
          <h5>{title}</h5>
          <p>{content}</p>
        </div>
      )}
    </div>
  );
}

export function VisualBucket({ algorithm, state, rpsLimit }) {
  // Общий враппер для всех визуализаций
  const VisualizerWrapper = ({ title, description, children }) => (
    <div className="visual-bucket">
      <div className="visual-bucket__header">
        <h3 className="visual-bucket__title">{title}</h3>
        {description && (
          <InfoTooltip
            title={title}
            content={description}
          />
        )}
      </div>
      {children}
    </div>
  );

  // Fixed Window
  if (algorithm === 'fixedWindow') {
    const { windowStart, count, windowSize } = state.fixedWindow;
    const now = Date.now();
    const elapsed = now - windowStart;
    const timeLeft = Math.max(0, windowSize - elapsed);
    const progress = (elapsed / windowSize) * 100;
    const isOverLimit = count > rpsLimit;

    return (
      <VisualizerWrapper 
        title="🪟 Fixed Window" 
        description="Простой подсчет запросов в фиксированном временном окне. При истечении окна счетчик сбрасывается."
      >
        <div className="visual-bucket__fixed-window">
          <div className="visual-bucket__window-container">
            <div 
              className="visual-bucket__progress-bar"
              style={{ width: `${progress}%` }}
            />
            <div className={`visual-bucket__counter ${isOverLimit ? 'visual-bucket__counter--over' : ''}`}>
              {count} / {rpsLimit}
            </div>
          </div>
          <p className="visual-bucket__timer">Сброс через: {Math.ceil(timeLeft / 1000)}с</p>
        </div>
      </VisualizerWrapper>
    );
  }

  // Sliding Log
  if (algorithm === 'slidingLog') {
    const { timestamps, windowSize } = state.slidingLog;
    const now = Date.now();
    const isOverLimit = timestamps.length > rpsLimit;
    
    return (
      <VisualizerWrapper 
        title="📜 Sliding Log" 
        description="Хранит временные метки всех запросов в скользящем окне. Старые метки удаляются по мере выхода из окна."
      >
        <div className="visual-bucket__sliding-log">
          <div className="visual-bucket__log-container">
            {timestamps.map((ts, i) => {
              const age = now - ts;
              const percent = 100 - (age / windowSize) * 100;
              return (
                <div
                  key={i}
                  className="visual-bucket__log-mark"
                  style={{ left: `${percent}%` }}
                />
              );
            })}
            <div 
              className="visual-bucket__limit-line" 
              style={{ right: `${rpsLimit * 5}px` }}
            />
          </div>
          <p className={`visual-bucket__status ${isOverLimit ? 'visual-bucket__status--over' : ''}`}>
            {timestamps.length} / {rpsLimit} запросов в окне
          </p>
        </div>
      </VisualizerWrapper>
    );
  }

  // Sliding Counter
  if (algorithm === 'slidingCounter') {
    const { buckets, bucketSize, windowSize } = state.slidingCounter;
    const maxCount = Math.max(...buckets.map(b => b.count || 0), 1);
    const totalCount = buckets.reduce((sum, b) => sum + (b.count || 0), 0);
    const isOverLimit = totalCount > rpsLimit;
    const now = Date.now();
    const currentBucket = Math.floor(now / bucketSize);
    
    // Сортируем бакеты по времени (от старых к новым)
    const sortedBuckets = [...buckets].sort((a, b) => a.id - b.id);
    
    return (
      <VisualizerWrapper 
        title="🧱 Sliding Counter" 
        description="Разбивает временное окно на сегменты (бакеты) и подсчитывает запросы в каждом. Общее количество запросов - сумма по всем бакетам в окне."
      >
        <div className="visual-bucket__counter-wrapper">
          <div className="visual-bucket__counter-container">
            {sortedBuckets.map((b, i) => {
              const age = (currentBucket - b.id) * bucketSize;
              const agePercent = (age / windowSize) * 100;
              return (
                <div
                  key={i}
                  className="visual-bucket__counter-column"
                  style={{ opacity: 1 - agePercent / 100 }}
                >
                  <div
                    className="visual-bucket__counter-item"
                    style={{ height: `${(b.count / maxCount) * 100}%` }}
                  >
                    {b.count || 0}
                  </div>
                  <div className="visual-bucket__counter-label">
                    {Math.floor(age / 100) / 10}s
                  </div>
                </div>
              );
            })}
          </div>
          <div className="visual-bucket__counter-total">
            <span className={isOverLimit ? 'visual-bucket__counter--over' : ''}>
              Всего: {totalCount} / {rpsLimit}
            </span>
          </div>
        </div>
      </VisualizerWrapper>
    );
  }

  // Token Bucket
  if (algorithm === 'tokenBucket') {
    const { tokens, maxTokens, refillRate } = state.tokenBucket;
    const filledPercent = (tokens / maxTokens) * 100;
    const isLow = tokens < maxTokens * 0.3;

    return (
      <VisualizerWrapper 
        title="🎟️ Token Bucket" 
        description="Контейнер с токенами, которые пополняются с заданной скоростью. Каждый запрос потребляет один токен. Если токенов нет, запрос отклоняется."
      >
        <div className="visual-bucket__token-wrapper">
          <TokenRain 
            tokens={tokens} 
            maxTokens={maxTokens} 
            refillRate={refillRate} 
          />
          <div className="visual-bucket__token-container">
            <div
              className={`visual-bucket__token-level ${isLow ? 'visual-bucket__token-level--low' : ''}`}
              style={{ height: `${filledPercent}%` }}
            />
          </div>
          <div className="visual-bucket__token-info">
            <p className="visual-bucket__status">
              {tokens} / {maxTokens} токенов
            </p>
            <p className="visual-bucket__refill-rate">
              Пополнение: {refillRate} токенов/сек
            </p>
          </div>
        </div>
      </VisualizerWrapper>
    );
  }

  // Leaky Bucket
  if (algorithm === 'leakyBucket') {
    const { queue, maxSize, processRate } = state.leakyBucket;
    const queueSize = queue.length;
    const fillPercent = (queueSize / maxSize) * 100;
    const isNearFull = queueSize > maxSize * 0.7;

    return (
      <VisualizerWrapper 
        title="💧 Leaky Bucket" 
        description="Очередь запросов с фиксированной скоростью обработки. Новые запросы добавляются в очередь, если она не переполнена. Запросы обрабатываются с постоянной скоростью."
      >
        <div className="visual-bucket__leaky-wrapper">
          <div className="visual-bucket__leaky-container">
            <div 
              className={`visual-bucket__leaky-level ${isNearFull ? 'visual-bucket__leaky-level--full' : ''}`}
              style={{ height: `${fillPercent}%` }}
            />
            <LeakyFlow processRate={processRate} />
          </div>
          <div className="visual-bucket__leaky-info">
            <p className="visual-bucket__status">
              {queueSize} / {maxSize} в очереди
            </p>
            <p className="visual-bucket__process-rate">
              Обработка: {processRate} запросов/сек
            </p>
          </div>
        </div>
      </VisualizerWrapper>
    );
  }

  return (
    <div className="visual-bucket">
      <h3 className="visual-bucket__title">Визуализация недоступна</h3>
    </div>
  );
}
