/** Modelo de domínio do quiz — fonte única de verdade para todos os tipos. */

export type OptionKey = 'a' | 'b' | 'c' | 'd';
export const OPTION_KEYS: readonly OptionKey[] = ['a', 'b', 'c', 'd'];

export interface QuestionOption {
  readonly key: OptionKey;
  readonly text: string;
}

export interface Question {
  readonly id: number;
  readonly lesson: number;
  readonly lessonTitle: string;
  readonly prompt: string;
  readonly options: readonly QuestionOption[];
  readonly answer: OptionKey;
  readonly explanation: string;
}

export interface Lesson {
  readonly number: number;
  readonly title: string;
  readonly total: number;
}

export interface Person {
  id: string;
  name: string;
  /** Caminho relativo a /public (ex.: "pessoas/davi.webp") ou null → iniciais. */
  photo: string | null;
  active: boolean;
}

export type DrawOrder = 'random' | 'sequential';

export interface Settings {
  personOrder: DrawOrder;
  questionOrder: DrawOrder;
  /** Lições habilitadas; lista vazia = todas. */
  lessons: number[];
  sound: boolean;
}

export interface Score {
  correct: number;
  wrong: number;
  bonus: number;
}

export interface HistoryEntry {
  id: string;
  personId: string;
  questionId: number;
  choice: OptionKey;
  correct: boolean;
  at: number;
}

/** Rodada em curso: sem `choice` = pergunta aberta; com `choice` = já respondida. */
export interface Round {
  personId: string;
  questionId: number;
  choice: OptionKey | null;
}

export interface QuizState {
  version: 1;
  settings: Settings;
  people: Person[];
  scores: Record<string, Score>;
  usedQuestionIds: number[];
  /** Saco de sorteio sem repetição (modo aleatório). */
  personBag: string[];
  /** Último aluno sorteado — âncora do modo em ordem. */
  lastPersonId: string | null;
  round: Round | null;
  history: HistoryEntry[];
  roundCount: number;
}

export type Route = 'palco' | 'placar' | 'ajustes';
