import { useMemo } from 'react';
import type { QuizActions } from '../hooks/useQuizStore';
import { QUESTION_BY_ID } from '../data/questions';
import { questionProgress, ranking, type RankRow } from '../lib/engine';
import type { QuizState } from '../lib/types';
import { Avatar } from './Avatar';

interface ScoreboardProps {
  state: QuizState;
  actions: QuizActions;
}

const timeFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Pódio: 2º – 1º – 3º, alturas assimétricas. */
function Podium({ rows }: { rows: RankRow[] }) {
  const order = [rows[1], rows[0], rows[2]];
  return (
    <ol className="podium" aria-label="Pódio">
      {order.map((r, i) =>
        r ? (
          <li
            key={r.person.id}
            className={`podium__step podium__step--${r.position}`}
            data-aos="fade-up"
            data-aos-delay={[150, 0, 300][i]}
          >
            <div className="podium__who">
              {r.position === 1 && <i className="bx bxs-crown podium__crown" aria-hidden="true" />}
              <Avatar person={r.person} size="lg" />
              <strong>{r.person.name}</strong>
              <span>
                {r.points} pts · {Math.round(r.accuracy * 100)}%
              </span>
            </div>
            <div className="podium__block">
              <span>{r.position}º</span>
            </div>
          </li>
        ) : (
          <li key={`empty-${i}`} className="podium__step podium__step--empty" aria-hidden="true" />
        ),
      )}
    </ol>
  );
}

export function Scoreboard({ state, actions }: ScoreboardProps) {
  const rows = useMemo(() => ranking(state), [state]);
  const progress = questionProgress(state);
  const totals = useMemo(() => {
    const correct = state.history.filter((h) => h.correct).length;
    return { answered: state.history.length, correct, pct: state.history.length ? Math.round((correct / state.history.length) * 100) : 0 };
  }, [state.history]);
  const maxPoints = Math.max(1, ...rows.map((r) => r.points));
  const nameOf = (id: string): string => state.people.find((p) => p.id === id)?.name ?? 'Aluno removido';
  const scorers = rows.filter((r) => r.points > 0);

  return (
    <section className="page" aria-labelledby="score-title">
      <header className="page__head" data-aos="fade-up">
        <span className="page__eyebrow">Classe Débora e Baraque</span>
        <h1 id="score-title" className="page__title">
          Placar <em>da turma</em>
        </h1>
      </header>

      <div className="stats" data-aos="fade-up" data-aos-delay="80">
        <div className="stat glass">
          <i className="bx bx-message-square-check" aria-hidden="true" />
          <b>{totals.answered}</b>
          <span>respostas</span>
        </div>
        <div className="stat glass">
          <i className="bx bx-target-lock" aria-hidden="true" />
          <b>{totals.pct}%</b>
          <span>de acerto da turma</span>
        </div>
        <div className="stat glass stat--wide">
          <i className="bx bx-library" aria-hidden="true" />
          <b>
            {progress.done}
            <small>/{progress.total}</small>
          </b>
          <span>perguntas já feitas</span>
        </div>
      </div>

      {scorers.length ? (
        <Podium rows={scorers} />
      ) : (
        <div className="empty glass" data-aos="fade-up">
          <i className="bx bx-trophy" aria-hidden="true" />
          <p>Ninguém pontuou ainda. O primeiro acerto abre o pódio!</p>
          <a className="btn btn--primary" href="#/palco">
            <i className="bx bx-dice-5" aria-hidden="true" /> Ir para o palco
          </a>
        </div>
      )}

      <div className="board glass" data-aos="fade-up">
        <div className="board__head" aria-hidden="true">
          <span>#</span>
          <span>Aluno</span>
          <span>Acertos</span>
          <span>Pontos</span>
        </div>
        <ol className="board__list">
          {rows.map((r, i) => (
            <li key={r.person.id} className={`board__row ${r.person.active ? '' : 'is-absent'}`} data-aos="fade-up" data-aos-delay={Math.min(i * 40, 400)} data-aos-offset="20">
              <span className="board__pos">{r.position}</span>
              <span className="board__who">
                <Avatar person={r.person} size="sm" />
                <span>
                  <strong>{r.person.name}</strong>
                  <small>
                    {r.answered ? `${r.score.correct} de ${r.answered} · ${Math.round(r.accuracy * 100)}%` : 'ainda não respondeu'}
                    {!r.person.active && ' · ausente'}
                  </small>
                </span>
              </span>
              <span className="board__bar" aria-hidden="true">
                <span style={{ width: `${(Math.max(0, r.points) / maxPoints) * 100}%` }} />
              </span>
              <span className="board__points">
                <button type="button" className="icon-btn" onClick={() => actions.adjustBonus(r.person.id, -1)} aria-label={`Tirar 1 ponto de ${r.person.name}`}>
                  <i className="bx bx-minus" />
                </button>
                <b>{r.points}</b>
                <button type="button" className="icon-btn" onClick={() => actions.adjustBonus(r.person.id, 1)} aria-label={`Dar 1 ponto extra para ${r.person.name}`}>
                  <i className="bx bx-plus" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {state.history.length > 0 && (
        <div className="timeline glass" data-aos="fade-up">
          <h2>
            <i className="bx bx-history" aria-hidden="true" /> Últimas respostas
          </h2>
          <ol>
            {state.history.slice(0, 15).map((h) => {
              const q = QUESTION_BY_ID.get(h.questionId);
              return (
                <li key={h.id} className={h.correct ? 'is-correct' : 'is-wrong'}>
                  <i className={`bx ${h.correct ? 'bx-check' : 'bx-x'}`} aria-label={h.correct ? 'Acertou' : 'Errou'} />
                  <div>
                    <strong>{nameOf(h.personId)}</strong>
                    <p>{q?.prompt}</p>
                  </div>
                  <time dateTime={new Date(h.at).toISOString()}>{timeFmt.format(h.at)}</time>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
