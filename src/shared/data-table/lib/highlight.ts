export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function splitByTerm(text: string, term: string): HighlightSegment[] {
  const trimmed = term.trim();
  if (!trimmed) return [{ text, match: false }];

  try {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const segments: HighlightSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), match: false });
      }
      segments.push({ text: match[0], match: true });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), match: false });
    }

    return segments.length > 0 ? segments : [{ text, match: false }];
  } catch {
    return [{ text, match: false }];
  }
}
