import { useEffect } from 'react';
import { useSettings } from './useSettings';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/** Global "/" shortcut to jump to search, gated by the user's preference. */
export function useGlobalShortcuts(): void {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.keyboardShortcutsEnabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      document.getElementById('global-search')?.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardShortcutsEnabled]);
}
