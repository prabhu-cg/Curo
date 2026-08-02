export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Label for the platform's primary modifier key, used in shortcut hints (e.g. "⌘K" / "Ctrl+K"). */
export const MOD_KEY_LABEL = isMac ? '⌘' : 'Ctrl+';
