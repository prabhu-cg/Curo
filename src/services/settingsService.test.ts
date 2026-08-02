import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { getSettings, updateSettings } from './settingsService';
import { DEFAULT_SETTINGS } from '@/types';

beforeEach(async () => {
  await db.settings.clear();
});

describe('getSettings', () => {
  it('creates and returns the default settings row when none exists', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(await db.settings.get('app')).toEqual(DEFAULT_SETTINGS);
  });

  it('backfills a field missing from an older stored settings row', async () => {
    const { healthScoreWeights: _omit, ...legacy } = DEFAULT_SETTINGS;
    // Simulate a pre-Phase-2 settings row saved before healthScoreWeights existed.
    await db.settings.put(legacy as typeof DEFAULT_SETTINGS);

    const settings = await getSettings();
    expect(settings.healthScoreWeights).toEqual(DEFAULT_SETTINGS.healthScoreWeights);

    const stored = await db.settings.get('app');
    expect(stored?.healthScoreWeights).toEqual(DEFAULT_SETTINGS.healthScoreWeights);
  });
});

describe('updateSettings', () => {
  it('shallow-merges a partial health score weights patch', async () => {
    await updateSettings({
      healthScoreWeights: { ...DEFAULT_SETTINGS.healthScoreWeights, tags: 0.5 },
    });
    const settings = await getSettings();
    expect(settings.healthScoreWeights.tags).toBe(0.5);
    expect(settings.healthScoreWeights.duplicates).toBe(
      DEFAULT_SETTINGS.healthScoreWeights.duplicates,
    );
  });
});
