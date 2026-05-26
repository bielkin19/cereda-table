import { SearchX, X } from 'lucide-react';

import { useDataTableLocale } from './data-table-locale-context';

interface DataTableEmptyProps {
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

export function DataTableEmpty({ activeFilterCount = 0, onClearFilters }: DataTableEmptyProps) {
  const locale = useDataTableLocale();
  return (
    <div className="cereda-table__empty">
      <span className="cereda-table__empty-icon">
        <SearchX strokeWidth={1.5} />
      </span>
      <span className="cereda-table__empty-title">{locale.empty.title}</span>
      <span className="cereda-table__empty-hint">{locale.empty.hint}</span>
      {onClearFilters ? (
        <button
          type="button"
          className="cereda-table__empty-clear"
          onClick={onClearFilters}
        >
          <X className="cereda-table__empty-clear-icon" />
          <span>{locale.empty.clearFilters}</span>
          <span className="cereda-table__empty-clear-count">{activeFilterCount}</span>
        </button>
      ) : null}
    </div>
  );
}

