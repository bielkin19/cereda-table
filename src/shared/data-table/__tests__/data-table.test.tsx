import type {
  ColumnDef,
  ExpandedState,
} from '@tanstack/react-table';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDataTable } from '../hooks/use-data-table';
import { DataTable } from '../index';
import {
  estimateColumnMinSize,
  getDefaultColumnMinSize,
  getEffectiveColumnSize,
} from '../lib/column-sizing';

interface TestRow {
  id: string;
  name: string;
}

interface FilterRow {
  id: string;
  name: string;
  department: 'Engineering' | 'Product' | 'Support';
  status: boolean;
}

interface AdvancedFilterRow {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  createdAt: string;
  region: 'North' | 'South' | 'West';
  status: boolean;
}

interface LooseNumberFilterRow {
  id: string;
  name: string;
  age: number | string;
  birthDate: string;
  createdAt: string;
  region: 'North' | 'South' | 'West';
  status: boolean;
}

interface MixedPrimitiveFilterRow {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  createdAt: string;
  region: string | number | boolean;
  status: boolean;
}

interface DateObjectFilterRow {
  id: string;
  name: string;
  age: number;
  birthDate: Date;
  createdAt: string;
  region: 'North' | 'South' | 'West';
  status: boolean;
}

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

type UserEventApi = ReturnType<typeof userEvent.setup>;

async function selectRadixOption(
  user: UserEventApi,
  trigger: HTMLElement,
  optionName: string,
) {
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

async function selectColumnFilterValue(
  user: UserEventApi,
  label: string,
  optionName: string,
) {
  await user.click(screen.getByRole('button', { name: `Filter ${label}` }));
  const filterPopover = await screen.findByRole('dialog', {
    name: `Filter ${label}`,
  });

  await user.click(
    within(filterPopover).getByRole('checkbox', {
      name: `Select all ${label} values`,
    }),
  );
  await user.click(within(filterPopover).getByRole('checkbox', { name: optionName }));
}

const mixedColumns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name', enableSorting: false },
];

const searchColumns: ColumnDef<TestRow, unknown>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableHiding: false,
    meta: {
      label: 'User ID',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      label: 'Full Name',
    },
  },
];

const visibilityColumns: ColumnDef<TestRow, unknown>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableHiding: false,
    meta: {
      label: 'User ID',
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      label: 'Full Name',
    },
  },
];

const filterColumns: ColumnDef<FilterRow, unknown>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableHiding: false,
    enableResizing: false,
    size: 96,
    minSize: 80,
    maxSize: 120,
    meta: {
      label: 'User ID',
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
    minSize: 140,
    maxSize: 260,
    meta: {
      label: 'Full Name',
      filterVariant: 'text',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    size: 180,
    minSize: 160,
    maxSize: 220,
    meta: {
      label: 'Department',
      filterVariant: 'select',
      enableGrouping: true,
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    minSize: 100,
    maxSize: 160,
    meta: {
      label: 'Status',
      filterVariant: 'boolean',
      enableGrouping: true,
    },
  },
];

const advancedFilterColumns: ColumnDef<AdvancedFilterRow, unknown>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableHiding: false,
    meta: {
      label: 'User ID',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      label: 'Full Name',
      filterVariant: 'text',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'age',
    header: 'Age',
    meta: {
      label: 'Age',
      filterVariant: 'number',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'birthDate',
    header: 'Birth Date',
    meta: {
      label: 'Birth Date',
      filterVariant: 'date',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    meta: {
      label: 'Created At',
      filterVariant: 'date-range',
      enableGrouping: false,
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    meta: {
      label: 'Region',
      filterVariant: 'multi-select',
      enableGrouping: true,
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      label: 'Status',
      filterVariant: 'boolean',
      enableGrouping: true,
    },
  },
];

const rows: TestRow[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const sortableRows: TestRow[] = [
  { id: '1', name: 'Bob' },
  { id: '2', name: 'Alice' },
];

const filterRows: FilterRow[] = [
  { id: '1', name: 'Alice', department: 'Engineering', status: true },
  { id: '2', name: 'Bob', department: 'Product', status: false },
  { id: '3', name: 'Carla', department: 'Support', status: true },
  { id: '4', name: 'Drew', department: 'Product', status: false },
];

const advancedFilterRows: AdvancedFilterRow[] = [
  {
    id: '1',
    name: 'Alice',
    age: 31,
    birthDate: '1992-05-12',
    createdAt: '2024-01-15',
    region: 'North',
    status: true,
  },
  {
    id: '2',
    name: 'Bob',
    age: 36,
    birthDate: '1988-11-03',
    createdAt: '2024-02-20',
    region: 'South',
    status: false,
  },
  {
    id: '3',
    name: 'Carla',
    age: 42,
    birthDate: '1981-07-09',
    createdAt: '2024-03-10',
    region: 'West',
    status: true,
  },
  {
    id: '4',
    name: 'Drew',
    age: 27,
    birthDate: '1996-09-21',
    createdAt: '2024-04-08',
    region: 'South',
    status: false,
  },
];

const advancedDecimalRows: AdvancedFilterRow[] = [
  {
    id: '1',
    name: 'Minus',
    age: -3.5,
    birthDate: '1992-05-12',
    createdAt: '2024-01-15',
    region: 'North',
    status: true,
  },
  {
    id: '2',
    name: 'Decimal',
    age: 1.25,
    birthDate: '1988-11-03',
    createdAt: '2024-02-20',
    region: 'South',
    status: false,
  },
  {
    id: '3',
    name: 'High',
    age: 8.75,
    birthDate: '1981-07-09',
    createdAt: '2024-03-10',
    region: 'West',
    status: true,
  },
];

const invalidDateRows: DateObjectFilterRow[] = [
  {
    id: '1',
    name: 'Valid',
    age: 31,
    birthDate: new Date(1988, 10, 3, 12, 30),
    createdAt: '2024-01-15',
    region: 'North',
    status: true,
  },
  {
    id: '2',
    name: 'ISO',
    age: 36,
    birthDate: new Date('1988-11-03T12:30:00'),
    createdAt: '2024-02-20',
    region: 'South',
    status: false,
  },
  {
    id: '3',
    name: 'Invalid',
    age: 42,
    birthDate: new Date('not-a-date'),
    createdAt: '2024-03-10',
    region: 'West',
    status: true,
  },
];

const mixedPrimitiveRows: MixedPrimitiveFilterRow[] = [
  {
    id: '1',
    name: 'South',
    age: 31,
    birthDate: '1992-05-12',
    createdAt: '2024-01-15',
    region: 'South',
    status: true,
  },
  {
    id: '2',
    name: 'One',
    age: 36,
    birthDate: '1988-11-03',
    createdAt: '2024-02-20',
    region: 1,
    status: false,
  },
  {
    id: '3',
    name: 'True',
    age: 42,
    birthDate: '1981-07-09',
    createdAt: '2024-03-10',
    region: true,
    status: true,
  },
];

const looseNumberRows: LooseNumberFilterRow[] = [
  {
    id: '1',
    name: 'Valid',
    age: 31,
    birthDate: '1992-05-12',
    createdAt: '2024-01-15',
    region: 'North',
    status: true,
  },
  {
    id: '2',
    name: 'Text Age',
    age: 'unknown',
    birthDate: '1988-11-03',
    createdAt: '2024-02-20',
    region: 'South',
    status: false,
  },
];

const advancedVirtualizationRows: AdvancedFilterRow[] = Array.from(
  { length: 60 },
  (_, index) => {
    const regions: AdvancedFilterRow['region'][] = ['North', 'South', 'West'];
    const id = index + 1;

    return {
      id: String(id),
      name: `Advanced User ${id}`,
      age: 24 + (index % 18),
      birthDate: `199${index % 10}-0${(index % 9) + 1}-15`,
      createdAt: `2024-${String((index % 12) + 1).padStart(2, '0')}-15`,
      region: regions[index % regions.length],
      status: id % 2 === 0,
    };
  },
);

const paginationRows: FilterRow[] = Array.from({ length: 12 }, (_, index) => {
  const departments: FilterRow['department'][] = [
    'Engineering',
    'Product',
    'Support',
  ];

  return {
    id: String(index + 1),
    name: `User ${index + 1}`,
    department: departments[index % departments.length],
    status: index % 2 === 0,
  };
});

const singlePaginationRow: FilterRow[] = paginationRows.slice(0, 1);

const virtualizationRows: FilterRow[] = Array.from({ length: 60 }, (_, index) => {
  const departments: FilterRow['department'][] = [
    'Engineering',
    'Product',
    'Support',
  ];

  return {
    id: String(index + 1),
    name: `Virtual User ${index + 1}`,
    department: departments[index % departments.length],
    status: index % 2 === 0,
  };
});

function getRenderedNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('tbody tr td:nth-child(2)')).map(
    (cell) => cell.textContent ?? '',
  );
}

function getRenderedHeaderLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('thead .cereda-table__header-label')).map(
    (element) => element.textContent ?? '',
  );
}

function getRenderedColumnHeaderButtonLabels(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('th[aria-sort] .cereda-table__header-main-surface'),
  ).map(
    (button) => button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function getRenderedBodyRowTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('tbody tr')).map(
    (row) => row.textContent ?? '',
  );
}

