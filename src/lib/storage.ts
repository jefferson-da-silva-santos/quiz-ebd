import { DEFAULT_PEOPLE } from '../data/people';
import { QUESTION_BY_ID } from '../data/questions';
import {
  OPTION_KEYS,
  type DrawOrder,
  type HistoryEntry,
  type OptionKey,
  type Person,
  type QuizState,
  type Round,
  type Score,
  type Settings,
} from './types';

/** Persistência em localStorage com validação estrutural — dados corrompidos nunca derrubam a app. */

export const STORAGE_KEY = 'ebd-debora-baraque:v1';

export const DEFAULT_SETTINGS: Settings = {
  personOrder: 'random',
  questionOrder: 'random',
  lessons: [],
  sound: true,
};

export const createInitialState = (): QuizState => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  people: DEFAULT_PEOPLE(),
  scores: {},
  usedQuestionIds: [],
  personBag: [],
  lastPersonId: null,
  round: null,
  history: [],
  roundCount: 0,
});

/* ── guards ─────────────────────────────────────────────── */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isOrder = (v: unknown): v is DrawOrder => v === 'random' || v === 'sequential';
const isKey = (v: unknown): v is OptionKey => isStr(v) && (OPTION_KEYS as readonly string[]).includes(v);

const readSettings = (v: unknown): Settings => {
  if (!isObj(v)) return { ...DEFAULT_SETTINGS };
  return {
    personOrder: isOrder(v.personOrder) ? v.personOrder : DEFAULT_SETTINGS.personOrder,
    questionOrder: isOrder(v.questionOrder) ? v.questionOrder : DEFAULT_SETTINGS.questionOrder,
    lessons: Array.isArray(v.lessons) ? v.lessons.filter(isNum) : [],
    sound: isBool(v.sound) ? v.sound : DEFAULT_SETTINGS.sound,
  };
};

const readPeople = (v: unknown): Person[] | null => {
  if (!Array.isArray(v)) return null;
  const out: Person[] = [];
  for (const p of v) {
    if (!isObj(p) || !isStr(p.id) || !isStr(p.name)) continue;
    out.push({
      id: p.id,
      name: p.name,
      photo: isStr(p.photo) ? p.photo : null,
      active: isBool(p.active) ? p.active : true,
    });
  }
  return out.length ? out : null;
};

const readScores = (v: unknown): Record<string, Score> => {
  if (!isObj(v)) return {};
  const out: Record<string, Score> = {};
  for (const [id, s] of Object.entries(v)) {
    if (!isObj(s)) continue;
    out[id] = {
      correct: isNum(s.correct) ? s.correct : 0,
      wrong: isNum(s.wrong) ? s.wrong : 0,
      bonus: isNum(s.bonus) ? s.bonus : 0,
    };
  }
  return out;
};

const readRound = (v: unknown): Round | null => {
  if (!isObj(v) || !isStr(v.personId) || !isNum(v.questionId) || !QUESTION_BY_ID.has(v.questionId)) return null;
  return { personId: v.personId, questionId: v.questionId, choice: isKey(v.choice) ? v.choice : null };
};

const readHistory = (v: unknown): HistoryEntry[] => {
  if (!Array.isArray(v)) return [];
  return v.flatMap((h): HistoryEntry[] =>
    isObj(h) && isStr(h.id) && isStr(h.personId) && isNum(h.questionId) && isKey(h.choice) && isBool(h.correct) && isNum(h.at)
      ? [{ id: h.id, personId: h.personId, questionId: h.questionId, choice: h.choice, correct: h.correct, at: h.at }]
      : [],
  );
};

/** Converte qualquer valor desconhecido (localStorage ou backup importado) em estado válido. */
export const parseState = (value: unknown): QuizState | null => {
  if (!isObj(value) || value.version !== 1) return null;
  const base = createInitialState();
  const people = readPeople(value.people) ?? base.people;
  const ids = new Set(people.map((p) => p.id));
  const round = readRound(value.round);
  return {
    version: 1,
    settings: readSettings(value.settings),
    people,
    scores: readScores(value.scores),
    usedQuestionIds: Array.isArray(value.usedQuestionIds)
      ? value.usedQuestionIds.filter((n): n is number => isNum(n) && QUESTION_BY_ID.has(n))
      : [],
    personBag: Array.isArray(value.personBag) ? value.personBag.filter((s): s is string => isStr(s) && ids.has(s)) : [],
    lastPersonId: isStr(value.lastPersonId) && ids.has(value.lastPersonId) ? value.lastPersonId : null,
    round: round && ids.has(round.personId) ? round : null,
    history: readHistory(value.history),
    roundCount: isNum(value.roundCount) ? value.roundCount : 0,
  };
};

export const loadState = (): QuizState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return parseState(JSON.parse(raw) as unknown) ?? createInitialState();
  } catch {
    return createInitialState();
  }
};

export const saveState = (state: QuizState): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* modo privado ou cota cheia: a sessão segue em memória */
  }
};
