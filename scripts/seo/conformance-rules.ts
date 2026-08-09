const CONFIDENCE_TAG = /\[(?:Kesin|Güçlü|Varsayım|Eksik_veri)\]/u;
const MONEY_TOKEN = /(?:\bTRY\b|\bTL\b|₺|\bUSD\b|\$|\bEUR\b|€)/u;
const THRESHOLD_ASSIGN_OR_COMPARE = /\b([A-Za-z][A-Za-z0-9]*?(?:Threshold|Min|Max|Pct|Days|Hours|Weeks|Months|Ms|Rho))\b\s*(?:[<>=]=?|:)\s*(-?\d+(?:\.\d+)?)/g;
const ALLOWED_PROTOCOL_NUMBERS = new Set(['0', '1', '100']);

function moneyClaimHasConfidence(line: string): boolean {
  return !MONEY_TOKEN.test(line) || CONFIDENCE_TAG.test(line);
}

function approvalRecordPresent(markdown: string, decisionNeedle: string): boolean {
  return markdown
    .split(/\r?\n/)
    .some((line) => line.includes(decisionNeedle) && /^\|\s*\d{4}-\d{2}-\d{2}T[^|]+\|\s*[^|]+\|/.test(line));
}

function hardcodedThresholdHits(source: string): string[] {
  const hits: string[] = [];
  for (const match of source.matchAll(THRESHOLD_ASSIGN_OR_COMPARE)) {
    const literal = match[2];
    if (!literal || ALLOWED_PROTOCOL_NUMBERS.has(literal)) continue;
    hits.push(match[0]);
  }
  return hits;
}

function explicitAnyHits(source: string): string[] {
  return source
    .split(/\r?\n/)
    .filter((line) => !line.includes('function explicitAnyHits') && /(?:\bas\s+any\b|:\s*any\b|<any>|\bany\[\])/u.test(line));
}

function evaluateColdStart(availableDays: number, thresholdDays: number): { coldStart: boolean; confidence: 'low' | 'high' } {
  const coldStart = availableDays < thresholdDays;
  return { coldStart, confidence: coldStart ? 'low' : 'high' };
}

export { moneyClaimHasConfidence, approvalRecordPresent, hardcodedThresholdHits, explicitAnyHits, evaluateColdStart };
