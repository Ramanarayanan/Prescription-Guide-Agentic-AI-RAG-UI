export type VerdictLevel = 'recommended' | 'caution' | 'not_recommended' | 'unknown';

export interface AnalysisSection {
  title: string;
  level: 3 | 4;
  body: string;
}

export interface ParsedVerdict {
  level: VerdictLevel;
  label: string;
  body: string;
}

export interface ParsedAnalysis {
  title: string;
  sections: AnalysisSection[];
  verdict: ParsedVerdict;
  rawFallback?: string;
}

const VERDICT_BRACKET_REGEX = /\*{0,2}\[([^\]]+)\]\*{0,2}/gi;

function detectVerdictLevel(text: string): VerdictLevel {
  const upper = text.toUpperCase();
  if (/NOT\s*RECOMMENDED/.test(upper)) return 'not_recommended';
  if (/PROCEED\s+WITH\s+CAUTION|\[CAUTION\]|(?<![A-Z])CAUTION(?![A-Z])/.test(upper)) {
    if (!/NOT\s*RECOMMENDED/.test(upper)) return 'caution';
  }
  if (/\[SUITABLE\]|SUITABLE|(?<!NOT\s)RECOMMENDED/.test(upper)) return 'recommended';
  return 'unknown';
}

function extractVerdictLabel(text: string): string {
  const matches = [...text.matchAll(VERDICT_BRACKET_REGEX)];
  for (const match of matches) {
    const inner = match[1].trim();
    const level = detectVerdictLevel(inner);
    if (level !== 'unknown') return inner;
  }
  const level = detectVerdictLevel(text);
  if (level === 'not_recommended') return 'NOT RECOMMENDED';
  if (level === 'caution') return 'PROCEED WITH CAUTION';
  if (level === 'recommended') return 'SUITABLE';
  return 'Clinical Verdict';
}

function buildVerdict(text: string, bodyOverride?: string): ParsedVerdict {
  const level = detectVerdictLevel(text);
  const label = extractVerdictLabel(text);
  return { level, label, body: bodyOverride ?? text.trim() };
}

function normalizeHeader(line: string): { level: 3 | 4; title: string } | null {
  const h4 = line.match(/^####\s+(.+)$/);
  if (h4) return { level: 4, title: h4[1].trim() };
  const h3 = line.match(/^###\s+(.+)$/);
  if (h3) return { level: 3, title: h3[1].trim() };
  return null;
}

function isVerdictSection(title: string): boolean {
  return /^verdict$/i.test(title.trim());
}

export function parseAnalysisResult(rawText: string): ParsedAnalysis {
  const text = rawText.trim();
  if (!text) {
    return {
      title: 'Clinical Safety Analysis',
      sections: [],
      verdict: { level: 'unknown', label: 'Clinical Verdict', body: '' },
      rawFallback: '',
    };
  }

  const lines = text.split('\n');
  const blocks: { level: 3 | 4; title: string; bodyLines: string[] }[] = [];
  let current: { level: 3 | 4; title: string; bodyLines: string[] } | null = null;
  let documentTitle = 'Clinical Safety Analysis';

  for (const line of lines) {
    const header = normalizeHeader(line);
    if (header) {
      if (current) blocks.push(current);
      if (header.level === 3 && blocks.length === 0 && !current) {
        documentTitle = header.title;
        current = null;
        continue;
      }
      current = { level: header.level, title: header.title, bodyLines: [] };
      continue;
    }
    if (current) {
      current.bodyLines.push(line);
    } else if (blocks.length === 0) {
      if (!documentTitle || documentTitle === 'Clinical Safety Analysis') {
        documentTitle = line.trim() || documentTitle;
      }
    }
  }
  if (current) blocks.push(current);

  const sections: AnalysisSection[] = [];
  let verdictSection: AnalysisSection | null = null;

  for (const block of blocks) {
    const section: AnalysisSection = {
      title: block.title,
      level: block.level,
      body: block.bodyLines.join('\n').trim(),
    };
    if (isVerdictSection(block.title)) {
      verdictSection = section;
    } else {
      sections.push(section);
    }
  }

  const fullVerdictText = verdictSection?.body ?? text;
  const verdict = buildVerdict(
    verdictSection ? `${fullVerdictText}\n${extractVerdictLabel(text)}` : text,
    verdictSection?.body ?? undefined,
  );

  if (!verdictSection) {
    verdict.level = detectVerdictLevel(text);
    verdict.label = extractVerdictLabel(text);
  }

  if (sections.length < 2) {
    return {
      title: documentTitle,
      sections: [],
      verdict,
      rawFallback: text,
    };
  }

  return {
    title: documentTitle,
    sections,
    verdict,
  };
}

export function verdictSeverity(
  level: VerdictLevel,
): 'success' | 'warning' | 'error' | 'info' {
  switch (level) {
    case 'recommended':
      return 'success';
    case 'caution':
      return 'warning';
    case 'not_recommended':
      return 'error';
    default:
      return 'info';
  }
}
