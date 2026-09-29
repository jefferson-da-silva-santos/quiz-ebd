import type { Person, Score } from '../lib/types';
import { pointsOf } from '../lib/engine';
import { Avatar } from './Avatar';

/** Cartão lateral do aluno da vez — foto em destaque com moldura em diagonal. */
export function PersonSpotlight({ person, score, rank }: { person: Person; score: Score; rank: number }) {
  return (
    <aside className="spotlight" data-aos="fade-up" data-aos-duration="700">
      <div className="spotlight__frame">
        <Avatar person={person} size="fill" eager />
        <span className="spotlight__slash" aria-hidden="true" />
      </div>
      <div className="spotlight__info">
        <span className="spotlight__eyebrow">Responde agora</span>
        <strong className="spotlight__name">{person.name}</strong>
        <ul className="spotlight__stats" aria-label="Desempenho">
          <li>
            <b>{pointsOf(score)}</b>
            <span>pts</span>
          </li>
          <li>
            <b>{score.correct}</b>
            <span>acertos</span>
          </li>
          <li>
            <b>{rank}º</b>
            <span>lugar</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
