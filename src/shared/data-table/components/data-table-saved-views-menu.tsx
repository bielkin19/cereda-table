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
import { useDataTableLocale } from './data-table-locale-context';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableSavedViewsMenuProps<TData extends object> {
  table: Table<TData>;
  storageKey?: string;
  defaultViewName?: string;
  savedViewsStorage?: DataTableSavedViewsStorage;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getDefaultDraftName(defaultViewName: string | undefined, fallbackName: string) {
  const trimmed = defaultViewName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallbackName;
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
  open: controlledOpen,
  onOpenChange,
}: DataTableSavedViewsMenuProps<TData>) {
  const locale = useDataTableLocale();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const storage = useMemo(
    () => resolveSavedViewsStorage(savedViewsStorage),
    [savedViewsStorage],
  );

  const [savedViewsDocument, setSavedViewsDocument] = useState(() =>
    getInitialSavedViewsDocument(storage, storageKey),
  );
  const [draftName, setDraftName] = useState(() =>
    getDefaultDraftName(defaultViewName, locale.savedViews.defaultName),
  );

  useEffect(() => {
    setSavedViewsDocument(getInitialSavedViewsDocument(storage, storageKey));
    setDraftName(getDefaultDraftName(defaultViewName, locale.savedViews.defaultName));
  }, [defaultViewName, locale.savedViews.defaultName, storage, storageKey]);

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
    setDraftName(nextDocument.views[0]?.name ?? getDefaultDraftName(defaultViewName, locale.savedViews.defaultName));
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

  useEffect(() => {
    if (!open) return;

    function handleBackdropPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.classList.contains('cereda-table__popover-backdrop')
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleBackdropPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleBackdropPointerDown, true);
    };
  }, [open, setOpen]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={
          open
            ? 'cereda-table__saved-views-menu cereda-table__popover-root--open'
            : 'cereda-table__saved-views-menu'
        }
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className="cereda-table__toolbar-button"
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={!canOpenMenu}
            title={
              canOpenMenu
                ? locale.savedViews.buttonLabel
                : locale.savedViews.buttonDisabledTitle
            }
          >
            <Bookmark aria-hidden="true" />
            {locale.savedViews.buttonLabel}
          </button>
        </Popover.Trigger>

        {open && canOpenMenu ? (
          <>
            <Popover.Portal>
              <div
                className="cereda-table__popover-backdrop"
                onPointerDown={() => setOpen(false)}
                aria-hidden="true"
              />
            </Popover.Portal>
            <Popover.Portal>
            <Popover.Content
              role="dialog"
              aria-label={locale.savedViews.panelTitle}
              className="cereda-table__saved-views-menu-panel"
              sideOffset={8}
              align="end"
            >
            <div className="cereda-table__saved-views-menu-section">
              <div className="cereda-table__saved-views-menu-section-title">
                {locale.savedViews.saveSectionTitle}
              </div>
              <label className="cereda-table__saved-views-field">
                <span className="cereda-table__saved-views-label">{locale.savedViews.nameLabel}</span>
                <input
                  className="cereda-table__saved-views-input"
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.currentTarget.value)}
                  placeholder={locale.savedViews.namePlaceholder}
                  aria-label={locale.savedViews.nameLabel}
                />
              </label>
              <button
                type="button"
                className="cereda-table__saved-views-action"
                onClick={handleSaveCurrentView}
              >
                <Save aria-hidden="true" />
                {locale.savedViews.saveButton}
              </button>
            </div>

            <div className="cereda-table__saved-views-menu-section">
              <div className="cereda-table__saved-views-menu-section-title">
                {locale.savedViews.listSectionTitle}
              </div>
              {savedViewsDocument.views.length === 0 ? (
                <div className="cereda-table__saved-views-empty">
                  {locale.savedViews.noViews}
                </div>
              ) : (
                <DataTableScrollArea className="cereda-table__scroll-area--saved-views">
                  <ul className="cereda-table__saved-views-list">
                    {savedViewsDocument.views.map((savedView) => (
                      <li key={savedView.id} className="cereda-table__saved-views-item">
                        <div className="cereda-table__saved-views-item-name">
                          {savedView.name}
                        </div>
                        <div className="cereda-table__saved-views-item-actions">
                          <button
                            type="button"
                            className="cereda-table__saved-views-item-action"
                            onClick={() => handleApplySavedView(savedView)}
                            aria-label={locale.savedViews.applyAriaLabel(savedView.name)}
                          >
                            <Check aria-hidden="true" />
                            {locale.savedViews.applyLabel}
                          </button>
                          <button
                            type="button"
                            className="cereda-table__saved-views-item-action cereda-table__saved-views-item-action--secondary"
                            onClick={() => handleDeleteSavedView(savedView)}
                            aria-label={locale.savedViews.deleteAriaLabel(savedView.name)}
                          >
                            <Trash2 aria-hidden="true" />
                            {locale.savedViews.deleteLabel}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </DataTableScrollArea>
              )}
            </div>

            <div className="cereda-table__saved-views-menu-actions">
              <button
                type="button"
                className="cereda-table__saved-views-action cereda-table__saved-views-action--secondary"
                onClick={handleResetTableState}
              >
                <RotateCcw aria-hidden="true" />
                {locale.savedViews.resetLabel}
              </button>
            </div>
            </Popover.Content>
            </Popover.Portal>
          </>
        ) : null}
      </div>
    </Popover.Root>
  );
}

