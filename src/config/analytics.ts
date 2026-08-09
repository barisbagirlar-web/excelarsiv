export const analytics = Object.freeze({
  events: Object.freeze({
    templateView: 'template_view',
    downloadStart: 'download_start',
    downloadComplete: 'download_complete',
    signup: 'signup',
    checkoutIntent: 'checkout_intent',
  }),
});

export type AnalyticsEventName = typeof analytics.events[keyof typeof analytics.events];
export type DownloadSource = 'organic' | 'direct' | 'internal';
