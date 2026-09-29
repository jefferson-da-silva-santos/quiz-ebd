import { useEffect, useRef, useState } from 'react';
import { fireConfetti } from '../lib/confetti';
import { play } from '../lib/sound';

interface RevealOverlayProps {
  correct: boolean;
  reducedMotion: boolean;
  onDone: () => void;
}

/**
 * Revelação em três tempos: "A resposta" → "está" → "Exata!" | "Errada".
 * A tipografia repete o cartaz: largo + manuscrito + condensado gigante.
 */
export function RevealOverlay({ correct, reducedMotion, onDone }: RevealOverlayProps) {
  const [step, setStep] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const k = reducedMotion ? 0.45 : 1;
    const timers = [
      window.setTimeout(() => setStep(1), 850 * k),
      window.setTimeout(() => setStep(2), 1900 * k),
      window.setTimeout(() => setStep(3), 3700 * k),
      window.setTimeout(() => doneRef.current(), 4150 * k),
    ];
    play('drum');
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reducedMotion]);

  useEffect(() => {
    if (step !== 2) return;
    play(correct ? 'win' : 'lose');
    fireConfetti(correct ? 'celebrate' : 'rain');
  }, [step, correct]);

  const verdict = correct ? 'Exata!' : 'Errada';

  return (
    <div
      className={`reveal ${correct ? 'is-correct' : 'is-wrong'} ${step >= 2 ? 'is-verdict' : ''} ${step >= 3 ? 'is-leaving' : ''}`}
      role="alert"
      aria-label={`A resposta está ${verdict}`}
      onClick={() => (step < 2 ? setStep(2) : doneRef.current())}
    >
      <div className="reveal__rays" aria-hidden="true" />
      <div className="reveal__words" aria-hidden="true">
        <span className="reveal__w1">A resposta</span>
        {step >= 1 && <span className="reveal__w2">está…</span>}
        {step >= 2 && (
          <span className="reveal__w3">
            {verdict.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 55}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        )}
      </div>
      <span className="reveal__hint">toque para continuar</span>
    </div>
  );
}
