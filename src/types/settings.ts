import { DEFAULT_HEALTH_WEIGHTS } from './analytics';
import type { HealthScoreWeights } from './analytics';

export type ExportFormat = 'html' | 'csv' | 'json' | 'markdown';
export type UiDensity = 'comfortable' | 'compact';

export interface AppSettings {
  /** Singleton row id. */
  id: 'app';
  appearance: {
    density: UiDensity;
  };
  importBehavior: {
    autoNormalizeUrls: boolean;
    autoDetectDuplicatesOnImport: boolean;
    skipInvalidEntries: boolean;
  };
  exportBehavior: {
    defaultFormat: ExportFormat;
    includeFolderStructure: boolean;
  };
  backup: {
    lastBackupAt?: number;
    reminderIntervalDays: number;
  };
  demoDataEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  healthScoreWeights: HealthScoreWeights;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  appearance: {
    density: 'comfortable',
  },
  importBehavior: {
    autoNormalizeUrls: true,
    autoDetectDuplicatesOnImport: true,
    skipInvalidEntries: true,
  },
  exportBehavior: {
    defaultFormat: 'html',
    includeFolderStructure: true,
  },
  backup: {
    reminderIntervalDays: 30,
  },
  demoDataEnabled: false,
  keyboardShortcutsEnabled: true,
  healthScoreWeights: DEFAULT_HEALTH_WEIGHTS,
};
