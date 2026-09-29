import { useCallback, useEffect, useMemo, useState } from 'react';
import AOS from 'aos';
import { ConfirmDialog, type ConfirmRequest } from './components/ConfirmDialog';
import { NavBar } from './components/NavBar';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Stage } from './components/Stage';
import { Toasts } from './components/Toasts';
import { useHashRoute } from './hooks/useHashRoute';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { useQuizStore } from './hooks/useQuizStore';
import { useToast } from './hooks/useToast';
import { activePeople } from './lib/engine';
import { setSoundEnabled } from './lib/sound';

/** Cenário: diagonais do cartaz, brilho azul e grão — puramente decorativo. */
function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <span className="backdrop__glow" />
      <span className="backdrop__band backdrop__band--a" />
      <span className="backdrop__band backdrop__band--b" />
      <span className="backdrop__band backdrop__band--c" />
      <span className="backdrop__grain" />
    </div>
  );
}

/** Faixa de rodapé inspirada no cartaz: três colunas separadas por fios. */
function Footer() {
  return (
    <footer className="footer">
      <p>
        sou <b>#TEAMEBD</b>
      </p>
      <p>
        terça é <br />
        dia de <b>EBD</b>
      </p>
      <p className="footer__class">
        Classe Débora
        <br />e Baraque <i className="bx bxs-star" aria-hidden="true" />
      </p>
    </footer>
  );
}

export default function App() {
  const { state, actions } = useQuizStore();
  const [route] = useHashRoute();
  const reducedMotion = usePrefersReducedMotion();
  const { toasts, push, dismiss } = useToast();
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const present = useMemo(() => activePeople(state).length, [state]);

  useEffect(() => setSoundEnabled(state.settings.sound), [state.settings.sound]);

  useEffect(() => {
    AOS.init({ duration: 750, easing: 'ease-out-cubic', once: true, offset: 40, disable: () => reducedMotion });
  }, [reducedMotion]);

  // nova rota → reposiciona e recalcula os gatilhos do AOS
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const id = window.requestAnimationFrame(() => AOS.refreshHard());
    return () => window.cancelAnimationFrame(id);
  }, [route]);

  const closeConfirm = useCallback(() => setConfirmReq(null), []);

  return (
    <>
      <Backdrop />
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <NavBar route={route} presentCount={present} totalCount={state.people.length} />
      <main id="main" className="main">
        {route === 'palco' && <Stage state={state} actions={actions} reducedMotion={reducedMotion} notify={push} />}
        {route === 'placar' && <Scoreboard state={state} actions={actions} />}
        {route === 'ajustes' && <SettingsPanel state={state} actions={actions} confirm={setConfirmReq} notify={push} />}
      </main>
      <Footer />
      <Toasts items={toasts} onDismiss={dismiss} />
      <ConfirmDialog request={confirmReq} onClose={closeConfirm} />
    </>
  );
}