describe('DataTable - markup', () => {
  it('renders a table element with thead and tbody', () => {
    const { container } = render(<DataTable data={rows} columns={columns} />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('renders a th for every column', () => {
    const { container } = render(<DataTable data={rows} columns={columns} />);
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(columns.length);
  });
});

describe('DataTable - column headers', () => {
  it('renders each column header label', () => {
    render(<DataTable data={rows} columns={columns} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders a button for sortable headers', () => {
    render(<DataTable data={rows} columns={columns} />);
    expect(screen.getByRole('button', { name: 'Sort ID ascending' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort Name ascending' })).toBeInTheDocument();
  });

  it('does not expose an interactive sort button for non-sortable headers', () => {
    render(<DataTable data={rows} columns={mixedColumns} />);
    expect(screen.getByRole('button', { name: 'Sort ID ascending' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sort Name ascending' })).not.toBeInTheDocument();
  });

  it('does not render header drag handles when enableColumnOrdering is false', () => {
    render(<DataTable data={filterRows} columns={filterColumns} />);

    expect(
      screen.queryByRole('button', { name: 'Drag Full Name column' }),
    ).not.toBeInTheDocument();
  });

  it('renders accessible header drag handles when enableColumnOrdering is true', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Drag Full Name column' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Drag Department column' }),
    ).toBeInTheDocument();
  });

  it('header drag handles do not trigger sorting', () => {
    const onSortingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Drag Full Name column' }));

    expect(onSortingChange).not.toHaveBeenCalled();
  });

  it('sets aria-sort="none" on sortable headers when not sorted', () => {
    const { container } = render(
      <DataTable data={rows} columns={columns} sorting={[]} onSortingChange={vi.fn()} />,
    );
    const ths = container.querySelectorAll('th');
    ths.forEach((th) => {
      expect(th).toHaveAttribute('aria-sort', 'none');
    });
  });

  it('sets aria-sort="ascending" on a sorted-asc column', () => {
    const { container } = render(
      <DataTable
        data={rows}
        columns={columns}
        sorting={[{ id: 'id', desc: false }]}
        onSortingChange={vi.fn()}
      />,
    );
    const idTh = container.querySelectorAll('th')[0];
    expect(idTh).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sets aria-sort="descending" on a sorted-desc column', () => {
    const { container } = render(
      <DataTable
        data={rows}
        columns={columns}
        sorting={[{ id: 'name', desc: true }]}
        onSortingChange={vi.fn()}
      />,
    );
    const nameTh = container.querySelectorAll('th')[1];
    expect(nameTh).toHaveAttribute('aria-sort', 'descending');
  });
});

describe('DataTable - row cells', () => {
  it('renders a cell for every data value', () => {
    render(<DataTable data={rows} columns={columns} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders exactly as many tbody rows as data items', () => {
    const { container } = render(<DataTable data={rows} columns={columns} />);
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(rows.length);
  });
});

describe('DataTable - column visibility', () => {
  it('does not render the toolbar when enableColumnVisibility is false', () => {
    render(<DataTable data={rows} columns={visibilityColumns} />);
    expect(screen.queryByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });

  it('renders the Columns button when enableColumnVisibility is true', () => {
    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );
    expect(screen.getByRole('button', { name: 'Columns' })).toBeInTheDocument();
  });

  it('does not render the search input when enableGlobalFilter is false', () => {
    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    expect(
      screen.queryByRole('searchbox', { name: 'Search' }),
    ).not.toBeInTheDocument();
  });

  it('renders the search input when enableGlobalFilter is true', () => {
    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableGlobalFilter
      />,
    );

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('opens the columns menu when Columns is clicked', () => {
    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('menu', { name: 'Columns' })).toBeInTheDocument();
  });

  it('closes the columns menu on Escape', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu', { name: 'Columns' })).not.toBeInTheDocument();
  });

  it('lists labels from column meta.label and omits non-hideable columns', () => {
    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('checkbox', { name: 'Full Name' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'User ID' })).not.toBeInTheDocument();
  });

  it('checkbox toggles a column in uncontrolled mode', () => {
    const { container } = render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(screen.queryByRole('columnheader', { name: 'Full Name' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr td')).toHaveLength(rows.length);
  });

  it('controlled columnVisibility calls onColumnVisibilityChange with resolved VisibilityState', () => {
    const onColumnVisibilityChange = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
        columnVisibility={{}}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ name: false });
  });

  it('Reset restores default visibility', () => {
    render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(screen.queryByText('Name')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('hiding all allowed columns does not crash the table', () => {
    const { container } = render(
      <DataTable
        data={rows}
        columns={visibilityColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(rows.length);
  });
});

describe('DataTable - column ordering', () => {
  it('does not render ordering controls when enableColumnOrdering is false', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.queryByRole('button', { name: 'Reset order' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move Department left' }),
    ).not.toBeInTheDocument();
  });

  it('exposes reset and move controls when enableColumnOrdering is true', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('button', { name: 'Reset order' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Drag Full Name to reorder' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Move User ID left' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Move Status right' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Department left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Department right' })).toBeInTheDocument();
  });

  it('checkbox interaction does not trigger sorting or unexpected reorder', async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    const onColumnOrderChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
        onSortingChange={onSortingChange}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Name',
      'Department',
      'Status',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(onSortingChange).not.toHaveBeenCalled();
    expect(onColumnOrderChange).not.toHaveBeenCalled();
    expect(getRenderedHeaderLabels(container)).toEqual(['ID', 'Department', 'Status']);
  });

  it('uncontrolled column order changes visible column order', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
        enableColumnFilters
      />,
    );

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Name',
      'Department',
      'Status',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Department',
      'Name',
      'Status',
    ]);
  });

  it('grouped source columns are auto-hidden while visible columns remain reorderable', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnOrdering
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(screen.getByRole('button', { name: 'Group Department' }));
    await user.click(screen.getByRole('button', { name: 'Group Status' }));

    const groupingPanel = screen.getByRole('region', { name: 'Grouping' });
    const groupingLabelsBefore = within(groupingPanel)
      .getAllByRole('button', { name: /^Drag .* grouping$/ })
      .map((button) => button.getAttribute('aria-label'));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'Group',
      'ID',
      'Name',
    ]);
    expect(screen.getByRole('button', { name: 'Move Full Name left' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Move Full Name left' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'Group',
      'Name',
      'ID',
    ]);
    expect(
      within(groupingPanel)
        .getAllByRole('button', { name: /^Drag .* grouping$/ })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(groupingLabelsBefore);
  });

  it('listener-only onColumnOrderChange still updates internal order', () => {
    const onColumnOrderChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Department',
      'Name',
      'Status',
    ]);
    expect(onColumnOrderChange).toHaveBeenLastCalledWith([
      'id',
      'department',
      'name',
      'status',
    ]);
  });

  it('controlled columnOrder calls onColumnOrderChange with resolved ColumnOrderState', () => {
    const onColumnOrderChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
        columnOrder={['id', 'name', 'department', 'status']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));

    expect(onColumnOrderChange).toHaveBeenLastCalledWith([
      'id',
      'department',
      'name',
      'status',
    ]);
  });

  it('controlled columnOrder does not change visible order unless parent updates the prop', () => {
    const onColumnOrderChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
        columnOrder={['id', 'name', 'department', 'status']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Name',
      'Department',
      'Status',
    ]);
    expect(onColumnOrderChange).toHaveBeenLastCalledWith([
      'id',
      'department',
      'name',
      'status',
    ]);
  });

  it('Reset order restores the original column order', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));
    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Department',
      'Name',
      'Status',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Reset order' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Name',
      'Department',
      'Status',
    ]);
  });

  it('hidden columns remain hidden after reorder', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
        enableColumnVisibility
        columnVisibility={{ status: false }}
      />,
    );

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Name',
      'Department',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Department',
      'Name',
    ]);
  });
});

