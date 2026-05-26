import type { DataTableLocale } from '../lib/data-table-locale';

function plural(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'рядків';
  if (mod10 === 1) return 'рядок';
  if (mod10 >= 2 && mod10 <= 4) return 'рядки';
  return 'рядків';
}

export const localeUk: DataTableLocale = {
  pagination: {
    label: 'Навігація по сторінках',
    rowCount: (count) => `${count} ${plural(count)}`,
    page: (current) => `Сторінка ${current}`,
    pageAriaLabel: (page) => `Сторінка ${page}`,
    pageNumbers: 'Номери сторінок',
    firstPage: 'Перша сторінка',
    previousPage: 'Попередня сторінка',
    nextPage: 'Наступна сторінка',
    lastPage: 'Остання сторінка',
    rowsPerPage: 'Рядків на сторінці',
  },

  empty: {
    title: 'Результати не знайдено',
    hint: 'Спробуйте змінити параметри пошуку або фільтрації.',
    clearFilters: 'Скинути фільтри',
  },

  search: {
    placeholder: 'Пошук...',
    ariaLabel: 'Пошук',
    clearAriaLabel: 'Очистити пошук',
  },

  columns: {
    buttonLabel: 'Колонки',
    panelAriaLabel: 'Колонки',
    panelTitle: 'Колонки',
    panelClose: 'Закрити панель',
    panelCloseTitle: 'Закрити',
    summaryAriaLabel: 'Зведення налаштувань колонок',
    visibleCount: (count) => `${count} видимих`,
    hiddenCount: (count) => `${count} прихованих`,
    groupedCount: (count) => `${count} згрупованих`,
    statVisible: 'Видимі',
    statOrder: 'Порядок',
    statGrouped: 'Групування',
    reset: 'Скинути',
    resetOrder: 'Скинути порядок',
    clearGrouping: 'Прибрати групування',
    orderSectionTitle: 'Порядок колонок',
    noOrderableColumns: 'Немає колонок для зміни порядку.',
    visibilitySectionTitle: 'Видимість колонок',
    noHidableColumns: 'Немає колонок для приховання.',
    groupedBadge: 'Згрупована',
  },

  filters: {
    buttonLabel: 'Фільтри',
    activeAriaLabel: (count) => `Фільтри, активних: ${count}`,
    panelTitle: 'Фільтри',
    panelSubtitle: 'Додавайте фільтри за полями та редагуйте їх в одному списку.',
    clearAll: 'Скинути всі',
    noFilters: 'Фільтри не додано.',
    chooseField: 'Оберіть поле',
    noAvailableFilters: 'Усі доступні фільтри вже додані.',
    addFilter: 'Додати фільтр',
    cancel: 'Скасувати',
    expandAriaLabel: (label) => `Розгорнути фільтр ${label}`,
    collapseAriaLabel: (label) => `Згорнути фільтр ${label}`,
    removeAriaLabel: (label) => `Видалити фільтр ${label}`,
    sectionAriaLabel: (label) => `Фільтр ${label}`,
  },

  savedViews: {
    buttonLabel: 'Збережені вигляди',
    buttonDisabledTitle: 'Для збережених виглядів потрібен ключ сховища',
    defaultName: 'Збережений вигляд',
    panelTitle: 'Збережені вигляди',
    saveSectionTitle: 'Зберегти поточний вигляд',
    nameLabel: 'Назва вигляду',
    namePlaceholder: 'Збережений вигляд',
    saveButton: 'Зберегти поточний вигляд',
    listSectionTitle: 'Поточні збережені вигляди',
    noViews: 'Немає збережених виглядів.',
    applyLabel: 'Застосувати',
    applyAriaLabel: (name) => `Застосувати ${name}`,
    deleteLabel: 'Видалити',
    deleteAriaLabel: (name) => `Видалити ${name}`,
    resetLabel: 'Скинути стан таблиці',
  },

  columnHeader: {
    rowNumberAriaLabel: 'Номер рядка',
    sortAscendingAriaLabel: (label) => `Сортувати ${label} за зростанням`,
    sortDescendingAriaLabel: (label) => `Сортувати ${label} за спаданням`,
    clearSortAriaLabel: (label) => `Скинути сортування ${label}`,
    resizeAriaLabel: (label) => `Змінити розмір колонки ${label}`,
    dragAriaLabel: (label) => `Перетягнути колонку ${label}`,
    canBeGroupedTitle: 'Можна групувати',
  },

  columnFilter: {
    filterAriaLabel: (label) => `Фільтр ${label}`,
    inputLabel: (label) => `Фільтр ${label}`,
    minPlaceholder: 'Мін',
    maxPlaceholder: 'Макс',
    minAriaLabel: (label) => `Мінімальний фільтр ${label}`,
    maxAriaLabel: (label) => `Максимальний фільтр ${label}`,
    clearAriaLabel: (label) => `Скинути фільтр ${label}`,
    fromPlaceholder: 'З',
    toPlaceholder: 'По',
    fromAriaLabel: (label) => `${label} з`,
    toAriaLabel: (label) => `${label} по`,
    booleanTrue: 'Так',
    booleanFalse: 'Ні',
  },

  facetFilter: {
    openAriaLabel: (label) => `Відкрити значення фільтра ${label}`,
    dialogAriaLabel: (label) => `Фільтр ${label}`,
    searchPlaceholder: 'Пошук значень',
    searchAriaLabel: (label) => `Пошук значень ${label}`,
    selectAllAriaLabel: (label) => `Вибрати всі значення ${label}`,
    selectAllLabel: '(Вибрати все)',
    noValues: 'Значення не знайдено.',
    clearAriaLabel: (label) => `Скинути фільтр ${label}`,
  },

  datePicker: {
    weekdays: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
    ],
    prevMonthAriaLabel: 'Попередній місяць',
    nextMonthAriaLabel: 'Наступний місяць',
    calendarAriaLabel: 'Календар',
    selectDatePlaceholder: 'оберіть дату',
    clearAriaLabel: (label) => `Скинути ${label}`,
  },

  groupingPanel: {
    ariaLabel: 'Групування',
    dropHint: 'Перетягніть сюди для групування рядків',
    clearAll: 'Скинути всі',
    sortAscendingAriaLabel: (label) => `Сортувати ${label} за зростанням`,
    sortDescendingAriaLabel: (label) => `Сортувати ${label} за спаданням`,
    clearSortAriaLabel: (label) => `Скинути сортування ${label}`,
    dragAriaLabel: (label) => `Перетягнути групування ${label}`,
    removeAriaLabel: (label) => `Прибрати групування ${label}`,
    itemAriaLabel: (label, position, total) =>
      `${label}: групування, позиція ${position} з ${total}`,
  },

  groupingSection: {
    sectionTitle: 'Групування',
    noGroupableColumns: 'Немає колонок для групування.',
    groupedBadge: 'Згрупована',
    dragAriaLabel: (label) => `Перетягнути ${label} на панель групування`,
    groupAriaLabel: (label) => `Згрупувати за ${label}`,
    ungroupAriaLabel: (label) => `Прибрати групування за ${label}`,
    groupLabel: 'Групувати',
    ungroupLabel: 'Розгрупувати',
  },

  columnOrder: {
    dragAriaLabel: (label) => `Перетягнути ${label} для зміни порядку`,
    canBeGroupedLabel: 'Можна групувати',
    moveOnlyLabel: 'Тільки переміщення',
    moveLeftAriaLabel: (label) => `Перемістити ${label} вліво`,
    moveRightAriaLabel: (label) => `Перемістити ${label} вправо`,
    leftLabel: 'Вліво',
    rightLabel: 'Вправо',
  },

  autoGroup: {
    headerLabel: 'Група',
    resizeHeaderAriaLabel: 'Змінити розмір колонки Група',
    booleanTrue: 'Так',
    booleanFalse: 'Ні',
    emptyValue: 'Порожньо',
    fallbackGroupLabel: 'Група',
    expandAriaLabel: (label, value, childCount) =>
      `Розгорнути групу ${label} — ${value} (${childCount} ${plural(childCount)})`,
    collapseAriaLabel: (label, value, childCount) =>
      `Згорнути групу ${label} — ${value} (${childCount} ${plural(childCount)})`,
    rowCount: (count) => `${count} ${plural(count)}`,
  },
};
