import * as Popover from '@radix-ui/react-popover';
import type { Table } from '@tanstack/react-table';
import { Bookmark, Check, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  applySavedViewState,
  type DataTableSavedView,
  type DataTableSavedViewsDocument,
  deleteSavedView,
  getDefaultSavedViewsDocument,
  loadSavedViewsDocument,
  persistSavedViewsDocument,
  resetSavedViewState,
  resolveSavedViewsStorage,
  snapshotSavedViewState,
  upsertSavedView,
} from '../lib/saved-views';
import type { DataTableSavedViewsStorage } from '../types/data-table.types';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableSavedViewsMenuProps<TData extends object> {
  table: Table<TData>;
  storageKey?: string;
  defaultViewName?: string;
  savedViewsStorage?: DataTableSavedViewsStorage;
}

function getDefaultDraftName(defaultViewName: string | undefined) {
  const trimmed = defaultViewName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Saved view';
}

function getInitialSavedViewsDocument(
  storage: DataTableSavedViewsStorage,
  storageKey: string | undefined,
): DataTableSavedViewsDocument {
  if (!storageKey) {
    return getDefaultSavedViewsDocument();
  }

  return loadSavedViewsDocument(storage, storageKey);
}

export function DataTableSavedViewsMenu<TData extends object>({
  table,
  storageKey,
  defaultViewName,
  savedViewsStorage,
}: DataTableSavedViewsMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const storage = useMemo(
    () => resolveSavedViewsStorage(savedViewsStorage),
    [savedViewsStorage],
  );

  const [savedViewsDocument, setSavedViewsDocument] = useState(() =>
    getInitialSavedViewsDocument(storage, storageKey),
  );
  const [draftName, setDraftName] = useState(() =>
    getDefaultDraftName(defaultViewName),
  );

  useEffect(() => {
    setSavedViewsDocument(getInitialSavedViewsDocument(storage, storageKey));
    setDraftName(getDefaultDraftName(defaultViewName));
  }, [defaultViewName, storage, storageKey]);

  const canOpenMenu = storageKey !== undefined && storageKey.trim().length > 0;

  const handleSaveCurrentView = () => {
    if (!canOpenMenu) {
      return;
    }

    const nextDocument = upsertSavedView(
      savedViewsDocument,
      draftName,
      snapshotSavedViewState(table),
    );

    setSavedViewsDocument(nextDocument);
    persistSavedViewsDocument(storage, storageKey, nextDocument);
    setDraftName(nextDocument.views[0]?.name ?? getDefaultDraftName(defaultViewName));
  };

  const handleApplySavedView = (savedView: DataTableSavedView) => {
    applySavedViewState(table, savedView.state);
  };

  const handleDeleteSavedView = (savedView: DataTableSavedView) => {
    const nextDocument = deleteSavedView(savedViewsDocument, savedView.id);

    setSavedViewsDocument(nextDocument);
    persistSavedViewsDocument(storage, storageKey, nextDocument);
  };

  const handleResetTableState = () => {
    resetSavedViewState(table);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="data-table__saved-views-menu">
        <Popover.Trigger asChild>
          <button
            type="button"
            className="data-table__toolbar-button"
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={!canOpenMenu}
            title={
              canOpenMenu
                ? 'Open saved views'
                : 'Saved views require a storage key'
            }
          >
            <Bookmark aria-hidden="true" />
            Saved views
          </button>
        </Popover.Trigger>

        {open && canOpenMenu ? (
          <Popover.Content
            role="dialog"
            aria-label="Saved views"
            className="data-table__saved-views-menu-panel"
            sideOffset={8}
            align="end"
          >
            <div className="data-table__saved-views-menu-section">
              <div className="data-table__saved-views-menu-section-title">
                Save current view
              </div>
              <label className="data-table__saved-views-field">
                <span className="data-table__saved-views-label">View name</span>
                <input
                  className="data-table__saved-views-input"
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.currentTarget.value)}
                  placeholder="Saved view"
                  aria-label="View name"
                />
              </label>
              <button
                type="button"
                className="data-table__saved-views-action"
                onClick={handleSaveCurrentView}
              >
                <Save aria-hidden="true" />
                Save current view
              </button>
            </div>

            <div className="data-table__saved-views-menu-section">
              <div className="data-table__saved-views-menu-section-title">
                Current saved views
              </div>
              {savedViewsDocument.views.length === 0 ? (
                <div className="data-table__saved-views-empty">
                  No saved views yet.
                </div>
              ) : (
                <DataTableScrollArea className="data-table__scroll-area--saved-views">
                  <ul className="data-table__saved-views-list">
                    {savedViewsDocument.views.map((savedView) => (
                      <li key={savedView.id} className="data-table__saved-views-item">
                        <div className="data-table__saved-views-item-name">
                          {savedView.name}
                        </div>
                        <div className="data-table__saved-views-item-actions">
                          <button
                            type="button"
                            className="data-table__saved-views-item-action"
                            onClick={() => handleApplySavedView(savedView)}
                            aria-label={`Apply ${savedView.name}`}
                          >
                            <Check aria-hidden="true" />
                            Apply
                          </button>
                          <button
                            type="button"
                            className="data-table__saved-views-item-action data-table__saved-views-item-action--secondary"
                            onClick={() => handleDeleteSavedView(savedView)}
                            aria-label={`Delete ${savedView.name}`}
                          >
                            <Trash2 aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </DataTableScrollArea>
              )}
            </div>

            <div className="data-table__saved-views-menu-actions">
              <button
                type="button"
                className="data-table__saved-views-action data-table__saved-views-action--secondary"
                onClick={handleResetTableState}
              >
                <RotateCcw aria-hidden="true" />
                Reset current table state
              </button>
            </div>
          </Popover.Content>
        ) : null}
      </div>
    </Popover.Root>
  );
}
