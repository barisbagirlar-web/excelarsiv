import { analytics, type AnalyticsEventName, type DownloadSource } from '../config/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsPayload = Record<string, string | number | boolean>;

export function trackAnalyticsEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload): boolean {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  window.gtag('event', eventName, payload);
  return true;
}

export function resolveDownloadSource(referrer = typeof document === 'undefined' ? '' : document.referrer): DownloadSource {
  if (!referrer) return 'direct';
  try {
    const referrerUrl = new URL(referrer);
    if (typeof window !== 'undefined' && referrerUrl.origin === window.location.origin) return 'internal';
    const host = referrerUrl.hostname.toLowerCase();
    if (/^(www\.)?(google\.|bing\.|search\.yahoo\.|duckduckgo\.com|yandex\.)/.test(host)) return 'organic';
    return 'direct';
  } catch {
    return 'direct';
  }
}

export function fileTypeFromDownloadUrl(value: string): string {
  try {
    const url = new URL(value, typeof window === 'undefined' ? 'https://excelarsiv.com' : window.location.origin);
    const decoded = decodeURIComponent(`${url.pathname} ${url.search}`);
    const match = decoded.match(/\.(xlsx|xlsm)(?:\b|[^a-z0-9])/i);
    return match?.[1]?.toLowerCase() ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export { analytics };
