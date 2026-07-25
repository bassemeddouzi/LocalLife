/** Lightweight analytics stub — wire Sentry/Segment in Phase 06/staging. */
export function track(event: string, props?: Record<string, unknown>) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, props ?? {});
  }
}
