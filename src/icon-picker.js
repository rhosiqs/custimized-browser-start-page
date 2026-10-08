// The one icon picker. Every icon (shortcut, launcher, profile) is changed by clicking the icon itself, which opens
// this dialog: a site's logo, an image address, an uploaded image, an emoji, or a solid color with or without a letter.
import { ICON_IMAGE_SIZE, ICON_TEXT_MAX, SHORTCUT_IMAGE_LIMIT, firstGraphemes, hostOf, isImageDataUrl, letterOf, normalizeHttpUrl, normalizeIcon } from './core.js';
import { h, icon, readIconImage, segmented, showModal } from './dom.js';
import { badge, swatchPicker } from './widgets.js';

const KINDS = [
  { value: 'site', label: 'Site logo' },
  { value: 'image', label: 'Image URL' },
  { value: 'upload', label: 'Upload' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'color', label: 'Color' }
];

// icon: the current icon object. name and url describe the item (the letter, and the address a site logo comes from
// when none is typed). allowNone adds a "None" choice; neutral starts without a color (profiles); requireUrl asks
// for a website address when there is no item address (profiles). onApply gets the new icon; onReset (optional)
// adds a "Default icon" button and is called instead.
export function openIconPicker({ icon: current, name, url = '', allowNone = false, neutral = false, requireUrl = false, subject = name, onApply, onReset }) {
  const draft = { kind: current.kind, color: neutral ? '' : 'green', letter: true, text: '', url: '', data: '', ...current };
  const options = { color: neutral ? '' : 'green', allowNone, requireUrl };
  let fileMsg = '';

  showModal({
    labelledBy: 'ip-title',
    className: 'icon-picker',
    nested: true,
    build(dialog, close) {
      const preview = h('div.preview-card');
      const kindSlot = h('div');
      const panel = h('div.picker-panel', { 'aria-live': 'polite' });
      const colorRow = h('fieldset.plain');
      const msg = h('span.msg', { id: 'ip-msg', 'aria-live': 'polite' });
      const apply = h('button.btn.primary', { type: 'button' }, 'Apply');
      const kinds = allowNone ? [...KINDS, { value: 'none', label: 'None' }] : KINDS;

      const effectiveUrl = () => normalizeHttpUrl(draft.url).ok ? normalizeHttpUrl(draft.url).url : url;
      const candidate = () => normalizeIcon(draft, options);

      // Why Apply can't be used yet, or ''.
      const problem = () => {
        if (draft.kind === 'site') {
          if (draft.url.trim() && !normalizeHttpUrl(draft.url).ok) return 'Enter a valid web address, or leave it empty.';
          if (requireUrl && !effectiveUrl()) return 'Enter the website address.';
        }
        if (draft.kind === 'image' && !normalizeHttpUrl(draft.url).ok) return 'Enter the web address of an image.';
        if (draft.kind === 'upload' && !isImageDataUrl(draft.data, SHORTCUT_IMAGE_LIMIT)) return fileMsg || 'Choose an image.';
        if (draft.kind === 'emoji' && !draft.text) return 'Enter an emoji or a few characters.';
        return '';
      };

      const refreshState = () => {
        const bad = problem();
        apply.disabled = Boolean(bad);
        msg.className = `msg${bad ? ' bad' : ''}`;
        msg.replaceChildren(...(bad ? [icon('alert', 14, 2.2), bad] : []));
      };
      const refreshPreview = () => {
        const shown = problem() ? normalizeIcon({ ...draft, kind: 'color' }, options) : candidate();
        const note = {
          site: `Logo from ${hostOf(effectiveUrl()) || 'the item\'s website'}; the letter shows if none is found`,
          image: 'Image from the web',
          upload: 'Uploaded image',
          emoji: 'Emoji or characters',
          color: draft.letter ? 'Solid color with a letter' : 'Solid color',
          none: 'No icon'
        }[draft.kind];
        preview.replaceChildren(
          badge({ name, url: effectiveUrl(), icon: shown }, shown.kind === 'color' && !shown.color ? 'neutral' : ''),
          h('div', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
            h('span.name', {}, subject || 'Untitled'),
            h('span.note', {}, note)));
      };
      const refresh = () => { refreshState(); refreshPreview(); };

      const field = (props, labelText) => h('input.input', { type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': labelText, 'aria-describedby': 'ip-msg', ...props });
      const addressField = (placeholder, labelText) => {
        const input = field({
          type: 'url', value: draft.url, placeholder,
          oninput: () => { draft.url = input.value.trim(); refreshState(); },
          onchange: () => { const check = normalizeHttpUrl(draft.url); if (check.ok) { draft.url = check.url; input.value = check.url; } refresh(); }
        }, labelText);
        return input;
      };

      const renderPanel = () => {
        if (draft.kind === 'site') {
          panel.replaceChildren(
            addressField(url ? hostOf(url) || url : 'example.com', 'Website address for the logo'),
            h('span.note', {}, url ? 'Leave empty to use the logo of this item\'s own website.' : 'The address of the website whose logo to show.'));
        } else if (draft.kind === 'image') {
          panel.replaceChildren(
            addressField('https://example.com/logo.png', 'Image address'),
            h('span.note', {}, 'PNG, SVG, ICO… The letter shows if it fails to load.'));
        } else if (draft.kind === 'upload') {
          panel.replaceChildren(
            h('div.inline', { style: { gap: '8px' } },
              h('label.btn.file-btn.round.small', {}, icon('upload', 14, 2.2), draft.data ? 'Change image' : 'Choose image',
                h('input', {
                  type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif', 'aria-describedby': 'ip-msg',
                  onchange: async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await readIconImage(file, ICON_IMAGE_SIZE);
                      if (!isImageDataUrl(data, SHORTCUT_IMAGE_LIMIT)) throw new Error('That image is still over 512 KB after resizing.');
                      draft.data = data;
                      fileMsg = '';
                    } catch (error) {
                      draft.data = '';
                      fileMsg = error.message;
                    }
                    renderPanel();
                    refresh();
                  }
                }))),
            h('span.note', {}, `Resized to ${ICON_IMAGE_SIZE} px and stored in this browser.`));
        } else if (draft.kind === 'emoji') {
          const input = field({
            value: draft.text, placeholder: 'e.g. an emoji', maxlength: 24,
            oninput: () => { draft.text = firstGraphemes(input.value.trim(), ICON_TEXT_MAX); refresh(); },
            onchange: () => { input.value = draft.text; }
          }, 'Emoji or characters');
          input.style.width = '140px';
          panel.replaceChildren(input, h('span.note', {}, `An emoji or up to ${ICON_TEXT_MAX} characters on a plain disc.`));
        } else if (draft.kind === 'color') {
          const input = field({
            value: draft.text, placeholder: letterOf(name), maxlength: 24, disabled: !draft.letter,
            oninput: () => { draft.text = firstGraphemes(input.value.trim(), ICON_TEXT_MAX); refresh(); },
            onchange: () => { input.value = draft.text; }
          }, 'Letters');
          input.style.width = '110px';
          panel.replaceChildren(
            h('div.inline', { style: { gap: '12px' } },
              segmented({
                label: 'Letter', className: 'round small', value: draft.letter ? 'letter' : 'none',
                options: [{ value: 'letter', label: 'Letter' }, { value: 'none', label: 'No letter' }],
                onChange: (value) => { draft.letter = value === 'letter'; renderPanel(); refresh(); }
              }),
              input),
            h('span.note', {}, draft.letter ? `Up to ${ICON_TEXT_MAX} letters or an emoji. Empty uses the first letter of the name.` : 'A plain colored disc.'));
        } else {
          panel.replaceChildren(h('span.note', {}, 'No icon is shown.'));
        }
      };

      // The color shows behind a letter, and behind a picture while it loads or when it fails.
      const renderColor = () => {
        const show = ['site', 'image', 'upload', 'color'].includes(draft.kind);
        colorRow.hidden = !show;
        colorRow.replaceChildren(h('legend', {}, 'Color'),
          swatchPicker({ value: draft.color, label: 'Icon color', onChange: (color) => { draft.color = color; refresh(); } }),
          h('span.note', {}, draft.kind === 'color' ? 'The color of the disc.' : 'Shown behind the letter when the picture is missing.'));
      };

      const renderKinds = (focus = false) => {
        kindSlot.replaceChildren(segmented({
          label: 'Icon type', className: 'round small', value: draft.kind, options: kinds,
          onChange: (kind) => { draft.kind = kind; renderKinds(true); renderPanel(); renderColor(); refresh(); }
        }));
        const pressed = kindSlot.querySelector('[aria-pressed="true"]');
        pressed?.setAttribute('autofocus', '');
        if (focus) pressed?.focus();
      };

      apply.addEventListener('click', () => {
        if (problem()) return;
        const next = candidate();
        close();
        onApply(next);
      });
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type !== 'file') {
          event.preventDefault();
          apply.click();
        }
      });

      renderKinds();
      renderPanel();
      renderColor();
      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {}, h('span.kicker', {}, 'ICON'), h('h1', { id: 'ip-title' }, 'Choose icon')),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
        h('div.dialog-body', {}, preview, kindSlot, panel, colorRow, msg),
        h('div.dialog-foot', {},
          onReset ? h('button.btn.outline', { type: 'button', onclick: () => { close(); onReset(); } }, 'Default icon') : null,
          h('span.spacer'),
          h('button.btn', { type: 'button', onclick: close }, 'Cancel'),
          apply));
      refresh();
    }
  });
}
