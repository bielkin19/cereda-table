import { splitByTerm } from '../lib/highlight';

interface DataTableHighlightTextProps {
  text: string;
  term: string;
}

export function DataTableHighlightText({ text, term }: DataTableHighlightTextProps) {
  const segments = splitByTerm(text, term);

  if (segments.length === 1 && !segments[0].match) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="data-table__highlight">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
