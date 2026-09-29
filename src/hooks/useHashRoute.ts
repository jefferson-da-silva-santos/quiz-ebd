import { useCallback, useEffect, useState } from 'react';
import type { Route } from '../lib/types';

/** Roteamento por hash — funciona em qualquer hospedagem estática, sem configuração de servidor. */
const ROUTES: readonly Route[] = ['palco', 'placar', 'ajustes'];
const parse = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : 'palco';
};

export function useHashRoute(): readonly [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onHash = (): void => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = useCallback((r: Route) => {
    if (parse() !== r) window.location.hash = `/${r}`;
  }, []);
  return [route, go] as const;
}
