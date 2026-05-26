interface DataTableLoadingProps {
  columnCount: number;
  rowCount?: number;
}

export function DataTableLoading({
  columnCount,
  rowCount = 5,
}: DataTableLoadingProps) {
  // Guard against degenerate values; a skeleton with 0 rows/cols is invisible
  // but would still emit invalid markup.
  const safeRowCount = Math.max(1, rowCount);
  const safeColCount = Math.max(1, columnCount);

  return (
    <>
      {Array.from({ length: safeRowCount }, (_, rowIndex) => (
        <tr key={rowIndex} className="cereda-table__loading-row">
          {Array.from({ length: safeColCount }, (_, colIndex) => (
            <td key={colIndex} className="cereda-table__loading-cell">
              <div className="cereda-table__skeleton" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

