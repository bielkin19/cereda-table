import * as Checkbox from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { type ReactNode, useId } from 'react';

interface DataTableCheckboxFieldProps {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  checked: boolean | 'indeterminate';
  children?: ReactNode;
  className?: string;
  label: ReactNode;
  labelClassName?: string;
  onCheckedChange: (checked: boolean) => void;
}

export function DataTableCheckboxField({
  ariaDescribedBy,
  ariaLabel,
  checked,
  children,
  className,
  label,
  labelClassName,
  onCheckedChange,
}: DataTableCheckboxFieldProps) {
  const generatedId = useId();
  const checkboxId = `data-table-checkbox-${generatedId}`;

  return (
    <div className={className ?? 'data-table__checkbox-field'}>
      <Checkbox.Root
        id={checkboxId}
        checked={checked}
        className="data-table__checkbox"
        onCheckedChange={(nextChecked) => {
          onCheckedChange(nextChecked === true);
        }}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
      >
        <Checkbox.Indicator className="data-table__checkbox-indicator">
          {checked === 'indeterminate' ? (
            <Minus aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label
        className={labelClassName ?? 'data-table__checkbox-label'}
        htmlFor={checkboxId}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
