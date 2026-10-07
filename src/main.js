// Entry point for the new tab page: loads settings, renders the blocks, and wires page-wide keys and sync.
import { clockParts, relativeZone } from './core.js';
import { applyAppearance } from './appearance.js';
import { closeDockPopups, renderDock } from './dock.js';
import { h, isModalOpen } from './dom.js';
import { pickImportFile } from './import-review.js';
import { closeSearchPopups, focusWebSearch, searchBlock } from './search.js';
import { openSettings } from './settings.js';
import { closeShortcutPopover, shortcutsBlock } from './shortcuts.js';
import { initStore, replaceFromOtherTab, store, subscribe } from './state.js';
import { onSettingsChanged } from './storage.js';

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 810;
const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const clockEls = { section: null, local: null, seconds: null, am: null, pm: null, date: null, world: [] };

// Scale the 1440-wide design to the window so the page never scrolls (same rule as the design canvas).
function fitStage() {
  const stage = document.getElementById('stage');
  const w = window.innerWidth || DESIGN_WIDTH;
  const hgt = window.innerHeight || DESIGN_HEIGHT;
  const scale = Math.min(w / DESIGN_WIDTH, hgt / DESIGN_HEIGHT);
  stage.style.width = `${w / scale}px`;
  stage.style.height = `${hgt / scale}px`;
  stage.style.transform = `scale(${scale})`;
}

function clocksBlock() {
  const { clocks } = store.settings;
  clockEls.local = h('span.time');
  clockEls.seconds = h('span.seconds');
  clockEls.am = h('span', {}, 'AM');
  clockEls.pm = h('span', {}, 'PM');
  clockEls.date = h('span.date');
  clockEls.world = clocks.world.map((clock) => ({ tz: clock.tz, time: h('span.time'), rel: h('span.rel') }));
  clockEls.section ||= h('section.clocks', { 'aria-label': 'Clocks' });
  clockEls.section.replaceChildren(
    h('div.clock-local', {},
      h('span.kicker', {}, `${localTz.split('/').pop().replace(/_/g, ' ').toUpperCase()} · LOCAL`),
      h('span.time-row', {},
        clocks.hour12 ? h('span.period', {}, clockEls.am, clockEls.pm) : null,
        clockEls.local, clockEls.seconds),
      clockEls.date),
    h('div.world', {}, ...clocks.world.map((clock, i) => h('div.world-clock', {},
      h('span.kicker', {}, clock.city.toUpperCase()),
      clockEls.world[i].time,
      clockEls.world[i].rel))));
  tick();
  return clockEls.section;
}

function tick() {
  if (!clockEls.local) return;
  const now = new Date();
  const { showSeconds, hour12 } = store.settings.clocks;
  // Hours and minutes large; seconds (when on) set smaller beside them; in 12-hour mode AM over PM on the left.
  const local = clockParts(now, localTz, hour12);
  clockEls.local.textContent = local.hm;
  clockEls.seconds.textContent = showSeconds ? `:${local.ss}` : '';
  clockEls.am.className = local.period === 'AM' ? 'on' : '';
  clockEls.pm.className = local.period === 'PM' ? 'on' : '';
  clockEls.date.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: localTz }).format(now);
  for (const clock of clockEls.world) {
    const parts = clockParts(now, clock.tz, hour12);
    clock.time.textContent = parts.period ? `${parts.hm} ${parts.period}` : parts.hm;
    clock.rel.textContent = relativeZone(now, clock.tz, localTz);
  }
}

function renderFooter() {
  document.getElementById('footer').replaceChildren(
    h('span', {}, 'Saved locally'),
    h('button.linkish', { type: 'button', onclick: pickImportFile }, 'Import'),
    h('button.linkish', { type: 'button', onclick: () => openSettings({ tab: 'Data' }) }, 'Export')
  );
}

function render() {
  applyAppearance(store.settings);
  const builders = { clocks: clocksBlock, search: searchBlock, shortcuts: shortcutsBlock };
  const page = document.getElementById('page');
  const blocks = store.settings.layout.blocks.map((block) => builders[block]());
  // Blocks are long-lived elements; only re-order them when the layout changed, so focus and typed text survive.
  if (blocks.some((block, i) => page.children[i] !== block) || page.children.length !== blocks.length) page.replaceChildren(...blocks);
  renderDock(document.getElementById('dock'));
  renderFooter();
}

function wireGlobalEvents() {
  window.addEventListener('resize', fitStage);

  // A press outside an open popup (engine menu, suggestions, flyout, tile editor) closes it.
  document.addEventListener('mousedown', (event) => {
    if (isModalOpen()) return;
    const keep = event.target.closest?.('[data-keep]')?.dataset.keep || '';
    closeSearchPopups(keep);
    closeDockPopups(keep);
    closeShortcutPopover(keep);
  });

  // "/" jumps to web search unless the user is typing somewhere.
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || isModalOpen() || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    focusWebSearch();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.settings.theme === 'system') render();
  });
}

async function start() {
  fitStage();
  await initStore();
  subscribe(render);
  onSettingsChanged((settings) => {
    if (JSON.stringify(settings) === JSON.stringify(store.settings)) return;
    // Don't swap settings underneath an open dialog; the next change after it closes will catch up.
    if (!isModalOpen()) replaceFromOtherTab(settings);
  });
  wireGlobalEvents();
  render();
  setInterval(tick, 1000);
  focusWebSearch();
}

start();
