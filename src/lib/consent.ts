export const CONSENT_STORAGE_KEY = 'excelarsiv:consent:v2';
export const CONSENT_VERSION = 2;

export type ConsentStatus = 'granted' | 'denied';
export type ConsentSignal = ConsentStatus;
export type ConsentSignals = {
  ad_storage: ConsentSignal;
  analytics_storage: ConsentSignal;
  ad_user_data: ConsentSignal;
  ad_personalization: ConsentSignal;
};
export type ConsentRecord = {
  version: number;
  status: ConsentStatus;
  updatedAt: string;
};
export type ConsentRuntimeApi = {
  getStatus: () => ConsentStatus | null;
  setStatus: (status: ConsentStatus) => ConsentStatus;
  hasAnalyticsConsent: () => boolean;
};

declare global {
  interface Window {
    ExcelArsivConsent?: ConsentRuntimeApi;
  }
}

export function consentSignals(status: ConsentStatus): ConsentSignals {
  return {
    ad_storage: status,
    analytics_storage: status,
    ad_user_data: status,
    ad_personalization: status,
  };
}

export function parseConsentRecord(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (parsed.status !== 'granted' && parsed.status !== 'denied') return null;
    if (typeof parsed.updatedAt !== 'string' || !parsed.updatedAt) return null;
    return { version: CONSENT_VERSION, status: parsed.status, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export function makeConsentRecord(status: ConsentStatus, now = new Date()): ConsentRecord {
  return { version: CONSENT_VERSION, status, updatedAt: now.toISOString() };
}

export function hasAnalyticsConsent(storage: Pick<Storage, 'getItem'> | null = typeof window === 'undefined' ? null : window.localStorage): boolean {
  if (!storage) return false;
  try {
    return parseConsentRecord(storage.getItem(CONSENT_STORAGE_KEY))?.status === 'granted';
  } catch {
    return false;
  }
}
