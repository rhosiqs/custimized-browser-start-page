// Reusable pieces built on dom.js: shortcut badges, color pickers, listbox dropdowns, toasts.
import { SWATCHES, colorOf, firstGraphemes, iconTone, initialOf, normalizeHex, readableOn } from './core.js';
import { grip, h, icon } from './dom.js';
import { faviconUrl, siteIconSources } from './storage.js';

// Round icon for a shortcut or launcher link: uploaded image, site favicon, or colored initial.
// color: null leaves the letter's colors to the stylesheet (launcher links).
export function badge({ name, url, color = 'green', icon: mode = 'site', image = '' }, className = '') {
  const swatch = color === null ? null : colorOf(color);
  const letter = () => {
    el.className = `badge${className ? ` ${className}` : ''}`;
    if (swatch) {
      el.style.background = swatch.fill;
      el.style.color = swatch.fg;
    }
    el.replaceChildren(initialOf(name));
  };
  const el = h('span.badge', { 'aria-hidden': 'true', class: className });
  const sources = mode === 'site' && url ? siteIconSources(url) : [];
  if (mode === 'upload' && image) {
    el.append(h('img', { src: image, alt: '', draggable: 'false' }));
  } else if (sources.length) {
    el.classList.add('site');
    const img = h('img', { alt: '', draggable: 'false' });
    // Walk the sources until one gives a real icon; fall back to the letter.
    const tryNext = (index) => {
      const source = sources[index];
      if (!source) { letter(); return; }
      img.onerror = () => tryNext(index + 1);
      img.onload = async () => {
        if (img.naturalWidth < 2) tryNext(index + 1);
        else if (source.chromeCache && await isChromeDefaultIcon(img)) tryNext(index + 1);
        else markTone(el, img);
      };
      img.src = source.src;
    };
    el.append(img);
    tryNext(0);
  } else {
    letter();
  }
  return el;
}

// What a launcher button shows: an image filling the circle (uploaded or linked), a website's icon on a
// light disc, or its label (letters or emoji). A web icon that fails to load shows the label instead.
export function launcherMark(group) {
  // Emoji are wider than letters: three in a row only fit the 40px circle at a smaller size.
  const tight = firstGraphemes(group.icon, 2) !== group.icon && /\p{Extended_Pictographic}/u.test(group.icon);
  const label = () => h(`span.launcher-label${tight ? '.tight' : ''}`, {}, group.icon);
  const mode = group.iconMode || (group.image ? 'upload' : 'label');
  if (mode === 'upload' && group.image) return h('img.launcher-img', { src: group.image, alt: '', draggable: 'false' });
  if (mode === 'url' && group.iconUrl) {
    const img = h('img.launcher-img', { alt: '', draggable: 'false', referrerpolicy: 'no-referrer' });
    img.onerror = () => img.replaceWith(label());
    img.src = group.iconUrl;
    return img;
  }
  const sources = mode === 'site' ? siteIconSources(group.iconUrl || group.links[0]?.url || '') : [];
  if (!sources.length) return label();
  const disc = h('span.launcher-site');
  const img = h('img', { alt: '', draggable: 'false' });
  const tryNext = (index) => {
    const source = sources[index];
    if (!source) { disc.replaceWith(label()); return; }
    img.onerror = () => tryNext(index + 1);
    img.onload = async () => {
      if (img.naturalWidth < 2) tryNext(index + 1);
      else if (source.chromeCache && await isChromeDefaultIcon(img)) tryNext(index + 1);
      else markTone(disc, img);
    };
    img.src = source.src;
  };
  disc.append(img);
  tryNext(0);
  return disc;
}

// Chrome's favicon cache answers unknown pages with a generic globe; detect it by comparing pixels.
let defaultIconPixels = null;
// Cross-origin icons taint the canvas; they read as no pixels.
function iconData(img) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 16, 16);
    return ctx.getImageData(0, 0, 16, 16).data;
  } catch {
    return null;
  }
}
function iconPixels(img) {
  return iconData(img)?.join(',') || '';
}
// A white logo vanishes on the light disc and a black one on the dark disc; the stylesheet swaps the disc.
// A cross-origin icon is read again through CORS; sites that don't allow it keep the plain disc.
function markTone(holder, img) {
  const apply = (data) => {
    const tone = data ? iconTone(data) : '';
    if (tone) holder.dataset.tone = tone;
    else delete holder.dataset.tone;
  };
  const data = iconData(img);
  if (data || img.src.startsWith(location.origin)) { apply(data); return; }
  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.referrerPolicy = 'no-referrer';
  probe.onload = () => apply(iconData(probe));
  probe.src = img.src;
}
async function isChromeDefaultIcon(img) {
  defaultIconPixels ||= new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(iconPixels(probe));
    probe.onerror = () => resolve('');
    probe.src = faviconUrl('https://unknown-site.invalid/', 64);
  });
  const reference = await defaultIconPixels;
  return Boolean(reference) && iconPixels(img) === reference;
}

