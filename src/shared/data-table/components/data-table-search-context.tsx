import type { Table } from '@tanstack/react-table';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

interface DataTableSearchContextValue {
  globalTerm: string;
  columnTerms: ReadonlyMap<string, string>;
}

const DataTableSearchContext = createContext<DataTableSearchContextValue>({
  globalTerm: '',
  columnTerms: new Map(),
});

export function useDataTableSearch(): DataTableSearchContextValue {
  return useContext(DataTableSearchContext);
}

export function getEffectiveTerm(
  search: DataTableSearchContextValue,
  columnId: string,
): string {
  return search.columnTerms.get(columnId) || search.globalTerm;
}

interface DataTableSearchProviderProps<TData extends object> {
  table: Table<TData>;
  children: ReactNode;
}

export function DataTableSearchProvider<TData extends object>({
  table,
  children,
}: DataTableSearchProviderProps<TData>) {
  const state = table.getState();
  const globalTerm = typeof state.globalFilter === 'string' ? state.globalFilter : '';

  const columnTerms = useMemo(() => {
    const map = new Map<string, string>();
    const rules = table.options.meta?.getFilterRules?.() ?? [];
    for (const rule of rules) {
      if (rule.operator === 'contains' && typeof rule.value === 'string' && rule.value.trim()) {
        map.set(rule.columnId, rule.value);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.columnFilters, table.options.meta]);

  const value = useMemo(
    () => ({ globalTerm, columnTerms }),
    [globalTerm, columnTerms],
  );

  return (
    <DataTableSearchContext.Provider value={value}>
      {children}
    </DataTableSearchContext.Provider>
  );
}
