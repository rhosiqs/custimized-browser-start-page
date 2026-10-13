// Bookmark dialog, like Chrome's: edit a bookmark (name and URL), rename a folder, or add a page or a folder.
// Changes go straight to the browser's bookmarks; the bar redraws from Chrome's change events.
import { normalizeHttpUrl } from './core.js';
import { h, icon, showModal } from './dom.js';
import { toast } from './widgets.js';

// item: an existing link or folder to edit. Otherwise kind ('link' or 'folder') and place ({ parentId, index? })
// say what to add and where.
export function openBookmarkEditor({ item = null, kind = item?.kind || 'link', place = null } = {}) {
  const isLink = kind === 'link';
  const title = item ? (isLink ? 'Edit bookmark' : 'Rename folder') : (isLink ? 'Add page' : 'Add folder');
  showModal({
    labelledBy: 'bm-ed-title',
    className: 'editor bm-editor',
    build(dialog, close) {
      const name = h('input.input', { id: 'bm-name', type: 'text', value: item?.title || '', autofocus: true, oninput: () => refresh() });
      const urlMsg = h('span.msg', { id: 'bm-url-msg', 'aria-live': 'polite' });
      const url = isLink
        ? h('input.input', { id: 'bm-url', type: 'url', value: item?.url || '', placeholder: 'example.com', 'aria-describedby': 'bm-url-msg', oninput: () => refresh() })
        : null;
      const save = h('button.btn.primary', { type: 'button' }, 'Save');

      const refresh = () => {
        const check = isLink ? normalizeHttpUrl(url.value) : { ok: true };
        if (isLink) {
          const typed = url.value.trim() !== '';
          urlMsg.className = `msg ${check.ok ? 'ok' : typed ? 'bad' : ''}`;
          urlMsg.replaceChildren(...(check.ok || typed ? [icon(check.ok ? 'check' : 'alert', 14, 2.2), check.ok ? `Saved as ${check.url}` : check.msg] : []));
          url.setAttribute('aria-invalid', String(!check.ok && typed));
        }
        // A folder needs a name; a bookmark without one shows its host on the bar.
        save.disabled = !check.ok || (!isLink && !name.value.trim());
        return check;
      };

      save.addEventListener('click', async () => {
        const check = refresh();
        if (save.disabled) return;
        const fields = { title: name.value.trim(), ...(isLink ? { url: check.url } : {}) };
        try {
          if (item) await chrome.bookmarks.update(item.id, fields);
          else await chrome.bookmarks.create({ ...place, ...fields });
          close();
        } catch {
          toast(item ? "Couldn't save the bookmark" : "Couldn't add the bookmark");
        }
      });
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
          event.preventDefault();
          save.click();
        }
      });

      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {}, h('span.kicker', {}, 'BOOKMARK'), h('h1', { id: 'bm-ed-title' }, title)),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
        h('div.dialog-body', {},
          h('div.field-group', {}, h('label.field-label', { for: 'bm-name' }, 'Name'), name),
          isLink ? h('div.field-group', {}, h('label.field-label', { for: 'bm-url' }, 'URL'), url, urlMsg) : null),
        h('div.dialog-foot', {},
          h('span.spacer'),
          h('button.btn', { type: 'button', onclick: close }, 'Cancel'),
          save));
      refresh();
      name.select();
    }
  });
}
