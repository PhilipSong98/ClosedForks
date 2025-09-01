'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ExtensionResistantInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

const ExtensionResistantInput = React.forwardRef<HTMLInputElement, ExtensionResistantInputProps>(
  ({ className, type = 'text', value = '', onChange, onBlur, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const inputRef = ref || internalRef;
    const [internalValue, setInternalValue] = React.useState(value);
    const isControlled = value !== undefined && onChange !== undefined;

    // Keep internal value in sync with controlled value
    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(value);
      }
    }, [value, isControlled]);

    // Stable event handler using useCallback
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Stop propagation to prevent extension interference
      e.stopPropagation();
      
      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }
    }, [onChange, isControlled]);

    // Fallback input recovery mechanism
    const handleInput = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const newValue = target.value;
      
      // Fallback handling if onChange fails
      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }
    }, [onChange, isControlled]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
    }, [onBlur]);

    // Custom event listener for additional protection
    React.useEffect(() => {
      const input = typeof inputRef === 'object' && inputRef?.current;
      if (!input) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't interfere with normal typing
        if (e.key.length === 1 || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.stopPropagation();
        }
      };

      input.addEventListener('keydown', handleKeyDown, { capture: true });
      
      return () => {
        input.removeEventListener('keydown', handleKeyDown, { capture: true });
      };
    }, [inputRef]);

    const currentValue = isControlled ? value : internalValue;

    return (
      <input
        type={type}
        ref={inputRef}
        value={currentValue}
        onChange={handleChange}
        onInput={handleInput}
        onBlur={handleBlur}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        // Comprehensive anti-extension attributes
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        data-lpignore="true"
        data-1p-ignore
        data-bitwarden-watching="false"
        data-password-manager-ignore="true"
        data-credential-ignore="true"
        data-form-type="other"
        data-no-autofill="true"
        role="textbox"
        aria-autocomplete="none"
        {...props}
      />
    );
  }
);

ExtensionResistantInput.displayName = 'ExtensionResistantInput';

export { ExtensionResistantInput };