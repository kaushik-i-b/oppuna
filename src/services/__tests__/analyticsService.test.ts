import {
  clearAnalytics,
  getAnalyticsSnapshot,
  recordAppOpen,
  trackEvent,
} from '@/services/analyticsService';

describe('analyticsService', () => {
  beforeEach(async () => {
    await clearAnalytics();
  });

  it('records first_open once and never stores free-text props', async () => {
    await recordAppOpen();
    await recordAppOpen();
    const snap = await getAnalyticsSnapshot();
    expect(snap.flags.first_open).toBe(true);
    expect(snap.events.filter((e) => e.name === 'first_open')).toHaveLength(1);

    await trackEvent('first_mood_logged', {
      mood_key: 'good',
      note: 'should never be stored',
      body: 'also blocked',
    }, { once: true });
    const after = await getAnalyticsSnapshot();
    const mood = after.events.find((e) => e.name === 'first_mood_logged');
    expect(mood?.props?.mood_key).toBe('good');
    expect(mood?.props?.note).toBeUndefined();
    expect(mood?.props?.body).toBeUndefined();
  });

  it('tracks once-only flags', async () => {
    await trackEvent('onboarding_started', { step: 'language' }, { once: true });
    await trackEvent('onboarding_started', { step: 'language' }, { once: true });
    const snap = await getAnalyticsSnapshot();
    expect(snap.events.filter((e) => e.name === 'onboarding_started')).toHaveLength(1);
  });
});
