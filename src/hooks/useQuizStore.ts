import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { questionPool, pickPerson, pickQuestion, EMPTY_SCORE, getQuestion } from '../lib/engine';
import { createInitialState, loadState, saveState } from '../lib/storage';
import { uid } from '../lib/random';
import type { OptionKey, Person, QuizState, Settings } from '../lib/types';

/* ── ações ───────────────────────────────────────────────── */

type Action =
  | { type: 'START_ROUND'; personId: string; questionId: number; personBag: string[]; cycled: boolean }
  | { type: 'SWAP_QUESTION'; questionId: number; cycled: boolean }
  | { type: 'ANSWER'; choice: OptionKey; entryId: string; at: number }
  | { type: 'UNDO_LAST' }
  | { type: 'CLEAR_ROUND' }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'TOGGLE_PERSON'; id: string }
  | { type: 'SET_ALL_ACTIVE'; active: boolean }
  | { type: 'RENAME_PERSON'; id: string; name: string }
  | { type: 'ADD_PERSON'; person: Person }
  | { type: 'REMOVE_PERSON'; id: string }
  | { type: 'ADJUST_BONUS'; id: string; delta: number }
  | { type: 'RESET_SCORES' }
  | { type: 'RESET_QUESTIONS' }
  | { type: 'RESET_ALL' }
  | { type: 'IMPORT'; state: QuizState };

const HISTORY_CAP = 400;

/** Ao reciclar o banco, limpa só as perguntas do filtro atual. */
const recycle = (s: QuizState): number[] => {
  const pool = new Set(questionPool(s).map((q) => q.id));
  return s.usedQuestionIds.filter((id) => !pool.has(id));
};

function reducer(s: QuizState, a: Action): QuizState {
  switch (a.type) {
    case 'START_ROUND':
      return {
        ...s,
        round: { personId: a.personId, questionId: a.questionId, choice: null },
        personBag: a.personBag,
        lastPersonId: a.personId,
        usedQuestionIds: a.cycled ? recycle(s) : s.usedQuestionIds,
        roundCount: s.roundCount + 1,
      };

    case 'SWAP_QUESTION':
      if (!s.round || s.round.choice) return s;
      return { ...s, round: { ...s.round, questionId: a.questionId }, usedQuestionIds: a.cycled ? recycle(s) : s.usedQuestionIds };

    case 'ANSWER': {
      if (!s.round || s.round.choice) return s;
      const { personId, questionId } = s.round;
      const correct = getQuestion(questionId).answer === a.choice;
      const prev = s.scores[personId] ?? EMPTY_SCORE;
      return {
        ...s,
        round: { ...s.round, choice: a.choice },
        scores: {
          ...s.scores,
          [personId]: { ...prev, correct: prev.correct + (correct ? 1 : 0), wrong: prev.wrong + (correct ? 0 : 1) },
        },
        usedQuestionIds: s.usedQuestionIds.includes(questionId) ? s.usedQuestionIds : [...s.usedQuestionIds, questionId],
        history: [{ id: a.entryId, personId, questionId, choice: a.choice, correct, at: a.at }, ...s.history].slice(0, HISTORY_CAP),
      };
    }

    case 'UNDO_LAST': {
      const [last, ...rest] = s.history;
      if (!s.round?.choice || !last || last.personId !== s.round.personId || last.questionId !== s.round.questionId) return s;
      const prev = s.scores[last.personId] ?? EMPTY_SCORE;
      return {
        ...s,
        round: { ...s.round, choice: null },
        history: rest,
        usedQuestionIds: s.usedQuestionIds.filter((id) => id !== last.questionId),
        scores: {
          ...s.scores,
          [last.personId]: {
            ...prev,
            correct: Math.max(0, prev.correct - (last.correct ? 1 : 0)),
            wrong: Math.max(0, prev.wrong - (last.correct ? 0 : 1)),
          },
        },
      };
    }

    case 'CLEAR_ROUND':
      return { ...s, round: null };

    case 'SET_SETTINGS':
      return { ...s, settings: { ...s.settings, ...a.patch } };

    case 'TOGGLE_PERSON':
      return { ...s, people: s.people.map((p) => (p.id === a.id ? { ...p, active: !p.active } : p)) };

    case 'SET_ALL_ACTIVE':
      return { ...s, people: s.people.map((p) => ({ ...p, active: a.active })) };

    case 'RENAME_PERSON': {
      const name = a.name.trim().slice(0, 40);
      if (!name) return s;
      return { ...s, people: s.people.map((p) => (p.id === a.id ? { ...p, name } : p)) };
    }

    case 'ADD_PERSON':
      return { ...s, people: [...s.people, a.person] };

    case 'REMOVE_PERSON': {
      const { [a.id]: _removed, ...scores } = s.scores;
      void _removed;
      return {
        ...s,
        people: s.people.filter((p) => p.id !== a.id),
        scores,
        personBag: s.personBag.filter((id) => id !== a.id),
        lastPersonId: s.lastPersonId === a.id ? null : s.lastPersonId,
        round: s.round?.personId === a.id ? null : s.round,
      };
    }

    case 'ADJUST_BONUS': {
      const prev = s.scores[a.id] ?? EMPTY_SCORE;
      return { ...s, scores: { ...s.scores, [a.id]: { ...prev, bonus: prev.bonus + a.delta } } };
    }

    case 'RESET_SCORES':
      return { ...s, scores: {}, history: [], roundCount: 0 };

    case 'RESET_QUESTIONS':
      return { ...s, usedQuestionIds: [] };

    case 'RESET_ALL':
      return createInitialState();

    case 'IMPORT':
      return a.state;
  }
}

