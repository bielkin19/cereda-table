import type { GroupingState } from '@tanstack/react-table';

export function normalizeGroupingIds(grouping: GroupingState): GroupingState {
  const normalized: GroupingState = [];
  const seen = new Set<string>();

  for (const groupId of grouping) {
    if (seen.has(groupId)) {
      continue;
    }

    seen.add(groupId);
    normalized.push(groupId);
  }

  return normalized;
}

export function addGroupingId(
  grouping: GroupingState,
  columnId: string,
): GroupingState {
  const normalizedGrouping = normalizeGroupingIds(grouping);

  if (normalizedGrouping.includes(columnId)) {
    return normalizedGrouping;
  }

  return [...normalizedGrouping, columnId];
}

export function reorderGroupingIds(
  grouping: GroupingState,
  activeId: string,
  overId: string,
): GroupingState {
  const normalizedGrouping = normalizeGroupingIds(grouping);
  const activeIndex = normalizedGrouping.indexOf(activeId);
  const overIndex = normalizedGrouping.indexOf(overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return grouping;
  }

  const nextGrouping = [...normalizedGrouping];
  const [activeGroupingId] = nextGrouping.splice(activeIndex, 1);
  nextGrouping.splice(overIndex, 0, activeGroupingId);
  return nextGrouping;
}

export function moveGroupingIdToEnd(
  grouping: GroupingState,
  columnId: string,
): GroupingState {
  const normalizedGrouping = normalizeGroupingIds(grouping);
  const currentIndex = normalizedGrouping.indexOf(columnId);

  if (currentIndex < 0) {
    return grouping;
  }

  if (currentIndex === normalizedGrouping.length - 1) {
    return normalizedGrouping;
  }

  const nextGrouping = normalizedGrouping.filter((groupId) => groupId !== columnId);
  nextGrouping.push(columnId);
  return nextGrouping;
}

export function removeGroupingId(
  grouping: GroupingState,
  columnId: string,
): GroupingState {
  const normalizedGrouping = normalizeGroupingIds(grouping);

  if (!normalizedGrouping.includes(columnId)) {
    return grouping;
  }

  return normalizedGrouping.filter((groupId) => groupId !== columnId);
}
