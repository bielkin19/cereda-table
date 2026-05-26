export interface DataTableLocale {
  pagination: {
    label: string;
    rowCount: (count: number) => string;
    page: (current: number) => string;
    pageAriaLabel: (page: number) => string;
    pageNumbers: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
    rowsPerPage: string;
  };

  empty: {
    title: string;
    hint: string;
    clearFilters: string;
  };

  search: {
    placeholder: string;
    ariaLabel: string;
    clearAriaLabel: string;
  };

  columns: {
    buttonLabel: string;
    panelAriaLabel: string;
    panelTitle: string;
    panelClose: string;
    panelCloseTitle: string;
    summaryAriaLabel: string;
    visibleCount: (count: number) => string;
    hiddenCount: (count: number) => string;
    groupedCount: (count: number) => string;
    statVisible: string;
    statOrder: string;
    statGrouped: string;
    reset: string;
    resetOrder: string;
    clearGrouping: string;
    orderSectionTitle: string;
    noOrderableColumns: string;
    visibilitySectionTitle: string;
    noHidableColumns: string;
    groupedBadge: string;
  };

  filters: {
    buttonLabel: string;
    activeAriaLabel: (count: number) => string;
    panelTitle: string;
    panelSubtitle: string;
    clearAll: string;
    noFilters: string;
    chooseField: string;
    noAvailableFilters: string;
    addFilter: string;
    cancel: string;
    expandAriaLabel: (label: string) => string;
    collapseAriaLabel: (label: string) => string;
    removeAriaLabel: (label: string) => string;
    sectionAriaLabel: (label: string) => string;
  };

  savedViews: {
    buttonLabel: string;
    buttonDisabledTitle: string;
    defaultName: string;
    panelTitle: string;
    saveSectionTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    saveButton: string;
    listSectionTitle: string;
    noViews: string;
    applyLabel: string;
    applyAriaLabel: (name: string) => string;
    deleteLabel: string;
    deleteAriaLabel: (name: string) => string;
    resetLabel: string;
  };

  columnHeader: {
    rowNumberAriaLabel: string;
    sortAscendingAriaLabel: (label: string) => string;
    sortDescendingAriaLabel: (label: string) => string;
    clearSortAriaLabel: (label: string) => string;
    resizeAriaLabel: (label: string) => string;
    dragAriaLabel: (label: string) => string;
    canBeGroupedTitle: string;
  };

  columnFilter: {
    filterAriaLabel: (label: string) => string;
    inputLabel: (label: string) => string;
    minPlaceholder: string;
    maxPlaceholder: string;
    minAriaLabel: (label: string) => string;
    maxAriaLabel: (label: string) => string;
    clearAriaLabel: (label: string) => string;
    fromPlaceholder: string;
    toPlaceholder: string;
    fromAriaLabel: (label: string) => string;
    toAriaLabel: (label: string) => string;
    booleanTrue: string;
    booleanFalse: string;
  };

  facetFilter: {
    openAriaLabel: (label: string) => string;
    dialogAriaLabel: (label: string) => string;
    searchPlaceholder: string;
    searchAriaLabel: (label: string) => string;
    selectAllAriaLabel: (label: string) => string;
    selectAllLabel: string;
    noValues: string;
    clearAriaLabel: (label: string) => string;
  };

  datePicker: {
    weekdays: readonly [string, string, string, string, string, string, string];
    months: readonly [
      string, string, string, string, string, string,
      string, string, string, string, string, string,
    ];
    prevMonthAriaLabel: string;
    nextMonthAriaLabel: string;
    calendarAriaLabel: string;
    selectDatePlaceholder: string;
    clearAriaLabel: (label: string) => string;
  };

  groupingPanel: {
    ariaLabel: string;
    dropHint: string;
    clearAll: string;
    sortAscendingAriaLabel: (label: string) => string;
    sortDescendingAriaLabel: (label: string) => string;
    clearSortAriaLabel: (label: string) => string;
    dragAriaLabel: (label: string) => string;
    removeAriaLabel: (label: string) => string;
    itemAriaLabel: (label: string, position: number, total: number) => string;
  };

  groupingSection: {
    sectionTitle: string;
    noGroupableColumns: string;
    groupedBadge: string;
    dragAriaLabel: (label: string) => string;
    groupAriaLabel: (label: string) => string;
    ungroupAriaLabel: (label: string) => string;
    groupLabel: string;
    ungroupLabel: string;
  };

  columnOrder: {
    dragAriaLabel: (label: string) => string;
    canBeGroupedLabel: string;
    moveOnlyLabel: string;
    moveLeftAriaLabel: (label: string) => string;
    moveRightAriaLabel: (label: string) => string;
    leftLabel: string;
    rightLabel: string;
  };

  autoGroup: {
    headerLabel: string;
    resizeHeaderAriaLabel: string;
    booleanTrue: string;
    booleanFalse: string;
    emptyValue: string;
    fallbackGroupLabel: string;
    expandAriaLabel: (label: string, value: string, childCount: number) => string;
    collapseAriaLabel: (label: string, value: string, childCount: number) => string;
    rowCount: (count: number) => string;
  };
}