/* ── hook público ────────────────────────────────────────── */

export type DrawResult =
  | { ok: true; personId: string; questionId: number; cycled: boolean }
  | { ok: false; reason: 'no-people' | 'no-questions' };

export function useQuizStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // ref sempre atual: os sorteios leem o estado mais recente sem recriar callbacks
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => saveState(state), [state]);

  const draw = useCallback((): DrawResult => {
    const s = ref.current;
    const person = pickPerson(s);
    if (!person) return { ok: false, reason: 'no-people' };
    const question = pickQuestion(s);
    if (!question) return { ok: false, reason: 'no-questions' };
    dispatch({ type: 'START_ROUND', ...person, ...question });
    return { ok: true, personId: person.personId, ...question };
  }, []);

  const swapQuestion = useCallback((): boolean => {
    const s = ref.current;
    const q = pickQuestion(s, s.round?.questionId);
    if (!q) return false;
    dispatch({ type: 'SWAP_QUESTION', ...q });
    return q.cycled;
  }, []);

  const actions = useMemo(
    () => ({
      draw,
      swapQuestion,
      answer: (choice: OptionKey) => dispatch({ type: 'ANSWER', choice, entryId: uid(), at: Date.now() }),
      undoLast: () => dispatch({ type: 'UNDO_LAST' }),
      clearRound: () => dispatch({ type: 'CLEAR_ROUND' }),
      setSettings: (patch: Partial<Settings>) => dispatch({ type: 'SET_SETTINGS', patch }),
      togglePerson: (id: string) => dispatch({ type: 'TOGGLE_PERSON', id }),
      setAllActive: (active: boolean) => dispatch({ type: 'SET_ALL_ACTIVE', active }),
      renamePerson: (id: string, name: string) => dispatch({ type: 'RENAME_PERSON', id, name }),
      addPerson: (name: string) =>
        dispatch({ type: 'ADD_PERSON', person: { id: `p-${uid()}`, name: name.trim().slice(0, 40), photo: null, active: true } }),
      removePerson: (id: string) => dispatch({ type: 'REMOVE_PERSON', id }),
      adjustBonus: (id: string, delta: number) => dispatch({ type: 'ADJUST_BONUS', id, delta }),
      resetScores: () => dispatch({ type: 'RESET_SCORES' }),
      resetQuestions: () => dispatch({ type: 'RESET_QUESTIONS' }),
      resetAll: () => dispatch({ type: 'RESET_ALL' }),
      importState: (next: QuizState) => dispatch({ type: 'IMPORT', state: next }),
    }),
    [draw, swapQuestion],
  );

  return { state, actions } as const;
}

export type QuizActions = ReturnType<typeof useQuizStore>['actions'];
