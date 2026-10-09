// Import flow: pick a backup file, choose which of its profiles to import, show what will change and what was
// repaired or skipped, then merge, replace, or separate them as new profiles.
import { FORMATS, countItems, detectFormat, keepSharedFrom, mergeSettings, normalizeSettings, parseBackup, readBackup, stripShared } from './core.js';
import { h, icon, showModal } from './dom.js';
import { importProfiles, store, update } from './state.js';
import { toast } from './widgets.js';

export function pickImportFile() {
  const input = h('input', {
    type: 'file', accept: '.json,.yaml,.yml,.toml,.txt,application/json,text/plain', style: { display: 'none' },
    onchange: async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) return toast('That file is too large to import.');
      const source = await file.text();
      reviewImport({ name: file.name, size: file.size, source });
    }
  });
  document.body.append(input);
  input.click();
}

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function reviewImport({ name, size, source }) {
  const format = detectFormat(name, source);
  let profiles = [];
  let error = '';
  try {
    const fallbackName = name.replace(/\.[^.]+$/, '');
    profiles = readBackup(parseBackup(source, format), fallbackName);
    if (!profiles.length) error = 'This file has no profiles to import.';
  } catch (err) {
    error = err.message;
  }
  // Each profile is checked on its own. Replace starts from defaults; merge starts from the current settings so
  // sections missing from the file stay as they are. A file never changes what is shared: its items come in as
  // ordinary ones.
  const entries = profiles.map((profile) => {
    const normalized = normalizeSettings(profile.raw);
    const incoming = stripShared(normalized.settings);
    const raw = profile.raw;
    const counts = countItems({
      ...raw,
      shortcuts: Array.isArray(raw.shortcuts) ? incoming.shortcuts : undefined,
      launchers: Array.isArray(raw.launchers) ? incoming.launchers : undefined,
      clocks: Array.isArray(raw.clocks?.world) ? incoming.clocks : undefined
    });
    return { ...profile, incoming, report: normalized.report, counts, total: counts.shortcuts + counts.launchers + counts.clocks + counts.settings };
  });
  const many = entries.length > 1;
  const selected = new Set(entries.map((_, i) => i));
  // Every profile is chosen by default. A file with several profiles starts on "separate" (keeping them apart);
  // one profile starts on merge, as before.
  let mode = many ? 'separate' : 'merge';

  showModal({
    labelledBy: 'imp-title',
    className: 'import',
    build(dialog, close) {
      const chosen = () => entries.filter((_, i) => selected.has(i));
      const reportList = (kind, title, iconName, rows) => rows.length ? h(`div.report.${kind}`, {},
        h('h2', {}, icon(iconName, 16, 2.2), `${title} · ${rows.length}`),
        h('ul.list', {}, ...rows.map((row) => h('li', {}, h('span', {}, row.item), h('span', {}, kind === 'fixed' ? `→ ${row.result}` : row.reason))))) : null;

      const modeOption = (value, title, note) => h('label.mode', {},
        h('input', { type: 'radio', name: 'import-mode', value, checked: mode === value, onchange: () => { mode = value; renderApply(); } }),
        h('span.grow', {}, h('strong', {}, title), h('span.note', {}, note)));

      const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } });
      const apply = h('button.btn.primary', { type: 'button' });

      const renderBody = () => {
        if (error) return body.replaceChildren(h('p.msg.bad', { role: 'alert' }, icon('alert', 16, 2.2), error));
        const picked = chosen();
        const sum = (key) => picked.reduce((n, e) => n + e.counts[key], 0);
        const label = (e, rows) => rows.map((row) => (many ? { ...row, item: `${e.name}: ${row.item}` } : row));
        const profileList = many ? h('fieldset.plain', { style: { gap: '4px' } },
          h('legend', {}, `Profiles in this file · ${entries.length}`),
          ...entries.map((entry, i) => h('label.mode', {},
            h('input', {
              type: 'checkbox', checked: selected.has(i), 'aria-label': `Import profile ${entry.name}`,
              onchange: (event) => { if (event.target.checked) selected.add(i); else selected.delete(i); renderBody(); renderApply(); }
            }),
            h('span.grow', {}, h('strong', {}, entry.name),
              h('span.note', {}, [[entry.counts.shortcuts, 'shortcut'], [entry.counts.launchers, 'launcher'], [entry.counts.clocks, 'clock']].map(([n, word]) => `${n} ${word}${n === 1 ? '' : 's'}`).join(' · ')))))) : null;
        body.replaceChildren(...[
          profileList,
          h('div.stats', {},
            ...[[sum('shortcuts'), 'Shortcuts'], [sum('launchers'), 'Launcher groups'], [sum('clocks'), 'World clocks'], [sum('settings'), 'Settings set']]
              .map(([n, text]) => h('div.stat', {}, h('strong', {}, n), h('span', {}, text)))),
          reportList('fixed', 'Fixed automatically', 'check', picked.flatMap((e) => label(e, e.report.fixed))),
          reportList('skipped', 'Skipped', 'skip', picked.flatMap((e) => label(e, e.report.skipped))),
          h('fieldset.plain', { style: { gap: '8px' } },
            h('legend', {}, 'How to apply'),
            modeOption('merge', 'Merge', `Add what is new to ${activeName()} and restore matching shortcuts and launchers from the file; nothing is removed. Appearance and search settings come from the file.`),
            modeOption('replace', 'Replace', `Clear ${activeName()} first. Export a backup before you do this.`),
            modeOption('separate', 'Separate as new profiles', 'Add each chosen profile as a new profile with its own name (a number is added if the name is taken). Nothing in the profile in use changes.'),
            many ? h('span.note', {}, 'Merge and Replace put the chosen profiles together into the profile in use; Replace starts from the first one.') : null)
        ].filter(Boolean));
      };
      const activeName = () => `the ${store.profiles.list.find((p) => p.id === store.profiles.active)?.name ?? 'current'} profile`;

      const renderApply = () => {
        const picked = chosen();
        const total = picked.reduce((n, e) => n + e.total, 0);
        apply.disabled = Boolean(error) || !picked.length || !total;
        apply.textContent = error ? 'Import'
          : mode === 'separate' ? `Import ${picked.length} profile${picked.length === 1 ? '' : 's'}`
            : `Import ${total} item${total === 1 ? '' : 's'}`;
      };

      apply.addEventListener('click', () => {
        const picked = chosen();
        if (error || !picked.length) return;
        if (mode === 'separate') {
          const names = importProfiles(picked.map((e) => ({ name: e.name, icon: e.icon, settings: e.incoming })));
          close();
          toast(names.length === 1 ? `Imported profile ${names[0]}` : `Imported ${names.length} profiles`);
          return;
        }
        // Replace keeps the shortcuts and launchers that show on all profiles, which belong to every profile; the
        // chosen profiles after the first are merged into the result.
        let next = mode === 'replace'
          ? keepSharedFrom(picked[0].incoming, store.settings)
          : mergeSettings(store.settings, picked[0].incoming);
        for (const entry of picked.slice(1)) next = mergeSettings(next, entry.incoming);
        update(next);
        close();
        toast(mode === 'replace' ? 'Settings replaced from file' : 'Import merged');
      });

      const sub = `${name} · read as ${FORMATS[format].label} · ${formatSize(size)}`;
      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {},
            h('span.kicker', {}, 'IMPORT'),
            h('h1', { id: 'imp-title' }, 'Review before importing'),
            h('span.sub', {}, sub)),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
        h('div.dialog-body', {}, body),
        h('div.dialog-foot', {}, h('button.btn', { type: 'button', onclick: close }, 'Cancel'), apply)
      );
      renderBody();
      renderApply();
    }
  });
}
