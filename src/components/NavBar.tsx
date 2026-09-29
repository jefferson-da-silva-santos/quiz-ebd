import type { Route } from '../lib/types';
import { Brand } from './Brand';

const TABS: ReadonlyArray<{ route: Route; label: string; icon: string }> = [
  { route: 'palco', label: 'Palco', icon: 'bx-joystick' },
  { route: 'placar', label: 'Placar', icon: 'bx-trophy' },
  { route: 'ajustes', label: 'Ajustes', icon: 'bx-slider-alt' },
];

interface NavBarProps {
  route: Route;
  presentCount: number;
  totalCount: number;
}

/** Topo em vidro no desktop; as abas viram um dock flutuante no mobile. */
export function NavBar({ route, presentCount, totalCount }: NavBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner topbar__glass">
        <Brand />
        <nav className="tabs" aria-label="Seções">
          {TABS.map((t) => (
            <a
              key={t.route}
              href={`#/${t.route}`}
              className={`tabs__item ${route === t.route ? 'is-active' : ''}`}
              aria-current={route === t.route ? 'page' : undefined}
            >
              <i className={`bx ${t.icon}`} aria-hidden="true" />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <a className="presence-pill" href="#/ajustes" title="Gerenciar presença">
          <span className="presence-pill__dot" aria-hidden="true" />
          <strong>{presentCount}</strong>
          <span>/{totalCount} presentes</span>
        </a>
      </div>
    </header>
  );
}
