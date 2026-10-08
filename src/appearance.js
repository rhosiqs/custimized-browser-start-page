// Applies theme, accent and background from settings to the page root and stage.
import { normalizeHex, readableOn } from './core.js';

export function isDark(settings) {
  return settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function applyAppearance(settings) {
  const root = document.documentElement;
  root.classList.toggle('theme-dark', isDark(settings));
  root.classList.toggle('theme-light', !isDark(settings));
  for (const accent of ['green', 'brown', 'ink']) root.classList.toggle(`acc-${accent}`, settings.accent === accent);
  // A custom #HEX accent is the same in both themes, with text picked for contrast.
  const custom = normalizeHex(settings.accent);
  if (custom) {
    root.style.setProperty('--acc', custom);
    root.style.setProperty('--on-acc', readableOn(custom));
  } else {
    root.style.removeProperty('--acc');
    root.style.removeProperty('--on-acc');
  }

  const stage = document.getElementById('stage');
  const bg = settings.background;
  stage.classList.remove('bg-solid', 'bg-gradient', 'bg-image');
  stage.style.removeProperty('--solid');
  stage.style.removeProperty('--grad-from');
  stage.style.removeProperty('--grad-to');
  stage.style.backgroundImage = '';
  if (bg.type === 'image' && bg.image) {
    stage.classList.add('bg-image');
    stage.style.backgroundImage = `url("${bg.image}")`;
  } else if (bg.type === 'gradient') {
    stage.classList.add('bg-gradient');
    stage.style.setProperty('--grad-from', bg.from);
    stage.style.setProperty('--grad-to', bg.to);
  } else {
    stage.classList.add('bg-solid');
    if (bg.solid) stage.style.setProperty('--solid', bg.solid);
  }
}
