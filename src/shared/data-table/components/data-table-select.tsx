import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface DataTableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DataTableSelectProps {
  ariaLabel: string;
  className: string;
  contentClassName: string;
  onValueChange: (value: string) => void;
  options: DataTableSelectOption[];
  placeholder?: string;
  sideOffset?: number;
  value: string;
}

export function DataTableSelect({
  ariaLabel,
  className,
  contentClassName,
  onValueChange,
  options,
  placeholder,
  sideOffset = 6,
  value,
}: DataTableSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className={className} aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} className="cereda-table__select-value" />
        <Select.Icon className="cereda-table__select-icon" aria-hidden="true">
          <ChevronDown className="cereda-table__select-icon-mark" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={contentClassName}
          position="popper"
          sideOffset={sideOffset}
          align="start"
        >
          <Select.ScrollUpButton className="cereda-table__select-scroll-button">
            <ChevronUp aria-hidden="true" />
          </Select.ScrollUpButton>
          <Select.Viewport className="cereda-table__select-viewport">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="cereda-table__select-item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="cereda-table__select-item-indicator">
                  <Check aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="cereda-table__select-scroll-button">
            <ChevronDown aria-hidden="true" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

