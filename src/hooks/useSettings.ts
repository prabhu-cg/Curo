import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services';
import { updateSettings } from '@/services/settingsService';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppSettings } from '@/types';

export interface UseSettingsResult {
  settings: AppSettings;
  isLoading: boolean;
  update: (patch: Partial<Omit<AppSettings, 'id'>>) => Promise<AppSettings>;
}

/**
 * Reactive view of the singleton settings row. Falls back to defaults before
 * the row exists (it's created once on app bootstrap, see AppProviders).
 */
export function useSettings(): UseSettingsResult {
  const settings = useLiveQuery(() => db.settings.get('app'), []);
  const update = useCallback(
    (patch: Partial<Omit<AppSettings, 'id'>>) => updateSettings(patch),
    [],
  );

  return {
    settings: settings ?? DEFAULT_SETTINGS,
    isLoading: settings === undefined,
    update,
  };
}
