import { useEffect, useState } from 'react';
import type { OptionKey, Person, Question, Score } from '../lib/types';
import { PersonSpotlight } from './PersonSpotlight';

interface QuestionViewProps {
  person: Person;
  score: Score;
  rank: number;
  question: Question;
  onAnswer: (key: OptionKey) => void;
  onSwapQuestion: () => void;
  onRedraw: () => void;
  onCancel: () => void;
}

const KEY_MAP: Readonly<Record<string, OptionKey>> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', a: 'a', b: 'b', c: 'c', d: 'd' };

/** A pergunta em cena. O professor toca na alternativa que o aluno escolheu (ou tecla 1–4 / A–D). */
export function QuestionView({ person, score, rank, question, onAnswer, onSwapQuestion, onRedraw, onCancel }: QuestionViewProps) {
  const [picked, setPicked] = useState<OptionKey | null>(null);

  useEffect(() => setPicked(null), [question.id]);

  const choose = (key: OptionKey): void => {
    if (picked) return;
    setPicked(key);
    // meio segundo de "travado" antes da revelação — dá peso à escolha
    window.setTimeout(() => onAnswer(key), 520);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target instanceof HTMLElement && e.target.closest('input,textarea'))) return;
      const k = KEY_MAP[e.key.toLowerCase()];
      if (k) choose(k);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section className="question-layout" aria-labelledby="q-prompt">
      <PersonSpotlight person={person} score={score} rank={rank} />

      <article className="qcard glass" key={question.id} data-aos="fade-up" data-aos-delay="120" data-aos-duration="800">
        <header className="qcard__head">
          <span className="chip chip--blue">
            <i className="bx bx-book-bookmark" aria-hidden="true" /> Lição {question.lesson}
          </span>
          <span className="qcard__lesson">{question.lessonTitle}</span>
          <span className="qcard__num" aria-label={`Pergunta número ${question.id}`}>
            Nº<b>{String(question.id).padStart(3, '0')}</b>
          </span>
        </header>

        <h2 id="q-prompt" className="qcard__prompt">
          {question.prompt}
        </h2>

        <ol className="options" aria-label="Alternativas — toque na que o aluno escolheu">
          {question.options.map((o, i) => (
            <li key={o.key} style={{ animationDelay: `${180 + i * 90}ms` }}>
              <button
                type="button"
                className={`option ${picked === o.key ? 'is-picked' : ''} ${picked && picked !== o.key ? 'is-dim' : ''}`}
                onClick={() => choose(o.key)}
                disabled={picked !== null}
                aria-keyshortcuts={`${i + 1} ${o.key}`}
              >
                <span className="option__key">{o.key.toUpperCase()}</span>
                <span className="option__text">{o.text}</span>
                <i className="bx bx-right-arrow-alt option__go" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        <footer className="qcard__foot">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onSwapQuestion} disabled={picked !== null}>
            <i className="bx bx-refresh" aria-hidden="true" /> Trocar pergunta
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRedraw} disabled={picked !== null}>
            <i className="bx bx-dice-3" aria-hidden="true" /> Sortear outro aluno
          </button>
          <button type="button" className="btn btn--text btn--sm" onClick={onCancel} disabled={picked !== null}>
            <i className="bx bx-x" aria-hidden="true" /> Encerrar rodada
          </button>
        </footer>
      </article>
    </section>
  );
}
