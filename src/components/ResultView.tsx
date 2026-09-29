import type { OptionKey, Person, Question, Score } from '../lib/types';
import { PersonSpotlight } from './PersonSpotlight';

interface ResultViewProps {
  person: Person;
  score: Score;
  rank: number;
  question: Question;
  choice: OptionKey;
  onNext: () => void;
  onUndo: () => void;
  onFinish: () => void;
}

/** Pós-revelação: veredito, gabarito comentado e caminho para o próximo sorteio. */
export function ResultView({ person, score, rank, question, choice, onNext, onUndo, onFinish }: ResultViewProps) {
  const correct = choice === question.answer;
  const answer = question.options.find((o) => o.key === question.answer);

  return (
    <section className={`question-layout result ${correct ? 'is-correct' : 'is-wrong'}`} aria-labelledby="result-title">
      <PersonSpotlight person={person} score={score} rank={rank} />

      <article className="qcard glass" data-aos="zoom-in-up" data-aos-duration="700">
        <header className="result__banner">
          <span className="result__stamp" aria-hidden="true">
            <i className={`bx ${correct ? 'bx-check' : 'bx-x'}`} />
          </span>
          <div>
            <h2 id="result-title" className="result__title">
              {correct ? 'Resposta exata!' : 'Resposta errada'}
            </h2>
            <p className="result__sub">
              {correct ? (
                <>
                  <b>+1 ponto</b> para {person.name}. Agora são {score.correct + score.bonus} pts.
                </>
              ) : (
                <>
                  A certa era a alternativa <b>{question.answer.toUpperCase()}</b>
                  {answer ? ` — ${answer.text}` : ''}.
                </>
              )}
            </p>
          </div>
        </header>

        <p className="qcard__prompt qcard__prompt--sm">{question.prompt}</p>

        <ol className="options options--review">
          {question.options.map((o) => {
            const isAnswer = o.key === question.answer;
            const isChoice = o.key === choice;
            return (
              <li key={o.key}>
                <div className={`option ${isAnswer ? 'is-answer' : ''} ${isChoice && !isAnswer ? 'is-miss' : ''}`}>
                  <span className="option__key">{o.key.toUpperCase()}</span>
                  <span className="option__text">{o.text}</span>
                  {isAnswer && <i className="bx bx-check-circle option__badge" aria-label="Correta" />}
                  {isChoice && !isAnswer && <i className="bx bx-x-circle option__badge" aria-label="Escolhida" />}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="why" data-aos="fade-up" data-aos-delay="200">
          <span className="why__icon" aria-hidden="true">
            <i className="bx bx-bulb" />
          </span>
          <div>
            <h3>Por quê?</h3>
            <p>{question.explanation}</p>
          </div>
        </div>

        <footer className="result__actions">
          <button type="button" className="btn btn--primary btn--lg btn--shine" onClick={onNext} autoFocus>
            <i className="bx bx-dice-5" aria-hidden="true" /> Sortear próximo aluno
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onUndo} title="Marcou a alternativa errada? Volte para a pergunta.">
            <i className="bx bx-undo" aria-hidden="true" /> Desfazer resposta
          </button>
          <button type="button" className="btn btn--text btn--sm" onClick={onFinish}>
            <i className="bx bx-home-alt-2" aria-hidden="true" /> Voltar ao palco
          </button>
        </footer>
      </article>
    </section>
  );
}
