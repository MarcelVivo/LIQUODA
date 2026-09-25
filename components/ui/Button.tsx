import { forwardRef, ButtonHTMLAttributes, ComponentProps } from 'react';
import { Link } from '@/i18n/routing';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

// Pill-Buttons wie in der Präsentation: Akzentverlauf für die Hauptaktion,
// feiner Rand für Nebenaktionen, «inverse» für dunkle Flächen.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-cta hover:shadow-cta-hover hover:brightness-105 border border-transparent',
  outline:
    'bg-transparent text-navy border border-navy/70 hover:bg-navy hover:text-white',
  ghost:
    'bg-transparent text-navy hover:bg-navy/5 border border-transparent',
  inverse:
    'bg-transparent text-onink border border-onink-muted/50 hover:bg-white/10 hover:border-onink',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-5 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-base',
};

/** Gemeinsame Klassen für Button und ButtonLink, damit beide gleich aussehen. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
    'transition-all duration-200 focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={buttonClasses({ variant, size, fullWidth, className })}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

type LinkProps = ComponentProps<typeof Link>;

/** Locale-sicherer Link im Erscheinungsbild eines Buttons. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {children}
    </Link>
  );
}
