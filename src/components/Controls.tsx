import { useId, type CSSProperties } from 'react';

/** Controle segmentado (radiogroup) com indicador deslizante. */
interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; icon: string }>;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const name = useId();
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <fieldset className="segmented" style={{ '--seg-count': options.length, '--seg-index': index } as CSSProperties}>
      <legend className="sr-only">{label}</legend>
      <span className="segmented__thumb" aria-hidden="true" />
      {options.map((o) => (
        <label key={o.value} className={`segmented__opt ${o.value === value ? 'is-on' : ''}`}>
          <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} />
          <i className={`bx ${o.icon}`} aria-hidden="true" />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** Interruptor acessível (role="switch"). */
interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={onChange}>
      <span className="switch__knob" />
    </button>
  );
}
