import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

/** PIN dots display. */
export function PinDots({ length, filled, error }: { length: number; filled: number; error?: boolean }) {
  return (
    <div className={cn('flex items-center justify-center gap-3.5', error && 'animate-shake')}>
      {Array.from({ length }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-3.5 w-3.5 rounded-full border-2 transition-all',
            i < filled
              ? error
                ? 'border-danger bg-danger'
                : 'border-brand bg-brand'
              : 'border-faint/60 bg-transparent',
          )}
        />
      ))}
    </div>
  );
}

/** Reusable numeric keypad. */
export function PinKeypad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k) => (
        <KeypadButton key={k} onClick={() => onDigit(k)} disabled={disabled}>
          {k}
        </KeypadButton>
      ))}
      <span />
      <KeypadButton onClick={() => onDigit('0')} disabled={disabled}>
        0
      </KeypadButton>
      <KeypadButton onClick={onBackspace} disabled={disabled} aria-label="Backspace">
        <Delete size={20} />
      </KeypadButton>
    </div>
  );
}

function KeypadButton({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-14 w-full items-center justify-center rounded-[8px] border border-line bg-card text-xl font-medium text-ink tnum',
        'hover:border-brand-light hover:bg-card-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
