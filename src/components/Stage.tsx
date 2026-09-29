import { useCallback, useEffect, useMemo, useState } from 'react';
import type { QuizActions } from '../hooks/useQuizStore';
import type { ToastTone } from '../hooks/useToast';
import { activePeople, getQuestion, questionProgress, ranking, scoreOf } from '../lib/engine';
import { play } from '../lib/sound';
import type { QuizState } from '../lib/types';
import { Hero } from './Hero';
import { QuestionView } from './QuestionView';
import { ResultView } from './ResultView';
import { RevealOverlay } from './RevealOverlay';
import { Roulette } from './Roulette';

type Phase = 'idle' | 'drawing' | 'question' | 'revealing' | 'result';

interface StageProps {
  state: QuizState;
  actions: QuizActions;
  reducedMotion: boolean;
  notify: (text: string, tone?: ToastTone, icon?: string) => void;
}

/** Retoma exatamente de onde parou (o round fica salvo no localStorage). */
const phaseFromState = (s: QuizState): Phase => (!s.round ? 'idle' : s.round.choice ? 'result' : 'question');

/** Máquina de estados do palco: idle → drawing → question → revealing → result → drawing… */
export function Stage({ state, actions, reducedMotion, notify }: StageProps) {
  const [phase, setPhase] = useState<Phase>(() => phaseFromState(state));
  const [drawKey, setDrawKey] = useState(0);

  const present = useMemo(() => activePeople(state), [state]);
  const ranks = useMemo(() => ranking(state), [state]);
  const round = state.round;
  const person = round ? state.people.find((p) => p.id === round.personId) : undefined;
  const question = round ? getQuestion(round.questionId) : undefined;
  const rankOf = (id: string): number => ranks.find((r) => r.person.id === id)?.position ?? 0;

  // o round pode sumir por fora (aluno removido, reset): volta ao repouso
  useEffect(() => {
    if (!round && phase !== 'idle') setPhase('idle');
  }, [round, phase]);

  const draw = useCallback(() => {
    const res = actions.draw();
    if (!res.ok) {
      notify(
        res.reason === 'no-people' ? 'Nenhum aluno presente para sortear.' : 'Nenhuma pergunta nas lições selecionadas.',
        'danger',
        'bx-error-circle',
      );
      return;
    }
    if (res.cycled) notify('Todas as perguntas do filtro já saíram — recomeçando o ciclo.', 'info', 'bx-revision');
    play('tap');
    setDrawKey((k) => k + 1);
    setPhase('drawing');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [actions, notify, reducedMotion]);

  // atalho: Espaço/Enter sorteia no repouso
  useEffect(() => {
    if (phase !== 'idle') return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.code !== 'Space' || (e.target instanceof HTMLElement && e.target.closest('button,a,input,textarea,select'))) return;
      e.preventDefault();
      draw();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, draw]);

  if (phase === 'idle' || !round || !person || !question) {
    return (
      <Hero
        present={present}
        totalPeople={state.people.length}
        settings={state.settings}
        progress={questionProgress(state)}
        roundCount={state.roundCount}
        onDraw={draw}
      />
    );
  }

  if (phase === 'drawing') {
    return (
      <Roulette
        key={drawKey}
        people={present.length ? present : [person]}
        target={person}
        reducedMotion={reducedMotion}
        onDone={() => setPhase('question')}
      />
    );
  }

  const score = scoreOf(state, person.id);

  if (phase === 'result' && round.choice) {
    return (
      <ResultView
        person={person}
        score={score}
        rank={rankOf(person.id)}
        question={question}
        choice={round.choice}
        onNext={draw}
        onUndo={() => {
          actions.undoLast();
          setPhase('question');
          notify('Resposta desfeita. Marque a alternativa correta.', 'info', 'bx-undo');
        }}
        onFinish={() => {
          actions.clearRound();
          setPhase('idle');
        }}
      />
    );
  }

  return (
    <>
      <QuestionView
        person={person}
        score={score}
        rank={rankOf(person.id)}
        question={question}
        onAnswer={(key) => {
          actions.answer(key);
          setPhase('revealing');
        }}
        onSwapQuestion={() => {
          const cycled = actions.swapQuestion();
          notify(cycled ? 'Banco reiniciado — nova pergunta sorteada.' : 'Nova pergunta na tela.', 'info', 'bx-refresh');
        }}
        onRedraw={draw}
        onCancel={() => {
          actions.clearRound();
          setPhase('idle');
        }}
      />
      {phase === 'revealing' && round.choice && (
        <RevealOverlay correct={round.choice === question.answer} reducedMotion={reducedMotion} onDone={() => setPhase('result')} />
      )}
    </>
  );
}
