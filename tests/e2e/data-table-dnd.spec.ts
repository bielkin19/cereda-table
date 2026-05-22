import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function pointerDrag(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Expected both drag source and target to be visible');
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 16, sourceBox.y + sourceBox.height / 2 + 16);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
  await page.mouse.up();
}

async function beginPointerDrag(page: Page, source: Locator) {
  const sourceBox = await source.boundingBox();

  if (!sourceBox) {
    throw new Error('Expected drag source to be visible');
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const dragX = startX + 32;
  const dragY = startY + 32;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 16, startY + 16);
  await page.mouse.move(dragX, dragY);

  return { dragX, dragY, sourceBox };
}

async function pointerDragToHorizontalPoint(
  page: Page,
  source: Locator,
  target: Locator,
  targetXRatio: number,
) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Expected both drag source and target to be visible');
  }

  const targetX = targetBox.x + targetBox.width * targetXRatio;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 16, sourceBox.y + sourceBox.height / 2 + 16);
  await page.mouse.move(targetX, targetY);
  await page.mouse.up();
}

async function pointerDragToHorizontalPointWithoutRelease(
  page: Page,
  source: Locator,
  target: Locator,
  targetXRatio: number,
) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Expected both drag source and target to be visible');
  }

  const targetX = targetBox.x + targetBox.width * targetXRatio;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 16, sourceBox.y + sourceBox.height / 2 + 16);
  await page.mouse.move(targetX, targetY);

  return { targetX, targetY };
}

async function getHitTestInfo(page: Page, source: Locator) {
  return source.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    const closestButton =
      target?.closest('.data-table__header-main-surface') ??
      target?.closest('button[aria-label^="Drag "]') ??
      target
        ?.closest('.data-table__header-cell[data-column-id]')
        ?.querySelector('.data-table__header-main-surface, button[aria-label^="Drag "]');
    return {
      targetTag: target?.tagName ?? null,
      targetClass: target?.getAttribute('class') ?? null,
      closestButtonLabel: closestButton?.getAttribute('aria-label') ?? null,
    };
  });
}

async function getOverlayInfo(page: Page) {
  const overlay = page.locator('.data-table__dnd-overlay');
  const overlayBox = await overlay.boundingBox();

  return {
    overlay,
    overlayBox,
    label: await overlay.textContent(),
  };
}

async function getHeaderInsertionMarkerInfo(scope: Locator) {
  const marker = scope.locator('.data-table__header-insertion-marker');
  const markerCount = await marker.count();

  if (markerCount === 0) {
    return {
      marker,
      markerBox: null,
      placement: null as string | null,
    };
  }

  return {
    marker,
      markerBox: await marker.first().boundingBox(),
      placement: await marker.first().getAttribute('data-placement'),
    };
  }

async function getVisibleColumnIdsFromHeaders(section: Locator) {
  return section.locator('thead tr:first-child th[data-column-id]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-column-id') ?? ''),
  );
}

async function getVisibleColumnIdsFromFirstBodyRow(section: Locator) {
  return section
    .locator('tbody tr')
    .first()
    .locator('.data-table__td[data-column-id]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-column-id') ?? ''));
}

function getHeaderMainSurface(section: Locator, columnId: string) {
  return section.locator(
    `thead th[data-column-id="${columnId}"] .data-table__header-main-surface`,
  );
}

