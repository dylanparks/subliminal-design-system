import { useState, useId } from 'react';
import './RatingInput.css';
import { StarFilledIcon, StarIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RatingInputProps {
  /** Visible group label rendered above the stars. */
  label?: string;
  /**
   * Accessible name for the group when no visible `label` is provided.
   * Ignored when `label` is present.
   */
  'aria-label'?: string;
  /**
   * Controlled rating value (1–`max`). Pass `null` to show no selection.
   * Omit entirely for uncontrolled mode.
   */
  value?: number | null;
  /** Initial rating value for uncontrolled mode. */
  defaultValue?: number;
  /** Called when the user selects a star. */
  onChange?: (value: number) => void;
  /** Total number of stars. @default 5 */
  max?: number;
  disabled?: boolean;
  required?: boolean;
  /** `name` attribute shared by the radio inputs — auto-generated when omitted. */
  name?: string;
  id?: string;
  className?: string;
}

// ─── Star icons ───────────────────────────────────────────────────────────────

// ─── RatingInput ──────────────────────────────────────────────────────────────

/**
 * Star rating input — a radio group styled as interactive star icons.
 *
 * Each star maps to a native `<input type="radio">` so the browser handles
 * arrow-key navigation, form submission, and screen-reader announcements.
 * The group is announced as a `radiogroup`; each star as "N out of max stars".
 *
 * Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`)
 * modes.
 */
export function RatingInput({
  label,
  'aria-label': ariaLabel,
  value,
  defaultValue,
  onChange,
  max = 5,
  disabled = false,
  required = false,
  name: nameProp,
  id,
  className,
}: RatingInputProps) {
  const uid        = useId();
  const radioName  = nameProp ?? uid;
  const labelId    = `${uid}-label`;

  const isControlled   = value !== undefined;
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue ?? null);
  const resolvedValue  = isControlled ? value : internalValue;

  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue  = hoverValue ?? resolvedValue ?? 0;
  const isGroupHovering = hoverValue !== null;

  const handleChange = (star: number) => {
    if (disabled) return;
    if (!isControlled) setInternalValue(star);
    onChange?.(star);
  };

  const handleStarMouseDown = (e: React.MouseEvent<HTMLLabelElement>) => {
    // Suppress Chrome's :focus-visible on radio click (same pattern as Toggle).
    const el = e.currentTarget;
    el.dataset.mouseFocus = 'true';
    setTimeout(() => { delete el.dataset.mouseFocus; }, 0);
  };

  return (
    <div
      className={[
        'sds-rating-input',
        disabled && 'sds-rating-input--disabled',
        className,
      ].filter(Boolean).join(' ')}
      id={id}
    >
      {label && (
        <span id={labelId} className="sds-rating-input__label">
          {label}
        </span>
      )}

      <div
        className={[
          'sds-rating-input__stars',
          isGroupHovering && 'sds-rating-input__stars--hovering',
        ].filter(Boolean).join(' ')}
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? ariaLabel : undefined}
        aria-disabled={disabled || undefined}
        onMouseLeave={() => { if (!disabled) setHoverValue(null); }}
      >
        {Array.from({ length: max }, (_, i) => {
          const star    = i + 1;
          const isFilled = star <= displayValue;
          const inputId  = `${uid}-star-${star}`;

          return (
            <label
              key={star}
              htmlFor={inputId}
              className={[
                'sds-rating-input__star-label',
                isFilled && 'sds-rating-input__star-label--filled',
              ].filter(Boolean).join(' ')}
              onMouseEnter={() => { if (!disabled) setHoverValue(star); }}
              onMouseDown={handleStarMouseDown}
            >
              <input
                type="radio"
                id={inputId}
                name={radioName}
                value={star}
                className="sds-rating-input__radio"
                checked={resolvedValue === star}
                disabled={disabled}
                required={required}
                aria-label={`${star} out of ${max} stars`}
                onChange={() => handleChange(star)}
              />
              <span className="sds-rating-input__star-icon" aria-hidden="true">
                {isFilled ? <StarFilledIcon size={24} /> : <StarIcon size={24} />}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
