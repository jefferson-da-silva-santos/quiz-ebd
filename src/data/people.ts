import type { Person } from '../lib/types';

/** Turma padrão. Fotos em /public/pessoas (WebP 360×360); sem foto → avatar com iniciais. */
const seed: ReadonlyArray<readonly [id: string, name: string, photo: string | null]> = [
  ['isabela', 'Isabela', 'isabela'],
  ['davi', 'Davi', 'davi'],
  ['julia', 'Júlia', 'julia'],
  ['kleber', 'Kleber', 'kleber'],
  ['maria-clara', 'Maria Clara', 'clara'],
  ['mirela', 'Mirela', 'mirela'],
  ['pingo', 'Pingo', 'pingo'],
  ['rayson', 'Rayson', null],
  ['richardson', 'Richardson', null],
  ['yasmin', 'Yasmin', 'yasmin'],
  ['julia-2', 'Júlia (2)', null],
  ['alessandro', 'Alessandro', null],
  ['joao-pedro', 'João Pedro', 'joao_pedro'],
  ['eva', 'Eva', 'eva'],
  ['kayque', 'Kayque', null],
  ['ana-julia', 'Ana Júlia', 'ana_julia'],
  ['eitor', 'Eitor', 'eitor'],
];

export const DEFAULT_PEOPLE = (): Person[] =>
  seed.map(([id, name, photo]) => ({ id, name, photo: photo ? `pessoas/${photo}.webp` : null, active: true }));
