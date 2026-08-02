import { useEffect } from 'react';
import { useSettings } from './useSettings';

/** Global Cmd/Ctrl+K shortcut to jump to search, gated by the user's preference. */
export function useGlobalShortcuts(): void {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.keyboardShortcutsEnabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const isSearchShortcut =
        event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (!isSearchShortcut) return;

      // Unlike a plain "/" shortcut, Cmd/Ctrl+K isn't a printable character, so it's
      // safe (and expected) to fire even while another field has focus.
      event.preventDefault();
      const input = document.getElementById('global-search');
      if (input instanceof HTMLInputElement) input.select();
      else input?.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardShortcutsEnabled]);
}
