declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string>; u?: string },
    ) => void;
  }
}

export function trackPageview() {
  if (typeof window === 'undefined') return;
  // Strip query string so search terms never appear in analytics.
  window.plausible?.('pageview', {
    u: window.location.origin + window.location.pathname,
  });
}

export function trackEvent(name: string, props?: Record<string, string>) {
  if (typeof window === 'undefined') return;
  window.plausible?.(name, props ? { props } : undefined);
}
