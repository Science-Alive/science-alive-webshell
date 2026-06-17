// Shared color schemes used across every page (login, sign-up, terminal).
// Each theme has a `term` (xterm.js palette) and a `ui` block (page chrome).
// The `ui` block recolors the header/borders/cards so the whole page matches.

const THEMES = {
  // ── Fantasy (dark) ──
  torchlight: {
    label: '🔥 Torchlight (fantasy)',
    ui: { bg:'#14100c', surface:'#1d1812', border:'#3f3322', accent:'#ffb347',
          danger:'#ff6b4a', text:'#f0e4c8', muted:'#b09872', logoText:'#fff6e6' },
    term: {
      background:'#14100c', foreground:'#f0e4c8',
      cursor:'#ffb347', cursorAccent:'#14100c',
      selectionBackground:'rgba(255,179,71,0.25)',
      black:'#2a2018', brightBlack:'#5a4a38',
      red:'#e05a3a', brightRed:'#ff7a52',
      green:'#8fae5a', brightGreen:'#b4d97a',
      yellow:'#ffc857', brightYellow:'#ffe08a',
      blue:'#5a8fc7', brightBlue:'#82b4e8',
      magenta:'#b07cd6', brightMagenta:'#cfa0ec',
      cyan:'#5fb3b3', brightCyan:'#8ad6d6',
      white:'#e8d8b8', brightWhite:'#fff6e6',
    }
  },
  arcane: {
    label: '🔮 Arcane (fantasy)',
    ui: { bg:'#120e1c', surface:'#1a1428', border:'#3a2f56', accent:'#c792ea',
          danger:'#ff6b9a', text:'#e4dcff', muted:'#9a8cc0', logoText:'#ffffff' },
    term: {
      background:'#120e1c', foreground:'#e4dcff',
      cursor:'#c792ea', cursorAccent:'#120e1c',
      selectionBackground:'rgba(199,146,234,0.25)',
      black:'#241c38', brightBlack:'#564b78',
      red:'#ff5c8a', brightRed:'#ff85a8',
      green:'#6fd6a0', brightGreen:'#9cf0c4',
      yellow:'#f0c674', brightYellow:'#ffe0a0',
      blue:'#7aa2f7', brightBlue:'#a0c0ff',
      magenta:'#c792ea', brightMagenta:'#e0b0ff',
      cyan:'#7fdbe8', brightCyan:'#a8ecf5',
      white:'#d8cef0', brightWhite:'#ffffff',
    }
  },
  // ── Light ──
  parchment: {
    label: '📜 Parchment (light)',
    ui: { bg:'#f2e8d0', surface:'#e6d8b8', border:'#c4ad7e', accent:'#8a4a1e',
          danger:'#a32a1e', text:'#2e2415', muted:'#6e5c3e', logoText:'#2e2415' },
    term: {
      background:'#f2e8d0', foreground:'#3a2e1f',
      cursor:'#9a5b2e', cursorAccent:'#f2e8d0',
      selectionBackground:'rgba(154,91,46,0.2)',
      black:'#3a2e1f', brightBlack:'#6b5a44',
      red:'#b23a2e', brightRed:'#d04a38',
      green:'#5a7d2a', brightGreen:'#6e9636',
      yellow:'#b8860b', brightYellow:'#d4a017',
      blue:'#2a5d8f', brightBlue:'#356fa8',
      magenta:'#8a4b9c', brightMagenta:'#a05cb4',
      cyan:'#2a7d7d', brightCyan:'#339494',
      white:'#3a2e1f', brightWhite:'#1a140c',
    }
  },
  daylight: {
    label: '☀ Daylight (light)',
    ui: { bg:'#fafafa', surface:'#eef0f2', border:'#c4c8cc', accent:'#0058b0',
          danger:'#c62828', text:'#1a1a1a', muted:'#5a5a5a', logoText:'#101010' },
    term: {
      background:'#fafafa', foreground:'#2a2a2a',
      cursor:'#0066cc', cursorAccent:'#fafafa',
      selectionBackground:'rgba(0,102,204,0.18)',
      black:'#2a2a2a', brightBlack:'#666666',
      red:'#cc3333', brightRed:'#e05555',
      green:'#2e8b3d', brightGreen:'#3aa84d',
      yellow:'#b58900', brightYellow:'#d4a017',
      blue:'#0066cc', brightBlue:'#2a8fff',
      magenta:'#9c27b0', brightMagenta:'#bb44cc',
      cyan:'#008b8b', brightCyan:'#00a8a8',
      white:'#2a2a2a', brightWhite:'#000000',
    }
  },
  // ── High contrast ──
  highContrastDark: {
    label: '◐ High Contrast (dark)',
    ui: { bg:'#000000', surface:'#000000', border:'#ffffff', accent:'#ffff00',
          danger:'#ff5555', text:'#ffffff', muted:'#cccccc', logoText:'#ffffff' },
    term: {
      background:'#000000', foreground:'#ffffff',
      cursor:'#ffff00', cursorAccent:'#000000',
      selectionBackground:'rgba(255,255,0,0.35)',
      black:'#000000', brightBlack:'#808080',
      red:'#ff5555', brightRed:'#ff8080',
      green:'#00ff00', brightGreen:'#55ff55',
      yellow:'#ffff00', brightYellow:'#ffff80',
      blue:'#4d9fff', brightBlue:'#80bfff',
      magenta:'#ff55ff', brightMagenta:'#ff99ff',
      cyan:'#00ffff', brightCyan:'#80ffff',
      white:'#ffffff', brightWhite:'#ffffff',
    }
  },
  highContrastLight: {
    label: '◑ High Contrast (light)',
    ui: { bg:'#ffffff', surface:'#ffffff', border:'#000000', accent:'#0000cc',
          danger:'#cc0000', text:'#000000', muted:'#333333', logoText:'#000000' },
    term: {
      background:'#ffffff', foreground:'#000000',
      cursor:'#0000cc', cursorAccent:'#ffffff',
      selectionBackground:'rgba(0,0,204,0.25)',
      black:'#000000', brightBlack:'#404040',
      red:'#cc0000', brightRed:'#990000',
      green:'#006600', brightGreen:'#008800',
      yellow:'#996600', brightYellow:'#b37700',
      blue:'#0000cc', brightBlue:'#0000ff',
      magenta:'#990099', brightMagenta:'#cc00cc',
      cyan:'#006666', brightCyan:'#008888',
      white:'#000000', brightWhite:'#000000',
    }
  },
};

