import React, { useState, useEffect } from 'react';
import './Stepper.css';

export type StepperOrientation = 'horizontal' | 'vertical';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: StepperOrientation;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  orientation = 'horizontal',
  showValue = true,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: StepperProps) {
  const [inputBuffer, setInputBuffer] = useState(String(value));

  // Keep buffer in sync when value is updated externally
  useEffect(() => {
    setInputBuffer(String(value));
  }, [value]);

  function update(next: number) {
    const clamped = Math.min(Math.max(Math.round(next), min), max);
    onChange(clamped);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pattern = min < 0 ? /[^0-9-]|(?!^)-/g : /[^0-9]/g;
    const filtered = e.target.value.replace(pattern, '');
    setInputBuffer(filtered);
  }

  function handleInputCommit() {
    const parsed = parseInt(inputBuffer, 10);
    if (!isNaN(parsed)) {
      update(parsed);
    } else {
      setInputBuffer(String(value));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'ArrowUp') { e.preventDefault(); update(value + step); }
    if (e.key === 'ArrowDown') { e.preventDefault(); update(value - step); }
  }

  const atMin = value <= min;
  const atMax = value >= max;

  const decrementBtn = (
    <button
      type="button"
      className="sds-stepper__button"
      onClick={() => update(value - step)}
      disabled={disabled || atMin}
      aria-disabled={disabled || atMin}
      aria-label="Decrease"
    >
      <svg
        className="sds-stepper__icon"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );

  const incrementBtn = (
    <button
      type="button"
      className="sds-stepper__button"
      onClick={() => update(value + step)}
      disabled={disabled || atMax}
      aria-disabled={disabled || atMax}
      aria-label="Increase"
    >
      <svg
        className="sds-stepper__icon"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );

  const classes = [
    'sds-stepper',
    `sds-stepper--${orientation}`,
    showValue && 'sds-stepper--show-value',
    disabled && 'sds-stepper--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="group" aria-label={ariaLabel} className={classes}>
      {orientation === 'vertical' ? incrementBtn : decrementBtn}

      {showValue && (
        <span className="sds-stepper__value" data-value={inputBuffer}>
          <input
            className="sds-stepper__value-input"
            type="text"
            inputMode="numeric"
            size={Math.max(1, inputBuffer.length)}
            value={inputBuffer}
            onChange={handleInputChange}
            onBlur={handleInputCommit}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Value"
          />
        </span>
      )}

      {orientation === 'vertical' ? decrementBtn : incrementBtn}
    </div>
  );
}
