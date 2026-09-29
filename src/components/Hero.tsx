import type { Person, Settings } from '../lib/types';
import { Avatar } from './Avatar';

interface HeroProps {
  present: Person[];
  totalPeople: number;
  settings: Settings;
  progress: { done: number; total: number };
  roundCount: number;
  onDraw: () => void;
}

const orderLabel = (o: Settings['personOrder']): string => (o === 'random' ? 'Aleatório' : 'Em ordem');

/** Palco em repouso: cartaz tipográfico assimétrico + painel de comando do sorteio. */
export function Hero({ present, totalPeople, settings, progress, roundCount, onDraw }: HeroProps) {
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const canDraw = present.length > 0;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__poster" data-aos="fade-right" data-aos-duration="900">
        <p className="hero__kicker">
          <span className="chip chip--red">#TEAMEBD</span>
          <span>terça é dia de EBD</span>
        </p>
        <h1 id="hero-title" className="poster">
          <span className="poster__row poster__row--wide">Quem</span>
          <span className="poster__row poster__row--wide">
            ama a <em className="poster__script">Palavra,</em>
          </span>
          <span className="poster__row poster__row--giant">
            <span className="poster__white">Ama&nbsp;a</span> <span className="poster__red">EBD</span>
          </span>
        </h1>
        <p className="hero__lede">
          Sorteie um aluno, lance a pergunta e deixe o placar contar a história da <strong>Classe Débora e Baraque</strong>.
        </p>
      </div>

      <aside className="command glass" data-aos="fade-left" data-aos-delay="150" data-aos-duration="900">
        <header className="command__head">
          <span className="command__label">Rodada</span>
          <span className="command__round">#{String(roundCount + 1).padStart(2, '0')}</span>
        </header>

        <div className="command__faces" aria-label={`${present.length} alunos presentes`}>
          {present.slice(0, 7).map((p, i) => (
            <span key={p.id} className="command__face" style={{ zIndex: 10 - i }}>
              <Avatar person={p} size="sm" eager />
            </span>
          ))}
          {present.length > 7 && <span className="command__more">+{present.length - 7}</span>}
        </div>
        <p className="command__presence">
          <strong>{present.length}</strong> de {totalPeople} presentes hoje
        </p>

        <dl className="command__meta">
          <div>
            <dt>
              <i className="bx bx-shuffle" aria-hidden="true" /> Alunos
            </dt>
            <dd>{orderLabel(settings.personOrder)}</dd>
          </div>
          <div>
            <dt>
              <i className="bx bx-list-ol" aria-hidden="true" /> Perguntas
            </dt>
            <dd>{orderLabel(settings.questionOrder)}</dd>
          </div>
        </dl>

        <div className="meter" role="img" aria-label={`${progress.done} de ${progress.total} perguntas já feitas`}>
          <div className="meter__top">
            <span>Banco de perguntas</span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="meter__track">
            <span className="meter__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button type="button" className="btn btn--primary btn--xl btn--shine" onClick={onDraw} disabled={!canDraw}>
          <i className="bx bx-dice-5" aria-hidden="true" />
          <span>Sortear aluno</span>
          <kbd aria-hidden="true">Espaço</kbd>
        </button>
        {!canDraw && (
          <a className="command__warn" href="#/ajustes">
            <i className="bx bx-user-x" aria-hidden="true" /> Nenhum aluno presente — marque a presença nos ajustes.
          </a>
        )}
      </aside>
    </section>
  );
}