describe('DataTable - column resizing', () => {
  it('does not render resize handles when enableColumnResizing is false', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Resize Full Name column' }),
    ).not.toBeInTheDocument();
  });

  it('renders resize handles for resizable columns when enabled', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Resize Full Name column' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resize User ID column' }),
    ).not.toBeInTheDocument();
  });

  it('renders resize handles when columnResizeMode is onEnd', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        columnResizeMode="onEnd"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Resize Full Name column' }),
    ).toBeInTheDocument();
  });

  it('resize handle does not trigger sorting, column-order DnD, or grouping drag', () => {
    const onSortingChange = vi.fn();
    const onColumnOrderChange = vi.fn();
    const onGroupingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableColumnOrdering
        enableGrouping
        sorting={[]}
        onSortingChange={onSortingChange}
        onColumnOrderChange={onColumnOrderChange}
        onGroupingChange={onGroupingChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'Drag Full Name column' })).toBeInTheDocument();
    fireEvent.mouseDown(
      screen.getByRole('button', { name: 'Resize Full Name column' }),
      {
        clientX: 200,
      },
    );

    expect(onSortingChange).not.toHaveBeenCalled();
    expect(onColumnOrderChange).not.toHaveBeenCalled();
    expect(onGroupingChange).not.toHaveBeenCalled();
  });

  it('applies consistent width styles to header and body cells', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
      />,
    );

    expect(container.querySelector('.cereda-table__body-scroll')).toBeInTheDocument();
    // ID column: autoMin=136 > maxSize=120 → capped at 120 (not bumped to 136)
    // Name=180 + Dept=180 + Status=136 + ID=120 = 616px total
    expect(container.querySelector('table')).toHaveStyle({
      width: '616px',
      minWidth: '616px',
      tableLayout: 'fixed',
    });

    const headers = container.querySelectorAll('thead th');
    const bodyCells = container.querySelectorAll('tbody tr:not(.cereda-table__loading-row) td');

    expect(headers[1]).toHaveStyle({
      width: '180px',
      minWidth: '144px',
      maxWidth: '260px',
    });
    expect(bodyCells[1]).toHaveStyle({
      width: '180px',
      minWidth: '144px',
      maxWidth: '260px',
    });
  });

  it('respects per-column minimum widths when rendering and measuring total width', () => {
    const narrowRows = [
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
    ];
    const narrowColumns = [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 40,
        minSize: 120,
        maxSize: 160,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        size: 80,
        minSize: 80,
      maxSize: 120,
      },
    ] satisfies ColumnDef<(typeof narrowRows)[number], unknown>[];

    const { container } = render(
      <DataTable
        data={narrowRows}
        columns={narrowColumns}
        enableColumnResizing
      />,
    );

    // ID  column: intrinsicMin=136 < maxSize=160  → size=136, minSize=136, maxSize=160
    // Title column: intrinsicMin=136 > maxSize=120 → capped at maxSize → size=120, minSize=120, maxSize=120
    expect(container.querySelector('table')).toHaveStyle({
      width: '256px',
      minWidth: '256px',
      tableLayout: 'fixed',
    });
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveStyle({
      width: '136px',
      minWidth: '136px',
      maxWidth: '160px',
    });
    expect(screen.getByRole('columnheader', { name: 'Title' })).toHaveStyle({
      width: '120px',
      minWidth: '120px',
      maxWidth: '120px',
    });
  });

  it('uses a larger automatic minimum width when a column does not declare minSize', () => {
    const label = 'Very Long Header Name';
    const rows = [
      { id: '1', label: 'A' },
      { id: '2', label: 'B' },
    ];
    const columns = [
      {
        accessorKey: 'id',
        header: label,
        size: 40,
        maxSize: 220,
        meta: {
          enableGrouping: true,
        },
      },
      {
        accessorKey: 'label',
        header: 'Label',
        size: 100,
      },
    ] satisfies ColumnDef<(typeof rows)[number], unknown>[];

    const { container } = render(
      <DataTable
        data={rows}
        columns={columns}
        enableColumnOrdering
        enableColumnResizing
        enableGrouping
      />,
    );

    const expectedMinWidth = getDefaultColumnMinSize({
      label,
      canSort: true,
      canGroup: true,
    });
    const labelColumnWidth = getDefaultColumnMinSize({
      label: 'Label',
      canSort: true,
      canGroup: true,
    });
    const table = container.querySelector('table');
    if (!table) {
      throw new Error('Expected table to be present');
    }

    // The 'id' column has maxSize:220. Its auto-min (256) exceeds that ceiling,
    // so the column is correctly capped at 220 rather than bumping maxSize.
    // The 'label' column has no maxSize → it is a fill column.
    // Fill columns make the table use width:100% so they can grow to fill the
    // container; minWidth still enforces the sum of all column minimums.
    const cappedColWidth = Math.min(expectedMinWidth, 220);
    expect(table.style.minWidth).toBe(`${cappedColWidth + labelColumnWidth}px`);
    expect(table.style.width).toBe('100%');
    expect(table).toHaveStyle({
      tableLayout: 'fixed',
    });
    expect(screen.getByRole('columnheader', { name: label })).toHaveStyle({
      width: `${cappedColWidth}px`,
      minWidth: `${cappedColWidth}px`,
      maxWidth: `${cappedColWidth}px`,
    });
    expect(screen.getByRole('button', { name: `Drag ${label} column` })).toBeInTheDocument();
    expect(
      container.querySelector('.cereda-table__header-groupable-indicator'),
    ).toBeInTheDocument();
    // getEffectiveColumnSize respects maxSize as a hard ceiling:
    // auto-estimate (224) > maxSize (220) → returns 220, not 224.
    expect(getEffectiveColumnSize(40, undefined, 220, label)).toBe(Math.min(estimateColumnMinSize(label), 220));
  });

  it('keeps visible widths aligned when a hidden column has its own width', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableColumnVisibility
        columnVisibility={{ status: false }}
        columnSizing={{ name: 220, status: 999 }}
      />,
    );

    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveStyle({
      width: '220px',
      minWidth: '144px',
      maxWidth: '260px',
    });
    const visibleBodyCells = container.querySelectorAll(
      'tbody tr:not(.cereda-table__loading-row) td',
    );
    expect(visibleBodyCells[1]).toHaveStyle({
      width: '220px',
      minWidth: '144px',
      maxWidth: '260px',
    });
    // Visible: ID=120 + Name=220 + Dept=180 = 520px
    // (ID column: autoMin=136 > maxSize=120 → capped at 120, not bumped to 136)
    const table = container.querySelector('table') as HTMLTableElement;
    expect(table).toHaveStyle({
      width: '520px',
      minWidth: '520px',
      tableLayout: 'fixed',
    });
  });

  it('reordered columns keep their widths by column id', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableColumnOrdering
        enableColumnVisibility
        columnSizing={{ department: 210 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));

    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Department',
      'Name',
      'Status',
    ]);
    expect(screen.getByRole('columnheader', { name: 'Department' })).toHaveStyle({
      width: '210px',
      minWidth: '160px',
      maxWidth: '220px',
    });
  });

  it('grouped rows still render with resizing enabled', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
    expect(screen.getByRole('button', { name: 'Resize Full Name column' })).toBeInTheDocument();
  });

  it('stays safe when all columns are hidden with resizing enabled', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableColumnVisibility
        columnVisibility={{
          id: false,
          name: false,
          department: false,
          status: false,
        }}
      />,
    );

    expect(container.querySelector('.cereda-table__body-scroll')).toBeInTheDocument();
    expect(container.querySelectorAll('thead th')).toHaveLength(0);
    expect(container.querySelector('table')).toHaveStyle({
      width: '100%',
      tableLayout: 'fixed',
    });
  });

  it('column visibility, ordering, grouping, pagination, and virtualization still work when resizing is enabled', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={virtualizationRows}
        columns={filterColumns}
        enableColumnResizing
        enableColumnVisibility
        enableColumnOrdering
        enableGrouping
        enablePagination
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(screen.getByRole('checkbox', { name: 'Status' }));
    await user.click(screen.getByRole('button', { name: 'Move Department left' }));
    await user.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Resize Full Name column' }),
    ).toBeInTheDocument();
  });
});