test.describe('DataTable DnD', () => {
  test('saved views clamp narrow column sizing so Status stays readable', async ({
    page,
  }) => {
    const storageKey = 'cereda-table-demo-saved-views';
    const savedViewsDocument = {
      version: 1,
      views: [
        {
          id: 'narrow-status',
          name: 'Narrow Status',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          state: {
            sorting: [],
            globalFilter: '',
            columnFilters: [],
            columnVisibility: {},
            columnOrder: [
              'id',
              'name',
              'email',
              'department',
              'age',
              'region',
              'status',
              'birthDate',
              'createdAt',
            ],
            columnSizing: {
              status: 40,
              department: 80,
            },
            grouping: [],
            pagination: {
              pageIndex: 0,
              pageSize: 10,
            },
          },
        },
      ],
    } as const;

    await page.addInitScript(
      ({ currentStorageKey, document }) => {
        localStorage.setItem(currentStorageKey, JSON.stringify(document));
      },
      {
        currentStorageKey: storageKey,
        document: savedViewsDocument,
      },
    );

    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    await baseline.getByRole('button', { name: 'Saved views' }).click();
    await baseline.getByRole('button', { name: 'Apply Narrow Status' }).click();

    const statusHeader = baseline.locator('thead tr:first-child th[data-column-id="status"]');
    await expect(statusHeader).toContainText('Status');

    const statusHeaderBox = await statusHeader.boundingBox();
    expect(statusHeaderBox).not.toBeNull();
    if (!statusHeaderBox) {
      return;
    }

    expect(statusHeaderBox.width).toBeGreaterThanOrEqual(152);
    expect(statusHeaderBox.width).toBeLessThanOrEqual(160);
  });

  test('header and menu drag sources can add and reorder grouping in the Vite demo', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const groupingPanel = baseline.getByRole('region', { name: 'Grouping' });

    await expect(groupingPanel).toBeVisible();

    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const fullNameHeaderHandle = getHeaderMainSurface(baseline, 'name');
    const statusHeaderHandle = getHeaderMainSurface(baseline, 'status');
    const regionHeaderHandle = getHeaderMainSurface(baseline, 'region');

    await expect(statusHeaderHandle).toBeVisible();
    await expect(regionHeaderHandle).toBeVisible();
    await expect(
      baseline.locator('thead th[data-column-id="department"] .data-table__header-groupable-indicator'),
    ).toBeVisible();
    await expect(
      baseline.locator('thead th[data-column-id="department"] .data-table__header-groupable-indicator'),
    ).not.toContainText('Group');
    await expect(
      baseline.locator('thead th[data-column-id="status"] .data-table__header-groupable-indicator'),
    ).toBeVisible();
    await expect(
      baseline.locator('thead th[data-column-id="region"] .data-table__header-groupable-indicator'),
    ).toBeVisible();
    await expect(
      baseline.locator('thead th[data-column-id="name"] .data-table__header-groupable-indicator'),
    ).toHaveCount(0);
    await expect(
      baseline.locator('thead th[data-column-id="department"] .data-table__header-label'),
    ).toContainText('Department');

    await pointerDrag(page, departmentHeaderHandle, groupingPanel);

    await expect(
      groupingPanel.getByRole('button', { name: 'Drag Department grouping' }),
    ).toBeVisible();
    await expect(groupingPanel.getByRole('listitem')).toHaveCount(1);
    await expect(baseline.getByRole('columnheader', { name: 'Group' })).toBeVisible();

    const groupedHeaderLabelsAfterDepartment = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();
    expect(groupedHeaderLabelsAfterDepartment).toEqual([
      'Group',
      'Name',
      'Email',
      'Age',
      'Region',
      'Status',
      'Birth Date',
      'Created',
    ]);
    await expect(baseline.getByRole('columnheader', { name: 'Department' })).toHaveCount(0);

    const groupedRowsAfterDepartment = baseline.locator('tbody tr[data-grouped="true"]');
    const headerCellCountAfterDepartment = await baseline.locator('thead tr:first-child th[data-column-id]').count();
    await expect(groupedRowsAfterDepartment.first().locator('td')).toHaveCount(
      headerCellCountAfterDepartment,
    );
    await expect(groupedRowsAfterDepartment.first().locator('td').first()).not.toHaveAttribute(
      'colspan',
    );

    const groupingPanelBox = await groupingPanel.boundingBox();
    if (!groupingPanelBox) {
      throw new Error('Expected grouping panel to be visible');
    }

    await beginPointerDrag(page, fullNameHeaderHandle);
    await page.mouse.move(
      groupingPanelBox.x + groupingPanelBox.width / 2,
      groupingPanelBox.y + groupingPanelBox.height / 2,
    );
    await expect(groupingPanel).not.toHaveClass(/data-table__grouping-panel--drop-target/);
    await expect(groupingPanel).toHaveClass(/data-table__grouping-panel--deny/);
    await page.mouse.up();
    await expect(groupingPanel.getByRole('listitem')).toHaveCount(1);

    await baseline.getByRole('button', { name: 'Columns' }).click();
    const columnsMenu = page.getByRole('menu', { name: 'Columns' });
    await expect(
      columnsMenu
        .locator('.data-table__column-order-item')
        .filter({ hasText: 'Department' })
        .getByLabel('Can be grouped'),
    ).toBeVisible();
    await expect(
      columnsMenu
        .locator('.data-table__column-order-item')
        .filter({ hasText: 'Full Name' })
        .getByLabel('Move only'),
    ).toBeVisible();
    await pointerDrag(
      page,
      columnsMenu.getByRole('button', { name: 'Drag Department to grouping panel' }),
      groupingPanel,
    );
    await expect(groupingPanel.getByRole('listitem')).toHaveCount(1);
  });

  test('grouping pills render horizontally and reorder naturally', async ({ page }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const groupingPanel = baseline.getByRole('region', { name: 'Grouping' });

    await baseline.getByRole('button', { name: 'Columns' }).click();
    const columnsMenu = page.getByRole('menu', { name: 'Columns' });
    await columnsMenu.getByRole('button', { name: 'Group Department' }).click();
    await columnsMenu.getByRole('button', { name: 'Group Status' }).click();
    await expect(columnsMenu.getByRole('button', { name: 'Group Region' })).toBeVisible();
    await columnsMenu.getByRole('button', { name: 'Group Region' }).click();

    const groupingPillList = groupingPanel.locator('.data-table__grouping-pill-list');
    await expect(groupingPillList).toHaveCSS('display', 'flex');
    await expect(groupingPillList).toHaveCSS('flex-wrap', 'nowrap');
    await expect(groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]')).toHaveCount(3);
    await expect(
      groupingPanel.getByRole('button', { name: 'Sort Department ascending' }),
    ).toBeVisible();
    await expect(
      groupingPanel.getByRole('button', { name: 'Sort Status ascending' }),
    ).toBeVisible();
    await expect(
      groupingPanel.getByRole('button', { name: 'Sort Region ascending' }),
    ).toBeVisible();

    const groupingPills = groupingPanel.locator('.data-table__grouping-pill');
    const pillBoxes = await groupingPills.evaluateAll((items) =>
      items.map((item) => {
        const rect = item.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }),
    );

    expect(pillBoxes).toHaveLength(3);
    expect(Math.abs(pillBoxes[0].y - pillBoxes[1].y)).toBeLessThan(4);
    expect(Math.abs(pillBoxes[1].y - pillBoxes[2].y)).toBeLessThan(4);
    expect(Math.abs(pillBoxes[0].width - pillBoxes[1].width)).toBeGreaterThan(8);

    const headerLabelsBeforeGroupingReorder = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();

    const groupingButtonsBefore = await groupingPanel
      .getByRole('button', { name: /^Drag .* grouping$/ })
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? ''));

    const statusGroupingBody = groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]').filter({ hasText: 'Status' }).first();
    const regionGroupingBody = groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]').filter({ hasText: 'Region' }).first();
    const departmentGroupingBody = groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]').filter({ hasText: 'Department' }).first();
    const regionGroupingBox = await regionGroupingBody.boundingBox();
    const departmentGroupingBox = await departmentGroupingBody.boundingBox();
    const statusGroupingBox = await statusGroupingBody.boundingBox();

    expect(regionGroupingBox).not.toBeNull();
    expect(departmentGroupingBox).not.toBeNull();
    expect(statusGroupingBox).not.toBeNull();
    if (!regionGroupingBox || !departmentGroupingBox || !statusGroupingBox) {
      throw new Error('Expected grouping handles to be visible');
    }

    const dragState = await beginPointerDrag(page, regionGroupingBody);
    await page.mouse.move(
      dragState.sourceBox.x + dragState.sourceBox.width + 120,
      dragState.sourceBox.y + dragState.sourceBox.height / 2,
    );
    await page.waitForTimeout(100);

    const pillBoxesDuringDrag = await groupingPanel.locator('.data-table__grouping-pill').evaluateAll((items) =>
      items.map((item) => {
        const rect = item.getBoundingClientRect();
        return { x: rect.x, width: rect.width };
      }),
    );
    const sortedDuringDrag = [...pillBoxesDuringDrag].sort((left, right) => left.x - right.x);
    expect(sortedDuringDrag).toHaveLength(3);
    expect(sortedDuringDrag[0].x + sortedDuringDrag[0].width).toBeLessThanOrEqual(
      sortedDuringDrag[1].x + 4,
    );
    expect(sortedDuringDrag[1].x + sortedDuringDrag[1].width).toBeLessThanOrEqual(
      sortedDuringDrag[2].x + 4,
    );

    await page.mouse.move(
      departmentGroupingBox.x + departmentGroupingBox.width / 2,
      departmentGroupingBox.y + departmentGroupingBox.height / 2,
    );
    await expect(groupingPanel.locator('.data-table__grouping-pill-label')).toHaveText([
      'Region',
      'Department',
      'Status',
    ]);
    await page.mouse.up();

    const groupingButtonsAfterFirstReorder = await groupingPanel
      .getByRole('button', { name: /^Drag .* grouping$/ })
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? ''));

    expect(groupingButtonsAfterFirstReorder).not.toEqual(groupingButtonsBefore);
    expect(groupingButtonsAfterFirstReorder[0]).toContain('Region');
    expect(groupingButtonsAfterFirstReorder[1]).toContain('Department');
    expect(groupingButtonsAfterFirstReorder[2]).toContain('Status');
    await expect(groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]')).toHaveCount(3);
    expect(await baseline.locator('thead .data-table__header-label').allTextContents()).toEqual(
      headerLabelsBeforeGroupingReorder,
    );

    const reorderedDepartmentGroupingBox = await departmentGroupingBody.boundingBox();
    const reorderedStatusGroupingBox = await statusGroupingBody.boundingBox();
    const reorderedRegionGroupingBox = await regionGroupingBody.boundingBox();

    expect(reorderedDepartmentGroupingBox).not.toBeNull();
    expect(reorderedStatusGroupingBox).not.toBeNull();
    expect(reorderedRegionGroupingBox).not.toBeNull();
    if (!reorderedDepartmentGroupingBox || !reorderedStatusGroupingBox || !reorderedRegionGroupingBox) {
      throw new Error('Expected reordered grouping handles to be visible');
    }

    await beginPointerDrag(page, departmentGroupingBody);
    await page.mouse.move(
      reorderedRegionGroupingBox.x + reorderedRegionGroupingBox.width / 2,
      reorderedRegionGroupingBox.y + reorderedRegionGroupingBox.height / 2,
    );
    await page.waitForTimeout(100);
    await expect(groupingPanel.locator('.data-table__grouping-pill-label')).toHaveText([
      'Department',
      'Region',
      'Status',
    ]);
    await page.mouse.up();

    const groupingButtonsAfterSecondReorder = await groupingPanel
      .getByRole('button', { name: /^Drag .* grouping$/ })
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? ''));

    expect(groupingButtonsAfterSecondReorder).not.toEqual(groupingButtonsBefore);
    expect(groupingButtonsAfterSecondReorder[0]).toContain('Department');
    expect(groupingButtonsAfterSecondReorder[1]).toContain('Region');
    expect(groupingButtonsAfterSecondReorder[2]).toContain('Status');
    await expect(groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]')).toHaveCount(3);
    expect(await baseline.locator('thead .data-table__header-label').allTextContents()).toEqual(
      headerLabelsBeforeGroupingReorder,
    );
  });

  test('grouping pill sort controls toggle sorting in the demo', async ({ page }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const groupingPanel = baseline.getByRole('region', { name: 'Grouping' });

    await baseline.getByRole('button', { name: 'Columns' }).click();
    const columnsMenu = page.getByRole('menu', { name: 'Columns' });
    await columnsMenu.getByRole('button', { name: 'Group Department' }).click();

    const sortButton = groupingPanel.locator('.data-table__grouping-pill-body[data-sort-state]').first();
    const groupedRows = baseline.locator('tbody tr[data-grouped="true"]');

    await expect(sortButton).toHaveAttribute('data-sort-state', 'none');
    await expect(sortButton).toHaveAttribute('aria-label', 'Sort Department ascending');

    await sortButton.click();
    await expect(sortButton).toHaveAttribute('data-sort-state', 'asc');
    await expect(sortButton).toHaveAttribute('aria-label', 'Sort Department descending');

    await sortButton.click();
    await expect(sortButton).toHaveAttribute('data-sort-state', 'desc');
    await expect(sortButton).toHaveAttribute('aria-label', 'Clear Department sorting');
    await expect(groupedRows.first()).toContainText('Department: Support');

    await sortButton.click();
    await expect(sortButton).toHaveAttribute('data-sort-state', 'none');
    await expect(sortButton).toHaveAttribute('aria-label', 'Sort Department ascending');
    await expect(groupedRows.first()).toContainText('Department: Engineering');
  });

  test('auto group column indents nested group rows by depth without stacking padding', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    await baseline.getByRole('button', { name: 'Columns' }).click();
    const columnsMenu = page.getByRole('menu', { name: 'Columns' });
    await columnsMenu.getByRole('button', { name: 'Group Department' }).click();
    await columnsMenu.getByRole('button', { name: 'Group Status' }).click();

    const topLevelAutoGroupCell = baseline
      .locator('tbody tr[data-grouped="true"][data-depth="0"] .data-table__auto-group-cell')
      .first();
    const topLevelPadding = await topLevelAutoGroupCell.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingInlineStart),
    );

    expect(topLevelPadding).toBeGreaterThanOrEqual(0);
    expect(topLevelPadding).toBeLessThanOrEqual(16);

    await baseline
      .getByRole('button', { name: /Expand Department group/ })
      .first()
      .click();

    const nestedAutoGroupCell = baseline
      .locator('tbody tr[data-grouped="true"][data-depth="1"] .data-table__auto-group-cell')
      .first();
    await expect(nestedAutoGroupCell).toBeVisible();
    const nestedPadding = await nestedAutoGroupCell.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingInlineStart),
    );

    expect(nestedPadding).toBeGreaterThan(topLevelPadding);
    expect(nestedPadding - topLevelPadding).toBeGreaterThanOrEqual(14);
    expect(nestedPadding - topLevelPadding).toBeLessThanOrEqual(18);
  });

  test('visible header drag handles receive pointer hit-testing in the demo', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const statusHeaderHandle = getHeaderMainSurface(baseline, 'status');

    const departmentHitTest = await getHitTestInfo(page, departmentHeaderHandle);
    const statusHitTest = await getHitTestInfo(page, statusHeaderHandle);

    expect(departmentHitTest.closestButtonLabel).toBe('Sort Department ascending');
    expect(departmentHitTest.targetClass).not.toBe('app-demo-card');
    expect(await statusHeaderHandle.getAttribute('aria-label')).toBe('Sort Status ascending');
    expect(statusHitTest.targetClass).not.toBe('app-demo-card');
  });

  test('header drag overlay is compact and follows the pointer', async ({ page }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const sourceCell = departmentHeaderHandle.locator('xpath=ancestor::th[1]');
    const sourceBox = await sourceCell.boundingBox();

    expect(sourceBox).not.toBeNull();
    if (!sourceBox) {
      return;
    }

    const { dragX, dragY } = await beginPointerDrag(page, departmentHeaderHandle);
    await page.waitForTimeout(100);

    const { overlayBox, label } = await getOverlayInfo(page);

    expect(label).toContain('Department');
    expect(overlayBox).not.toBeNull();
    if (!overlayBox) {
      await page.mouse.up();
      return;
    }

    expect(overlayBox.width).toBeLessThan(220);
    expect(overlayBox.width).toBeLessThan(sourceBox.width);
    expect(Math.abs(overlayBox.x + overlayBox.width / 2 - dragX)).toBeLessThan(40);
    expect(Math.abs(overlayBox.y + overlayBox.height / 2 - dragY)).toBeLessThan(40);

    await page.mouse.up();
  });

  test('header drag reorder keeps the table stable during drag and commits on drop', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const statusHeaderCell = getHeaderMainSurface(baseline, 'status').locator(
      'xpath=ancestor::th[1]',
    );
    const visibleHeaderIdsBeforeDrag = await getVisibleColumnIdsFromHeaders(baseline);
    const visibleBodyIdsBeforeDrag = await getVisibleColumnIdsFromFirstBodyRow(baseline);

    await pointerDragToHorizontalPointWithoutRelease(page, departmentHeaderHandle, statusHeaderCell, 0.25);
    await page.waitForTimeout(150);

    const [departmentHeaderBoxDuringDrag, statusHeaderBoxDuringDrag] = await Promise.all([
      departmentHeaderHandle.locator('xpath=ancestor::th[1]').boundingBox(),
      statusHeaderCell.boundingBox(),
    ]);

    expect(departmentHeaderBoxDuringDrag).not.toBeNull();
    expect(statusHeaderBoxDuringDrag).not.toBeNull();
    if (!departmentHeaderBoxDuringDrag || !statusHeaderBoxDuringDrag) {
      await page.mouse.up();
      return;
    }

    const visibleHeaderIdsDuringDrag = await getVisibleColumnIdsFromHeaders(baseline);
    const visibleBodyIdsDuringDrag = await getVisibleColumnIdsFromFirstBodyRow(baseline);

    expect(visibleHeaderIdsDuringDrag).toEqual(visibleHeaderIdsBeforeDrag);
    expect(visibleBodyIdsDuringDrag).toEqual(visibleBodyIdsBeforeDrag);

    await page.mouse.up();

    const visibleHeaderIdsAfterDrop = await getVisibleColumnIdsFromHeaders(baseline);
    const visibleBodyIdsAfterDrop = await getVisibleColumnIdsFromFirstBodyRow(baseline);

    expect(visibleHeaderIdsAfterDrop).toEqual(visibleBodyIdsAfterDrop);
    expect(visibleHeaderIdsAfterDrop).not.toEqual(visibleHeaderIdsBeforeDrag);
  });

  test('header insertion marker hides when dragging into the grouping panel', async ({ page }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const groupingPanel = baseline.getByRole('region', { name: 'Grouping' });
    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const marker = baseline.locator('.data-table__header-insertion-marker');

    await beginPointerDrag(page, departmentHeaderHandle);
    const groupingPanelBox = await groupingPanel.boundingBox();

    expect(groupingPanelBox).not.toBeNull();
    if (!groupingPanelBox) {
      await page.mouse.up();
      return;
    }

    await page.mouse.move(
      groupingPanelBox.x + groupingPanelBox.width / 2,
      groupingPanelBox.y + groupingPanelBox.height / 2,
    );
    await page.waitForTimeout(100);

    await expect(marker).toHaveCount(0);

    await page.mouse.up();

    await expect(groupingPanel.getByRole('button', { name: 'Drag Department grouping' })).toBeVisible();
  });

  test('header drag reorder commits when dropped near the target column', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const statusHeaderCell = getHeaderMainSurface(baseline, 'status').locator(
      'xpath=ancestor::th[1]',
    );

    await pointerDragToHorizontalPoint(page, departmentHeaderHandle, statusHeaderCell, 0.9);

    const headerLabels = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();

    expect(headerLabels.indexOf('Department')).toBeGreaterThan(-1);
    expect(headerLabels.indexOf('Status')).toBeGreaterThan(-1);
    expect(headerLabels.indexOf('Department')).toBeGreaterThan(headerLabels.indexOf('Status'));
  });

  test('header insertion marker appears after a wider header cell', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const departmentHeaderHandle = getHeaderMainSurface(baseline, 'department');
    const emailAddressHeaderCell = getHeaderMainSurface(baseline, 'email').locator(
      'xpath=ancestor::th[1]',
    );

    await pointerDragToHorizontalPointWithoutRelease(
      page,
      departmentHeaderHandle,
      emailAddressHeaderCell,
      0.8,
    );
    await page.waitForTimeout(100);

    const markerInfoDuringDrag = await getHeaderInsertionMarkerInfo(baseline);
    const emailAddressHeaderBoxDuringDrag = await emailAddressHeaderCell.boundingBox();
    expect(markerInfoDuringDrag.placement).toBe('after');
    expect(markerInfoDuringDrag.markerBox).not.toBeNull();
    expect(emailAddressHeaderBoxDuringDrag).not.toBeNull();
    if (markerInfoDuringDrag.markerBox && emailAddressHeaderBoxDuringDrag) {
      expect(
        Math.abs(
          markerInfoDuringDrag.markerBox.x + markerInfoDuringDrag.markerBox.width -
            (emailAddressHeaderBoxDuringDrag.x + emailAddressHeaderBoxDuringDrag.width),
        ),
      ).toBeLessThan(8);
    }

    await page.mouse.up();

    const headerLabels = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();

    expect(headerLabels.indexOf('Department')).toBeGreaterThan(-1);
    expect(headerLabels.indexOf('Status')).toBeGreaterThan(-1);
    expect(headerLabels.indexOf('Department')).toBeLessThan(headerLabels.indexOf('Status'));
  });

  test('header drag reorder still works after hiding a column', async ({ page }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    await baseline.getByRole('button', { name: 'Columns' }).click();
    const columnsMenu = page.getByRole('menu', { name: 'Columns' });

    await columnsMenu.getByRole('checkbox', { name: 'Email Address' }).uncheck();
    await baseline.getByRole('button', { name: 'Columns' }).click();

    const statusHeaderHandle = getHeaderMainSurface(baseline, 'status');
    const statusHeaderCell = getHeaderMainSurface(baseline, 'status').locator(
      'xpath=ancestor::th[1]',
    );
    const departmentHeaderCell = getHeaderMainSurface(baseline, 'department').locator(
      'xpath=ancestor::th[1]',
    );

    await pointerDragToHorizontalPoint(page, statusHeaderHandle, departmentHeaderCell, 0.5);

    const headerLabels = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();

    expect(headerLabels).toContain('Department');
    expect(headerLabels).toContain('Status');
    expect(headerLabels.indexOf('Status')).toBeLessThan(headerLabels.indexOf('Department'));
    expect(headerLabels).not.toContain('Email');
  });

  test('visible columns remain reorderable while grouped source columns stay hidden', async ({
    page,
  }) => {
    await page.goto('/');

    const baseline = page.locator('section[aria-labelledby="baseline-demo-title"]');
    const groupingPanel = baseline.getByRole('region', { name: 'Grouping' });

    await baseline.getByRole('button', { name: 'Columns' }).click();
    const columnsMenu = page.getByRole('menu', { name: 'Columns' });
    await columnsMenu.getByRole('button', { name: 'Group Department' }).click();
    await columnsMenu.getByRole('button', { name: 'Group Status' }).click();

    const groupingButtonsBefore = await groupingPanel
      .getByRole('button', { name: /^Drag .* grouping$/ })
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute('aria-label') ?? ''),
      );
    const headerLabelsBeforeColumnReorder = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();

    expect(headerLabelsBeforeColumnReorder).toEqual([
      'Group',
      'Name',
      'Email',
      'Age',
      'Region',
      'Birth Date',
      'Created',
    ]);
    await expect(baseline.getByRole('columnheader', { name: 'Department' })).toHaveCount(0);
    await expect(baseline.getByRole('columnheader', { name: 'Status' })).toHaveCount(0);

    const fullNameHeaderHandle = getHeaderMainSurface(baseline, 'name');
    const emailHeaderCell = getHeaderMainSurface(baseline, 'email').locator(
      'xpath=ancestor::th[1]',
    );

    await pointerDragToHorizontalPoint(page, fullNameHeaderHandle, emailHeaderCell, 0.9);

    const headerLabelsAfterColumnReorder = await baseline
      .locator('thead .data-table__header-label')
      .allTextContents();

    expect(headerLabelsAfterColumnReorder).not.toEqual(headerLabelsBeforeColumnReorder);
    expect(headerLabelsAfterColumnReorder).toEqual([
      'Group',
      'Email',
      'Name',
      'Age',
      'Region',
      'Birth Date',
      'Created',
    ]);
    expect(
      await groupingPanel
        .getByRole('button', { name: /^Drag .* grouping$/ })
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getAttribute('aria-label') ?? ''),
        ),
    ).toEqual(groupingButtonsBefore);
  });
});







