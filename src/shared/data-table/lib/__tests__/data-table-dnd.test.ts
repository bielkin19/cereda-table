import { describe, expect, it } from 'vitest';

import {
  createDataTableDndData,
  getColumnHeaderDndId,
  getColumnOrderDndId,
  getDataTableDndReorderPlacement,
  getDataTableDndReorderPlacementFromPoint,
  getGroupingMenuDndId,
  getGroupingPanelDndId,
  isDataTableDndZone,
  isGroupingDragSource,
  isGroupingDropTarget,
  readDataTableDndData,
  resolveDataTableDndDropAction,
} from '../data-table-dnd';

describe('data-table dnd helpers', () => {
  it('creates deterministic ids for each DnD zone', () => {
    expect(getColumnOrderDndId('name')).toBe('column-order:name');
    expect(getColumnHeaderDndId('name')).toBe('column-header:name');
    expect(getGroupingMenuDndId('name')).toBe('grouping-menu:name');
    expect(getGroupingPanelDndId('name')).toBe('grouping-panel:name');
  });

  it('parses valid DnD metadata and rejects invalid zones safely', () => {
    expect(
      readDataTableDndData({
        data: { current: createDataTableDndData('column-header', 'name', true, 'Name') },
      }),
    ).toEqual({ zone: 'column-header', columnId: 'name', groupable: true, label: 'Name' });
    expect(isGroupingDragSource(createDataTableDndData('column-header', 'name', true))).toBe(true);
    expect(isGroupingDragSource(createDataTableDndData('column-header', 'name', false))).toBe(false);
    expect(isGroupingDragSource(createDataTableDndData('grouping-menu', 'name', true))).toBe(true);
    expect(isGroupingDropTarget(createDataTableDndData('grouping-panel-drop-zone'))).toBe(true);
    expect(isDataTableDndZone('column-header')).toBe(true);
    expect(isDataTableDndZone('unknown')).toBe(false);
    expect(readDataTableDndData({ data: { current: { zone: 'unknown', columnId: 'name' } } })).toBeUndefined();
    expect(readDataTableDndData({ data: { current: { zone: 'column-header', columnId: 123 } } })).toBeUndefined();
    expect(
      readDataTableDndData({
        data: { current: { zone: 'column-header', columnId: 'name', groupable: 'yes' } },
      }),
    ).toBeUndefined();
    expect(
      readDataTableDndData({
        data: { current: { zone: 'column-header', columnId: 'name', label: 123 } },
      }),
    ).toBeUndefined();
  });

  it('resolves header and grouping drops safely across zones', () => {
    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('column-header', 'department', true),
        createDataTableDndData('grouping-panel'),
      ),
    ).toEqual({ kind: 'append-grouping', columnId: 'department' });

    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('column-header', 'department', true),
        createDataTableDndData('grouping-panel-drop-zone'),
      ),
    ).toEqual({ kind: 'append-grouping', columnId: 'department' });

    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('column-header', 'department', false),
        createDataTableDndData('grouping-panel-drop-zone'),
      ),
    ).toBeUndefined();

    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('column-header', 'name', true),
        createDataTableDndData('column-header', 'department', true),
      ),
    ).toEqual({
      kind: 'reorder-column',
      activeColumnId: 'name',
      overColumnId: 'department',
    });

    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('grouping-menu', 'department', true),
        createDataTableDndData('grouping-panel'),
      ),
    ).toEqual({ kind: 'append-grouping', columnId: 'department' });

    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('grouping-panel', 'department'),
        createDataTableDndData('grouping-panel', 'status'),
      ),
    ).toEqual({
      kind: 'reorder-grouping',
      activeColumnId: 'department',
      overColumnId: 'status',
    });

    expect(
      resolveDataTableDndDropAction(
        createDataTableDndData('grouping-panel', 'department'),
        createDataTableDndData('grouping-panel-drop-zone'),
      ),
    ).toBeUndefined();
  });

  it('derives before and after reorder placement from the active and over rects', () => {
    expect(
      getDataTableDndReorderPlacement(
        { left: 10, top: 0, width: 100, height: 24 },
        { left: 120, top: 0, width: 100, height: 24 },
        'horizontal',
      ),
    ).toBe('before');

    expect(
      getDataTableDndReorderPlacement(
        { left: 140, top: 0, width: 100, height: 24 },
        { left: 120, top: 0, width: 100, height: 24 },
        'horizontal',
      ),
    ).toBe('after');

    expect(
      getDataTableDndReorderPlacement(
        { left: 0, top: 10, width: 100, height: 24 },
        { left: 0, top: 120, width: 100, height: 24 },
        'vertical',
      ),
    ).toBe('before');

    expect(
      getDataTableDndReorderPlacement(
        { left: 0, top: 140, width: 100, height: 24 },
        { left: 0, top: 120, width: 100, height: 24 },
        'vertical',
      ),
    ).toBe('after');
  });

  it('derives before and after reorder placement from the pointer position', () => {
    expect(
      getDataTableDndReorderPlacementFromPoint(
        { clientX: 120, clientY: 12 },
        { left: 100, top: 0, width: 80, height: 24 },
        'horizontal',
      ),
    ).toBe('before');

    expect(
      getDataTableDndReorderPlacementFromPoint(
        { clientX: 175, clientY: 12 },
        { left: 100, top: 0, width: 80, height: 24 },
        'horizontal',
      ),
    ).toBe('after');
  });
});
