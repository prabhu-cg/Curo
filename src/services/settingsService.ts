import { db } from './db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppSettings, Bookmark, Collection } from '@/types';

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('app');
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(
  patch: Partial<Omit<AppSettings, 'id'>>,
): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    appearance: { ...current.appearance, ...patch.appearance },
    importBehavior: { ...current.importBehavior, ...patch.importBehavior },
    exportBehavior: { ...current.exportBehavior, ...patch.exportBehavior },
    backup: { ...current.backup, ...patch.backup },
  };
  await db.settings.put(next);
  return next;
}

const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: number;
  bookmarks: Bookmark[];
  collections: Collection[];
  settings: AppSettings;
}

export async function createBackup(): Promise<string> {
  const [bookmarks, collections, settings] = await Promise.all([
    db.bookmarks.toArray(),
    db.collections.toArray(),
    getSettings(),
  ]);

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    bookmarks,
    collections,
    settings,
  };

  await updateSettings({
    backup: { ...settings.backup, lastBackupAt: payload.exportedAt },
  });

  return JSON.stringify(payload, null, 2);
}

export class InvalidBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBackupError';
  }
}

function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.bookmarks) &&
    Array.isArray(record.collections) &&
    typeof record.settings === 'object'
  );
}

/** Replaces all local data with the contents of a previously exported backup. */
export async function restoreBackup(json: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new InvalidBackupError('The backup file is not valid JSON.');
  }

  if (!isBackupPayload(parsed)) {
    throw new InvalidBackupError(
      'This file does not look like a Curo backup (missing bookmarks, collections, or settings).',
    );
  }

  await db.transaction('rw', db.bookmarks, db.collections, db.settings, async () => {
    await db.bookmarks.clear();
    await db.collections.clear();
    await db.settings.clear();
    await db.bookmarks.bulkAdd(parsed.bookmarks);
    await db.collections.bulkAdd(parsed.collections);
    await db.settings.put(parsed.settings);
  });
}