// Drag handle for a vertical list row (the row carries data-sort-row). Dragging the handle moves the row;
// arrow keys move it one place. onMove(from, to) changes the list and re-renders synchronously, after which
// the handle of the moved item takes focus again. item: the list entry (an object or a string) it moves.
const sortKeys = new WeakMap();
let sortKeyCount = 0;
function sortKeyOf(item) {
  if (item === null || typeof item !== 'object') return `v:${item}`;
  if (!sortKeys.has(item)) sortKeys.set(item, `o:${(sortKeyCount += 1)}`);
  return sortKeys.get(item);
}
export function sortHandle({ item, index, count, label, onMove }) {
  const key = sortKeyOf(item);
  const refocus = () => document.querySelector(`.sort-handle[data-sort-key="${CSS.escape(key)}"]`)?.focus();
  const handle = h('button.sort-handle', {
    type: 'button',
    'aria-label': `Reorder ${label}: drag, or use the arrow keys`,
    title: 'Drag to reorder',
    dataset: { sortKey: key },
    onkeydown: (event) => {
      const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      const to = index + delta;
      if (to < 0 || to >= count) return;
      onMove(index, to);
      refocus();
    }
  }, grip());

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const row = handle.closest('[data-sort-row]');
    if (!row) return;
    event.preventDefault();
    const others = [...row.parentElement.children].filter((el) => el !== row && el.matches('[data-sort-row]'));
    const startY = event.clientY;
    // The stage is scaled to the window; screen pixels become design pixels for the transform.
    const scale = row.getBoundingClientRect().height / row.offsetHeight || 1;
    let to = index;
    const clear = () => others.forEach((el) => el.classList.remove('drop-before', 'drop-after'));
    const onPointerMove = (e) => {
      row.classList.add('sorting');
      row.style.transform = `translateY(${(e.clientY - startY) / scale}px)`;
      to = others.filter((el) => { const r = el.getBoundingClientRect(); return e.clientY > r.top + r.height / 2; }).length;
      clear();
      if (to === index) return;
      if (to < others.length) others[to].classList.add('drop-before');
      else others[others.length - 1]?.classList.add('drop-after');
    };
    const finish = (commit) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      row.classList.remove('sorting');
      row.style.transform = '';
      clear();
      if (commit && to !== index) { onMove(index, to); refocus(); }
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  });
  return handle;
}

// Shortcut and launcher colors: the SWATCHES presets plus custom #HEX.
export function swatchPicker({ value, onChange, size = '', label = 'Color' }) {
  const options = Object.entries(SWATCHES).map(([key, swatch]) => ({ value: key, label: swatch.label, fill: swatch.fill, fg: swatch.fg }));
  return colorChoice({ value, options, onChange, size, label });
}