const DEFAULT_THEME = 'torchlight';
const THEME_KEY = 'terminalTheme';

// Returns the saved theme key, falling back to the default if unset/unknown.
function getSavedTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  return THEMES[saved] ? saved : DEFAULT_THEME;
}

// Applies a theme's page-chrome (CSS vars) and, if a terminal is passed, its
// xterm palette. Persists the choice to localStorage.
function applyTheme(name, term) {
  const theme = THEMES[name] || THEMES[DEFAULT_THEME];
  if (term) term.options.theme = theme.term;
  const root = document.documentElement.style;
  root.setProperty('--bg',        theme.ui.bg);
  root.setProperty('--surface',   theme.ui.surface);
  root.setProperty('--border',    theme.ui.border);
  root.setProperty('--accent',    theme.ui.accent);
  root.setProperty('--danger',    theme.ui.danger);
  root.setProperty('--text',      theme.ui.text);
  root.setProperty('--muted',     theme.ui.muted);
  root.setProperty('--logo-text', theme.ui.logoText);
  try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
}

// Populates a <select> with the theme options and wires it to applyTheme.
// `getTerm` is optional and should return the live terminal (terminal page).
function buildThemeSelector(selectEl, current, getTerm) {
  for (const [key, theme] of Object.entries(THEMES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = theme.label;
    selectEl.appendChild(opt);
  }
  selectEl.value = current;
  selectEl.addEventListener('change', () =>
    applyTheme(selectEl.value, getTerm ? getTerm() : null));
}