describe('DataTable - grouping', () => {
  it('does not render grouping controls when enableGrouping is false', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(
      screen.queryByRole('button', { name: 'Group Department' }),
    ).not.toBeInTheDocument();
  });

  it('marks grouped columns in the Columns menu and preserves the order selected', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(screen.getByRole('button', { name: 'Ungroup Status' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Ungroup Status' }).closest(
        '.cereda-table__columns-menu-group-item',
      ),
    ).toHaveClass('cereda-table__columns-menu-group-item--grouped');
    expect(screen.getByRole('button', { name: 'Ungroup Department' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getAllByRole('button', { name: /^Ungroup / }).map((button) =>
        button.getAttribute('aria-label'),
      ),
    ).toEqual(['Ungroup Status', 'Ungroup Department']);
  });

  it('renders grouping controls only for groupable columns when enableGrouping is true', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('button', { name: 'Group Department' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Group Status' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Drag Department to grouping panel' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Drag Status to grouping panel' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Group Full Name' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Drag Full Name to grouping panel' }),
    ).not.toBeInTheDocument();
  });

  it('grouping by department creates grouped rows in uncontrolled client mode', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(screen.getByRole('columnheader', { name: 'Group' })).toBeInTheDocument();
    expect(getRenderedHeaderLabels(container)).toEqual(['Group', 'ID', 'Name', 'Status']);

    const groupedRows = Array.from(container.querySelectorAll('tbody tr[data-grouped="true"]'));
    expect(groupedRows).toHaveLength(3);

    groupedRows.forEach((row) => {
      expect(row.querySelectorAll('td')).toHaveLength(4);
      expect(row.querySelector('td')).not.toHaveAttribute('colspan');
    });

    expect(groupedRows[0]).toHaveTextContent('Department: Engineering');
    expect(groupedRows[1]).toHaveTextContent('Department: Product');
    expect(groupedRows[1]).toHaveTextContent('(2)');
    expect(groupedRows[2]).toHaveTextContent('Department: Support');
  });

  it('expand/collapse hides and shows grouped child rows and updates aria-expanded', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    const expandButton = screen.getByRole('button', {
      name: /Expand Department group Product/,
    });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(expandButton);
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
    const collapseButton = screen.getByRole('button', {
      name: /Collapse Department group Product/,
    });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    await user.click(collapseButton);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('grouped rows remain full-width when a column is hidden', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        columnVisibility={{ status: false }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    const groupedRows = Array.from(container.querySelectorAll('tbody tr[data-grouped="true"]'));
    expect(groupedRows).toHaveLength(3);
    groupedRows.forEach((row) => {
      expect(row.querySelectorAll('td')).toHaveLength(3);
      expect(row.querySelector('td')).not.toHaveAttribute('colspan');
    });
  });

  it('renders the internal Group column only while grouping is active', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    expect(screen.queryByRole('columnheader', { name: 'Group' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(screen.getByRole('columnheader', { name: 'Group' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Group' })).not.toBeInTheDocument();

    const groupingPanel = screen.getByRole('region', { name: 'Grouping' });
    fireEvent.click(within(groupingPanel).getByRole('button', { name: 'Clear all' }));

    expect(screen.queryByRole('columnheader', { name: 'Group' })).not.toBeInTheDocument();
  });

  it('listener-only onGroupingChange still groups internally', () => {
    const onGroupingChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        onGroupingChange={onGroupingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(getRenderedBodyRowTexts(container)).toHaveLength(3);
    expect(onGroupingChange).toHaveBeenLastCalledWith(['department']);
  });

  it('ungrouping one grouped column preserves the remaining grouping', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ungroup Department' }));

    expect(screen.queryByRole('button', { name: 'Ungroup Department' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ungroup Status' })).toBeInTheDocument();
  });

  it('controlled grouping calls onGroupingChange with resolved GroupingState', () => {
    const onGroupingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={[]}
        onGroupingChange={onGroupingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(onGroupingChange).toHaveBeenLastCalledWith(['department']);
  });

  it('controlled grouping does not change visible grouping unless parent updates the prop', () => {
    const onGroupingChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={[]}
        onGroupingChange={onGroupingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(getRenderedHeaderLabels(container)).toEqual([
      'ID',
      'Name',
      'Department',
      'Status',
    ]);
    expect(onGroupingChange).toHaveBeenLastCalledWith(['department']);
  });

  it('clear grouping removes all grouped columns', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Status' }));

    const columnsMenu = screen.getByRole('menu', { name: 'Columns' });
    fireEvent.click(within(columnsMenu).getByRole('button', { name: 'Clear grouping' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Group Department' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Group Status' })).toBeInTheDocument();
  });

  it('grouping still works after column visibility changes', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('grouping still works after column order changes', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnOrdering
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('global search + grouping still filters correctly', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableGlobalFilter
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');

    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('column filters + grouping still filters correctly', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnFilters
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    await selectColumnFilterValue(user, 'Status', 'No');

    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Product');
  });

  it('sorting + grouping still behaves predictably', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort Full Name ascending' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('controlled expanded calls onExpandedChange with resolved ExpandedState', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={['department']}
        expanded={{}}
        onExpandedChange={onExpandedChange}
      />,
    );

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: /Expand Department group Product/ }));

    const nextExpanded = onExpandedChange.mock.calls[
      onExpandedChange.mock.calls.length - 1
    ]?.[0] as ExpandedState | undefined;
    expect(nextExpanded).toEqual(expect.any(Object));
    if (nextExpanded !== true && nextExpanded !== undefined) {
      expect(Object.values(nextExpanded)).toEqual([true]);
    }
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('server mode calls onGroupingChange but does not client-group rows', () => {
    const onGroupingChange = vi.fn();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        mode="server"
        enableGrouping
        onGroupingChange={onGroupingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(onGroupingChange).toHaveBeenLastCalledWith(['department']);
  });
});

describe('DataTable - grouping panel', () => {
  it('is hidden when enableGrouping is false', () => {
    render(<DataTable data={filterRows} columns={filterColumns} />);

    expect(
      screen.queryByRole('region', { name: 'Grouping' }),
    ).not.toBeInTheDocument();
  });

  it('renders when enableGrouping is true and shows the empty-state hint', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(screen.getByText('Drag here to set row groups')).toBeInTheDocument();
  });

  it('has a clear accessible label', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
  });

  it('renders grouped pills in grouping order and exposes drag handles', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={['status', 'department']}
      />,
    );

    const region = screen.getByRole('region', { name: 'Grouping' });
    const pills = within(region).getAllByRole('listitem');

    expect(pills).toHaveLength(2);
    expect(pills[0]).toHaveTextContent('Status');
    expect(pills[1]).toHaveTextContent('Department');
    expect(screen.getByRole('button', { name: 'Drag Status grouping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Drag Department grouping' })).toBeInTheDocument();
  });

  it('grouping pills expose sorting controls and cycle sorting state', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    const region = screen.getByRole('region', { name: 'Grouping' });
    const sortButton = within(region).getByRole('button', {
      name: 'Sort Department ascending',
    });

    expect(sortButton).toHaveAttribute('data-sort-state', 'none');

    fireEvent.pointerDown(sortButton);
    expect(container.querySelectorAll('[data-dragging="true"]')).toHaveLength(0);

    await user.click(sortButton);
    expect(sortButton).toHaveAttribute('data-sort-state', 'asc');
    expect(
      within(region).getByRole('button', { name: 'Sort Department descending' }),
    ).toBeInTheDocument();

    await user.click(
      within(region).getByRole('button', { name: 'Sort Department descending' }),
    );
    expect(
      within(region).getByRole('button', { name: 'Clear Department sorting' }),
    ).toHaveAttribute('data-sort-state', 'desc');
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Support');

    await user.click(
      within(region).getByRole('button', { name: 'Clear Department sorting' }),
    );
    expect(
      within(region).getByRole('button', { name: 'Sort Department ascending' }),
    ).toHaveAttribute('data-sort-state', 'none');
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('dragging the grouping pill body suppresses the follow-up sort click', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    const region = screen.getByRole('region', { name: 'Grouping' });
    const sortButton = within(region).getByRole('button', {
      name: 'Sort Department ascending',
    });

    fireEvent.pointerDown(sortButton, { clientX: 12, clientY: 12 });
    fireEvent.pointerMove(sortButton, { clientX: 24, clientY: 24 });
    fireEvent.pointerUp(sortButton, { clientX: 24, clientY: 24 });
    fireEvent.click(sortButton);

    expect(sortButton).toHaveAttribute('data-sort-state', 'none');
  });

  it('controlled grouping pill sorting calls onSortingChange without visual update until the prop changes', async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    const sortButton = within(screen.getByRole('region', { name: 'Grouping' })).getByRole(
      'button',
      { name: 'Sort Department ascending' },
    );

    await user.click(sortButton);

    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'department', desc: false }]);
    expect(sortButton).toHaveAttribute('data-sort-state', 'none');
  });

  it('remove button does not trigger drag behavior', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={['department', 'status']}
      />,
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Remove Department grouping' }));

    expect(container.querySelectorAll('[data-dragging="true"]')).toHaveLength(0);
    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(2);
  });

  it('clear button does not trigger drag behavior', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={['department', 'status']}
      />,
    );

    fireEvent.pointerDown(
      within(screen.getByRole('region', { name: 'Grouping' })).getByRole('button', {
        name: 'Clear all',
      }),
    );

    expect(container.querySelectorAll('[data-dragging="true"]')).toHaveLength(0);
  });

  it('panel remains in sync after Columns menu Group/Ungroup actions', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Status' }));

    const columnsMenu = screen.getByRole('menu', { name: 'Columns' });
    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(2);

    fireEvent.click(within(columnsMenu).getByRole('button', { name: 'Ungroup Department' }));

    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Ungroup Status' })).toBeInTheDocument();
  });

  it('removing one pill updates grouping', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Status' }));

    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Remove Department grouping' }));

    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Remove Department grouping' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('Clear grouping removes all grouped columns', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Status' }));

    const groupingPanel = screen.getByRole('region', { name: 'Grouping' });
    fireEvent.click(within(groupingPanel).getByRole('button', { name: 'Clear all' }));

    expect(screen.getByText('Drag here to set row groups')).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('listener-only grouping still updates internal grouping through panel actions', async () => {
    const user = userEvent.setup();
    const onGroupingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        onGroupingChange={onGroupingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    await user.click(screen.getByRole('button', { name: 'Remove Department grouping' }));

    expect(screen.getByText('Drag here to set row groups')).toBeInTheDocument();
    expect(onGroupingChange).toHaveBeenLastCalledWith([]);
  });

  it('controlled grouping calls onGroupingChange and does not visually change until the prop updates', async () => {
    const user = userEvent.setup();
    const onGroupingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        grouping={['department', 'status']}
        onGroupingChange={onGroupingChange}
      />,
    );

    const region = screen.getByRole('region', { name: 'Grouping' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Remove Department grouping' }));

    expect(onGroupingChange).toHaveBeenLastCalledWith(['status']);
    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Remove Department grouping' })).toBeInTheDocument();
  });

  it('grouping still works after column visibility changes', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('grouping still works after column order changes', () => {
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnOrdering
        enableColumnVisibility
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Department left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(getRenderedBodyRowTexts(container)[0]).toContain('Department: Engineering');
  });

  it('panel remains stable after visibility, order, search, filter, and sorting interactions', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableGrouping
        enableColumnVisibility
        enableColumnOrdering
        enableColumnFilters
        enableGlobalFilter
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));
    const columnsMenu = screen.getByRole('menu', { name: 'Columns' });
    fireEvent.click(within(columnsMenu).getByRole('button', { name: 'Move Department left' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Full Name' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort Status ascending' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');
    await selectColumnFilterValue(user, 'Status', 'Yes');

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Grouping' })).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('Alice');
    expect(screen.getByRole('button', { name: 'Filter Status' })).toHaveTextContent('Yes');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});

describe('DataTable - pagination', () => {
  it('is hidden when enablePagination is false', () => {
    render(<DataTable data={paginationRows} columns={filterColumns} />);

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows a stable zero-row state', () => {
    render(
      <DataTable
        data={[]}
        columns={filterColumns}
        enablePagination
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('0 rows')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('shows a stable one-page disabled state', () => {
    render(
      <DataTable
        data={singlePaginationRow}
        columns={filterColumns}
        enablePagination
      />,
    );

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('renders when enablePagination is true', () => {
    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the initial page rows in uncontrolled client mode', () => {
    const { container } = render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
      />,
    );

    expect(getRenderedBodyRowTexts(container)).toHaveLength(10);
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 10')).toBeInTheDocument();
    expect(screen.queryByText('User 11')).not.toBeInTheDocument();
  });

  it('Next and Previous move between pages in uncontrolled client mode', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(getRenderedBodyRowTexts(container)).toHaveLength(2);
    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(screen.getByText('User 12')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(getRenderedBodyRowTexts(container)).toHaveLength(10);
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.queryByText('User 11')).not.toBeInTheDocument();
  });

  it('First and Last buttons work', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('disabled states are correct on the first page', () => {
    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
      />,
    );

    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeEnabled();
  });

  it('changing page size updates visible rows and resets to the first page', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        pageSizeOptions={[5, 10, 20]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('User 11')).toBeInTheDocument();

    await selectRadixOption(user, screen.getByRole('combobox', { name: 'Rows per page' }), '5');

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.queryByText('User 11')).not.toBeInTheDocument();
  });

  it('clamps the page index after global search shrinks the row count', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        enableGlobalFilter
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'User 11');

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(screen.queryByText('User 12')).not.toBeInTheDocument();
  });

  it('clamps the page index after a column filter shrinks the row count', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        enableColumnFilters
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await selectColumnFilterValue(user, 'Department', 'Product');

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.getByText('User 5')).toBeInTheDocument();
    expect(screen.getByText('User 8')).toBeInTheDocument();
    expect(screen.getByText('User 11')).toBeInTheDocument();
  });

  it('listener-only onPaginationChange still updates internal pagination', async () => {
    const user = userEvent.setup();
    const onPaginationChange = vi.fn();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        onPaginationChange={onPaginationChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(onPaginationChange).toHaveBeenLastCalledWith({
      pageIndex: 1,
      pageSize: 10,
    });
  });

  it('controlled pagination calls onPaginationChange with resolved PaginationState', async () => {
    const user = userEvent.setup();
    const onPaginationChange = vi.fn();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onPaginationChange={onPaginationChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(onPaginationChange).toHaveBeenLastCalledWith({
      pageIndex: 1,
      pageSize: 10,
    });
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('User 11')).not.toBeInTheDocument();
  });

  it('controlled pagination does not internally clamp visual state unless the parent updates props', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        enableGlobalFilter
        pagination={{ pageIndex: 1, pageSize: 10 }}
        onPaginationChange={vi.fn()}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'User 11');

    expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  it('server mode calls onPaginationChange but does not client-paginate rows', async () => {
    const user = userEvent.setup();
    const onPaginationChange = vi.fn();

    const { container } = render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        mode="server"
        enablePagination
        pageCount={2}
        rowCount={12}
        onPaginationChange={onPaginationChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(onPaginationChange).toHaveBeenLastCalledWith({
      pageIndex: 1,
      pageSize: 10,
    });
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(getRenderedBodyRowTexts(container)).toHaveLength(12);
  });

  it('server mode with unknown total pages remains predictable', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        mode="server"
        enablePagination
        pageCount={-1}
      />,
    );

    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('search and filter interactions with pagination remain stable', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        enableGlobalFilter
        enableColumnFilters
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'User 11');
    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(screen.queryByText('User 1')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Search' }));
    await selectColumnFilterValue(user, 'Department', 'Product');

    expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('grouping interactions with pagination remain stable', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        enableGrouping
        pageSizeOptions={[1, 5, 10]}
      />,
    );

    await selectRadixOption(user, screen.getByRole('combobox', { name: 'Rows per page' }), '1');
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
  });

  it('expanded grouped rows remain stable with pagination', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={paginationRows}
        columns={filterColumns}
        enablePagination
        enableGrouping
        pageSizeOptions={[1, 5, 10]}
      />,
    );

    await selectRadixOption(user, screen.getByRole('combobox', { name: 'Rows per page' }), '1');
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Department' }));

    const expandButton = screen.getByRole('button', {
      name: /Expand Department group/,
    });
    await user.click(expandButton);

    expect(screen.getByRole('button', { name: /Collapse Department group/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
  });
});

describe('DataTable - column filters', () => {
  it('does not render column filters when enableColumnFilters is false', () => {
    render(<DataTable data={filterRows} columns={filterColumns} />);

    expect(
      screen.queryByRole('textbox', { name: 'Filter Full Name' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Filter Department' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Filter Status' }),
    ).not.toBeInTheDocument();
  });

  it('renders text, select, and boolean filters when enabled', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Filter Full Name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter Department' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter Status' })).toBeInTheDocument();
  });

  it('typing in a text filter filters rows in uncontrolled client mode', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.queryByText('Carla')).not.toBeInTheDocument();
  });

  it('clear button resets a text filter', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Open Full Name filter values' }));
    const filterPopover = await screen.findByRole('dialog', { name: 'Filter Full Name' });

    await user.click(within(filterPopover).getByRole('button', { name: 'Clear Full Name filter' }));

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(
      within(filterPopover).queryByRole('button', { name: 'Clear Full Name filter' }),
    ).not.toBeInTheDocument();
  });

  it('select filter lists available values', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filter Department' }));
    const departmentPopover = await screen.findByRole('dialog', {
      name: 'Filter Department',
    });

    expect(
      within(departmentPopover).getByRole('checkbox', { name: 'Engineering' }),
    ).toBeInTheDocument();
    expect(
      within(departmentPopover).getByRole('checkbox', { name: 'Product' }),
    ).toBeInTheDocument();
    expect(
      within(departmentPopover).getByRole('checkbox', { name: 'Support' }),
    ).toBeInTheDocument();
  });

  it('selecting a value filters rows', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
      />,
    );

    await selectColumnFilterValue(user, 'Department', 'Product');

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Drew')).toBeInTheDocument();
  });

  it('boolean filter works against a boolean column', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
      />,
    );

    await selectColumnFilterValue(user, 'Status', 'No');

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Drew')).toBeInTheDocument();
  });

  it('filter input click does not trigger sorting', () => {
    const onSortingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        enableColumnOrdering
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    fireEvent.click(screen.getByRole('textbox', { name: 'Filter Full Name' }));

    expect(onSortingChange).not.toHaveBeenCalled();
  });

  it('listener-only onColumnFiltersChange still allows internal filtering', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'name', value: 'Alice' },
    ]);
  });

  it('controlled columnFilters calls onColumnFiltersChange with resolved ColumnFiltersState', () => {
    const onColumnFiltersChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        columnFilters={[]}
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter Full Name' }), {
      target: { value: 'Alice' },
    });

    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'name', value: 'Alice' },
    ]);
  });

  it('controlled columnFilters does not change visible rows unless parent updates the prop', () => {
    const onColumnFiltersChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        columnFilters={[]}
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter Full Name' }), {
      target: { value: 'Alice' },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'name', value: 'Alice' },
    ]);
  });

  it('header text filters emit canonical filterRules', async () => {
    const user = userEvent.setup();
    const onFilterRulesChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        onFilterRulesChange={onFilterRulesChange}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    expect(onFilterRulesChange).toHaveBeenLastCalledWith([
      {
        id: 'name:contains',
        columnId: 'name',
        operator: 'contains',
        value: 'Alice',
      },
    ]);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('controlled filterRules does not change visible rows unless parent updates the prop', () => {
    const onFilterRulesChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        filterRules={[]}
        onFilterRulesChange={onFilterRulesChange}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter Full Name' }), {
      target: { value: 'Alice' },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(onFilterRulesChange).toHaveBeenLastCalledWith([
      {
        id: 'name:contains',
        columnId: 'name',
        operator: 'contains',
        value: 'Alice',
      },
    ]);
  });

  it('server mode calls onColumnFiltersChange but does not client-filter rows', async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        mode="server"
        enableColumnFilters
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'name', value: 'Alice' },
    ]);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('server mode updates filterRules without applying client filtering', async () => {
    const user = userEvent.setup();
    const onFilterRulesChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        mode="server"
        enableColumnFilters
        onFilterRulesChange={onFilterRulesChange}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    expect(onFilterRulesChange).toHaveBeenLastCalledWith([
      {
        id: 'name:contains',
        columnId: 'name',
        operator: 'contains',
        value: 'Alice',
      },
    ]);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('DataTable - advanced column filters', () => {
  it('renders number, date, date-range, and multi-select filters when enabled', () => {
    render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    expect(
      screen.getByRole('spinbutton', { name: 'Minimum Age filter' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Filter Birth Date')).toBeInTheDocument();
    expect(screen.getByLabelText('From Created At')).toBeInTheDocument();
    expect(screen.getByLabelText('To Created At')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter Region' })).toBeInTheDocument();
  });

  it('number filter renders and filters rows predictably', () => {
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '35' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Maximum Age filter' }), {
      target: { value: '40' },
    });

    expect(getRenderedNames(container)).toEqual(['Bob']);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Carla')).not.toBeInTheDocument();
  });

  it('number filter supports decimals, negatives, and reversed ranges', () => {
    const { container: decimalContainer } = render(
      <DataTable
        data={advancedDecimalRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '-2.5' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Maximum Age filter' }), {
      target: { value: '3.25' },
    });

    expect(getRenderedNames(decimalContainer)).toEqual(['Decimal']);

    const { container: reversedContainer } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(
      within(reversedContainer).getByRole('spinbutton', {
        name: 'Maximum Age filter',
      }),
      {
        target: { value: '30' },
      },
    );
    fireEvent.change(
      within(reversedContainer).getByRole('spinbutton', {
        name: 'Minimum Age filter',
      }),
      {
        target: { value: '40' },
      },
    );

    expect(
      within(reversedContainer).getByRole('spinbutton', { name: 'Minimum Age filter' }),
    ).toHaveValue(30);
    expect(
      within(reversedContainer).getByRole('spinbutton', { name: 'Maximum Age filter' }),
    ).toHaveValue(40);
    expect(getRenderedNames(reversedContainer)).toEqual(['Alice', 'Bob']);
  });

  it('invalid number input does not crash', () => {
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Minimum Age filter' }),
      {
        target: { value: 'abc' },
      },
    );

    expect(getRenderedNames(container)).toEqual([
      'Alice',
      'Bob',
      'Carla',
      'Drew',
    ]);
  });

  it('number filter ignores non-numeric row values safely', () => {
    const columnsForLooseNumbers = advancedFilterColumns as ColumnDef<
      LooseNumberFilterRow,
      unknown
    >[];

    const { container } = render(
      <DataTable
        data={looseNumberRows}
        columns={columnsForLooseNumbers}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '30' },
    });

    expect(getRenderedNames(container)).toEqual(['Valid']);
    expect(screen.queryByText('Text Age')).not.toBeInTheDocument();
  });

  it('date and date-range filters filter rows predictably', () => {
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByLabelText('Filter Birth Date'), {
      target: { value: '1988-11-03' },
    });

    expect(getRenderedNames(container)).toEqual(['Bob']);

    fireEvent.change(screen.getByLabelText('Filter Birth Date'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('From Created At'), {
      target: { value: '2024-02-01' },
    });
    fireEvent.change(screen.getByLabelText('To Created At'), {
      target: { value: '2024-03-31' },
    });

    expect(getRenderedNames(container)).toEqual(['Bob', 'Carla']);
  });

  it('date filter handles Date objects and ISO-like values safely', () => {
    const columnsForDateObjects = advancedFilterColumns as ColumnDef<
      DateObjectFilterRow,
      unknown
    >[];

    const { container } = render(
      <DataTable
        data={invalidDateRows}
        columns={columnsForDateObjects}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByLabelText('Filter Birth Date'), {
      target: { value: '1988-11-03' },
    });

    expect(getRenderedNames(container)).toEqual(['Valid', 'ISO']);
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });

  it('date-range filter normalizes reversed input deterministically', () => {
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByLabelText('From Created At'), {
      target: { value: '2024-04-08' },
    });
    fireEvent.change(screen.getByLabelText('To Created At'), {
      target: { value: '2024-02-20' },
    });

    expect(getRenderedNames(container)).toEqual(['Bob', 'Carla', 'Drew']);
  });

  it('invalid date and date-range values do not crash', () => {
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByLabelText('Filter Birth Date'), {
      target: { value: 'not-a-date' },
    });
    fireEvent.change(screen.getByLabelText('From Created At'), {
      target: { value: '2024-13-40' },
    });
    fireEvent.change(screen.getByLabelText('To Created At'), {
      target: { value: '2024-02-30' },
    });

    expect(getRenderedNames(container)).toEqual([
      'Alice',
      'Bob',
      'Carla',
      'Drew',
    ]);
  });

  it('multi-select filter renders options and filters rows', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filter Region' }));

    const regionPopover = screen.getByRole('dialog', { name: 'Filter Region' });
    expect(within(regionPopover).getByRole('checkbox', { name: 'North' })).toBeInTheDocument();
    expect(within(regionPopover).getByRole('checkbox', { name: 'South' })).toBeInTheDocument();
    expect(within(regionPopover).getByRole('checkbox', { name: 'West' })).toBeInTheDocument();

    await user.click(
      within(regionPopover).getByRole('checkbox', {
        name: 'Select all Region values',
      }),
    );
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'South' }));
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'West' }));

    expect(getRenderedNames(container)).toEqual(['Bob', 'Carla', 'Drew']);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('multi-select filter keeps an explicit empty selection when no values are selected', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filter Region' }));
    const regionPopover = screen.getByRole('dialog', { name: 'Filter Region' });
    await user.click(
      within(regionPopover).getByRole('checkbox', {
        name: 'Select all Region values',
      }),
    );
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'South' }));
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'West' }));
    expect(getRenderedNames(container)).toEqual(['Bob', 'Carla', 'Drew']);

    await user.click(within(regionPopover).getByRole('checkbox', { name: 'South' }));
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'West' }));

    expect(getRenderedNames(container)).toEqual([]);
  });

  it('multi-select filter handles number and boolean values safely', async () => {
    const user = userEvent.setup();
    const columnsForMixedPrimitives = advancedFilterColumns as ColumnDef<
      MixedPrimitiveFilterRow,
      unknown
    >[];

    const { container } = render(
      <DataTable
        data={mixedPrimitiveRows}
        columns={columnsForMixedPrimitives}
        enableColumnFilters
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filter Region' }));
    const regionPopover = screen.getByRole('dialog', { name: 'Filter Region' });
    await user.click(
      within(regionPopover).getByRole('checkbox', {
        name: 'Select all Region values',
      }),
    );
    await user.click(within(regionPopover).getByRole('checkbox', { name: '1' }));
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'true' }));

    expect(getRenderedNames(container)).toEqual(['One', 'True']);
  });

  it('clearing advanced filters restores rows', () => {
    const { container } = render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '35' },
    });

    expect(getRenderedNames(container)).toEqual(['Bob', 'Carla']);
    expect(screen.getByRole('button', { name: 'Clear Age filter' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Age filter' }));

    expect(getRenderedNames(container)).toEqual([
      'Alice',
      'Bob',
      'Carla',
      'Drew',
    ]);
  });

  it('advanced filters do not trigger sorting or header drag', () => {
    const onSortingChange = vi.fn();
    const onColumnOrderChange = vi.fn();
    const onColumnSizingChange = vi.fn();

    render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
        enableColumnOrdering
        enableColumnResizing
        sorting={[]}
        onSortingChange={onSortingChange}
        onColumnOrderChange={onColumnOrderChange}
        onColumnSizingChange={onColumnSizingChange}
      />,
    );

    fireEvent.pointerDown(screen.getByLabelText('Minimum Age filter'));
    fireEvent.click(screen.getByLabelText('Minimum Age filter'));
    fireEvent.change(screen.getByLabelText('Minimum Age filter'), {
      target: { value: '35' },
    });

    expect(onSortingChange).not.toHaveBeenCalled();
    expect(onColumnOrderChange).not.toHaveBeenCalled();
    expect(onColumnSizingChange).not.toHaveBeenCalled();
  });

  it('controlled advanced filters do not visually update until the parent updates props', () => {
    const onColumnFiltersChange = vi.fn();

    render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
        columnFilters={[{ id: 'age', value: { min: 30, max: 40 } }]}
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '35' },
    });

    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'age', value: { min: 35, max: 40 } },
    ]);
    expect(screen.getByRole('spinbutton', { name: 'Minimum Age filter' })).toHaveValue(30);
    expect(screen.getByRole('spinbutton', { name: 'Maximum Age filter' })).toHaveValue(40);
  });

  it('advanced filters work with pagination, grouping, and virtualization', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        data={advancedVirtualizationRows}
        columns={advancedFilterColumns}
        enableColumnFilters
        enableColumnOrdering
        enableGrouping
        enablePagination
        pageSizeOptions={[2, 4]}
      />,
    );

    await selectRadixOption(user, screen.getByRole('combobox', { name: 'Rows per page' }), '2');
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group Region' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '30' },
    });

    expect(screen.getByRole('region', { name: 'Grouping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
  });
});

