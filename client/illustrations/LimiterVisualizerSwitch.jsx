import { FixedWindowIllustration } from './FixedWindowIllustration.jsx';
import { SlidingLogIllustration } from './SlidingLogIllustration.jsx';
import { SlidingCounterIllustration } from './SlidingCounterIllustration.jsx';
import { TokenBucketIllustration } from './TokenBucketIllustration.jsx';
import { LeakyBucketIllustration } from './LeakyBucketIllustration.jsx';

export function LimiterVisualizerSwitch({ algorithm, rpsLimit, rps, running, algorithmState }) {
  // Выбираем компонент визуализации в зависимости от выбранного алгоритма
  switch (algorithm) {
    case 'fixedWindow':
      return <FixedWindowIllustration rpsLimit={rpsLimit} rps={rps} running={running} algorithmState={algorithmState} />;
      
    case 'slidingLog':
      return <SlidingLogIllustration rpsLimit={rpsLimit} rps={rps} running={running} algorithmState={algorithmState} />;
      
    case 'slidingCounter':
      return <SlidingCounterIllustration rpsLimit={rpsLimit} rps={rps} running={running} algorithmState={algorithmState} />;
      
    case 'tokenBucket':
      return <TokenBucketIllustration rpsLimit={rpsLimit} rps={rps} running={running} algorithmState={algorithmState} />;
      
    case 'leakyBucket':
      return <LeakyBucketIllustration rpsLimit={rpsLimit} rps={rps} running={running} algorithmState={algorithmState} />;
      
    default:
      return (
        <div className="illustration">
          <h3 className="illustration__title">Визуализация недоступна</h3>
          <p className="illustration__description">
            Для выбранного алгоритма визуализация не реализована.
          </p>
        </div>
      );
  }
}
