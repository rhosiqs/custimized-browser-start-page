// Reusable pieces built on dom.js: shortcut badges, swatch pickers, listbox dropdowns, toasts.
import { SWATCHES, initialOf } from './core.js';
import { h, icon } from './dom.js';
import { faviconUrl, siteIconSources } from './storage.js';

// Round icon for a shortcut or launcher link: uploaded image, site favicon, or colored initial.
export function badge({ name, url, color = 'green', icon: mode = 'site', image = '' }, className = '') {
  const swatch = SWATCHES[color] || SWATCHES.green;
  const letter = () => {
    el.className = `badge${className ? ` ${className}` : ''}`;
    el.style.background = swatch.fill;
    el.style.color = swatch.fg;
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

// Chrome's favicon cache answers unknown pages with a generic globe; detect it by comparing pixels.
let defaultIconPixels = null;
function iconPixels(img) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 16, 16);
    return ctx.getImageData(0, 0, 16, 16).data.join(',');
  } catch {
    return '';
  }
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

export function swatchPicker({ value, onChange, size = '', label = 'Color' }) {
  const group = h('div.swatches', { role: 'group', 'aria-label': label });
  const render = (current) => {
    group.replaceChildren(...Object.entries(SWATCHES).map(([key, swatch]) => h(`button.swatch${size ? `.${size}` : ''}`, {
      type: 'button',
      'aria-label': swatch.label,
      'aria-pressed': String(key === current),
      onclick: () => { render(key); onChange(key); }
    }, h('span', { style: { background: swatch.fill } }))));
  };
  render(value);
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