export type DataTableLocaleOverrides = {
  [K in keyof DataTableLocale]?: Partial<DataTableLocale[K]>;
};

export const DEFAULT_DATA_TABLE_LOCALE: DataTableLocale = {
  pagination: {
    label: 'Pagination',
    rowCount: (count) => `${count} ${count === 1 ? 'row' : 'rows'}`,
    page: (current) => `Page ${current}`,
    pageAriaLabel: (page) => `Page ${page}`,
    pageNumbers: 'Page numbers',
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    rowsPerPage: 'Rows per page',
  },

  empty: {
    title: 'No results found',
    hint: 'Try adjusting your search or filter criteria.',
    clearFilters: 'Clear filters',
  },

  search: {
    placeholder: 'Search...',
    ariaLabel: 'Search',
    clearAriaLabel: 'Clear search',
  },

  columns: {
    buttonLabel: 'Columns',
    panelAriaLabel: 'Columns',
    panelTitle: 'Columns',
    panelClose: 'Close panel',
    panelCloseTitle: 'Close',
    summaryAriaLabel: 'Column settings summary',
    visibleCount: (count) => `${count} visible`,
    hiddenCount: (count) => `${count} hidden`,
    groupedCount: (count) => `${count} grouped`,
    statVisible: 'Visible',
    statOrder: 'Order',
    statGrouped: 'Grouped',
    reset: 'Reset',
    resetOrder: 'Reset order',
    clearGrouping: 'Clear grouping',
    orderSectionTitle: 'Column order',
    noOrderableColumns: 'No columns can be reordered.',
    visibilitySectionTitle: 'Column visibility',
    noHidableColumns: 'No columns can be hidden.',
    groupedBadge: 'Grouped',
  },

  filters: {
    buttonLabel: 'Filters',
    activeAriaLabel: (count) => `Filters, ${count} active`,
    panelTitle: 'Filters',
    panelSubtitle: 'Add field filters and edit them in one list.',
    clearAll: 'Clear all',
    noFilters: 'No filters added.',
    chooseField: 'Choose a field',
    noAvailableFilters: 'All available filters are already added.',
    addFilter: 'Add filter',
    cancel: 'Cancel',
    expandAriaLabel: (label) => `Expand ${label} filter`,
    collapseAriaLabel: (label) => `Collapse ${label} filter`,
    removeAriaLabel: (label) => `Remove ${label} filter`,
    sectionAriaLabel: (label) => `${label} filter`,
  },

  savedViews: {
    buttonLabel: 'Saved views',
    buttonDisabledTitle: 'Saved views require a storage key',
    defaultName: 'Saved view',
    panelTitle: 'Saved views',
    saveSectionTitle: 'Save current view',
    nameLabel: 'View name',
    namePlaceholder: 'Saved view',
    saveButton: 'Save current view',
    listSectionTitle: 'Current saved views',
    noViews: 'No saved views yet.',
    applyLabel: 'Apply',
    applyAriaLabel: (name) => `Apply ${name}`,
    deleteLabel: 'Delete',
    deleteAriaLabel: (name) => `Delete ${name}`,
    resetLabel: 'Reset current table state',
  },

  columnHeader: {
    rowNumberAriaLabel: 'Row number',
    sortAscendingAriaLabel: (label) => `Sort ${label} ascending`,
    sortDescendingAriaLabel: (label) => `Sort ${label} descending`,
    clearSortAriaLabel: (label) => `Clear ${label} sorting`,
    resizeAriaLabel: (label) => `Resize ${label} column`,
    dragAriaLabel: (label) => `Drag ${label} column`,
    canBeGroupedTitle: 'Can be grouped',
  },

  columnFilter: {
    filterAriaLabel: (label) => `Filter ${label}`,
    inputLabel: (label) => `Filter ${label}`,
    minPlaceholder: 'Min',
    maxPlaceholder: 'Max',
    minAriaLabel: (label) => `Minimum ${label} filter`,
    maxAriaLabel: (label) => `Maximum ${label} filter`,
    clearAriaLabel: (label) => `Clear ${label} filter`,
    fromPlaceholder: 'From',
    toPlaceholder: 'To',
    fromAriaLabel: (label) => `From ${label}`,
    toAriaLabel: (label) => `To ${label}`,
    booleanTrue: 'Yes',
    booleanFalse: 'No',
  },

  facetFilter: {
    openAriaLabel: (label) => `Open ${label} filter values`,
    dialogAriaLabel: (label) => `Filter ${label}`,
    searchPlaceholder: 'Search values',
    searchAriaLabel: (label) => `Search ${label} values`,
    selectAllAriaLabel: (label) => `Select all ${label} values`,
    selectAllLabel: '(Select All)',
    noValues: 'No values found.',
    clearAriaLabel: (label) => `Clear ${label} filter`,
  },

  datePicker: {
    weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    prevMonthAriaLabel: 'Previous month',
    nextMonthAriaLabel: 'Next month',
    calendarAriaLabel: 'Calendar',
    selectDatePlaceholder: 'select date',
    clearAriaLabel: (label) => `Clear ${label}`,
  },

  groupingPanel: {
    ariaLabel: 'Grouping',
    dropHint: 'Drag here to set row groups',
    clearAll: 'Clear all',
    sortAscendingAriaLabel: (label) => `Sort ${label} ascending`,
    sortDescendingAriaLabel: (label) => `Sort ${label} descending`,
    clearSortAriaLabel: (label) => `Clear ${label} sorting`,
    dragAriaLabel: (label) => `Drag ${label} grouping`,
    removeAriaLabel: (label) => `Remove ${label} grouping`,
    itemAriaLabel: (label, position, total) => `${label} grouping, position ${position} of ${total}`,
  },

  groupingSection: {
    sectionTitle: 'Grouping',
    noGroupableColumns: 'No columns can be grouped.',
    groupedBadge: 'Grouped',
    dragAriaLabel: (label) => `Drag ${label} to grouping panel`,
    groupAriaLabel: (label) => `Group ${label}`,
    ungroupAriaLabel: (label) => `Ungroup ${label}`,
    groupLabel: 'Group',
    ungroupLabel: 'Ungroup',
  },

  columnOrder: {
    dragAriaLabel: (label) => `Drag ${label} to reorder`,
    canBeGroupedLabel: 'Can be grouped',
    moveOnlyLabel: 'Move only',
    moveLeftAriaLabel: (label) => `Move ${label} left`,
    moveRightAriaLabel: (label) => `Move ${label} right`,
    leftLabel: 'Left',
    rightLabel: 'Right',
  },

  autoGroup: {
    headerLabel: 'Group',
    resizeHeaderAriaLabel: 'Resize Group column',
    booleanTrue: 'Yes',
    booleanFalse: 'No',
    emptyValue: 'Empty',
    fallbackGroupLabel: 'Group',
    expandAriaLabel: (label, value, childCount) =>
      `Expand ${label} group ${value} (${childCount} ${childCount === 1 ? 'row' : 'rows'})`,
    collapseAriaLabel: (label, value, childCount) =>
      `Collapse ${label} group ${value} (${childCount} ${childCount === 1 ? 'row' : 'rows'})`,
    rowCount: (count) => `${count} ${count === 1 ? 'row' : 'rows'}`,
  },
};

export function createLocale(overrides: DataTableLocaleOverrides): DataTableLocale {
  const result = {} as DataTableLocale;
  for (const key of Object.keys(DEFAULT_DATA_TABLE_LOCALE) as (keyof DataTableLocale)[]) {
    (result as unknown as Record<keyof DataTableLocale, unknown>)[key] = {
      ...DEFAULT_DATA_TABLE_LOCALE[key],
      ...(overrides[key] ?? {}),
    };
  }
  return result;
}

