import raw from './questions.json';
import { OPTION_KEYS, type Lesson, type OptionKey, type Question, type QuestionOption } from '../lib/types';

/* O JSON é gerado por scripts/parse-questions.py; aqui ele é estreitado para o tipo de domínio. */

const isOptionKey = (v: string): v is OptionKey => (OPTION_KEYS as readonly string[]).includes(v);

const toQuestion = (q: (typeof raw)[number]): Question => {
  if (!isOptionKey(q.answer)) throw new Error(`Gabarito inválido na pergunta ${q.id}`);
  const options: QuestionOption[] = q.options.map((o) => {
    if (!isOptionKey(o.key)) throw new Error(`Alternativa inválida na pergunta ${q.id}`);
    return { key: o.key, text: o.text };
  });
  return { ...q, options, answer: q.answer };
};

export const QUESTIONS: readonly Question[] = raw.map(toQuestion);

export const QUESTION_BY_ID: ReadonlyMap<number, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));

export const LESSONS: readonly Lesson[] = (() => {
  const map = new Map<number, Lesson>();
  for (const q of QUESTIONS) {
    const cur = map.get(q.lesson);
    map.set(q.lesson, { number: q.lesson, title: q.lessonTitle, total: (cur?.total ?? 0) + 1 });
  }
  return [...map.values()].sort((a, b) => a.number - b.number);
})();
