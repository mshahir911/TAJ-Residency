// Theme Management for TAJ Residency PMS
// Supports 'dark' (Night-Desk & Boarding-Pass) and 'light' (Prestige Day-Desk White Theme)

const THEME_STORAGE_KEY = 'taj_pms_theme';

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (err) {
    // Ignore localStorage errors
  }
  return 'dark';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const targetTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', targetTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
  } catch (err) {
    // Ignore localStorage errors
  }
  // Dispatch custom event for cross-component reactive updates
  window.dispatchEvent(new CustomEvent('taj-theme-change', { detail: { theme: targetTheme } }));
}

export function toggleTheme(currentTheme) {
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
  return nextTheme;
}
