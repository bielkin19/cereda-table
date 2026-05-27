import type { DataTableLocale } from '../lib/data-table-locale';

function plural(count: number): string {
  return count === 1 ? 'Zeile' : 'Zeilen';
}

export const localeDe: DataTableLocale = {
  pagination: {
    label: 'Seitennavigation',
    rowCount: (count) => `${count} ${plural(count)}`,
    page: (current) => `Seite ${current}`,
    pageAriaLabel: (page) => `Seite ${page}`,
    pageNumbers: 'Seitenzahlen',
    firstPage: 'Erste Seite',
    previousPage: 'Vorherige Seite',
    nextPage: 'Nächste Seite',
    lastPage: 'Letzte Seite',
    rowsPerPage: 'Zeilen pro Seite',
  },

  empty: {
    title: 'Keine Ergebnisse gefunden',
    hint: 'Versuchen Sie, die Such- oder Filterparameter zu ändern.',
    clearFilters: 'Filter zurücksetzen',
  },

  search: {
    placeholder: 'Suche...',
    ariaLabel: 'Suche',
    clearAriaLabel: 'Suche löschen',
  },

  columns: {
    buttonLabel: 'Spalten',
    panelAriaLabel: 'Spalten',
    panelTitle: 'Spalten',
    panelClose: 'Panel schließen',
    panelCloseTitle: 'Schließen',
    summaryAriaLabel: 'Zusammenfassung der Spalteneinstellungen',
    visibleCount: (count) => `${count} sichtbar`,
    hiddenCount: (count) => `${count} ausgeblendet`,
    groupedCount: (count) => `${count} gruppiert`,
    statVisible: 'Sichtbar',
    statOrder: 'Reihenfolge',
    statGrouped: 'Gruppierung',
    reset: 'Zurücksetzen',
    resetOrder: 'Reihenfolge zurücksetzen',
    clearGrouping: 'Gruppierung entfernen',
    orderSectionTitle: 'Spaltenreihenfolge',
    noOrderableColumns: 'Keine Spalten zum Neuanordnen.',
    visibilitySectionTitle: 'Spaltensichtbarkeit',
    noHidableColumns: 'Keine Spalten zum Ausblenden.',
    groupedBadge: 'Gruppiert',
  },

  filters: {
    buttonLabel: 'Filter',
    activeAriaLabel: (count) => `Filter, aktiv: ${count}`,
    panelTitle: 'Filter',
    panelSubtitle: 'Fügen Sie Filter nach Feldern hinzu und bearbeiten Sie sie in einer Liste.',
    clearAll: 'Alle zurücksetzen',
    noFilters: 'Keine Filter hinzugefügt.',
    chooseField: 'Feld auswählen',
    noAvailableFilters: 'Alle verfügbaren Filter wurden bereits hinzugefügt.',
    addFilter: 'Filter hinzufügen',
    cancel: 'Abbrechen',
    expandAriaLabel: (label) => `Filter ${label} erweitern`,
    collapseAriaLabel: (label) => `Filter ${label} reduzieren`,
    removeAriaLabel: (label) => `Filter ${label} entfernen`,
    sectionAriaLabel: (label) => `Filter ${label}`,
  },

  savedViews: {
    buttonLabel: 'Gespeicherte Ansichten',
    buttonDisabledTitle: 'Gespeicherte Ansichten benötigen einen Speicherschlüssel',
    defaultName: 'Gespeicherte Ansicht',
    panelTitle: 'Gespeicherte Ansichten',
    saveSectionTitle: 'Aktuelle Ansicht speichern',
    nameLabel: 'Ansichtsname',
    namePlaceholder: 'Gespeicherte Ansicht',
    saveButton: 'Aktuelle Ansicht speichern',
    listSectionTitle: 'Aktuelle gespeicherte Ansichten',
    noViews: 'Keine gespeicherten Ansichten.',
    applyLabel: 'Anwenden',
    applyAriaLabel: (name) => `${name} anwenden`,
    deleteLabel: 'Löschen',
    deleteAriaLabel: (name) => `${name} löschen`,
    resetLabel: 'Tabellenzustand zurücksetzen',
  },

  columnHeader: {
    rowNumberAriaLabel: 'Zeilennummer',
    sortAscendingAriaLabel: (label) => `${label} aufsteigend sortieren`,
    sortDescendingAriaLabel: (label) => `${label} absteigend sortieren`,
    clearSortAriaLabel: (label) => `Sortierung ${label} zurücksetzen`,
    resizeAriaLabel: (label) => `Spalte ${label} in der Größe ändern`,
    autoFitAriaLabel: (label) => `Spalte ${label} in der Größe ändern · Doppelklick für automatische Anpassung`,
    dragAriaLabel: (label) => `Spalte ${label} verschieben`,
    canBeGroupedTitle: 'Kann gruppiert werden',
  },

  columnFilter: {
    filterAriaLabel: (label) => `Filter ${label}`,
    inputLabel: (label) => `Filter ${label}`,
    minPlaceholder: 'Min',
    maxPlaceholder: 'Max',
    minAriaLabel: (label) => `Minimalfilter ${label}`,
    maxAriaLabel: (label) => `Maximalfilter ${label}`,
    clearAriaLabel: (label) => `Filter ${label} zurücksetzen`,
    fromPlaceholder: 'Von',
    toPlaceholder: 'Bis',
    fromAriaLabel: (label) => `${label} von`,
    toAriaLabel: (label) => `${label} bis`,
    booleanTrue: 'Ja',
    booleanFalse: 'Nein',
  },

  facetFilter: {
    openAriaLabel: (label) => `Filterwerte ${label} öffnen`,
    dialogAriaLabel: (label) => `Filter ${label}`,
    searchPlaceholder: 'Werte suchen',
    searchAriaLabel: (label) => `Werte ${label} suchen`,
    selectAllAriaLabel: (label) => `Alle Werte ${label} auswählen`,
    selectAllLabel: '(Alle auswählen)',
    noValues: 'Keine Werte gefunden.',
    clearAriaLabel: (label) => `Filter ${label} zurücksetzen`,
  },

  datePicker: {
    weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    months: [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
    ],
    prevMonthAriaLabel: 'Vorheriger Monat',
    nextMonthAriaLabel: 'Nächster Monat',
    calendarAriaLabel: 'Kalender',
    selectDatePlaceholder: 'Datum auswählen',
    clearAriaLabel: (label) => `${label} zurücksetzen`,
  },

  groupingPanel: {
    ariaLabel: 'Gruppierung',
    dropHint: 'Hierher ziehen, um Zeilen zu gruppieren',
    clearAll: 'Alle zurücksetzen',
    sortAscendingAriaLabel: (label) => `${label} aufsteigend sortieren`,
    sortDescendingAriaLabel: (label) => `${label} absteigend sortieren`,
    clearSortAriaLabel: (label) => `Sortierung ${label} zurücksetzen`,
    dragAriaLabel: (label) => `Gruppierung ${label} verschieben`,
    removeAriaLabel: (label) => `Gruppierung ${label} entfernen`,
    itemAriaLabel: (label, position, total) =>
      `${label}: Gruppierung, Position ${position} von ${total}`,
  },

  groupingSection: {
    sectionTitle: 'Gruppierung',
    noGroupableColumns: 'Keine Spalten zum Gruppieren.',
    groupedBadge: 'Gruppiert',
    dragAriaLabel: (label) => `${label} auf das Gruppierungspanel ziehen`,
    groupAriaLabel: (label) => `Nach ${label} gruppieren`,
    ungroupAriaLabel: (label) => `Gruppierung nach ${label} entfernen`,
    groupLabel: 'Gruppieren',
    ungroupLabel: 'Gruppierung aufheben',
  },

  columnOrder: {
    dragAriaLabel: (label) => `${label} zum Neuanordnen verschieben`,
    canBeGroupedLabel: 'Kann gruppiert werden',
    moveOnlyLabel: 'Nur verschieben',
    moveLeftAriaLabel: (label) => `${label} nach links verschieben`,
    moveRightAriaLabel: (label) => `${label} nach rechts verschieben`,
    leftLabel: 'Links',
    rightLabel: 'Rechts',
  },

  autoGroup: {
    headerLabel: 'Gruppe',
    resizeHeaderAriaLabel: 'Größe der Spalte Gruppe ändern',
    booleanTrue: 'Ja',
    booleanFalse: 'Nein',
    emptyValue: 'Leer',
    fallbackGroupLabel: 'Gruppe',
    expandAriaLabel: (label, value, childCount) =>
      `Gruppe ${label} — ${value} erweitern (${childCount} ${plural(childCount)})`,
    collapseAriaLabel: (label, value, childCount) =>
      `Gruppe ${label} — ${value} reduzieren (${childCount} ${plural(childCount)})`,
    rowCount: (count) => `${count} ${plural(count)}`,
  },
};
