// The three smart search boxes: engine menu, routing hint, suggestions, keyboard navigation.
import { SEARCH_BOXES, historyMatches, routeQuery } from './core.js';
import { h, icon } from './dom.js';
import { rememberQuery, store, update } from './state.js';
import { navigate } from './widgets.js';

const SUGGEST_URL = 'https://api.datamuse.com/sug?max=4&s=';
const boxes = {};

function engineOf(box) {
  const group = store.settings.engines[box];
  return group.list.find((e) => e.id === group.default) || group.list[0];
}

async function webSuggestions(query, signal) {
  try {
    const response = await fetch(SUGGEST_URL + encodeURIComponent(query), { signal });
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item) => item.word).filter((word) => typeof word === 'string');
  } catch {
    return [];
  }
}

function createBox(box) {
  const meta = SEARCH_BOXES[box];
  const id = `q-${box}`;
  const state = { items: [], active: -1, controller: null, timer: null, offline: false };

  const engineButton = h('button.engine-btn', { type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' });
  const input = h('input', {
    id, type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: meta.placeholder,
    role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': `${id}-list`
  });
  const hint = h('span.hint', { hidden: true });
  const go = h('button.go-btn', { type: 'button' }, 'Search');
  const engineMenu = h('div.menu.engine-menu', { role: 'listbox', 'aria-label': `${meta.kicker} engine`, hidden: true });
  const suggestMenu = h('div.menu.suggest-menu', { id: `${id}-list`, role: 'listbox', 'aria-label': 'Suggestions', hidden: true });
  const wrap = h('div.search-wrap', { dataset: { keep: `field-${box}` } },
    h('div.field', {}, engineButton, input, hint, go), engineMenu, suggestMenu);
  const row = h('div.search-row', {}, h('label.kicker', { for: id }, meta.kicker), wrap);

  const route = () => routeQuery(input.value, engineOf(box));

  const refreshHint = () => {
    const r = route();
    const show = r.kind !== 'empty' && r.kind !== 'search';
    hint.hidden = !show;
    hint.className = `hint ${r.kind}`;
    hint.textContent = show ? r.hint : '';
    go.textContent = r.action;
    go.disabled = r.kind === 'blocked';
  };

  const run = (newTab = false) => {
    const r = route();
    if (!r.dest) return;
    rememberQuery(box, input.value);
    closeSuggestions();
    navigate(r.dest, newTab);
  };

  const closeSuggestions = () => {
    state.items = [];
    state.active = -1;
    suggestMenu.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const renderSuggestions = () => {
    if (!state.items.length || document.activeElement !== input) return closeSuggestions();
    const children = [];
    state.items.forEach((item, index) => {
      if (index === 0 || state.items[index - 1].kind !== item.kind) {
        children.push(h('span.menu-head', { 'aria-hidden': 'true' }, item.kind === 'history' ? 'RECENT' : 'SUGGESTED'));
      }
      const selected = index === state.active;
      children.push(h('button.option', {
        id: `${id}-opt-${index}`, type: 'button', role: 'option', tabindex: '-1', 'aria-selected': String(selected),
        onmousedown: (event) => {
          event.preventDefault();
          input.value = item.text;
          refreshHint();
          run(event.ctrlKey || event.metaKey || event.button === 1);
        }
      }, icon(item.kind === 'history' ? 'history' : 'search', 16, 1.8), h('span.label', {}, item.text), selected ? h('span.meta', {}, 'Enter') : null));
    });
    children.push(h('div.suggest-foot', {}, h('span', {}, '↑ ↓ move · Enter choose · Esc close'), h('span', {}, box === 'web' && !state.offline ? 'Local history + web' : 'Local history')));
    suggestMenu.replaceChildren(...children);
    suggestMenu.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (state.active >= 0) input.setAttribute('aria-activedescendant', `${id}-opt-${state.active}`);
    else input.removeAttribute('aria-activedescendant');
  };

  const loadSuggestions = () => {
    const query = input.value.trim();
    const history = historyMatches(store.history, box, query).map((text) => ({ text, kind: 'history' }));
    state.items = history;
    state.active = -1;
    renderSuggestions();
    clearTimeout(state.timer);
    state.controller?.abort();
    const r = route();
    if (box !== 'web' || !query || r.kind !== 'search') return;
    state.timer = setTimeout(async () => {
      state.controller = new AbortController();
      const words = await webSuggestions(query, state.controller.signal);
      state.offline = !words.length && !navigator.onLine;
      if (input.value.trim() !== query) return;
      const seen = new Set(history.map((item) => item.text.toLowerCase()));
      const web = words.filter((word) => !seen.has(word.toLowerCase()) && word.toLowerCase() !== query.toLowerCase()).slice(0, 4).map((text) => ({ text, kind: 'web' }));
      state.items = history.concat(web);
      renderSuggestions();
    }, 150);
  };

  const closeEngineMenu = (focusButton = false) => {
    engineMenu.hidden = true;
    engineButton.setAttribute('aria-expanded', 'false');
    if (focusButton) engineButton.focus();
  };

  const openEngineMenu = () => {
    closeSuggestions();
    const group = store.settings.engines[box];
    engineMenu.replaceChildren(
      h('span.menu-head', { 'aria-hidden': 'true' }, 'DEFAULT ENGINE'),
      ...group.list.map((engine) => {
        const on = engine.id === group.default;
        return h('button.option', {
          type: 'button', role: 'option', tabindex: '-1', 'aria-selected': String(on),
          onclick: () => {
            closeEngineMenu(true);
            update((draft) => { draft.engines[box].default = engine.id; });
          }
        }, h('span.label', {}, engine.name), on ? h('span.tick', {}, icon('check', 16, 2.2)) : null);
      })
    );
    engineMenu.hidden = false;
    engineButton.setAttribute('aria-expanded', 'true');
    (engineMenu.querySelector('[aria-selected="true"]') || engineMenu.querySelector('.option'))?.focus();
  };

  engineButton.addEventListener('click', () => (engineMenu.hidden ? openEngineMenu() : closeEngineMenu()));
  engineMenu.addEventListener('keydown', (event) => {
    const options = [...engineMenu.querySelectorAll('.option')];
    const index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeEngineMenu(true);
    } else if (event.key === 'Tab') {
      closeEngineMenu();
    }
  });

  input.addEventListener('input', () => { refreshHint(); loadSuggestions(); });
  input.addEventListener('focus', () => { closeEngineMenu(); if (input.value.trim()) loadSuggestions(); });
  input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input) closeSuggestions(); }, 0));
  input.addEventListener('keydown', (event) => {
    const n = state.items.length;
    if (event.key === 'ArrowDown' && n) {
      event.preventDefault();
      state.active = (state.active + 1) % n;
      renderSuggestions();
    } else if (event.key === 'ArrowUp' && n) {
      event.preventDefault();
      state.active = (state.active - 1 + n) % n;
      renderSuggestions();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (n && state.active >= 0) {
        input.value = state.items[state.active].text;
        refreshHint();
      }
      run(event.ctrlKey || event.metaKey);
    } else if (event.key === 'Escape') {
      if (!suggestMenu.hidden) {
        event.preventDefault();
        closeSuggestions();
      } else if (input.value) {
        event.preventDefault();
        input.value = '';
        refreshHint();
      }
    }
  });
  go.addEventListener('click', (event) => run(event.ctrlKey || event.metaKey));
  go.addEventListener('auxclick', (event) => { if (event.button === 1) run(true); });

  const refresh = () => {
    const engine = engineOf(box);
    engineButton.replaceChildren(engine.name, icon('chevronDown', 14, 2.2));
    engineButton.setAttribute('aria-label', `${meta.kicker} engine: ${engine.name}`);
    refreshHint();
  };

  refresh();
  return {
    row,
    refresh,
    focus: () => input.focus(),
    closePopups(keep) {
      if (keep !== `field-${box}`) {
        closeEngineMenu();
        closeSuggestions();
      }
    }
  };
}

// The search block is built once so typed text and focus survive settings changes.
export function searchBlock() {
  if (!boxes.el) {
    for (const box of Object.keys(SEARCH_BOXES)) boxes[box] = createBox(box);
    boxes.el = h('section.search', { 'aria-label': 'Search' }, ...Object.keys(SEARCH_BOXES).map((box) => boxes[box].row));
  }
  for (const box of Object.keys(SEARCH_BOXES)) boxes[box].refresh();
  return boxes.el;
}

export function focusWebSearch() {
  boxes.web?.focus();
}

export function closeSearchPopups(keep) {
  for (const box of Object.keys(SEARCH_BOXES)) boxes[box]?.closePopups(keep);
}
