import { createBookmark, clearAllBookmarks } from './bookmarkService';
import { SAMPLE_BOOKMARKS } from '@/data/sampleBookmarks';

/**
 * Seeds the local database with sample bookmarks for development and demos.
 * Gated in the UI behind `settings.demoDataEnabled`, which is itself only
 * exposed when running in dev mode — see the Settings feature.
 */
export async function seedDemoData(): Promise<void> {
  for (const input of SAMPLE_BOOKMARKS) {
    await createBookmark({ ...input, source: 'manual' });
  }
}

export async function clearDemoData(): Promise<void> {
  await clearAllBookmarks();
}