// Color picker that shows the first two options and a + button. The + opens a popup with the
// other options and a #HEX field. options: [{ value, label, fill, fg? }] (fg: text on fill, for the + mark); onChange gets a value or '#rrggbb'.
export function colorChoice({ value, options, onChange, size = '', label = 'Color' }) {
  const group = h('div.swatches.color-choice', { role: 'group', 'aria-label': label });
  const sized = size ? `.${size}` : '';
  let current = value;
  let pop = null;

  const pick = (next) => {
    close(false);
    current = next;
    render();
    onChange(next);
  };
  const swatchButton = (option) => h(`button.swatch${sized}`, {
    type: 'button', 'aria-label': option.label, 'aria-pressed': String(option.value === current),
    onclick: () => pick(option.value)
  }, h('span', { style: { background: option.fill } }));

  const onOutside = (event) => { if (!group.contains(event.target)) close(false); };
  function close(refocus) {
    if (!pop) return;
    pop.remove();
    pop = null;
    document.removeEventListener('pointerdown', onOutside, true);
    more.setAttribute('aria-expanded', 'false');
    if (refocus) more.focus();
  }
  const open = () => {
    const hex = normalizeHex(current);
    const msg = h('span.msg.bad', { hidden: true }, 'Use #RGB or #RRGGBB.');
    const field = h('input.input.compact', {
      type: 'text', value: hex, placeholder: '#RRGGBB', maxlength: 7, spellcheck: 'false', autocomplete: 'off',
      'aria-label': `${label} HEX`,
      oninput: () => { msg.hidden = true; field.removeAttribute('aria-invalid'); }
    });
    const apply = () => {
      let v = field.value.trim();
      if (v && v[0] !== '#') v = `#${v}`;
      const next = normalizeHex(v);
      if (next) { pick(next); more.focus(); return; }
      field.setAttribute('aria-invalid', 'true');
      msg.hidden = false;
    };
    pop = h('div.color-pop', {
      role: 'dialog', 'aria-label': `More ${label.toLowerCase()} options`,
      onkeydown: (event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
        // Keep Enter in the HEX field from submitting the form or popover around the picker.
        if (event.key === 'Enter' && event.target === field) { event.preventDefault(); event.stopPropagation(); apply(); }
      }
    },
      options.length > 2 ? h('div.swatches', {}, ...options.slice(2).map(swatchButton)) : null,
      h('div.color-pop-hex', {},
        field,
        h('button.btn.outline.small', { type: 'button', onclick: apply }, 'Apply')),
      msg);
    group.append(pop);
    more.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onOutside, true);
    // Open upward when the popup would run past the bottom of a scrolling dialog or the page.
    let box = group.parentElement;
    while (box && box !== document.body && !/(auto|scroll|hidden)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
    const limit = box && box !== document.body ? box.getBoundingClientRect().bottom : window.innerHeight;
    if (pop.getBoundingClientRect().bottom > limit) pop.classList.add('up');
    (pop.querySelector('[aria-pressed="true"]') || field).focus();
  };

  // The + button carries a custom or popup color, so the current choice always shows.
  const more = h(`button.swatch.more${sized}`, {
    type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false',
    onclick: () => (pop ? close(true) : open())
  });
  function render() {
    const base = options.slice(0, 2);
    const inPopup = !base.some((o) => o.value === current);
    const hex = normalizeHex(current);
    const shown = !inPopup ? null : options.find((o) => o.value === current) || (hex && { label: hex, fill: hex });
    more.setAttribute('aria-pressed', String(Boolean(shown)));
    more.setAttribute('aria-label', shown ? `More colors (current: ${shown.label})` : 'More colors');
    more.replaceChildren(h('span', { style: shown ? { background: shown.fill, color: shown.fg || readableOn(normalizeHex(shown.fill) || '#ffffff') } : {} }, icon('plus', 14)));
    group.replaceChildren(...base.map(swatchButton), more, ...(pop ? [pop] : []));
  }
  render();
  return group;
}

// A button that opens a listbox. options: [{ value, label }]. Arrow keys move, Enter picks, Escape closes.
export function dropdown({ labelId, value, options, onChange, align = 'end', buttonClass = 'dropdown-btn' }) {
  const wrap = h('div.dropdown-anchor', { style: { position: 'relative' } });
  const button = h(`button.${buttonClass}`, {
    type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-labelledby': labelId
  });
  const menu = h('div.menu', {
    role: 'listbox', 'aria-labelledby': labelId, hidden: true,
    style: { top: 'calc(100% + 6px)', zIndex: 30, width: '220px', [align === 'end' ? 'right' : 'left']: 0 }
  });
  let current = value;

  const setLabel = () => {
    const option = options.find((o) => o.value === current);
    button.replaceChildren(option ? option.label : String(current), icon('chevronDown', 14, 2.2));
  };
  const close = (focusButton = false) => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (focusButton) button.focus();
  };
  const choose = (option) => {
    close(true);
    if (option.value !== current || option.action) {
      if (!option.action) current = option.value;
      setLabel();
      onChange(option.value);
    }
  };
  const renderMenu = () => {
    menu.replaceChildren(...options.map((option) => {
      const selected = option.value === current;
      return h('button.option', {
        type: 'button', role: 'option', 'aria-selected': String(selected), tabindex: '-1',
        onclick: () => choose(option)
      }, h('span.label', {}, option.label), selected ? h('span.tick', {}, icon('check', 16, 2.2)) : null);
    }));
  };
  const open = () => {
    renderMenu();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    menu.children[Math.max(0, options.findIndex((o) => o.value === current))]?.focus();
  };

  button.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('keydown', (event) => {
    const items = [...menu.children];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') {
      close();
    }
  });
  const outside = (event) => {
    if (!wrap.isConnected) document.removeEventListener('mousedown', outside);
    else if (!menu.hidden && !wrap.contains(event.target)) close();
  };
  document.addEventListener('mousedown', outside);

  setLabel();
  wrap.append(button, menu);
  return {
    el: wrap,
    button,
    setOptions(next, nextValue = current) {
      options = next;
      current = nextValue;
      setLabel();
    },
    get value() { return current; }
  };
}

let toastTimer = null;
export function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

// Navigate the current tab, or a background tab when the user holds Ctrl/⌘ or middle-clicks.
export function navigate(url, newTab = false) {
  if (newTab) window.open(url, '_blank', 'noopener');
  else window.location.assign(url);
}
