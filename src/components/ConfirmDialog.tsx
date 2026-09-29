import { useEffect, useRef } from 'react';

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

/** Diálogo nativo <dialog>: foco preso, Esc para fechar e backdrop acessíveis de graça. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (request && !d.open) d.showModal();
    if (!request && d.open) d.close();
  }, [request]);

  return (
    <dialog
      ref={ref}
      className="dialog glass"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="dialog-title"
    >
      {request && (
        <div className="dialog__body">
          <span className={`dialog__icon ${request.danger ? 'is-danger' : ''}`} aria-hidden="true">
            <i className={`bx ${request.danger ? 'bx-error' : 'bx-help-circle'}`} />
          </span>
          <h2 id="dialog-title">{request.title}</h2>
          <p>{request.body}</p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} autoFocus>
              Cancelar
            </button>
            <button
              type="button"
              className={`btn ${request.danger ? 'btn--danger' : 'btn--primary'}`}
              onClick={() => {
                request.onConfirm();
                onClose();
              }}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
