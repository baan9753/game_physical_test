type EventParams = Record<string, string | number | boolean | null | undefined>;

type GameAnalyticsWindow = Window & {
  gtag?: (command: 'event', eventName: string, parameters?: EventParams) => void;
};

/** Sends game events through the host site's GA4 gtag integration when available. */
export function trackGameEvent(eventName: string, parameters: EventParams = {}) {
  if (typeof window === 'undefined') return;
  const gtag = (window as GameAnalyticsWindow).gtag;
  if (typeof gtag === 'function') gtag('event', eventName, parameters);
}
