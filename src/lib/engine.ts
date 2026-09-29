import { QUESTIONS, QUESTION_BY_ID } from '../data/questions';
import { randomInt, shuffle } from './random';
import type { Person, Question, QuizState, Score } from './types';

/** Regras puras de sorteio e pontuação — sem efeitos colaterais, fáceis de testar. */

export const EMPTY_SCORE: Score = { correct: 0, wrong: 0, bonus: 0 };

export const activePeople = (s: QuizState): Person[] => s.people.filter((p) => p.active);

export const questionPool = (s: QuizState): readonly Question[] =>
  s.settings.lessons.length ? QUESTIONS.filter((q) => s.settings.lessons.includes(q.lesson)) : QUESTIONS;

export interface PersonPick {
  personId: string;
  personBag: string[];
}

/**
 * Aleatório: "saco" embaralhado — ninguém repete até todos os presentes responderem.
 * Em ordem: segue a lista da turma a partir do último sorteado, pulando ausentes.
 */
export const pickPerson = (s: QuizState): PersonPick | null => {
  const active = activePeople(s);
  if (!active.length) return null;
  const activeIds = new Set(active.map((p) => p.id));

  if (s.settings.personOrder === 'sequential') {
    const start = s.lastPersonId ? s.people.findIndex((p) => p.id === s.lastPersonId) : -1;
    for (let step = 1; step <= s.people.length; step++) {
      const p = s.people[(start + step + s.people.length) % s.people.length];
      if (p && activeIds.has(p.id)) return { personId: p.id, personBag: s.personBag };
    }
    return null;
  }

  let bag = s.personBag.filter((id) => activeIds.has(id));
  if (!bag.length) {
    bag = shuffle(active.map((p) => p.id));
    // evita o mesmo aluno duas vezes seguidas na virada do saco
    if (bag.length > 1 && bag[0] === s.lastPersonId) bag.push(bag.shift() as string);
  }
  const [personId, ...rest] = bag;
  return personId ? { personId, personBag: rest } : null;
};

export interface QuestionPick {
  questionId: number;
  /** true quando todas as perguntas do filtro já saíram e o ciclo recomeça. */
  cycled: boolean;
}

export const pickQuestion = (s: QuizState, excludeId?: number): QuestionPick | null => {
  const pool = questionPool(s);
  if (!pool.length) return null;
  const used = new Set(s.usedQuestionIds);
  let candidates = pool.filter((q) => !used.has(q.id) && q.id !== excludeId);
  let cycled = false;
  if (!candidates.length) {
    cycled = true;
    candidates = pool.filter((q) => q.id !== excludeId);
    if (!candidates.length) candidates = [...pool];
  }
  const chosen = s.settings.questionOrder === 'sequential' ? candidates[0] : candidates[randomInt(candidates.length)];
  return chosen ? { questionId: chosen.id, cycled } : null;
};

export const scoreOf = (s: QuizState, id: string): Score => s.scores[id] ?? EMPTY_SCORE;
export const pointsOf = (sc: Score): number => sc.correct + sc.bonus;

export interface RankRow {
  person: Person;
  score: Score;
  points: number;
  answered: number;
  accuracy: number;
  position: number;
}

/** Ranking: pontos ↓, menos erros ↑, nome A–Z. Empates dividem a posição. */
export const ranking = (s: QuizState): RankRow[] => {
  const rows = s.people
    .map((person) => {
      const score = scoreOf(s, person.id);
      const answered = score.correct + score.wrong;
      return { person, score, points: pointsOf(score), answered, accuracy: answered ? score.correct / answered : 0, position: 0 };
    })
    .sort(
      (a, b) => b.points - a.points || a.score.wrong - b.score.wrong || a.person.name.localeCompare(b.person.name, 'pt-BR'),
    );
  let last: RankRow | undefined;
  rows.forEach((r, i) => {
    r.position = last && last.points === r.points && last.score.wrong === r.score.wrong ? last.position : i + 1;
    last = r;
  });
  return rows;
};

export const questionProgress = (s: QuizState): { done: number; total: number } => {
  const pool = questionPool(s);
  const used = new Set(s.usedQuestionIds);
  return { done: pool.filter((q) => used.has(q.id)).length, total: pool.length };
};

export const getQuestion = (id: number): Question => {
  const q = QUESTION_BY_ID.get(id);
  if (!q) throw new Error(`Pergunta ${id} não encontrada`);
  return q;
};
