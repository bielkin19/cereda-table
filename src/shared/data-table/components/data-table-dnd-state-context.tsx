import { createContext, type ReactNode, useContext } from 'react';

import type { DataTableDndData } from '../lib/data-table-dnd';

interface DataTableDndStateContextValue {
  activeDragData: DataTableDndData | null;
}

const DataTableDndStateContext =
  createContext<DataTableDndStateContextValue | null>(null);

interface DataTableDndStateProviderProps {
  activeDragData: DataTableDndData | null;
  children: ReactNode;
}

export function DataTableDndStateProvider({
  activeDragData,
  children,
}: DataTableDndStateProviderProps) {
  return (
    <DataTableDndStateContext.Provider value={{ activeDragData }}>
      {children}
    </DataTableDndStateContext.Provider>
  );
}

export function useDataTableDndState() {
  return useContext(DataTableDndStateContext);
}
