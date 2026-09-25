import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

const controlClasses = (error?: string) =>
  [
    'mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-navy',
    'placeholder:text-navy/40 outline-none transition-colors duration-150',
    'focus:border-navy focus:ring-2 focus:ring-navy/20',
    error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-navy/20',
  ].join(' ');

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy">
        {label}
        {hint && <span className="ml-2 font-normal text-navy/50">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const aria = (id: string, error?: string) => ({
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : undefined,
});

export function InputField({
  label,
  hint,
  error,
  inputProps,
}: {
  label: string;
  hint?: string;
  error?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement> & { id: string };
}) {
  return (
    <Wrapper id={inputProps.id} label={label} hint={hint} error={error}>
      <input {...inputProps} {...aria(inputProps.id, error)} className={controlClasses(error)} />
    </Wrapper>
  );
}

export function SelectField({
  label,
  hint,
  error,
  selectProps,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  selectProps: SelectHTMLAttributes<HTMLSelectElement> & { id: string };
  children: ReactNode;
}) {
  return (
    <Wrapper id={selectProps.id} label={label} hint={hint} error={error}>
      <select {...selectProps} {...aria(selectProps.id, error)} className={controlClasses(error)}>
        {children}
      </select>
    </Wrapper>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  textareaProps,
}: {
  label: string;
  hint?: string;
  error?: string;
  textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string };
}) {
  return (
    <Wrapper id={textareaProps.id} label={label} hint={hint} error={error}>
      <textarea
        {...textareaProps}
        {...aria(textareaProps.id, error)}
        className={`${controlClasses(error)} min-h-[140px] resize-y`}
      />
    </Wrapper>
  );
}

export function CheckboxField({
  id,
  label,
  error,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-navy/30 accent-navy"
          {...aria(id, error)}
        />
        <span className="text-sm text-navy/80">{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
