import { useCallback, useRef, useState } from 'react';

export type ToastTone = 'info' | 'success' | 'danger';
export interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
  icon: string;
}

/** Fila de avisos efêmeros (aria-live) com auto-dispensa. */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (text: string, tone: ToastTone = 'info', icon = 'bx-info-circle') => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, text, tone, icon }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );
  return { toasts, push, dismiss } as const;
}
