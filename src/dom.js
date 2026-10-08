// Small DOM helpers: element builder, inline icons, and the modal shell used by every dialog.

// h('button.btn', { type: 'button', onclick }, 'Label') — props starting with "on" become listeners,
// "class"/"style"/"dataset" are applied directly, booleans toggle attributes.
export function h(tag, props = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = [el.className, value].filter(Boolean).join(' ');
    else if (key === 'style' && typeof value === 'object') {
      // Custom properties (--name) need setProperty; Object.assign skips them.
      for (const [prop, v] of Object.entries(value)) prop.startsWith('--') ? el.style.setProperty(prop, v) : (el.style[prop] = v);
    }
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'value' || key === 'checked' || key === 'textContent') el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronUp: '<path d="M6 15l6-6 6 6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  history: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  skip: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'
};

export function icon(name, size = 16, strokeWidth = 2) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', strokeWidth);
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  // Static markup from the ICONS table above, never user input.
  svg.innerHTML = ICONS[name] || '';
  return svg;
}

export function grip() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', 14);
  svg.setAttribute('height', 20);
  svg.setAttribute('viewBox', '0 0 14 20');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = [4, 10, 16].map((y) => `<circle cx="4" cy="${y}" r="1.6"/><circle cx="10" cy="${y}" r="1.6"/>`).join('');
  return svg;
}

// Segmented control: options = [{ value, label }]; returns the group element.
export function segmented({ label, labelledBy, options, value, onChange, className = '' }) {
  const group = h(`div.seg-group${className ? `.${className}` : ''}`, { role: 'group', 'aria-label': label, 'aria-labelledby': labelledBy });
  for (const option of options) {
    group.append(h('button.seg', {
      type: 'button',
      'aria-pressed': String(option.value === value),
      onclick: () => onChange(option.value)
    }, option.content ?? option.label));
  }
  return group;
}

// ---------- Modal ----------

// Open dialogs, bottom first. A nested dialog opens over the one below it; any other closes them all.
const modals = [];

// Opens a dialog inside the scaled stage; the page behind it becomes inert until it closes.
export function showModal({ labelledBy, className = '', build, onClose, nested = false }) {
  if (!nested) closeAllModals();
  const stage = document.getElementById('stage');
  // Elements already inert belong to the dialog below, which restores them.
  const background = [...stage.children].filter((el) => el.id !== 'toast' && !el.hasAttribute('inert'));
  const previousFocus = document.activeElement;
  const dialog = h(`div.dialog${className ? `.${className}` : ''}`, { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': labelledBy });
  const scrim = h('div.scrim', {
    onmousedown: (event) => { if (event.target === scrim) closeModal(state); }
  }, dialog);
  background.forEach((el) => el.setAttribute('inert', ''));
  stage.append(scrim);

  const state = { scrim, dialog, background, previousFocus, onClose };
  modals.push(state);
  const close = () => closeModal(state);
  build(dialog, close);

  scrim.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      // Let an open menu inside the dialog handle Escape first.
      if (event.defaultPrevented) return;
      event.preventDefault();
      closeModal(state);
    }
  });
  const first = dialog.querySelector('[autofocus]') || dialog.querySelector('input, button, select, textarea, a[href]');
  first?.focus();
  return close;
}

// Closes the given dialog (default: the top one) and any opened over it.
export function closeModal(target = modals[modals.length - 1]) {
  const index = modals.indexOf(target);
  if (index < 0) return;
  while (modals.length > index) {
    const { scrim, background, previousFocus, onClose } = modals.pop();
    scrim.remove();
    background.forEach((el) => el.removeAttribute('inert'));
    onClose?.();
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }
}

function closeAllModals() {
  if (modals.length) closeModal(modals[0]);
}

export function isModalOpen() {
  return modals.length > 0;
}

// Reads a user-chosen image file as a data URL after type and size checks.
export function readImageFile(file, limit) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|svg\+xml|gif)$/.test(file.type)) return reject(new Error('That file is not a supported image.'));
    if (file.size > limit) return reject(new Error(`That image is over ${limit >= 1024 * 1024 ? `${limit / 1024 / 1024} MB` : `${limit / 1024} KB`}.`));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('That image could not be read.'));
    reader.readAsDataURL(file);
  });
}

// Reads a user-chosen image for an icon: type and size checks, then scaled down so its longer side is at most
// `size` pixels, so a stored icon stays small. Returns a data URL (WebP, else PNG, keeping transparency).
export function readIconImage(file, size, { maxBytes = 5 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp|svg\+xml|gif)$/.test(file.type)) return reject(new Error('That file is not a supported image.'));
    if (file.size > maxBytes) return reject(new Error(`That image is over ${maxBytes / 1024 / 1024} MB.`));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read.')); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      // An SVG without its own size reports 0; draw it at the target size.
      const width = img.naturalWidth || size;
      const height = img.naturalHeight || size;
      const scale = Math.min(1, size / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL('image/webp', 0.92);
      resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png'));
    };
    img.src = url;
  });
}