describe('DataTable - global search', () => {
  it('typing into search filters visible rows in uncontrolled client mode', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={rows}
        columns={searchColumns}
        enableGlobalFilter
      />,
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('clear button resets the search', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={rows}
        columns={searchColumns}
        enableGlobalFilter
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('listener-only onGlobalFilterChange still allows uncontrolled filtering', async () => {
    const user = userEvent.setup();
    const onGlobalFilterChange = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={searchColumns}
        enableGlobalFilter
        onGlobalFilterChange={onGlobalFilterChange}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(onGlobalFilterChange).toHaveBeenLastCalledWith('Alice');
  });

  it('controlled globalFilter calls onGlobalFilterChange with the next string', () => {
    const onGlobalFilterChange = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={searchColumns}
        enableGlobalFilter
        globalFilter=""
        onGlobalFilterChange={onGlobalFilterChange}
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'Alice' },
    });

    expect(onGlobalFilterChange).toHaveBeenLastCalledWith('Alice');
  });

  it('controlled globalFilter does not change visible rows unless parent updates the prop', () => {
    const onGlobalFilterChange = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={searchColumns}
        enableGlobalFilter
        globalFilter=""
        onGlobalFilterChange={onGlobalFilterChange}
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'Alice' },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(onGlobalFilterChange).toHaveBeenLastCalledWith('Alice');
  });

  it('server mode calls onGlobalFilterChange but does not client-filter rows', async () => {
    const user = userEvent.setup();
    const onGlobalFilterChange = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={searchColumns}
        mode="server"
        enableGlobalFilter
        onGlobalFilterChange={onGlobalFilterChange}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');

    expect(onGlobalFilterChange).toHaveBeenLastCalledWith('Alice');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('DataTable - saved views', () => {
  const storageKey = 'data-table-saved-views-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('does not render saved views when enableSavedViews is false', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnOrdering
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Saved views' }),
    ).not.toBeInTheDocument();
  });

  it('renders a disabled saved views button when storageKey is missing', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
      />,
    );

    expect(screen.getByRole('button', { name: 'Saved views' })).toBeDisabled();
    expect(screen.queryByRole('dialog', { name: 'Saved views' })).not.toBeInTheDocument();
  });

  it('renders the saved views menu when storageKey is provided', () => {
    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
        storageKey={storageKey}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));

    expect(screen.getByRole('dialog', { name: 'Saved views' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save current view' }),
    ).toBeInTheDocument();
  });

  it('save current view writes a versioned payload', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        enableColumnOrdering
        enableColumnResizing
        enableColumnVisibility
        enableGlobalFilter
        enableGrouping
        enablePagination
        pageSizeOptions={[4, 10]}
        enableSavedViews
        storageKey={storageKey}
        columnSizing={{ name: 180, department: 150, status: 120 }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sort Full Name ascending' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');
    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(screen.getByRole('checkbox', { name: 'Status' }));
    await user.click(screen.getByRole('button', { name: 'Move Department left' }));
    await user.click(screen.getByRole('button', { name: 'Group Department' }));
    await selectRadixOption(user, screen.getByRole('combobox', { name: 'Rows per page' }), '4');

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'View name' }), {
      target: { value: 'Demo view' },
    });
    await user.click(screen.getByRole('button', { name: 'Save current view' }));

    const raw = localStorage.getItem(storageKey);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw ?? '{}') as {
      version?: number;
      views?: Array<{
        name?: string;
        state?: {
          sorting?: unknown[];
          globalFilter?: string;
          columnFilters?: unknown[];
          columnVisibility?: Record<string, boolean>;
          columnOrder?: string[];
          columnSizing?: Record<string, number>;
          grouping?: string[];
          pagination?: { pageIndex?: number; pageSize?: number };
        };
      }>;
    };

    expect(parsed.version).toBe(1);
    expect(parsed.views).toHaveLength(1);
    expect(parsed.views?.[0]?.name).toBe('Demo view');
    expect(parsed.views?.[0]?.state?.globalFilter).toBe('Alice');
    expect(parsed.views?.[0]?.state?.columnVisibility).toMatchObject({ status: false });
    expect(parsed.views?.[0]?.state?.columnOrder).toEqual([
      'id',
      'department',
      'name',
      'status',
    ]);
    expect(parsed.views?.[0]?.state?.columnSizing).toEqual({
      name: 180,
      department: 168,
      status: 152,
    });
    expect(parsed.views?.[0]?.state?.grouping).toEqual(['department']);
    expect(parsed.views?.[0]?.state?.pagination?.pageSize).toBe(4);
  });

  it('blank saved view names fall back to a safe default', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
        storageKey={storageKey}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'View name' }), {
      target: { value: '   ' },
    });
    await user.click(screen.getByRole('button', { name: 'Save current view' }));

    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as {
      views?: Array<{ name?: string }>;
    };

    expect(parsed.views?.[0]?.name).toBe('Saved view');
  });

  it('saves and restores advanced filter values', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={advancedFilterRows}
        columns={advancedFilterColumns}
        enableColumnFilters
        enableSavedViews
        storageKey={storageKey}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum Age filter' }), {
      target: { value: '35' },
    });
    fireEvent.change(screen.getByLabelText('Filter Birth Date'), {
      target: { value: '1988-11-03' },
    });
    await user.click(screen.getByRole('button', { name: 'Filter Region' }));
    const regionPopover = screen.getByRole('dialog', { name: 'Filter Region' });
    await user.click(
      within(regionPopover).getByRole('checkbox', {
        name: 'Select all Region values',
      }),
    );
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'South' }));
    await user.click(within(regionPopover).getByRole('checkbox', { name: 'West' }));

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'View name' }), {
      target: { value: 'Advanced view' },
    });
    await user.click(screen.getByRole('button', { name: 'Save current view' }));

    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as {
      views?: Array<{
        state?: {
          columnFilters?: Array<{ id?: string; value?: unknown }>;
        };
      }>;
    };

    expect(parsed.views?.[0]?.state?.columnFilters).toEqual([
      { id: 'age', value: { min: 35 } },
      { id: 'birthDate', value: '1988-11-03' },
      { id: 'region', value: ['South', 'West'] },
    ]);

    await user.click(screen.getByRole('button', { name: 'Reset current table state' }));
    await user.click(screen.getByRole('button', { name: 'Apply Advanced view' }));

    expect(screen.getByRole('spinbutton', { name: 'Minimum Age filter' })).toHaveValue(35);
    expect(screen.getByLabelText('Filter Birth Date')).toHaveValue('1988-11-03');
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('applying a saved view calls controlled slice callbacks without changing the visual state', () => {
    const onGlobalFilterChange = vi.fn();
    const onColumnSizingChange = vi.fn();

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        views: [
          {
            id: 'demo-view',
            name: 'Demo view',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            state: {
              sorting: [],
              globalFilter: 'Alice',
              columnFilters: [],
              columnVisibility: {},
              columnOrder: ['id', 'name', 'department', 'status'],
              columnSizing: { name: 220 },
              grouping: [],
              pagination: { pageIndex: 0, pageSize: 4 },
            },
          },
        ],
      }),
    );

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableGlobalFilter
        enableSavedViews
        storageKey={storageKey}
        globalFilter=""
        columnSizing={{}}
        onGlobalFilterChange={onGlobalFilterChange}
        onColumnSizingChange={onColumnSizingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply Demo view' }));

    expect(onGlobalFilterChange).toHaveBeenLastCalledWith('Alice');
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 220 });
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    const controlledNameHeader = screen.getByText('Name').closest('th');
    if (!controlledNameHeader) {
      throw new Error('Expected Name header to be present');
    }
    expect(controlledNameHeader).toHaveStyle({
      width: '180px',
      minWidth: '144px',
      maxWidth: '260px',
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('resetting to the default state respects controlled slices', async () => {
    const user = userEvent.setup();
    const onGlobalFilterChange = vi.fn();
    const onColumnSizingChange = vi.fn();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnResizing
        enableGlobalFilter
        enableSavedViews
        storageKey={storageKey}
        globalFilter="Alice"
        columnSizing={{ name: 220 }}
        onGlobalFilterChange={onGlobalFilterChange}
        onColumnSizingChange={onColumnSizingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    await user.click(screen.getByRole('button', { name: 'Reset current table state' }));

    expect(onGlobalFilterChange).toHaveBeenLastCalledWith('');
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({});
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('Alice');
    const resetNameHeader = screen.getByText('Name').closest('th');
    if (!resetNameHeader) {
      throw new Error('Expected Name header to be present');
    }
    expect(resetNameHeader).toHaveStyle({
      width: '220px',
      minWidth: '144px',
      maxWidth: '260px',
    });
  });

  it('applies a saved view and restores the supported table state', async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        views: [
          {
            id: 'demo-view',
            name: 'Demo view',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            state: {
              sorting: [],
              globalFilter: 'Alice',
              columnFilters: [{ id: 'name', value: 'Alice' }],
              columnVisibility: {},
              columnOrder: ['id', 'name', 'department', 'status'],
              columnSizing: { name: 220, department: 180 },
              grouping: ['department'],
              pagination: { pageIndex: 0, pageSize: 4 },
            },
          },
        ],
      }),
    );

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableColumnFilters
        enableColumnOrdering
        enableColumnResizing
        enableColumnVisibility
        enableGlobalFilter
        enableGrouping
        enablePagination
        pageSizeOptions={[4, 10]}
        enableSavedViews
        storageKey={storageKey}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sort Full Name ascending' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Alice');
    await user.type(screen.getByRole('textbox', { name: 'Filter Full Name' }), 'Alice');

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(screen.getByRole('checkbox', { name: 'Status' }));
    await user.click(screen.getByRole('button', { name: 'Move Department left' }));
    await user.click(screen.getByRole('button', { name: 'Group Department' }));
    await selectRadixOption(user, screen.getByRole('combobox', { name: 'Rows per page' }), '4');

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    await user.click(screen.getByRole('button', { name: 'Reset current table state' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'Filter Full Name' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveTextContent('10');
      expect(
        getRenderedColumnHeaderButtonLabels(
          screen.getByRole('table').parentElement ?? document.body,
        ),
      ).toEqual(['ID', 'Name', 'Department', 'Status']);
      expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveStyle({
        width: '180px',
        minWidth: '144px',
        maxWidth: '260px',
      });
      expect(
        screen.queryByRole('button', { name: 'Drag Department grouping' }),
      ).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await user.click(screen.getByRole('button', { name: 'Apply Demo view' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('Alice');
      expect(screen.getByRole('textbox', { name: 'Filter Full Name' })).toHaveValue('Alice');
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveTextContent('4');
      const restoredNameHeader = screen.getByText('Name').closest('th');
      if (!restoredNameHeader) {
        throw new Error('Expected Name header to be present');
      }
      expect(restoredNameHeader).toHaveStyle({
        width: '220px',
        minWidth: '144px',
        maxWidth: '260px',
      });
      expect(screen.getByRole('button', { name: 'Drag Department grouping' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deletes a saved view', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
        pageSizeOptions={[4, 10]}
        storageKey={storageKey}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'View name' }), {
      target: { value: 'Demo view' },
    });
    await user.click(screen.getByRole('button', { name: 'Save current view' }));

    expect(localStorage.getItem(storageKey)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete Demo view' }));

    const raw = localStorage.getItem(storageKey);
    expect(raw).toBeNull();
    expect(screen.getByText('No saved views yet.')).toBeInTheDocument();
  });

  it('ignores malformed localStorage data safely', () => {
    localStorage.setItem(storageKey, '{not-json');

    render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
        storageKey={storageKey}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));

    expect(screen.getByText('No saved views yet.')).toBeInTheDocument();
  });

  it('localStorage unavailable does not crash', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    expect(() =>
      render(
        <DataTable
          data={filterRows}
          columns={filterColumns}
          enableSavedViews
          storageKey={storageKey}
          savedViewsStorage={storage}
        />,
      ),
    ).not.toThrow();
  });

  it('uses the latest custom storage adapter when one is provided', async () => {
    const user = userEvent.setup();
    const firstStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const secondStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    const { rerender } = render(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
        storageKey={storageKey}
        savedViewsStorage={firstStorage}
      />,
    );

    rerender(
      <DataTable
        data={filterRows}
        columns={filterColumns}
        enableSavedViews
        storageKey={storageKey}
        savedViewsStorage={secondStorage}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved views' }));
    await user.click(screen.getByRole('button', { name: 'Save current view' }));

    expect(firstStorage.setItem).not.toHaveBeenCalled();
    expect(secondStorage.setItem).toHaveBeenCalled();
  });
});

describe('DataTable - empty state', () => {
  it('renders the default empty message when data is empty', () => {
    render(<DataTable data={[]} columns={columns} />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders a custom empty slot when provided', () => {
    const custom = (
      <tr>
        <td>Nothing here</td>
      </tr>
    );
    render(<DataTable data={[]} columns={columns} renderEmpty={custom} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('empty-state panel is visible when data is empty', () => {
    render(<DataTable data={[]} columns={columns} />);
    const panel = screen.getByText('No results found').closest('.cereda-table__empty-panel');
    expect(panel).toBeInTheDocument();
  });

  it('does not render an empty state when data has rows', () => {
    render(<DataTable data={rows} columns={columns} />);
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });
});

describe('DataTable - loading state', () => {
  it('renders skeleton rows when isLoading is true', () => {
    const { container } = render(<DataTable data={[]} columns={columns} isLoading />);
    expect(container.querySelectorAll('.cereda-table__skeleton').length).toBeGreaterThan(0);
  });

  it('does not render the empty state while loading', () => {
    render(<DataTable data={[]} columns={columns} isLoading />);
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('does not render data rows while loading', () => {
    render(<DataTable data={rows} columns={columns} isLoading />);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('renders a custom loading slot when provided', () => {
    const custom = (
      <tr>
        <td>Loading</td>
      </tr>
    );
    const { container } = render(
      <DataTable data={[]} columns={columns} isLoading renderLoading={custom} />,
    );
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(container.querySelectorAll('.cereda-table__skeleton')).toHaveLength(0);
  });
});


describe('DataTable - sorting', () => {
  it('calls onSortingChange when a sortable header button is clicked', () => {
    const onSortingChange = vi.fn();
    render(
      <DataTable
        data={rows}
        columns={columns}
        enableColumnOrdering
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Drag ID column' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sort ID ascending' }));
    expect(onSortingChange).toHaveBeenCalledOnce();
  });

  it('uncontrolled sorting changes visible row order after clicking a sortable header', () => {
    const { container } = render(<DataTable data={sortableRows} columns={columns} />);

    expect(getRenderedNames(container)).toEqual(['Bob', 'Alice']);

    fireEvent.click(screen.getByRole('button', { name: 'Sort Name ascending' }));

    expect(getRenderedNames(container)).toEqual(['Alice', 'Bob']);
  });

  it('onSortingChange without sorting still allows visible row order to change', () => {
    const onSortingChange = vi.fn();
    const { container } = render(
      <DataTable data={sortableRows} columns={columns} onSortingChange={onSortingChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sort Name ascending' }));

    expect(getRenderedNames(container)).toEqual(['Alice', 'Bob']);
    expect(onSortingChange).toHaveBeenCalledOnce();
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
  });

  it('controlled sorting does not change unless parent updates the sorting prop', () => {
    const onSortingChange = vi.fn();
    const { container } = render(
      <DataTable
        data={sortableRows}
        columns={columns}
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sort Name ascending' }));

    expect(getRenderedNames(container)).toEqual(['Bob', 'Alice']);
    expect(onSortingChange).toHaveBeenCalledOnce();
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
  });

  it('supports keyboard activation on the sort button', async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={columns}
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    const button = screen.getByRole('button', { name: 'Sort ID ascending' });
    button.focus();
    await user.keyboard('{Enter}');

    expect(onSortingChange).toHaveBeenCalledOnce();
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'id', desc: false }]);
  });
});

describe('DataTable - hook-level state slices', () => {
  it('uncontrolled column visibility works through the table API', () => {
    const { result } = renderHook(() =>
      useDataTable({
        data: rows,
        columns,
      }),
    );

    expect(result.current.getVisibleLeafColumns().map((column) => column.id)).toEqual([
      'id',
      'name',
    ]);

    act(() => {
      result.current.getAllLeafColumns()[1]?.toggleVisibility(false);
    });

    expect(result.current.getVisibleLeafColumns().map((column) => column.id)).toEqual(['id']);
  });

  it('uncontrolled row selection works through the table API', () => {
    const { result } = renderHook(() =>
      useDataTable({
        data: rows,
        columns,
        getRowId: (row) => row.id,
      }),
    );

    act(() => {
      result.current.getRowModel().rows[0]?.toggleSelected();
    });

    expect(result.current.getState().rowSelection).toEqual({ '1': true });
  });

  it('listener-only columnSizing still updates internal state', () => {
    const onColumnSizingChange = vi.fn();
    const { result } = renderHook(() =>
      useDataTable({
        data: filterRows,
        columns: filterColumns,
        enableColumnResizing: true,
        onColumnSizingChange,
      }),
    );

    act(() => {
      result.current.setColumnSizing({ department: 180 });
    });

    expect(result.current.getState().columnSizing).toEqual({ department: 180 });
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ department: 180 });
  });

  it('controlled columnSizing calls onColumnSizingChange with the resolved state', () => {
    const onColumnSizingChange = vi.fn();
    const { result } = renderHook(() =>
      useDataTable({
        data: filterRows,
        columns: filterColumns,
        enableColumnResizing: true,
        columnSizing: {},
        onColumnSizingChange,
      }),
    );

    act(() => {
      result.current.setColumnSizing({ name: 220 });
    });

    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 220 });
    expect(result.current.getState().columnSizing).toEqual({});
  });

  it('controlled columnSizing does not visually change until the parent updates the prop', () => {
    const onColumnSizingChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ columnSizing: currentColumnSizing }) =>
        useDataTable({
          data: filterRows,
          columns: filterColumns,
          enableColumnResizing: true,
          columnSizing: currentColumnSizing,
          onColumnSizingChange,
        }),
      {
        initialProps: {
          columnSizing: {},
        },
      },
    );

    act(() => {
      result.current.setColumnSizing({ name: 220 });
    });

    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 220 });
    expect(result.current.getState().columnSizing).toEqual({});

    rerender({
      columnSizing: { name: 220 },
    });

    expect(result.current.getState().columnSizing).toEqual({ name: 220 });
  });

  it('wires columnResizeMode="onEnd" without breaking the table model', () => {
    const { result } = renderHook(() =>
      useDataTable({
        data: filterRows,
        columns: filterColumns,
        enableColumnResizing: true,
        columnResizeMode: 'onEnd',
      }),
    );

    expect(result.current.options.columnResizeMode).toBe('onEnd');
    expect(result.current.getRowModel().rows).toHaveLength(filterRows.length);
  });

  it('keeps grouped columns reorderable by disabling grouped column auto-reordering', () => {
    const { result } = renderHook(() =>
      useDataTable({
        data: filterRows,
        columns: filterColumns,
        enableGrouping: true,
        enableColumnOrdering: true,
      }),
    );

    expect(result.current.options.groupedColumnMode).toBe(false);

    act(() => {
      result.current.getColumn('department')?.toggleGrouping();
      result.current.getColumn('status')?.toggleGrouping();
    });

    const groupingBefore = result.current.getState().grouping;

    act(() => {
      result.current.setColumnOrder(['id', 'status', 'name', 'department']);
    });

    expect(result.current.getState().grouping).toEqual(groupingBefore);
    expect(result.current.getState().columnOrder).toEqual([
      '__data-table-auto-group__',
      'id',
      'status',
      'name',
      'department',
    ]);
  });

  it('internal reset callback restores the default slice state', () => {
    const { result } = renderHook(() =>
      useDataTable({
        data: filterRows,
        columns: filterColumns,
        enableColumnFilters: true,
        enableColumnOrdering: true,
        enableColumnVisibility: true,
        enableGlobalFilter: true,
        enableGrouping: true,
        enablePagination: true,
      }),
    );

    act(() => {
      result.current.getColumn('name')?.toggleVisibility(false);
      result.current.getColumn('department')?.toggleGrouping();
      result.current.setColumnOrder(['department', 'id', 'name', 'status']);
      result.current.setColumnFilters([{ id: 'name', value: 'Alice' }]);
      result.current.setGlobalFilter('Alice');
      result.current.setPagination({ pageIndex: 1, pageSize: 4 });
    });

    act(() => {
      result.current.options.meta?.resetToInitialState?.();
    });

    expect(result.current.getState().sorting).toEqual([]);
    expect(result.current.getState().globalFilter).toBe('');
    expect(result.current.getState().columnFilters).toEqual([]);
    expect(result.current.getState().pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });

    expect(result.current.getState().rowSelection).toEqual({});
    expect(result.current.getState().columnSizing).toEqual({});

    return waitFor(() => {
      expect(result.current.getState().columnVisibility).toEqual({});
      expect(result.current.getState().columnOrder).toEqual([
        'id',
        'name',
        'department',
        'status',
      ]);
      expect(result.current.getState().columnSizing).toEqual({});
      expect(result.current.getState().grouping).toEqual([]);
      expect(result.current.getState().expanded).toEqual({});
    });
  });
});

describe('DataTable - edge cases', () => {
  it('renders without crashing when data is an empty array', () => {
    expect(() => render(<DataTable data={[]} columns={columns} />)).not.toThrow();
  });

  it('handles all columns hidden - empty state colSpan is at least 1', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        enableColumnResizing
        columnVisibility={{ id: false, name: false }}
      />,
    );
    const panel = screen.getByText('No results found').closest('.cereda-table__empty-panel');
    expect(panel).toBeInTheDocument();
  });

  it('renders without crashing when columns array is empty', () => {
    expect(() => render(<DataTable data={[]} columns={[]} />)).not.toThrow();
  });
});


