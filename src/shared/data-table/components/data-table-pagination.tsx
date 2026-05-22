import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { DataTableSelect } from './data-table-select';

interface DataTablePaginationProps<TData extends object> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function normalizePageSizeOptions(
  options: number[] | undefined,
  currentPageSize: number,
) {
  const candidateOptions =
    options && options.length > 0 ? options : [...DEFAULT_PAGE_SIZE_OPTIONS];

  const uniquePositiveOptions = Array.from(
    new Set(
      candidateOptions.filter(
        (pageSize) => Number.isFinite(pageSize) && pageSize > 0,
      ),
    ),
  ).sort((a, b) => a - b);

  if (!uniquePositiveOptions.includes(currentPageSize)) {
    uniquePositiveOptions.push(currentPageSize);
    uniquePositiveOptions.sort((a, b) => a - b);
  }

  return uniquePositiveOptions;
}

function getPageNumbers(currentPage: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const nearStart = currentPage <= 3;
  const nearEnd = currentPage >= pageCount - 2;

  if (nearStart) {
    return [1, 2, 3, 4, 5, 'ellipsis', pageCount];
  }

  if (nearEnd) {
    return [1, 'ellipsis', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', pageCount];
}

export function DataTablePagination<TData extends object>({
  table,
  pageSizeOptions,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const rowCount = table.getRowCount();
  const hasKnownPageCount = pageCount > 0;
  const currentPage = pageIndex + 1;
  const options = normalizePageSizeOptions(pageSizeOptions, pageSize);

  const handlePageSizeChange = (nextValue: string) => {
    const nextSize = Number(nextValue);
    if (!Number.isFinite(nextSize) || nextSize <= 0) return;
    table.setPagination((current) => ({ ...current, pageIndex: 0, pageSize: nextSize }));
  };

  const pageNumbers = hasKnownPageCount ? getPageNumbers(currentPage, pageCount) : null;

  return (
    <nav className="data-table__pagination" aria-label="Pagination">
      <span className="data-table__pagination-row-count">
        {rowCount} row{rowCount === 1 ? '' : 's'}
      </span>

      <div className="data-table__pagination-controls">
        <button
          type="button"
          className="data-table__pagination-button"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="First page"
        >
          <ChevronsLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className="data-table__pagination-button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        {pageNumbers ? (
          <div className="data-table__pagination-pages" role="group" aria-label="Page numbers">
            {pageNumbers.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="data-table__pagination-ellipsis" aria-hidden="true">
                  &hellip;
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className="data-table__pagination-button"
                  aria-label={`Page ${item}`}
                  aria-current={item === currentPage ? 'page' : undefined}
                  data-active={item === currentPage || undefined}
                  onClick={item === currentPage ? undefined : () => table.setPageIndex(item - 1)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        ) : (
          <span className="data-table__pagination-page-info">
            Page {currentPage}
          </span>
        )}

        <button
          type="button"
          className="data-table__pagination-button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight aria-hidden="true" />
        </button>
        <button
          type="button"
          className="data-table__pagination-button"
          onClick={() => table.lastPage()}
          disabled={!hasKnownPageCount || !table.getCanNextPage()}
          aria-label="Last page"
        >
          <ChevronsRight aria-hidden="true" />
        </button>
      </div>

      <label className="data-table__pagination-size">
        <span className="data-table__pagination-size-label">Rows per page</span>
        <DataTableSelect
          ariaLabel="Rows per page"
          className="data-table__pagination-size-select"
          contentClassName="data-table__select-content data-table__select-content--pagination"
          onValueChange={handlePageSizeChange}
          options={options.map((option) => ({ value: String(option), label: String(option) }))}
          value={String(pageSize)}
        />
      </label>
    </nav>
  );
}
