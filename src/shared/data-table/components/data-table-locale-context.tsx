import { createContext, type ReactNode, useContext } from 'react';

import { type DataTableLocale,DEFAULT_DATA_TABLE_LOCALE } from '../lib/data-table-locale';

const DataTableLocaleContext = createContext<DataTableLocale>(DEFAULT_DATA_TABLE_LOCALE);

export interface DataTableLocaleProviderProps {
  children: ReactNode;
  locale: DataTableLocale;
}

export function DataTableLocaleProvider({ children, locale }: DataTableLocaleProviderProps) {
  return (
    <DataTableLocaleContext.Provider value={locale}>
      {children}
    </DataTableLocaleContext.Provider>
  );
}

export function useDataTableLocale(): DataTableLocale {
  return useContext(DataTableLocaleContext);
}
