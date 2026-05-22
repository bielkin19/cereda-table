import { SearchX, X } from 'lucide-react';

interface DataTableEmptyProps {
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

export function DataTableEmpty({ activeFilterCount = 0, onClearFilters }: DataTableEmptyProps) {
  return (
    <div className="data-table__empty">
      <span className="data-table__empty-icon">
        <SearchX strokeWidth={1.5} />
      </span>
      <span className="data-table__empty-title">No results found</span>
      <span className="data-table__empty-hint">Try adjusting your search or filter criteria.</span>
      {onClearFilters ? (
        <button
          type="button"
          className="data-table__empty-clear"
          onClick={onClearFilters}
        >
          <X className="data-table__empty-clear-icon" />
          <span>Clear filters</span>
          <span className="data-table__empty-clear-count">{activeFilterCount}</span>
        </button>
      ) : null}
    </div>
  );
}
