import { useRef, useState, type FormEvent } from 'react';
import type { QuizActions } from '../hooks/useQuizStore';
import type { ToastTone } from '../hooks/useToast';
import { LESSONS } from '../data/questions';
import { parseState } from '../lib/storage';
import type { DrawOrder, Person, QuizState } from '../lib/types';
import { Avatar } from './Avatar';
import type { ConfirmRequest } from './ConfirmDialog';
import { Segmented, Switch } from './Controls';

interface SettingsProps {
  state: QuizState;
  actions: QuizActions;
  confirm: (req: ConfirmRequest) => void;
  notify: (text: string, tone?: ToastTone, icon?: string) => void;
}

const ORDER_OPTIONS: ReadonlyArray<{ value: DrawOrder; label: string; icon: string }> = [
  { value: 'random', label: 'Aleatório', icon: 'bx-shuffle' },
  { value: 'sequential', label: 'Em ordem', icon: 'bx-list-ol' },
];

/** Linha de presença: interruptor, renomear inline e remover. */
function PersonRow({ person, actions, confirm }: { person: Person; actions: QuizActions; confirm: SettingsProps['confirm'] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person.name);

  const commit = (): void => {
    if (draft.trim() && draft.trim() !== person.name) actions.renamePerson(person.id, draft);
    else setDraft(person.name);
    setEditing(false);
  };

  return (
    <li className={`roster__row ${person.active ? '' : 'is-off'}`}>
      <Avatar person={person} size="sm" />
      {editing ? (
        <input
          className="roster__input"
          value={draft}
          autoFocus
          maxLength={40}
          aria-label={`Novo nome para ${person.name}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(person.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className="roster__name">
          {person.name}
          <small>{person.active ? 'presente' : 'ausente hoje'}</small>
        </span>
      )}
      <span className="roster__tools">
        <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label={`Renomear ${person.name}`}>
          <i className="bx bx-pencil" />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          aria-label={`Remover ${person.name}`}
          onClick={() =>
            confirm({
              title: `Remover ${person.name}?`,
              body: 'O aluno sai da turma e a pontuação dele é apagada. Isso não pode ser desfeito.',
              confirmLabel: 'Remover',
              danger: true,
              onConfirm: () => actions.removePerson(person.id),
            })
          }
        >
          <i className="bx bx-trash" />
        </button>
      </span>
      <Switch checked={person.active} onChange={() => actions.togglePerson(person.id)} label={`${person.name} presente`} />
    </li>
  );
}

export function SettingsPanel({ state, actions, confirm, notify }: SettingsProps) {
  const [newName, setNewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { settings, people } = state;
  const present = people.filter((p) => p.active).length;

  const toggleLesson = (n: number): void => {
    const cur = settings.lessons;
    const next = cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b);
    actions.setSettings({ lessons: next.length === LESSONS.length ? [] : next });
  };

  const addPerson = (e: FormEvent): void => {
    e.preventDefault();
    if (!newName.trim()) return;
    actions.addPerson(newName);
    notify(`${newName.trim()} entrou na turma.`, 'success', 'bx-user-plus');
    setNewName('');
  };

  const exportData = (): void => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebd-debora-baraque-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Backup baixado.', 'success', 'bx-download');
  };

  const importData = async (file: File): Promise<void> => {
    try {
      const parsed = parseState(JSON.parse(await file.text()) as unknown);
      if (!parsed) throw new Error('formato');
      confirm({
        title: 'Restaurar backup?',
        body: 'Os dados atuais (placar, presença e progresso) serão substituídos pelos do arquivo.',
        confirmLabel: 'Restaurar',
        onConfirm: () => {
          actions.importState(parsed);
          notify('Backup restaurado.', 'success', 'bx-upload');
        },
      });
    } catch {
      notify('Arquivo inválido — use um backup exportado por este site.', 'danger', 'bx-error-circle');
    }
  };

  return (
    <section className="page" aria-labelledby="settings-title">
      <header className="page__head" data-aos="fade-up">
        <span className="page__eyebrow">Painel do professor</span>
        <h1 id="settings-title" className="page__title">
          Ajustes <em>da aula</em>
        </h1>
      </header>

      <div className="settings-grid">
        <div className="panel glass panel--modes" data-aos="fade-up">
          <h2 className="panel__title">
            <i className="bx bx-git-branch" aria-hidden="true" /> Modo de sorteio
          </h2>
          <div className="field">
            <div className="field__label">
              <strong>Alunos</strong>
              <span>
                {settings.personOrder === 'random'
                  ? 'Embaralhado, sem repetir até todos os presentes responderem.'
                  : 'Segue a ordem da lista de presença, pulando ausentes.'}
              </span>
            </div>
            <Segmented label="Ordem dos alunos" value={settings.personOrder} options={ORDER_OPTIONS} onChange={(v) => actions.setSettings({ personOrder: v })} />
          </div>
          <div className="field">
            <div className="field__label">
              <strong>Perguntas</strong>
              <span>
                {settings.questionOrder === 'random' ? 'Qualquer pergunta ainda não feita.' : 'Da 1 à 200, na ordem das lições.'}
              </span>
            </div>
            <Segmented label="Ordem das perguntas" value={settings.questionOrder} options={ORDER_OPTIONS} onChange={(v) => actions.setSettings({ questionOrder: v })} />
          </div>
          <div className="field field--inline">
            <div className="field__label">
              <strong>Efeitos sonoros</strong>
              <span>Roleta, suspense e comemoração.</span>
            </div>
            <Switch checked={settings.sound} onChange={() => actions.setSettings({ sound: !settings.sound })} label="Efeitos sonoros" />
          </div>
        </div>

        <div className="panel glass panel--roster" data-aos="fade-up" data-aos-delay="100">
          <div className="panel__row">
            <h2 className="panel__title">
              <i className="bx bx-group" aria-hidden="true" /> Presença <span className="count">{present}/{people.length}</span>
            </h2>
            <div className="panel__actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.setAllActive(true)}>
                Todos
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.setAllActive(false)}>
                Ninguém
              </button>
            </div>
          </div>
          <ul className="roster">
            {people.map((p) => (
              <PersonRow key={p.id} person={p} actions={actions} confirm={confirm} />
            ))}
          </ul>
          <form className="add-person" onSubmit={addPerson}>
            <label className="sr-only" htmlFor="new-person">
              Nome do novo aluno
            </label>
            <input id="new-person" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Adicionar aluno visitante…" maxLength={40} />
            <button type="submit" className="btn btn--primary btn--sm" disabled={!newName.trim()}>
              <i className="bx bx-user-plus" aria-hidden="true" /> Adicionar
            </button>
          </form>
        </div>

        <div className="panel glass panel--lessons" data-aos="fade-up" data-aos-delay="150">
          <div className="panel__row">
            <h2 className="panel__title">
              <i className="bx bx-book-open" aria-hidden="true" /> Lições no sorteio
            </h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.setSettings({ lessons: [] })} disabled={!settings.lessons.length}>
              Todas
            </button>
          </div>
          <p className="panel__hint">
            {settings.lessons.length ? `${settings.lessons.length} lição(ões) selecionada(s).` : 'Todas as 13 lições estão valendo.'} Toque para filtrar.
          </p>
          <ul className="lessons">
            {LESSONS.map((l) => {
              const on = !settings.lessons.length || settings.lessons.includes(l.number);
              return (
                <li key={l.number}>
                  <button type="button" className={`lesson ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggleLesson(l.number)}>
                    <b>{String(l.number).padStart(2, '0')}</b>
                    <span>{l.title}</span>
                    <small>{l.total} perguntas</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel glass panel--data" data-aos="fade-up" data-aos-delay="200">
          <h2 className="panel__title">
            <i className="bx bx-data" aria-hidden="true" /> Dados
          </h2>
          <p className="panel__hint">Tudo fica salvo neste navegador. Faça backup para levar a outro aparelho.</p>
          <div className="data-actions">
            <button type="button" className="btn btn--ghost" onClick={exportData}>
              <i className="bx bx-download" aria-hidden="true" /> Exportar backup
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
              <i className="bx bx-upload" aria-hidden="true" /> Importar backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importData(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                confirm({
                  title: 'Liberar todas as perguntas?',
                  body: 'As perguntas já feitas voltam a poder ser sorteadas. O placar continua.',
                  confirmLabel: 'Liberar',
                  onConfirm: () => {
                    actions.resetQuestions();
                    notify('Banco de perguntas reiniciado.', 'success', 'bx-revision');
                  },
                })
              }
            >
              <i className="bx bx-revision" aria-hidden="true" /> Reiniciar perguntas
            </button>
            <button
              type="button"
              className="btn btn--danger-ghost"
              onClick={() =>
                confirm({
                  title: 'Zerar o placar?',
                  body: 'Pontos, acertos, erros e histórico de todos os alunos serão apagados.',
                  confirmLabel: 'Zerar placar',
                  danger: true,
                  onConfirm: () => {
                    actions.resetScores();
                    notify('Placar zerado.', 'success', 'bx-trash');
                  },
                })
              }
            >
              <i className="bx bx-reset" aria-hidden="true" /> Zerar placar
            </button>
            <button
              type="button"
              className="btn btn--danger-ghost"
              onClick={() =>
                confirm({
                  title: 'Restaurar tudo ao padrão?',
                  body: 'Turma, presença, placar, ajustes e progresso voltam ao estado inicial.',
                  confirmLabel: 'Restaurar padrão',
                  danger: true,
                  onConfirm: () => {
                    actions.resetAll();
                    notify('Tudo restaurado ao padrão.', 'success', 'bx-refresh');
                  },
                })
              }
            >
              <i className="bx bx-error-alt" aria-hidden="true" /> Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
