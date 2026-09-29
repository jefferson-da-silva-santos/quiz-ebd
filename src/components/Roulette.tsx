import { useEffect, useRef, useState } from 'react';
import { shuffle } from '../lib/random';
import { play } from '../lib/sound';
import type { Person } from '../lib/types';
import { Avatar } from './Avatar';

interface RouletteProps {
  people: Person[];
  target: Person;
  reducedMotion: boolean;
  onDone: () => void;
}

const MIN_ITEMS = 48;
const TAIL = 5;

/** Monta a fita: presentes embaralhados em loop, com o sorteado cravado perto do fim. */
const buildStrip = (people: Person[], target: Person): { items: Person[]; targetIndex: number } => {
  const items: Person[] = [];
  const pool = people.length ? people : [target];
  while (items.length < MIN_ITEMS) items.push(...shuffle(pool));
  const targetIndex = items.length - TAIL;
  items[targetIndex] = target;
  return { items, targetIndex };
};

// easing: arrancada forte e frenagem longa (suspense)
const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Roleta horizontal de cartões (foto + nome).
 * A animação roda em requestAnimationFrame direto no DOM — zero re-render por quadro.
 */
export function Roulette({ people, target, reducedMotion, onDone }: RouletteProps) {
  // congelado na montagem: re-renders do pai nunca reembaralham a fita em movimento
  const [{ items, targetIndex }] = useState(() => buildStrip(people, target));
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const viewport = viewportRef.current;
    const strip = stripRef.current;
    const first = strip?.children[0] as HTMLElement | undefined;
    const second = strip?.children[1] as HTMLElement | undefined;
    if (!viewport || !strip || !first || !second) return;

    const itemW = first.offsetWidth;
    const step = second.offsetLeft - first.offsetLeft;
    const center = viewport.clientWidth / 2 - itemW / 2;
    const from = center - 2 * step;
    const to = center - targetIndex * step;
    const overshoot = step * 0.28;
    const mainMs = reducedMotion ? 700 : 5200;
    const settleMs = reducedMotion ? 0 : 520;
    const cards = Array.from(strip.children) as HTMLElement[];

    let raf = 0;
    let lastIdx = -1;
    let lastX = from;
    const t0 = performance.now();

    const paint = (x: number): void => {
      strip.style.transform = `translate3d(${x}px,0,0)`;
      const velocity = Math.abs(x - lastX);
      lastX = x;
      strip.style.setProperty('--blur', `${Math.min(5, velocity / 9).toFixed(2)}px`);
      const idx = Math.round((center - x) / step);
      if (idx !== lastIdx) {
        cards[lastIdx]?.classList.remove('is-center');
        cards[idx]?.classList.add('is-center');
        lastIdx = idx;
        if (!reducedMotion) play('tick');
      }
    };

    const frame = (now: number): void => {
      const t = now - t0;
      if (t < mainMs) {
        // passa um pouco do alvo…
        paint(from + (to - overshoot - from) * easeOutQuint(t / mainMs));
        raf = requestAnimationFrame(frame);
      } else if (t < mainMs + settleMs) {
        // …e volta devagar: o "quase parou no outro"
        paint(to - overshoot + overshoot * easeInOutSine((t - mainMs) / settleMs));
        raf = requestAnimationFrame(frame);
      } else {
        paint(to);
        strip.style.setProperty('--blur', '0px');
        play('land');
        setLanded(true);
      }
    };

    paint(from);
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [targetIndex, reducedMotion]);

  // após o pouso, segura o destaque do vencedor e segue para a pergunta
  useEffect(() => {
    if (!landed) return;
    const id = window.setTimeout(() => doneRef.current(), reducedMotion ? 600 : 1900);
    return () => window.clearTimeout(id);
  }, [landed, reducedMotion]);

  return (
    <section className={`roulette ${landed ? 'is-landed' : ''}`} aria-live="assertive" aria-busy={!landed}>
      <header className="roulette__head">
        <span className="roulette__eyebrow">
          <i className={`bx ${landed ? 'bxs-star' : 'bx-loader-circle bx-spin'}`} aria-hidden="true" /> {landed ? 'Sorteado' : 'Sorteando'}
        </span>
        <h2 className="roulette__title">
          {landed ? (
            <>
              É a vez de <span className="roulette__winner-name">{target.name}</span>
            </>
          ) : (
            <>
              Quem vai responder<span className="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
            </>
          )}
        </h2>
      </header>

      <div className="roulette__stage">
        <span className="roulette__pointer roulette__pointer--top" aria-hidden="true" />
        <span className="roulette__pointer roulette__pointer--bottom" aria-hidden="true" />
        <span className="roulette__spot" aria-hidden="true" />
        <div className="roulette__viewport" ref={viewportRef}>
          <div className="roulette__strip" ref={stripRef}>
            {items.map((p, i) => (
              <div key={`${p.id}-${i}`} className={`reel-card ${landed && i === targetIndex ? 'is-winner' : ''}`}>
                <Avatar person={p} size="fill" eager />
                <span className="reel-card__name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className="roulette__skip" onClick={() => doneRef.current()} disabled={!landed}>
        {landed ? 'Ir para a pergunta' : 'Girando…'} <i className="bx bx-right-arrow-alt" aria-hidden="true" />
      </button>
    </section>
  );
}
