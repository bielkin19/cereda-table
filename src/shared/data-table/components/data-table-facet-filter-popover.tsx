import * as Popover from '@radix-ui/react-popover';
import { Funnel, X } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

import {
  filterPrimitiveOptionsBySearch,
  type PrimitiveOption,
} from '../lib/filters/data-table-filter-options';
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
            aria-label={`Open ${label} filter values`}
            title={`Filter ${label}`}
          >
            <Funnel
              className="data-table__column-filter-facet-icon"
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>
      </div>

      {open ? (
        <Popover.Content
          id={popoverId}
          role="dialog"
          aria-label={`Filter ${label}`}
          className="data-table__column-filter-popover data-table__column-filter-popover--facet"
          sideOffset={6}
          align="start"
        >
          <input
            className="data-table__column-filter-popover-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
            placeholder="Search values"
            aria-label={`Search ${label} values`}
          />

          <DataTableScrollArea
            className="data-table__scroll-area--column-filter-options"
            viewportClassName="data-table__column-filter-options"
            viewportRole="group"
          >
            <label className="data-table__column-filter-option">
              <input
                className="data-table__column-filter-option-input"
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.currentTarget.checked)}
                aria-label={`Select all ${label} values`}
              />
              <span className="data-table__column-filter-option-label">
                (Select All)
              </span>
            </label>
            {visibleOptions.length === 0 ? (
              <div className="data-table__column-filter-option-empty">
                No values found.
              </div>
            ) : (
              visibleOptions.map((option) => {
                const checked = selectedKeys.includes(option.key);

                return (
                  <label key={option.key} className="data-table__column-filter-option">
                    <input
                      className="data-table__column-filter-option-input"
                      type="checkbox"
                      checked={allSelected || checked}
                      onChange={(event) => onToggle(option, event.currentTarget.checked)}
                      aria-label={option.label}
                    />
                    <span className="data-table__column-filter-option-label">
                      {option.label}
                    </span>
                  </label>
                );
              })
            )}
          </DataTableScrollArea>

          {shouldShowClear ? (
            <button
              type="button"
              className="data-table__column-filter-clear"
              onClick={onClear}
              aria-label={`Clear ${label} filter`}
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </Popover.Content>
      ) : null}
    </Popover.Root>
  );
}
