import * as Popover from '@radix-ui/react-popover';
import { Funnel, X } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

import {
  filterPrimitiveOptionsBySearch,
  type PrimitiveOption,
} from '../lib/filters/data-table-filter-options';
import { DataTableCheckboxField } from './data-table-checkbox';
import { useDataTableLocale } from './data-table-locale-context';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableFacetFilterPopoverProps {
  allSelected: boolean;
  canClear?: boolean;
  children: (openFilter: () => void) => ReactNode;
  label: string;
  onClear: () => void;
  onToggleAll: (checked: boolean) => void;
  onToggle: (option: PrimitiveOption, checked: boolean) => void;
  options: PrimitiveOption[];
  selectedKeys: string[];
}

export function DataTableFacetFilterPopover({
  allSelected,
  canClear,
  children,
  label,
  onClear,
  onToggleAll,
  onToggle,
  options,
  selectedKeys,
}: DataTableFacetFilterPopoverProps) {
  const locale = useDataTableLocale();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const popoverId = useId();
  const visibleOptions = filterPrimitiveOptionsBySearch(options, searchValue);
  const shouldShowClear = canClear ?? selectedKeys.length > 0;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchValue('');
    }
  }

  function openFilter() {
    setOpen(true);
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className="data-table__column-filter-facet">
        {children(openFilter)}
        <Popover.Trigger asChild>
          <button
            type="button"
            className={
              selectedKeys.length > 0
                ? 'data-table__column-filter-facet-button data-table__column-filter-facet-button--active'
                : 'data-table__column-filter-facet-button'
            }
            aria-label={locale.facetFilter.openAriaLabel(label)}
            title={locale.facetFilter.openAriaLabel(label)}
          >
            <Funnel
              className="data-table__column-filter-facet-icon"
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>
      </div>

      {open ? (
        <Popover.Portal>
          <Popover.Content
            id={popoverId}
            role="dialog"
            aria-label={locale.facetFilter.dialogAriaLabel(label)}
            className="data-table__column-filter-popover data-table__column-filter-popover--facet"
            sideOffset={6}
            align="start"
          >
          <input
            className="data-table__column-filter-popover-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
            placeholder={locale.facetFilter.searchPlaceholder}
            aria-label={locale.facetFilter.searchAriaLabel(label)}
          />

          <DataTableScrollArea
            className="data-table__scroll-area--column-filter-options"
            viewportClassName="data-table__column-filter-options"
            viewportRole="group"
          >
            <DataTableCheckboxField
              className="data-table__column-filter-option"
              checked={allSelected}
              onCheckedChange={onToggleAll}
              ariaLabel={locale.facetFilter.selectAllAriaLabel(label)}
              label={locale.facetFilter.selectAllLabel}
              labelClassName="data-table__column-filter-option-label"
            />
            {visibleOptions.length === 0 ? (
              <div className="data-table__column-filter-option-empty">
                {locale.facetFilter.noValues}
              </div>
            ) : (
              visibleOptions.map((option) => {
                const checked = selectedKeys.includes(option.key);

                return (
                  <DataTableCheckboxField
                    key={option.key}
                    className="data-table__column-filter-option"
                    checked={allSelected || checked}
                    onCheckedChange={(nextChecked) => onToggle(option, nextChecked)}
                    ariaLabel={option.label}
                    label={option.label}
                    labelClassName="data-table__column-filter-option-label"
                  />
                );
              })
            )}
          </DataTableScrollArea>

          {shouldShowClear ? (
            <button
              type="button"
              className="data-table__column-filter-clear"
              onClick={onClear}
              aria-label={locale.facetFilter.clearAriaLabel(label)}
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
          </Popover.Content>
        </Popover.Portal>
      ) : null}
    </Popover.Root>
  );
}
