import type { Table } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';

import type {
  DataTableFilterVariant,
  DataTableSavedViewsStorage,
} from '../../types/data-table.types';
import { normalizeColumnSizingState } from '../column-sizing';
import {
  applySavedViewState,
  type DataTableSavedViewState,
  DEFAULT_SAVED_VIEWS_STORAGE,
  deleteSavedView,
  getDefaultSavedViewsDocument,
  loadSavedViewsDocument,
  normalizeSavedViewsDocument,
  persistSavedViewsDocument,
  resetSavedViewState,
  upsertSavedView,
} from '../saved-views';

function createState(overrides?: Partial<DataTableSavedViewState>): DataTableSavedViewState {
  return {
    sorting: [{ id: 'name', desc: false }],
    globalFilter: 'Alice',
    columnFilters: [{ id: 'department', value: 'Engineering' }],
    columnVisibility: { status: false },
    columnOrder: ['id', 'name', 'department', 'status'],
    columnSizing: { name: 220, status: 120 },
    grouping: ['department'],
    pagination: { pageIndex: 1, pageSize: 25 },
    ...overrides,
  };
}

function createMemoryStorage() {
  const storage = new Map<string, string>();

  const adapter: DataTableSavedViewsStorage = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
  };

  return {
    adapter,
    storage,
  };
}

interface MockTableHelpers {
  table: Table<{ id: string }>;
  setSorting: ReturnType<typeof vi.fn>;
  setGlobalFilter: ReturnType<typeof vi.fn>;
  setColumnFilters: ReturnType<typeof vi.fn>;
  resetColumnSizing: ReturnType<typeof vi.fn>;
  resetHeaderSizeInfo: ReturnType<typeof vi.fn>;
  setColumnSizing: ReturnType<typeof vi.fn>;
  resetSorting: ReturnType<typeof vi.fn>;
  resetGlobalFilter: ReturnType<typeof vi.fn>;
  resetColumnFilters: ReturnType<typeof vi.fn>;
  resetColumnVisibility: ReturnType<typeof vi.fn>;
  resetColumnOrder: ReturnType<typeof vi.fn>;
  resetGrouping: ReturnType<typeof vi.fn>;
  resetExpanded: ReturnType<typeof vi.fn>;
  resetPagination: ReturnType<typeof vi.fn>;
  setPagination: ReturnType<typeof vi.fn>;
  setColumnVisibility: ReturnType<typeof vi.fn>;
  setColumnOrder: ReturnType<typeof vi.fn>;
  setGrouping: ReturnType<typeof vi.fn>;
  resetToInitialState: ReturnType<typeof vi.fn>;
}

function createMockTable(
  overrides?: Partial<DataTableSavedViewState>,
): MockTableHelpers {
  const setSorting = vi.fn();
  const setGlobalFilter = vi.fn();
  const setColumnFilters = vi.fn();
  const resetColumnSizing = vi.fn();
  const resetHeaderSizeInfo = vi.fn();
  const setColumnSizing = vi.fn();
  const resetSorting = vi.fn();
  const resetGlobalFilter = vi.fn();
  const resetColumnFilters = vi.fn();
  const resetColumnVisibility = vi.fn();
  const resetColumnOrder = vi.fn();
  const resetGrouping = vi.fn();
  const resetExpanded = vi.fn();
  const resetPagination = vi.fn();
  const setPagination = vi.fn();
  const setColumnVisibility = vi.fn();
  const setColumnOrder = vi.fn();
  const setGrouping = vi.fn();
  const resetToInitialState = vi.fn();
  const createLeaf = (
    id: string,
    getCanGroup: boolean,
    filterVariant?: DataTableFilterVariant,
    minSize?: number,
    maxSize?: number,
  ) => ({
    id,
    getCanSort: () => true,
    getCanGroup: () => getCanGroup,
    getCanFilter: () => filterVariant !== undefined,
    columnDef: {
      minSize,
      maxSize,
      meta: filterVariant !== undefined ? { filterVariant } : undefined,
    },
  });

  const table = {
    getAllLeafColumns: () => [
      createLeaf('id', false, 'number'),
      createLeaf('name', false, 'text', 140),
      createLeaf('department', true, 'select', 160),
      createLeaf('status', true, 'boolean', 100),
      createLeaf('age', false, 'number'),
      createLeaf('birthDate', false, 'date'),
      createLeaf('createdAt', false, 'date-range'),
      createLeaf('region', true, 'multi-select'),
    ],
    getState: () =>
      ({
        sorting: overrides?.sorting ?? [],
        globalFilter: overrides?.globalFilter ?? '',
        columnFilters: overrides?.columnFilters ?? [],
        columnVisibility: overrides?.columnVisibility ?? {},
        columnOrder: overrides?.columnOrder ?? ['id', 'name', 'department', 'status'],
        columnSizing: overrides?.columnSizing ?? { name: 220, status: 120 },
        grouping: overrides?.grouping ?? [],
        pagination: overrides?.pagination ?? { pageIndex: 0, pageSize: 10 },
      } satisfies DataTableSavedViewState),
    setSorting,
    setGlobalFilter,
    setColumnFilters,
    resetColumnSizing,
    resetHeaderSizeInfo,
    setColumnSizing,
    resetSorting,
    resetGlobalFilter,
    resetColumnFilters,
    resetColumnVisibility,
    resetColumnOrder,
    resetGrouping,
    resetExpanded,
    resetPagination,
    setPagination,
    setColumnVisibility,
    setColumnOrder,
    setGrouping,
    options: {
      meta: {
        resetToInitialState,
      },
    },
  } as unknown as Table<{ id: string }>;

  return {
    table,
    setSorting,
    setGlobalFilter,
    setColumnFilters,
    resetColumnSizing,
    resetHeaderSizeInfo,
    setColumnSizing,
    resetSorting,
    resetGlobalFilter,
    resetColumnFilters,
    resetColumnVisibility,
    resetColumnOrder,
    resetGrouping,
    resetExpanded,
    resetPagination,
    setPagination,
    setColumnVisibility,
    setColumnOrder,
    setGrouping,
    resetToInitialState,
  };
}

