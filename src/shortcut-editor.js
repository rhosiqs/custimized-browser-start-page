// Full shortcut editor dialog (add or edit): name, URL, category, whether it shows on all profiles. The icon is
// changed by clicking it in the preview, which opens the icon picker.
import { categoriesOf, changedSharedItems, createId, hostOf, nameFromUrl, normalizeHttpUrl, pageNameFromHtml, sharedEditPrompt, siteIcon } from './core.js';
import { h, icon, showModal } from './dom.js';
import { openIconPicker } from './icon-picker.js';
import { store, update } from './state.js';
import { badge, dropdown, iconButton, toast } from './widgets.js';

const NEW_CATEGORY = '\u0000new';

// Reads a page's own name (og:site_name or <title>) so the editor can prefill it. Needs the manifest's host
// permission; any failure (blocked, offline, not HTML, too slow) is silent and gives ''.
async function fetchSiteName(url, signal) {
  try {
    const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'follow' });
    if (!response.ok || !/html/i.test(response.headers.get('content-type') || '')) return '';
    return pageNameFromHtml((await response.text()).slice(0, 300000));
  } catch {
    return '';
  }
}

// By default edits are saved at once. Settings passes its draft list and a commit that edits it
// instead; the editor then opens over Settings and the change waits for its Save.
// newGroup opens the editor with the new-category field ready, for "Add group" (a group exists once it holds a shortcut).
export function openShortcutEditor(id, { category = '', shortcuts, commit, newGroup = false } = {}) {
  const inSettings = Boolean(commit);
  const list = shortcuts || store.settings.shortcuts;
  const apply = commit || ((fn) => update((settings) => fn(settings.shortcuts)));
  const existing = id ? list.find((s) => s.id === id) : null;
  const categories = categoriesOf(list);
  const draft = existing ? { ...existing } : {
    id: createId('sc'), name: '', url: '', category, icon: siteIcon()
  };

  showModal({
    labelledBy: 'ed-title',
    className: 'editor',
    nested: inSettings,
    build(dialog, close) {
      const preview = h('div.preview-card');
      const urlMsg = h('span.msg', { id: 'sc-url-msg', 'aria-live': 'polite' });
      // The name is prefilled from the website while the user hasn't typed one; typing a name stops that for good.
      let nameTyped = Boolean(draft.name.trim());
      let lookup = { timer: null, controller: null };
      const nameNote = h('span.note', { id: 'sc-name-note', 'aria-live': 'polite' });
      const name = h('input.input', {
        id: 'sc-name', type: 'text', value: draft.name, autofocus: true, 'aria-describedby': 'sc-name-note',
        oninput: () => { nameTyped = Boolean(name.value.trim()); nameNote.textContent = ''; draft.name = name.value; refresh(); }
      });
      const fillName = (value, note) => {
        if (nameTyped || !value) return;
        draft.name = value;
        name.value = value;
        nameNote.textContent = note;
        refresh();
      };
      const lookUpName = () => {
        clearTimeout(lookup.timer);
        lookup.controller?.abort();
        if (nameTyped) return;
        const check = normalizeHttpUrl(url.value);
        if (!check.ok || !new URL(check.url).hostname.includes('.')) return;
        lookup.timer = setTimeout(async () => {
          lookup.controller = new AbortController();
          const timeout = setTimeout(() => lookup.controller.abort(), 6000);
          const found = await fetchSiteName(check.url, lookup.controller.signal);
          clearTimeout(timeout);
          if (normalizeHttpUrl(url.value).url !== check.url) return;
          if (found) fillName(found, 'Name taken from the website; edit it if you like.');
          else fillName(nameFromUrl(check.url), 'Name guessed from the address; edit it if you like.');
        }, 500);
      };
      const url = h('input.input', {
        id: 'sc-url', type: 'url', value: draft.url, placeholder: 'example.com', 'aria-describedby': 'sc-url-msg',
        oninput: () => { draft.url = url.value; refresh(); lookUpName(); }
      });
      const save = h('button.btn.primary', { type: 'button' }, 'Save');

      // Category, with a free-text field for a new one
      const newCategory = h('input.input.compact', {
        type: 'text', placeholder: 'New category name', 'aria-label': 'New category name', hidden: !newGroup,
        oninput: () => { draft.category = newCategory.value.trim(); refresh(); }
      });
      // A category is optional; uncategorized shortcuts show under All only.
      const categoryOptions = [{ value: '', label: 'No category' }, ...[...new Set([...categories, draft.category].filter(Boolean))].map((c) => ({ value: c, label: c }))];
      const categoryPicker = dropdown({
        labelId: 'sc-cat-lbl',
        value: newGroup ? NEW_CATEGORY : draft.category,
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
        const note = {
          site: `icon from ${host || 'the site'}`, image: 'image from the web', upload: 'uploaded image', emoji: 'emoji', color: 'solid color'
        }[draft.icon.kind];
        // The icon is a button: clicking it opens the icon picker.
        preview.replaceChildren(
          iconButton({
            mark: badge({ name: draft.name, url: check.ok ? check.url : '', icon: draft.icon }),
            label: `Change icon of ${draft.name.trim() || 'this shortcut'}`,
            onclick: () => openIconPicker({
              icon: draft.icon, name: draft.name || 'Untitled', url: check.ok ? check.url : '', subject: draft.name.trim(),
              onApply: (next) => { draft.icon = next; refresh(); preview.querySelector('.icon-pick')?.focus(); }
            })
          }),
          h('div', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
            h('span.name', {}, draft.name.trim() || 'Untitled'),
            h('span.note', {}, `${draft.category || 'No category'} · ${note} · click the icon to change it`))
        );
        urlMsg.className = `msg ${check.ok ? 'ok' : draft.url.trim() ? 'bad' : ''}`;
        urlMsg.replaceChildren(icon(check.ok ? 'check' : 'alert', 14, 2.2), check.ok ? `Saved as ${check.url}` : check.msg);
        url.setAttribute('aria-invalid', String(!check.ok && draft.url.trim() !== ''));
        save.disabled = !check.ok || !draft.name.trim() || (newGroup && !draft.category.trim());
        return check;
      };

      // Shown on every profile: edits and deleting apply everywhere (the content is stored once, see joinShared).
      const sharedNote = h('span.note');
      const sharedSwitch = h('div.field-group', {},
        h('button.switch', {
          type: 'button', role: 'switch', 'aria-checked': String(Boolean(draft.shared)), 'aria-describedby': 'sc-shared-note',
          style: { alignSelf: 'flex-start' },
          onclick: () => { draft.shared = !draft.shared; sharedSwitch.querySelector('.switch').setAttribute('aria-checked', String(draft.shared)); showSharedNote(); }
        }, h('span.track', { 'aria-hidden': 'true' }, h('span.knob')), 'Show on all profiles'),
        sharedNote);
      sharedNote.id = 'sc-shared-note';
      const showSharedNote = () => {
        sharedNote.textContent = draft.shared
          ? 'This shortcut appears on every profile. Changes and deleting it apply to all of them.'
          : 'Off: this shortcut belongs to the profile in use only.';
      };
      showSharedNote();

      save.addEventListener('click', () => {
        clearTimeout(lookup.timer);
        lookup.controller?.abort();
        const check = refresh();
        if (save.disabled) return;
        const next = {
          ...draft,
          name: draft.name.trim(),
          url: check.url,
          category: draft.category.trim()
        };
        if (!next.shared) delete next.shared;
        // From the page this saves at once, so ask here; inside Settings its own Save asks.
        if (!inSettings && existing) {
          const names = changedSharedItems({ shortcuts: [existing] }, { shortcuts: [next] });
          if (names.length && !window.confirm(sharedEditPrompt(names))) return;
        }
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

      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {}, h('span.kicker', {}, 'SHORTCUT'), h('h1', { id: 'ed-title' }, existing ? 'Edit shortcut' : newGroup ? 'Add group' : 'Add shortcut')),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
        h('div.dialog-body', {},
          preview,
          h('div.field-group', {}, h('label.field-label', { for: 'sc-name' }, 'Name'), name, nameNote),
          h('div.field-group', {}, h('label.field-label', { for: 'sc-url' }, 'URL'), url, urlMsg),
          h('div.field-group', {}, h('span.field-label', { id: 'sc-cat-lbl' }, 'Category'), categoryPicker.el, newCategory),
          sharedSwitch),
        h('div.dialog-foot', {},
          existing ? h('button.btn.outline', {
            type: 'button',
            onclick: () => {
              if (existing.shared && !window.confirm(`Delete ${existing.name} from every profile?`)) return;
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
      if (newGroup) queueMicrotask(() => newCategory.focus());
    }
  });
}
