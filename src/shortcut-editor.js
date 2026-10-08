// Full shortcut editor dialog (add or edit): name, URL, icon source, category, color.
import { SHORTCUT_IMAGE_LIMIT, categoriesOf, createId, hostOf, normalizeHttpUrl } from './core.js';
import { h, icon, readImageFile, segmented, showModal } from './dom.js';
import { store, update } from './state.js';
import { badge, dropdown, swatchPicker, toast } from './widgets.js';

const NEW_CATEGORY = '\u0000new';

// By default edits are saved at once. Settings passes its draft list and a commit that edits it
// instead; the editor then opens over Settings and the change waits for its Save.
export function openShortcutEditor(id, { category = '', shortcuts, commit } = {}) {
  const inSettings = Boolean(commit);
  const list = shortcuts || store.settings.shortcuts;
  const apply = commit || ((fn) => update((settings) => fn(settings.shortcuts)));
  const existing = id ? list.find((s) => s.id === id) : null;
  const categories = categoriesOf(list);
  const draft = existing ? { ...existing } : {
    id: createId('sc'), name: '', url: '', category, color: 'green', icon: 'site', image: ''
  };
  let fileMsg = '';

  showModal({
    labelledBy: 'ed-title',
    className: 'editor',
    nested: inSettings,
    build(dialog, close) {
      const preview = h('div.preview-card');
      const urlMsg = h('span.msg', { id: 'sc-url-msg', 'aria-live': 'polite' });
      const name = h('input.input', { id: 'sc-name', type: 'text', value: draft.name, autofocus: true, oninput: () => { draft.name = name.value; refresh(); } });
      const url = h('input.input', {
        id: 'sc-url', type: 'url', value: draft.url, placeholder: 'example.com', 'aria-describedby': 'sc-url-msg',
        oninput: () => { draft.url = url.value; refresh(); }
      });
      const save = h('button.btn.primary', { type: 'button' }, 'Save');

      // Icon source
      const iconExtras = h('div.inline');
      const fileNote = h('span.note', { 'aria-live': 'polite' });
      const iconSlot = h('div');
      const renderIconModes = () => {
        iconSlot.replaceChildren(segmented({
          labelledBy: 'sc-icon-lbl',
          className: 'round',
          value: draft.icon,
          options: [{ value: 'site', label: 'Website icon' }, { value: 'letter', label: 'Letter' }, { value: 'upload', label: 'Upload image' }],
          onChange: (mode) => { draft.icon = mode; renderIconModes(); refresh(); }
        }));
        const upload = draft.icon === 'upload';
        iconExtras.replaceChildren(...[iconSlot, upload ? h('label.btn.file-btn.round.small', {}, icon('upload', 14, 2.2), 'Choose image',
          h('input', {
            type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif', 'aria-describedby': 'sc-file-note',
            onchange: async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                draft.image = await readImageFile(file, SHORTCUT_IMAGE_LIMIT);
                fileMsg = file.name;
              } catch (error) {
                draft.image = '';
                fileMsg = error.message;
              }
              refresh();
            }
          })) : null].filter(Boolean));
        fileNote.hidden = !upload;
      };
      fileNote.id = 'sc-file-note';

      // Category, with a free-text field for a new one
      const newCategory = h('input.input.compact', {
        type: 'text', placeholder: 'New category name', 'aria-label': 'New category name', hidden: true,
        oninput: () => { draft.category = newCategory.value.trim(); refresh(); }
      });
      // A category is optional; uncategorized shortcuts show under All only.
      const categoryOptions = [{ value: '', label: 'No category' }, ...[...new Set([...categories, draft.category].filter(Boolean))].map((c) => ({ value: c, label: c }))];
      const categoryPicker = dropdown({
        labelId: 'sc-cat-lbl',
        value: draft.category,
        options: [...categoryOptions, { value: NEW_CATEGORY, label: 'New category…', action: true }],
        onChange: (value) => {
          if (value === NEW_CATEGORY) {
            newCategory.hidden = false;
            newCategory.value = '';
            draft.category = '';
            newCategory.focus();
          } else {
            newCategory.hidden = true;
            draft.category = value;
          }
          refresh();
        }
      });

      const refresh = () => {
        const check = normalizeHttpUrl(draft.url);
        const host = check.ok ? hostOf(check.url) : '';
        const shown = draft.icon === 'upload' && !draft.image ? { ...draft, icon: 'letter' } : draft;
        const note = draft.icon === 'upload'
          ? (draft.image ? 'custom image' : 'no image yet, showing the initial')
          : draft.icon === 'site' ? `icon from ${host || 'the site'}` : 'letter on color';
        preview.replaceChildren(
          badge({ ...shown, url: check.ok ? check.url : '' }),
          h('div', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
            h('span.name', {}, draft.name.trim() || 'Untitled'),
            h('span.note', {}, `${draft.category || 'No category'} · ${note}`))
        );
        urlMsg.className = `msg ${check.ok ? 'ok' : draft.url.trim() ? 'bad' : ''}`;
        urlMsg.replaceChildren(icon(check.ok ? 'check' : 'alert', 14, 2.2), check.ok ? `Saved as ${check.url}` : check.msg);
        url.setAttribute('aria-invalid', String(!check.ok && draft.url.trim() !== ''));
        fileNote.textContent = fileMsg || 'PNG, JPG, WebP, SVG or GIF, up to 512 KB. Stored in this browser.';
        save.disabled = !check.ok || !draft.name.trim();
        return check;
      };

      save.addEventListener('click', () => {
        const check = refresh();
        if (save.disabled) return;
        const next = {
          ...draft,
          name: draft.name.trim(),
          url: check.url,
          category: draft.category.trim(),
          image: draft.icon === 'upload' ? draft.image : ''
        };
        if (next.icon === 'upload' && !next.image) next.icon = 'letter';
        apply((items) => {
          const index = items.findIndex((s) => s.id === next.id);
          if (index >= 0) items[index] = next;
          else items.push(next);
        });
        close();
        if (!inSettings) toast(existing ? `Saved ${next.name}` : `Added ${next.name}`);
      });

      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type !== 'file') {
          event.preventDefault();
          save.click();
        }
      });

      renderIconModes();
      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {}, h('span.kicker', {}, 'SHORTCUT'), h('h1', { id: 'ed-title' }, existing ? 'Edit shortcut' : 'Add shortcut')),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
        h('div.dialog-body', {},
          preview,
          h('div.field-group', {}, h('label.field-label', { for: 'sc-name' }, 'Name'), name),
          h('div.field-group', {}, h('label.field-label', { for: 'sc-url' }, 'URL'), url, urlMsg),
          h('div.editor-row', {},
            h('div.grow', {}, h('span.field-label', { id: 'sc-icon-lbl' }, 'Icon'), iconExtras, fileNote),
            h('div.dropdown', { style: { alignItems: 'flex-end' } }, h('span.field-label', { id: 'sc-cat-lbl' }, 'Category'), categoryPicker.el, newCategory)),
          h('fieldset.plain', {}, h('legend', {}, 'Color'),
            swatchPicker({ value: draft.color, onChange: (color) => { draft.color = color; refresh(); } }),
            h('span.note', {}, 'Used for the letter icon and as the fallback when no image is available.'))),
        h('div.dialog-foot', {},
          existing ? h('button.btn.outline', {
            type: 'button',
            onclick: () => {
              apply((items) => { items.splice(items.findIndex((s) => s.id === existing.id), 1); });
              close();
              if (!inSettings) toast(`Deleted ${existing.name}`);
            }
          }, 'Delete') : null,
          h('span.spacer'),
          h('button.btn', { type: 'button', onclick: close }, 'Cancel'),
          save)
      );
      refresh();
    }
  });
}