describe('saved views helpers', () => {
  it('normalizes malformed stored documents safely', () => {
    const document = normalizeSavedViewsDocument({
      version: 1,
      views: [
        null,
        {
          id: '',
          name: '  First   View  ',
          state: createState(),
        },
        {
          id: 'duplicate',
          name: 'first view',
          state: createState({
            globalFilter: 'Bob',
            grouping: ['status'],
          }),
        },
        {
          id: 'invalid-state',
          name: 'Second',
          state: {
            sorting: [{ id: 'name', desc: 'nope' }],
            columnSizing: { name: 'wide' },
          },
        },
      ],
    });

    expect(document.version).toBe(1);
    expect(document.views).toHaveLength(2);
    expect(document.views[0]?.name).toBe('first view');
    expect(document.views[0]?.state.globalFilter).toBe('Bob');
    expect(document.views[1]?.name).toBe('Second');
    expect(document.views[1]?.state.sorting).toEqual([]);
    expect(document.views[1]?.state.columnSizing).toEqual({});
  });

  it('loads legacy saved views without advanced filter slices safely', () => {
    const document = normalizeSavedViewsDocument({
      version: 1,
      views: [
        {
          id: 'legacy',
          name: 'Legacy',
          state: {
            sorting: [{ id: 'name', desc: false }],
            globalFilter: 'Alice',
            columnVisibility: { status: false },
            columnOrder: ['id', 'name', 'department', 'status'],
            grouping: ['department'],
            pagination: { pageIndex: 2, pageSize: 25 },
          },
        },
      ],
    });

    expect(document.views).toHaveLength(1);
    expect(document.views[0]?.state.columnFilters).toEqual([]);
    expect(document.views[0]?.state.columnSizing).toEqual({});
  });

  it('ignores unknown versions and invalid slice shapes safely', () => {
    expect(
      normalizeSavedViewsDocument({
        version: 2,
        views: [
          {
            id: 'unknown-version',
            name: 'Legacy',
            state: createState(),
          },
        ],
      }),
    ).toEqual(getDefaultSavedViewsDocument());

    const document = normalizeSavedViewsDocument({
      version: 1,
      views: [
        {
          id: 'invalid-shapes',
          name: 'Invalid',
          state: {
            sorting: [{ id: 'name', desc: 'nope' }],
            globalFilter: 123,
            columnFilters: 'nope',
            columnVisibility: { status: 'hidden' },
            columnOrder: ['id', 'name', 'department', 'status'],
            grouping: ['department', 'department'],
            pagination: { pageIndex: -1, pageSize: 0 },
          },
        },
      ],
    });

    expect(document.views).toHaveLength(1);
    expect(document.views[0]?.state.sorting).toEqual([]);
    expect(document.views[0]?.state.globalFilter).toBe('');
    expect(document.views[0]?.state.columnFilters).toEqual([]);
    expect(document.views[0]?.state.columnVisibility).toEqual({});
    expect(document.views[0]?.state.columnSizing).toEqual({});
    expect(document.views[0]?.state.grouping).toEqual(['department']);
    expect(document.views[0]?.state.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it('upserts views by name without introducing duplicates', () => {
    const firstState = createState({ globalFilter: 'Alice' });
    const secondState = createState({ globalFilter: 'Bob' });
    const document = upsertSavedView(getDefaultSavedViewsDocument(), 'My View', firstState);
    const updatedDocument = upsertSavedView(document, ' my   view ', secondState);

    expect(updatedDocument.views).toHaveLength(1);
    expect(updatedDocument.views[0]?.name).toBe('my view');
    expect(updatedDocument.views[0]?.state.globalFilter).toBe('Bob');
  });

  it('normalizes empty view names predictably', () => {
    const document = upsertSavedView(getDefaultSavedViewsDocument(), '   ', createState());

    expect(document.views).toHaveLength(1);
    expect(document.views[0]?.name).toBe('Saved view');
  });

  it('deletes saved views by id', () => {
    const firstDocument = upsertSavedView(
      getDefaultSavedViewsDocument(),
      'View One',
      createState(),
    );
    const secondDocument = upsertSavedView(
      firstDocument,
      'View Two',
      createState({ globalFilter: 'Bob' }),
    );
    const targetId = secondDocument.views[0]?.id ?? '';

    expect(deleteSavedView(secondDocument, targetId).views).toHaveLength(1);
  });

  it('persists versioned payloads and round-trips through storage', () => {
    const { adapter, storage } = createMemoryStorage();
    const document = upsertSavedView(
      getDefaultSavedViewsDocument(),
      'View One',
      createState(),
    );

    persistSavedViewsDocument(adapter, 'saved-views-key', document);

    const raw = storage.get('saved-views-key');
    expect(raw).toBeDefined();

    const parsed = JSON.parse(raw ?? '{}') as { version?: number; views?: unknown[] };
    expect(parsed.version).toBe(1);
    expect(parsed.views).toHaveLength(1);

    expect(loadSavedViewsDocument(adapter, 'saved-views-key')).toEqual(document);

    persistSavedViewsDocument(adapter, 'saved-views-key', getDefaultSavedViewsDocument());
    expect(storage.has('saved-views-key')).toBe(false);
  });

  it('ignores storage write failures safely', () => {
    const adapter: DataTableSavedViewsStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('write failed');
      }),
      removeItem: vi.fn(),
    };

    expect(() =>
      persistSavedViewsDocument(adapter, 'saved-views-key', {
        version: 1,
        views: [
          {
            id: 'view-id',
            name: 'View',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            state: createState(),
          },
        ],
      }),
    ).not.toThrow();
  });

  it('ignores malformed local storage data safely', () => {
    const adapter: DataTableSavedViewsStorage = {
      getItem: vi.fn(() => '{not-json'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    expect(loadSavedViewsDocument(adapter, 'saved-views-key')).toEqual(
      getDefaultSavedViewsDocument(),
    );
  });

  it('default storage fails safely when localStorage is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

    if (!descriptor?.configurable) {
      return;
    }

    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get: () => {
          throw new Error('unavailable');
        },
      });

      expect(DEFAULT_SAVED_VIEWS_STORAGE.getItem('saved-views-key')).toBeNull();
      expect(() =>
        DEFAULT_SAVED_VIEWS_STORAGE.setItem('saved-views-key', 'value'),
      ).not.toThrow();
      expect(() =>
        DEFAULT_SAVED_VIEWS_STORAGE.removeItem('saved-views-key'),
      ).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', descriptor);
    }
  });

  it('applies a saved view safely when ids are unknown or duplicated', () => {
    const { table, setSorting, setGlobalFilter, setColumnFilters, resetExpanded, setPagination, setColumnVisibility, setColumnOrder, setColumnSizing, setGrouping } =
      createMockTable();

    applySavedViewState(table, {
      sorting: [{ id: 'unknown', desc: false }, { id: 'name', desc: true }],
      globalFilter: 'Alice',
      columnFilters: [{ id: 'invalid', value: 'x' }, { id: 'department', value: 'Engineering' }],
      columnVisibility: { status: false, unknown: true },
      columnOrder: ['unknown', 'department', 'department', 'name'],
      columnSizing: { unknown: 500, name: 220, status: Number.NaN },
      grouping: ['department', 'status', 'department', 'unknown'],
      pagination: { pageIndex: 1, pageSize: 25 },
    });

    expect(setSorting).toHaveBeenCalledWith([{ id: 'name', desc: true }]);
    expect(setGlobalFilter).toHaveBeenCalledWith('Alice');
    expect(setColumnFilters).toHaveBeenCalledWith([
      { id: 'department', value: ['Engineering'] },
    ]);
    expect(resetExpanded).toHaveBeenCalledWith(true);
    expect(setPagination).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 25 });
    expect(setColumnVisibility).toHaveBeenCalledWith({ status: false });
    expect(setColumnOrder).toHaveBeenCalledWith(['department', 'name']);
    expect(setColumnSizing).toHaveBeenCalledWith({ name: 220 });
    expect(setGrouping).toHaveBeenCalledWith(['department', 'status']);
  });

  it('clamps restored column sizing to the current column minimums', () => {
    const { table, setColumnSizing } = createMockTable();

    applySavedViewState(table, {
      sorting: [],
      globalFilter: '',
      columnFilters: [],
      columnVisibility: {},
      columnOrder: [],
      columnSizing: { status: 40, name: 220 },
      grouping: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    });

    expect(setColumnSizing).toHaveBeenCalledWith({
      name: 220,
      status: 152,
    });
  });

  it('normalizes advanced filter values when applying a saved view', () => {
    const { table, setColumnFilters } = createMockTable();

    applySavedViewState(table, {
      sorting: [],
      globalFilter: '',
      columnFilters: [
        { id: 'age', value: { min: '40', max: '30' } },
        { id: 'birthDate', value: '1988-11-03' },
        { id: 'createdAt', value: { from: '2024-04-08', to: '2024-02-20' } },
        { id: 'region', value: ['South', 'South', false, 1] },
      ],
      columnVisibility: {},
      columnOrder: [],
      columnSizing: {},
      grouping: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    });

    expect(setColumnFilters).toHaveBeenCalledWith([
      { id: 'age', value: { min: 30, max: 40 } },
      { id: 'birthDate', value: '1988-11-03' },
      { id: 'createdAt', value: { from: '2024-02-20', to: '2024-04-08' } },
      { id: 'region', value: ['South', false, 1] },
    ]);
  });

  it('ignores malformed advanced filter values safely when applying a saved view', () => {
    const { table, setColumnFilters } = createMockTable();

    applySavedViewState(table, {
      sorting: [],
      globalFilter: '',
      columnFilters: [
        { id: 'age', value: { min: 'nope', max: 'also-nope' } },
        { id: 'birthDate', value: 'not-a-date' },
        { id: 'createdAt', value: { from: 'bad', to: 'also-bad' } },
        { id: 'region', value: [' ', {}] },
      ],
      columnVisibility: {},
      columnOrder: [],
      columnSizing: {},
      grouping: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    });

    expect(setColumnFilters).toHaveBeenCalledWith([]);
  });

  it('resetSavedViewState respects controlled slices through the internal reset callback', () => {
    const { table, resetToInitialState } = createMockTable();

    resetSavedViewState(table);

    expect(resetToInitialState).toHaveBeenCalledTimes(1);
  });

  it('resetSavedViewState falls back to column sizing resets when no internal reset exists', () => {
    const { table, resetColumnSizing, resetHeaderSizeInfo } = createMockTable();
    const tableWithoutMeta = {
      ...table,
      options: {},
    } as Table<{ id: string }>;

    resetSavedViewState(tableWithoutMeta);

    expect(resetColumnSizing).toHaveBeenCalledWith(true);
    expect(resetHeaderSizeInfo).toHaveBeenCalledWith(true);
  });

  it('normalizes column sizing with and without known ids', () => {
    expect(
      normalizeColumnSizingState(
        { name: 220, status: Number.NaN, unknown: 400 },
      ),
    ).toEqual({ name: 220, unknown: 400 });
    expect(
      normalizeColumnSizingState(
        { name: 220, status: Number.NaN, unknown: 400 },
        ['name', 'status'],
      ),
    ).toEqual({ name: 220 });
  });
});
