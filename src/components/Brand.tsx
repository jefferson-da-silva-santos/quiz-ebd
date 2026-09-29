/** Marca da classe: duas lâminas inclinadas (azul Palavra + vermelho EBD) — ecoa as diagonais do cartaz. */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 36 20 8h6L14 36Z" fill="var(--blue-500)" />
      <path d="M20 42 32 14h8L28 42Z" fill="var(--red-500)" />
      <path d="M37 6l1.6 3.4L42 11l-3.4 1.6L37 16l-1.6-3.4L32 11l3.4-1.6Z" fill="#fff" />
    </svg>
  );
}

export function Brand() {
  return (
    <a className="brand" href="#/palco" aria-label="Classe Débora e Baraque — ir para o palco">
      <BrandMark />
      <span className="brand__text">
        <span className="brand__kicker">EBD · Quiz</span>
        <span className="brand__name">Débora &amp; Baraque</span>
      </span>
    </a>
  );
}
