import { memo, useState } from 'react';
import type { Person } from '../lib/types';

/** Foto WebP com fallback elegante de iniciais (gradiente determinístico por aluno). */

const initials = (name: string): string =>
  name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const hue = (id: string): number => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

interface AvatarProps {
  person: Pick<Person, 'id' | 'name' | 'photo'>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fill';
  className?: string;
  eager?: boolean;
}

export const Avatar = memo(function Avatar({ person, size = 'md', className = '', eager = false }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showPhoto = person.photo !== null && !broken;
  const h = hue(person.id);
  return (
    <span
      className={`avatar avatar--${size} ${className}`}
      style={showPhoto ? undefined : { background: `linear-gradient(145deg, hsl(${h} 70% 42%), hsl(${(h + 48) % 360} 80% 24%))` }}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={person.photo ?? ''}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="avatar__initials">{initials(person.name)}</span>
      )}
    </span>
  );
});
