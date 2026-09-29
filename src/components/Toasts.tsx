import type { ToastItem } from '../hooks/useToast';

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <button key={t.id} type="button" className={`toast toast--${t.tone}`} onClick={() => onDismiss(t.id)}>
          <i className={`bx ${t.icon}`} aria-hidden="true" />
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}
