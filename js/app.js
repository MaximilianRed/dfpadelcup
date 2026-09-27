/*
 * DF Padel Cup - interfaccia.
 * Usa PadelCore (regole) e PadelStorage (salvataggio).
 */
(function () {
  'use strict';

  const C = window.PadelCore;
  const S = window.PadelStorage;
  const view = document.getElementById('view');
  const tabsEl = document.getElementById('tabs');
  const currentNameEl = document.getElementById('currentName');

  let t = null; // torneo aperto
  let TM = {}; // coppie per id
  let tab = 'tornei';
  const ui = { court: 0, editGroups: false, focus: null };
  const FREE_TABS = ['tornei', 'impostazioni']; // usabili anche senza un torneo aperto

  /* ------------------------------------------------------------ preferenze */

  // Preferenze del dispositivo (non del torneo): tema, dimensione testo, aiuto.
  const PREFS_KEY = 'ppt.prefs';
  const prefs = Object.assign({ theme: 'auto', size: 'normale', help: true }, readPrefs());

  // Colori delle miniature: stessi valori dei temi in style.css.
  const THEMES = [
    { id: 'auto', name: 'Automatico', desc: 'Padel di giorno, Padel notte se il dispositivo è in modalità scura.' },
    { id: 'padel', name: 'Padel', desc: 'Blu campo e giallo pallina.', meta: '#1d4f9c',
      p: { bg: '#eef3fa', hero1: '#173f80', hero2: '#2a6fd4', nav: '#12325f', card: '#ffffff', text: '#0f1d33', ball: '#d4f53c', score: '#0f1d33' } },
    { id: 'notte', name: 'Padel notte', desc: 'Scuro, come una partita sotto i riflettori.', meta: '#081634',
      p: { bg: '#080e1c', hero1: '#081634', hero2: '#173a86', nav: '#060d1f', card: '#111a2e', text: '#e8eefb', ball: '#d4f53c', score: '#03060d' } },
    { id: 'verde', name: 'Campo verde', desc: 'Erba sintetica verde e pallina gialla.', meta: '#125233',
      p: { bg: '#eef5f0', hero1: '#125233', hero2: '#22915a', nav: '#0e3f27', card: '#ffffff', text: '#0f2418', ball: '#f2e94e', score: '#0f2418' } },
    { id: 'classico', name: 'Classico', desc: 'Sobrio e chiaro, senza decorazioni.', meta: '#0f766e',
      p: { bg: '#f3f6f5', hero1: '#0f766e', hero2: '#0f766e', nav: '#ffffff', card: '#ffffff', text: '#17201d', ball: '#0f766e', score: '#dbe3e0' } },
  ];
  const SIZES = [
    { id: 'normale', name: 'Normale', aa: 'Aa' },
    { id: 'grande', name: 'Grande', aa: 'Aa' },
    { id: 'molto-grande', name: 'Molto grande', aa: 'Aa' },
  ];

  function readPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch (e) { return {}; }
  }

  function applyPrefs() {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.size = prefs.size;
    const dark = prefs.theme === 'notte' || (prefs.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const theme = THEMES.find((x) => x.id === (prefs.theme === 'auto' ? (dark ? 'notte' : 'padel') : prefs.theme));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && theme) meta.content = theme.meta;
    if (window.PadelHelp) window.PadelHelp.enabled = prefs.help;
  }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* ignora */ }
    applyPrefs();
  }

  /* ----------------------------------------------------------------- icone */

  const ICON = {
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    groups: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    bracket: '<svg viewBox="0 0 24 24"><path d="M3 5h5v4H3M3 15h5v4H3M8 7h3v10H8M11 12h4M15 10h6v4h-6z"/></svg>',
    print: '<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    dice: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="9" cy="15" r="1.2"/><circle cx="15" cy="15" r="1.2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/></svg>',
    rank: '<svg viewBox="0 0 24 24"><path d="M4 6h2M4 12h2M4 18h2M9 6h11M9 12h8M9 18h5"/></svg>',
    sim: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  };
  const TROPHY = '<svg class="trophy" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v2h3v2a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 13.9V17h3v2H8v-2h3v-3.1A5 5 0 0 1 8.3 11H8a4 4 0 0 1-4-4V5h3zm-1 4v0a2 2 0 0 0 1 1.7V7zm12 0v1.7A2 2 0 0 0 19 7zM6 20h12v2H6z"/></svg>';
  const COURT = `<svg class="court" viewBox="0 0 200 110" aria-hidden="true">
      <rect class="c-floor" x="5" y="5" width="190" height="100" rx="6"/>
      <rect class="c-line" x="15" y="15" width="170" height="80"/>
      <line class="c-line" x1="55" y1="15" x2="55" y2="95"/><line class="c-line" x1="145" y1="15" x2="145" y2="95"/>
      <line class="c-line" x1="55" y1="55" x2="145" y2="55"/>
      <line class="c-net" x1="100" y1="8" x2="100" y2="102"/>
      <circle class="c-ball" cx="128" cy="36" r="7"/>
      <g transform="translate(62 70) rotate(-28)"><rect x="-3" y="10" width="6" height="16" rx="2.5" class="c-racket"/>
        <ellipse cx="0" cy="0" rx="12" ry="14" class="c-racket"/>
        <g class="c-holes"><circle cx="-4" cy="-5" r="1.4"/><circle cx="4" cy="-5" r="1.4"/><circle cx="0" cy="0" r="1.4"/><circle cx="-4" cy="5" r="1.4"/><circle cx="4" cy="5" r="1.4"/></g></g></svg>`;

  /* --------------------------------------------------------------- utilità */

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const sel = (cond) => (cond ? 'selected' : '');
  const name = (id) => esc(C.teamName(TM[id]));

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
  }

  function parseScore(v) {
    const s = String(v).trim();
    if (s === '') return null;
    const n = Number(s);
    return Number.isInteger(n) && n >= 0 && n <= 99 ? n : null;
  }

  function toast(msg, warn) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'show' + (warn ? ' warn' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.className = ''; }, 2800);
  }

  function persist() {
    if (t && !S.save(t)) toast('Attenzione: salvataggio non riuscito', true);
  }

  // Salva e ridisegna dopo che il focus si è spostato sul campo successivo.
  function commit() {
    persist();
    setTimeout(render, 0);
  }

  function go(newTab) {
    tab = newTab;
    render();
    window.scrollTo(0, 0);
  }

  function empty(msg, gotoTab, label) {
    return `<section class="card empty">${COURT}<p>${msg}</p>
      ${gotoTab ? `<button class="btn primary" data-action="goto" data-tab="${gotoTab}">${label}</button>` : ''}</section>`;
  }

  /* ---------------------------------------------------------------- render */

  function render() {
    TM = t ? C.indexTeams(t) : {};
    const active = document.activeElement;
    const focusKey = ui.focus || (active && active.dataset ? active.dataset.fk : null);
    ui.focus = null;

    tabsEl.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
      b.disabled = !t && !FREE_TABS.includes(b.dataset.tab);
    });
    currentNameEl.textContent = t ? t.name + (t.date ? ' · ' + formatDate(t.date) : '') : '';

    const views = {
      tornei: viewTornei, coppie: viewCoppie, calendario: viewCalendario, gironi: viewGironi,
      classifica: viewClassifica, tabellone: viewTabellone, impostazioni: viewImpostazioni,
    };
    const free = FREE_TABS.includes(tab);
    view.innerHTML = (t || free) && views[tab] ? views[tab]() : viewTornei();

    if (focusKey) {
      const el = view.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`);
      if (el) {
        el.focus();
        if (el.select && (el.type === 'number' || C.isDefaultName(el.value))) el.select();
      }
    }
    try { localStorage.setItem('ppt.tab', tab); } catch (e) { /* ignora */ }
  }

  /* ---------------------------------------------------------------- tornei */

  function viewTornei() {
    const list = S.list();
    const today = new Date().toLocaleDateString('sv');
    return `
    <section class="card">
      <h2 data-help-key="sec-new">Nuovo torneo</h2>
      <form data-form="new-t" id="newTForm" class="grid-form">
        <label>Nome<input name="name" maxlength="80" placeholder="Es. Torneo d'autunno" value="${esc(ui.newName || '')}"></label>
        <label>Data<input name="date" type="date" value="${esc(ui.newDate || today)}"></label>
      </form>
      <p class="hint">Imposta i numeri con − e +: qui sotto vedi subito come si dividono le coppie e gli orari.</p>
      ${planSteppers('new')}
    </section>
    <section class="card">
      <h2 data-help-key="sec-plan">Gironi e tempi</h2>
      ${planDetails('new')}
      <div class="create-row">
        <button class="btn ball big" type="submit" form="newTForm" data-help-key="new-t-submit" ${C.groupSizes(planOf('new').n, 1) ? '' : 'disabled'}>${ICON.plus} Crea torneo</button>
      </div>
    </section>
    <section class="card">
      <h2 data-help-key="sec-saved">Tornei salvati</h2>
      ${list.length ? `<ul class="t-list">${list.map((x) => {
        const isCur = t && t.id === x.id;
        return `<li class="${isCur ? 'current' : ''}">
          <div class="t-title"><span class="t-dot"></span><div><strong>${esc(x.name)}</strong>
            <div class="t-date">${x.date ? formatDate(x.date) : 'Senza data'}${isCur ? ' · aperto' : ''}</div></div></div>
          <div class="row-actions">
            ${isCur ? '' : `<button class="btn small primary" data-action="open-t" data-id="${x.id}">Apri</button>`}
            <button class="btn small ghost" data-action="export-t" data-id="${x.id}">${ICON.download} Esporta</button>
            <button class="btn small ghost danger" data-action="delete-t" data-id="${x.id}">Elimina</button>
          </div></li>`;
      }).join('')}</ul>` : '<p class="muted">Nessun torneo salvato.</p>'}
      <div class="import">
        <label class="btn ghost">${ICON.upload} Importa torneo da file<input type="file" accept=".json,application/json" data-change="import" hidden></label>
      </div>
      <p class="hint">I tornei sono salvati in questo browser. Usa <em>Esporta</em> per fare un backup o per spostare un torneo su un altro dispositivo.</p>
    </section>`;
  }

  /* ---------------------------------------------------------------- coppie */

  function viewCoppie() {
    const n = t.teams.length;
    const desc = C.describeSizes(n, t.courts, t.settings.groupCount);
    const sizes = C.groupSizes(n, t.courts, t.settings.groupCount);
    const s = t.settings;
    const turns = sizes ? Math.ceil(sizes.length / t.courts) : 0;
    const seeds = C.seedCount(n, t.courts, t.settings.groupCount);
    const filled = t.teams.filter(C.isTeamComplete).length;
    const ready = sizes && filled === n;
    const defaults = t.teams.filter((x) => C.isDefaultName(x.p1) || C.isDefaultName(x.p2)).length;
    return `
    <section class="card">
      <h2 data-help-key="sec-settings">Regole e dati del torneo</h2>
      <div class="grid-form">
        <label>Nome<input data-change="t-name" value="${esc(t.name)}" maxlength="80"></label>
        <label>Data<input type="date" data-change="t-date" value="${esc(t.date)}"></label>
      </div>
      <label class="rules-field" data-help-key="rules">Regolamento
        <textarea data-change="t-rules" rows="6" placeholder="Scrivi qui il regolamento del torneo: orari di ritrovo, quote, regole di gioco, premi...">${esc(t.rules || '')}</textarea>
      </label>
      <div class="option-row" data-help-key="opt-format">
        <span class="option-label">Formato delle partite</span>
        <div class="segmented" role="group" aria-label="Formato delle partite">
          ${Object.entries(C.FORMATS).map(([id, f]) => `<button class="${C.scoreFormat(t) === id ? 'active' : ''}" data-action="set-format" data-id="${id}" data-help-key="fmt-${id}">${f.label}</button>`).join('')}
        </div>
      </div>
      <div class="option-row" data-help-key="opt-cross">
        <span class="option-label">Confronto tra gironi da 3 e da 4</span>
        <div class="segmented" role="group" aria-label="Confronto tra gironi">
          <button class="${s.crossGroup !== 'media' ? 'active' : ''}" data-action="set-cross" data-id="assoluto" data-help-key="cross-assoluto">Valori assoluti</button>
          <button class="${s.crossGroup === 'media' ? 'active' : ''}" data-action="set-cross" data-id="media" data-help-key="cross-media">Media per partita</button>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 data-help-key="sec-plan">Numeri, gironi e tempi</h2>
      ${planSteppers('t')}
      ${t.groups.length ? '<p class="notice" style="margin:12px 0 0">I gironi sono già stati sorteggiati: se cambi coppie o gironi andranno rifatti. Minuti e ora di inizio si possono cambiare quando vuoi.</p>' : ''}
      ${planDetails('t')}
    </section>

    <section class="card">
      <h2 data-help-key="sec-teams">Coppie <span class="badge ${filled === n ? 'ok' : ''}" data-help-key="badge-teams">${filled}/${n}</span></h2>
      ${seeds ? `<p class="hint" style="margin-top:0"><strong>L'ordine dell'elenco conta:</strong> metti le coppie dalla più forte (1) alla più debole con le frecce.
        Con <em>Teste di serie</em> contano le prime <span class="tds">TdS</span> <strong>${seeds}</strong> (una per girone);
        con <em>In ordine di bravura</em> conta la posizione di tutte le coppie.</p>` : ''}
      <details class="bulk">
        <summary data-help-key="bulk-summary">Incolla un elenco di coppie</summary>
        <p class="hint">Una coppia per riga, giocatori separati da <strong>/</strong> oppure <strong>,</strong> (es. <em>Rossi / Bianchi</em>). Sostituisce prima le righe con i nomi di default.</p>
        <textarea id="bulkText" rows="6" placeholder="Rossi / Bianchi&#10;Verdi / Neri" data-help-key="bulk-text"></textarea>
        <button class="btn" data-action="bulk-add">Inserisci elenco</button>
      </details>
      ${n ? `<ol class="teams">${t.teams.map((tm, i) => `
        <li class="${i < seeds ? 'seeded' : ''} ${C.isTeamComplete(tm) ? '' : 'incomplete'}">
          <span class="num" data-help-key="${i < seeds ? 'team-num-tds' : 'team-num'}">${i + 1}</span>
          <input class="${C.isDefaultName(tm.p1) ? 'is-default' : ''}" data-change="team-p1" data-nav="team" data-id="${tm.id}" data-fk="p1-${tm.id}" value="${esc(tm.p1)}" placeholder="Giocatore 1" aria-label="Giocatore 1 coppia ${i + 1}" maxlength="40" autocomplete="off">
          <input class="${C.isDefaultName(tm.p2) ? 'is-default' : ''}" data-change="team-p2" data-nav="team" data-id="${tm.id}" data-fk="p2-${tm.id}" value="${esc(tm.p2)}" placeholder="Giocatore 2" aria-label="Giocatore 2 coppia ${i + 1}" maxlength="40" autocomplete="off">
          <span class="row-actions">
            <button class="icon" data-action="team-up" data-id="${tm.id}" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">↑</button>
            <button class="icon" data-action="team-down" data-id="${tm.id}" ${i === n - 1 ? 'disabled' : ''} aria-label="Sposta giù">↓</button>
            <button class="icon danger" data-action="team-del" data-id="${tm.id}" aria-label="Elimina">✕</button>
          </span>
        </li>`).join('')}</ol>` : '<p class="muted">Nessuna coppia.</p>'}
      <button class="btn ghost" data-action="add-row" style="margin-top:12px">${ICON.plus} Aggiungi una coppia</button>
    </section>

    <section class="card">
      <h2 data-help-key="sec-draw">${t.groups.length ? 'Rifai i gironi' : 'Crea i gironi'}</h2>
      <p data-help-key="groups-summary" style="margin-top:0">${desc
        ? `<strong>${n} coppie</strong> → ${desc}${turns > 1 ? ' · alcuni gironi giocano dopo, quando si libera il campo' : ''}`
        : `<span class="warn">Con ${n} coppie non si possono fare gironi da 3 o 4.</span>`}
        ${s.groupCount ? ' <span class="badge" data-help-key="manual-groups">scelti a mano</span>' : ''}</p>
      ${sizes && !ready ? `<p class="notice">Mancano <strong>${n - filled}</strong> ${n - filled === 1 ? 'coppia da completare' : 'coppie da completare'}: servono i nomi di entrambi i giocatori.</p>` : ''}
      ${ready ? `<p class="hint" id="defaultsHint">${defaults ? `${defaults === 1 ? '1 coppia ha' : `${defaults} coppie hanno`} ancora i nomi di default: puoi creare i gironi lo stesso e correggerli dopo.` : ''}</p>` : ''}
      <div class="draw-choice">
        <button class="draw-option" data-action="make-groups" data-mode="casuale" data-help-key="draw-random" ${ready ? '' : 'disabled'}>
          <span class="draw-icon">${ICON.dice}</span>
          <span><strong>Sorteggio casuale</strong><span class="muted">Tutte le coppie vengono sorteggiate nei gironi.</span></span>
        </button>
        <button class="draw-option" data-action="make-groups" data-mode="teste" data-help-key="draw-seeded" ${ready ? '' : 'disabled'}>
          <span class="draw-icon">${ICON.star}</span>
          <span><strong>Con teste di serie</strong><span class="muted">Le prime ${seeds || ''} coppie in gironi diversi, le altre sorteggiate.</span></span>
        </button>
        <button class="draw-option" data-action="make-groups" data-mode="ordine" data-help-key="draw-ranked" ${ready ? '' : 'disabled'}>
          <span class="draw-icon">${ICON.rank}</span>
          <span><strong>In ordine di bravura</strong><span class="muted">Tutte teste di serie, dalla 1 alla ${n}: come nel tabellone di tennis, 1 in alto, 2 in basso, le altre incrociate.</span></span>
        </button>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------- gironi */

  function viewGironi() {
    if (!t.groups.length) return empty('Non ci sono ancora gironi. Inserisci le coppie e crea i gironi.', 'coppie', 'Vai alle coppie');
    const total = t.groupMatches.length;
    const played = t.groupMatches.filter(C.isPlayed).length;
    const courts = [...new Set(t.groups.map((g) => g.court))].sort((a, b) => a - b);
    if (ui.court && !courts.includes(ui.court)) ui.court = 0;
    const groups = t.groups
      .filter((g) => !ui.court || g.court === ui.court)
      .slice()
      .sort((a, b) => a.turn - b.turn || a.court - b.court || a.name.localeCompare(b.name));

    return `
    <div class="toolbar">
      ${courts.length > 1 ? `<div class="segmented" role="group" aria-label="Filtra per campo" data-help-key="court-filter">
        <button class="${ui.court ? '' : 'active'}" data-action="court-filter" data-court="0">Tutti</button>
        ${courts.map((c) => `<button class="${ui.court === c ? 'active' : ''}" data-action="court-filter" data-court="${c}">Campo ${c}</button>`).join('')}
      </div>` : ''}
      <span class="badge" data-help-key="badge-groups">${C.describeGroups(t.groups.map((g) => g.teamIds.length), t.courts)}</span>
      <span class="badge" data-help-key="badge-matches">${played}/${total} partite</span>
      <span class="badge" data-help-key="badge-draw">${{
        casuale: ICON.dice + ' Sorteggio casuale',
        ordine: ICON.rank + ' In ordine di bravura',
      }[t.settings.drawMode] || ICON.star + ' Teste di serie'}</span>
      <span class="spacer"></span>
      <button class="btn small ${ui.editGroups ? 'primary' : ''}" data-action="toggle-edit">${ICON.edit} ${ui.editGroups ? 'Fine modifica' : 'Modifica composizione'}</button>
      <button class="btn small" data-action="print">${ICON.print} Stampa</button>
    </div>
    ${ui.editGroups ? `<p class="notice">${ui.swapPick
      ? `Hai scelto <strong>${name(ui.swapPick)}</strong>: ora clicca la coppia di un altro girone con cui scambiarla (o di nuovo la stessa per annullare).`
      : 'Clicca una coppia, poi la coppia di un altro girone con cui scambiarla. Le partite dei due gironi vengono rigenerate.'}</p>` : ''}
    ${played === total ? `<section class="card summary no-print"><p><strong>Gironi conclusi!</strong> Tutte le partite sono state giocate.</p>
      <button class="btn ball" data-action="goto" data-tab="classifica">Vai alla classifica ${ICON.arrow}</button></section>` : ''}
    <div class="groups">${groups.map(groupCard).join('')}</div>`;
  }

  // Gironi raggruppati per campo, nell'ordine in cui giocano.
  function groupsByCourt() {
    const map = new Map();
    t.groups.slice().sort((a, b) => a.court - b.court || a.turn - b.turn || a.name.localeCompare(b.name))
      .forEach((g) => { if (!map.has(g.court)) map.set(g.court, []); map.get(g.court).push(g); });
    return map;
  }

  function groupCard(g) {
    const st = C.groupStandings(t, g);
    const matches = t.groupMatches.filter((m) => m.groupId === g.id).sort((a, b) => a.order - b.order);
    const anyDraw = st.rows.some((r) => r.drawn);
    const teamCell = (id) => (ui.editGroups
      ? `<button class="swap-btn ${ui.swapPick === id ? 'picked' : ''}" data-action="swap-pick" data-id="${id}">${name(id)}</button>`
      : name(id));

    return `
    <section class="card">
      <div class="group-head">
        <div class="group-title" data-help-key="group-title">
          <span class="group-letter">${esc(g.name)}</span>
          <h3>Girone ${esc(g.name)}${st.complete ? '<span class="done-tag" data-help-key="group-done">✓ concluso</span>' : ''}</h3>
        </div>
        <span class="where">
          <span class="chip" data-help-key="group-court">Campo ${g.court}</span>
        </span>
      </div>
      <div class="group-body">
      <div class="table-wrap"><table>
        <thead><tr>
          <th data-help-key="th-pos">#</th><th class="l" data-help-key="th-coppia">Coppia</th><th data-help-key="th-g">G</th><th data-help-key="th-v">V</th>
          ${anyDraw ? '<th data-help-key="th-n">N</th>' : ''}<th data-help-key="th-p">P</th><th data-help-key="th-gv">GV</th><th data-help-key="th-gp">GP</th>
        </tr></thead>
        <tbody>${st.rows.map((r) => `
          <tr class="${r.pos === 1 && r.played ? 'first' : ''}">
            <td class="pos"><span class="pos-badge">${r.pos}</span></td>
            <td class="l">${t.settings.drawMode === 'ordine' ? `<span class="rank-no" data-help-key="rank-no">${(t.seedOrder || t.teams.map((x) => x.id)).indexOf(r.teamId) + 1}</span>` : ''}${teamCell(r.teamId)}${r.decidedBy && r.played ? `<span class="tag" data-help-key="${r.decidedBy === 'monetina' ? 'tag-coin' : 'tag-h2h'}">pari: decide ${r.decidedBy}</span>` : ''}</td>
            <td>${r.played}</td><td class="pts">${r.won}</td>${anyDraw ? `<td>${r.drawn}</td>` : ''}<td>${r.lost}</td><td>${r.gw}</td><td>${r.gl}</td>
          </tr>`).join('')}</tbody>
      </table></div>
      <div class="matches">${matches.map((m) => scoreBoard(m, false)).join('')}</div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ segnapunti */

  // Segnapunti di una partita: una colonna per set, come nel tennis.
  // Le colonne sono nell'ordine di inserimento: 1° set (A, B), 2° set (A, B), ...
  function scoreBoard(m, knockout, seedNo) {
    const n = C.setCount(t);
    const fmt = C.scoreFormat(t);
    const sets = m.sets || [];
    const w = C.matchWinner(m);
    // Al meglio dei 3: se i primi due set bastano, il terzo non serve.
    const decided2 = n === 3 && C.evalSets(t, sets.slice(0, 2), knockout).done;
    const kind = knockout ? 'kscore' : 'gscore';

    const team = (id) => `<span class="sb-team ${w === id ? 'win' : ''} ${w && w !== id ? 'lose' : ''}">
        ${seedNo ? `<span class="seed" data-help-key="seed">${seedNo(id)}</span>` : ''}
        <span class="nm">${name(id)}</span>
        ${m.done && n > 1 ? `<span class="sb-won" data-help-key="sets-won">${id === m.a ? m.sa : m.sb}</span>` : ''}
      </span>`;

    let cols = '';
    for (let i = 0; i < n; i++) {
      const stb = fmt === '3set-stb' && i === 2;
      const label = n > 1 ? (stb ? 'STB' : `${i + 1}° set`) : '';
      const [va, vb] = sets[i] || [];
      const off = i === 2 && decided2 && va == null && vb == null;
      const max = fmt === 'libero' || stb ? 99 : 7;
      const input = (side, v, id) => `<input class="${m.bad ? 'bad' : ''}" type="number" inputmode="numeric" min="0" max="${max}" placeholder="–"
          data-change="${kind}" data-id="${m.id}" data-set="${i}" data-side="${side}" data-fk="${m.id}-${i}-${side}"
          value="${v == null ? '' : v}" aria-label="${label || 'Game'} ${esc(C.teamName(TM[id]))}" ${off ? 'disabled' : ''}>`;
      cols += `<span class="sb-lbl" data-help-key="${stb ? 'col-stb' : 'col-set'}">${label}</span>${input('a', va, m.a)}${input('b', vb, m.b)}`;
    }

    return `<div class="sb ${m.done ? 'done' : ''} ${m.bad ? 'bad' : ''}" data-match="${m.id}" data-ko="${knockout ? 1 : 0}">
      <div class="sb-grid"><span class="sb-lbl"></span>${team(m.a)}${team(m.b)}${cols}</div>
      ${m.bad ? `<div class="sb-error">${esc(m.err)}</div>` : ''}
    </div>`;
  }

  // Legge i set dal segnapunti così come sono scritti ora (anche prima del salvataggio).
  function setsFromBoard(box) {
    const sets = [];
    box.querySelectorAll('input[data-set]').forEach((el) => {
      const i = +el.dataset.set;
      sets[i] = sets[i] || [null, null];
      sets[i][el.dataset.side === 'a' ? 0 : 1] = parseScore(el.value);
    });
    return sets;
  }

  // Set della partita con il nuovo valore del campo modificato (senza set vuoti in fondo).
  function setsWith(m, el) {
    const sets = (m.sets || []).map((s) => s.slice());
    const i = +el.dataset.set;
    while (sets.length <= i) sets.push([null, null]);
    sets[i][el.dataset.side === 'a' ? 0 : 1] = parseScore(el.value);
    while (sets.length && sets[sets.length - 1].every((v) => v == null)) sets.pop();
    return sets;
  }

  /* ------------------------------------------------------------ classifica */

  function viewClassifica() {
    if (!t.groups.length) return empty('La classifica sarà disponibile dopo aver creato i gironi.', 'coppie', 'Vai alle coppie');
    const { ranking, complete } = C.overallRanking(t);
    const limit = t.settings.maxBracket > 0 ? Math.min(t.settings.maxBracket, ranking.length) : ranking.length;
    const plan = C.bracketPlan(limit, t.settings.bracketDirect, t.settings.bracketEntry);
    const missing = t.groupMatches.filter((m) => !C.isPlayed(m)).length;
    const avg = t.settings.crossGroup === 'media';
    const fmt = (r, f) => (avg && r.played ? (r[f] / r.played).toFixed(2).replace('.', ',') : r[f]);
    const bandNames = ['Prime classificate', 'Seconde classificate', 'Terze classificate', 'Quarte classificate'];

    // Chi entra al turno più avanzato è evidenziato con il colore pallina.
    const topEntry = plan ? Math.max(...plan.entry) : 0;
    const zoneClass = (entry) => (entry === topEntry && topEntry > 0 ? 'z2' : entry > 0 ? 'z1' : 'z0');
    let rows = '';
    let lastPos = 0;
    ranking.forEach((r, i) => {
      if (r.groupPos !== lastPos) {
        rows += `<tr class="band"><td colspan="8" data-help-key="band">${bandNames[r.groupPos - 1] || r.groupPos + 'ª classificate'} dei gironi</td></tr>`;
        lastPos = r.groupPos;
      }
      let zone = '<span class="zone out" data-help-key="zone-out">Esclusa</span>';
      if (plan && i < limit) {
        const entry = plan.entry[i];
        const round = C.roundName(plan.total, entry);
        const where = {
          Finale: 'in finale', Semifinali: 'in semifinale', 'Quarti di finale': 'ai quarti di finale',
          'Ottavi di finale': 'agli ottavi di finale', 'Sedicesimi di finale': 'ai sedicesimi di finale',
        }[round] || 'al turno ' + (entry + 1);
        const help = entry === 0
          ? `Gioca dal primo turno del tabellone (${round.toLowerCase()}).`
          : `Salta ${entry === 1 ? 'il primo turno' : `i primi ${entry} turni`} ed entra direttamente ${where}.`;
        zone = `<span class="zone ${zoneClass(entry)}" data-help="${esc(help)}">${round}</span>`;
      }
      rows += `<tr class="${i < 4 && complete ? 'first' : ''}">
        <td class="pos"><span class="pos-badge">${r.rank}</span></td>
        <td class="l">${name(r.teamId)}</td>
        <td>${esc(r.groupName)}</td>
        <td>${r.played}</td><td>${fmt(r, 'won')}</td><td>${fmt(r, 'gw')}</td><td>${fmt(r, 'gl')}</td>
        <td class="l">${zone}</td>
      </tr>`;
    });

    let action;
    if (!complete) {
      action = `<p class="notice">Classifica provvisoria: ${missing === 1 ? 'manca 1 partita' : `mancano ${missing} partite`} dei gironi.</p>`;
    } else if (!t.knockout) {
      action = `<section class="card summary"><p><strong>Gironi conclusi.</strong> Il tabellone mette di fronte le più forti alle più deboli.</p>
        <button class="btn ball" data-action="make-ko">${ICON.bracket} Genera il tabellone</button></section>`;
    } else {
      action = `<section class="card summary"><p>Il tabellone è già stato generato.</p>
        <span class="row-actions"><button class="btn primary" data-action="goto" data-tab="tabellone">Vai al tabellone ${ICON.arrow}</button>
        <button class="btn ghost danger" data-action="remake-ko">Rigenera</button></span></section>`;
    }

    // Le prime 4 in evidenza: sono quelle che entrano direttamente ai quarti.
    const podium = ranking.slice(0, Math.min(4, limit)).map((r) => `
      <div class="podium-item" data-help="${esc(complete ? 'Tra le prime 4 della classifica generale.' : 'Posizione provvisoria: mancano ancora partite dei gironi.')}">
        <span class="rank">${r.rank}</span>
        <div><div class="who">${name(r.teamId)}</div><div class="meta">Girone ${esc(r.groupName)} · ${r.won} vinte · ${r.gw} game</div></div>
      </div>`).join('');

    return `
    <div class="toolbar"><span class="spacer"></span><button class="btn small" data-action="print">${ICON.print} Stampa</button></div>
    <div class="no-print">${action}</div>
    <div class="podium">${podium}</div>
    <section class="card">
      <h2 data-help-key="sec-ranking">Classifica generale</h2>
      <div class="table-wrap"><table>
        <thead><tr>
          <th data-help-key="th-pos">#</th><th class="l" data-help-key="th-coppia">Coppia</th><th data-help-key="th-gir">Gir.</th><th data-help-key="th-g">G</th>
          <th data-help-key="th-v${avg ? '-media' : ''}">V</th><th data-help-key="th-gv${avg ? '-media' : ''}">GV</th><th data-help-key="th-gp${avg ? '-media' : ''}">GP</th><th class="l" data-help-key="th-entra">Entra in</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="hint">Prima tutte le prime dei gironi, poi le seconde, e così via. Dentro ogni fascia contano: partite vinte, game vinti, game persi (meno è meglio), poi sorteggio.
      ${avg ? 'Valori in media per partita giocata.' : ''}</p>
    </section>`;
  }

  /* ------------------------------------------------------------- tabellone */

  function viewTabellone() {
    const ko = t.knockout;
    if (!ko) return empty('Il tabellone si genera dalla classifica quando i gironi sono conclusi.', 'classifica', 'Vai alla classifica');
    const champ = C.champion(t);
    const seedNo = (id) => ko.seeds.indexOf(id) + 1;
    const full = ui.koView !== 'edit';

    const toolbar = `
    <div class="toolbar">
      <div class="segmented" role="group" aria-label="Vista del tabellone">
        <button class="${full ? 'active' : ''}" data-action="ko-view" data-v="full" data-help-key="ko-view-full">Tabellone completo</button>
        <button class="${full ? '' : 'active'}" data-action="ko-view" data-v="edit" data-help-key="ko-view-edit">Inserisci risultati</button>
      </div>
      <span class="badge" data-help-key="badge-ko">${ko.seeds.length} coppie</span>
      <span class="spacer"></span>
      ${full ? `
      <div class="zoom" role="group" aria-label="Zoom" data-help-key="ko-zoom">
        <button class="icon" data-action="ko-zoom" data-z="out" aria-label="Rimpicciolisci">−</button>
        <span class="zoom-val">${ui.koZoom ? Math.round(ui.koZoom * 100) + '%' : 'intero'}</span>
        <button class="icon" data-action="ko-zoom" data-z="in" aria-label="Ingrandisci">+</button>
        <button class="btn small ghost" data-action="ko-zoom" data-z="fit">Adatta</button>
      </div>
      <button class="btn small" data-action="ko-print" data-mode="fit">${ICON.print} Stampa 1 pagina</button>
      <button class="btn small" data-action="ko-print" data-mode="multi">${ICON.print} Stampa su più fogli</button>
      <button class="btn small ball" data-action="ko-share">${ICON.share} Condividi</button>`
    : `<button class="btn small" data-action="print">${ICON.print} Stampa</button>`}
    </div>`;

    const banner = champ ? `<section class="card champion" data-help-key="champion">
      <svg class="crossed" viewBox="0 0 100 90" aria-hidden="true">${crossedArt(50, 52, 78, { head: '#ffffff', holes: '#173f80', ball: '#d4f53c', stroke: '#173f80' })}</svg>
      <div><div class="label">Vincitori del torneo</div><div class="who">${name(champ)}</div></div>${TROPHY}</section>` : '';

    if (full) {
      const { svg, w } = bracketSVG();
      const z = ui.koZoom;
      return toolbar + banner + `
      <div class="ko-sheet-wrap"><div class="ko-sheet" data-w="${w}" style="${z ? `width:${Math.round(w * z)}px` : ''}">${svg}</div></div>
      <p class="hint no-print">Con − e + ingrandisci, con <em>Adatta</em> lo vedi intero; sul telefono puoi anche allargare con due dita.
      I punteggi si inseriscono in <em>Inserisci risultati</em>. <em>Stampa</em>: nella finestra di stampa scegli la stampante oppure «Salva come PDF».</p>`;
    }

    let alive = 0;
    const cols = [];
    for (let r = 0; r < ko.total; r++) {
      const entering = ko.seeds.filter((id) => ko.entry[id] === r);
      const round = ko.rounds[r];
      const title = C.roundName(ko.total, r);
      const isFinal = r === ko.total - 1;
      const head = `<h3 data-help-key="round-title">${isFinal ? TROPHY : ''}${title}</h3>`;
      if (round) {
        cols.push(`<div class="round ${isFinal ? 'final' : ''}">${head}<div class="round-matches">${round.matches.map((m) => kMatch(m, seedNo)).join('')}</div></div>`);
      } else {
        cols.push(`<div class="round ${isFinal ? 'final' : ''}">${head}<div class="round-matches"><div class="pending" data-help-key="pending">
          In attesa di ${alive} ${alive === 1 ? 'vincente' : 'vincenti'} del turno precedente.
          ${entering.length ? `<br>Entrano direttamente:<ul>${entering.map((id) => `<li>(${seedNo(id)}) ${name(id)}</li>`).join('')}</ul>` : ''}
        </div></div></div>`);
      }
      alive = (alive + entering.length) / 2;
    }

    return toolbar + banner + `
    <div class="bracket">${cols.join('')}</div>
    <p class="hint">Il numero nel cerchio è la posizione nella classifica generale. In ogni turno la coppia meglio classificata affronta la peggiore rimasta.
    Nel tabellone non sono ammessi pareggi.</p>`;
  }

  function kMatch(m, seedNo) {
    return `<div class="kmatch">
      ${scoreBoard(m, true, seedNo)}
      <div class="kmeta" data-help-key="k-court">Campo ${m.court}</div>
    </div>`;
  }

  /* ----------------------------------------------------- tabellone completo */

  // Colori fissi del foglio del tabellone (uguale a schermo, in stampa e nell'immagine).
  const SHEET = {
    bg: '#ffffff', ink: '#0f1d33', muted: '#6b7a93', line: '#d5deeb', box: '#f7f9fd',
    blue: '#1f5fbf', navy: '#173f80', soft: '#e4edfb', ball: '#d4f53c', ballInk: '#1d2a00',
  };

  // Racchetta da padel con pallina, in SVG con colori espliciti (per il foglio e l'immagine).
  function racketArt(x, y, size, rotate, c) {
    const s = size / 64;
    const holes = [[24, 15], [32, 13], [40, 17], [20, 24], [28, 22], [36, 24], [24, 32], [32, 31]]
      .map(([hx, hy]) => `<circle cx="${hx}" cy="${hy}" r="2.2"/>`).join('');
    return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${s}) translate(-32 -32)">
      <rect x="27" y="40" width="10" height="22" rx="4" fill="${c.handle || c.head}"/>
      <ellipse cx="32" cy="24" rx="20" ry="22" fill="${c.head}"/>
      <g fill="${c.holes}" opacity="0.65">${holes}</g></g>`;
  }

  function ballArt(x, y, r, c) {
    return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${c.ball}" stroke="${c.stroke}" stroke-width="${Math.max(1, r / 6)}"/>
      <path d="M${x - r * 0.75} ${y - r * 0.45} C ${x - r * 0.1} ${y - r * 0.2} ${x + r * 0.2} ${y + r * 0.3} ${x + r * 0.3} ${y + r * 0.95}
        M${x + r * 0.1} ${y - r * 0.95} C ${x + r * 0.25} ${y - r * 0.4} ${x + r * 0.6} ${y - r * 0.1} ${x + r * 0.97} ${y - r * 0.05}"
        fill="none" stroke="${c.stroke}" stroke-width="${Math.max(1, r / 7)}" opacity="0.55"/></g>`;
  }

  // Due racchette incrociate con la pallina sopra.
  function crossedArt(cx, cy, size, c) {
    return `${racketArt(cx - size * 0.16, cy + size * 0.06, size * 0.78, -32, c)}
      ${racketArt(cx + size * 0.16, cy + size * 0.06, size * 0.78, 32, c)}
      ${ballArt(cx, cy - size * 0.36, size * 0.13, c)}`;
  }

  // Tutti i turni del tabellone, anche quelli non ancora creati (con i posti "Vincente ...").
  function bracketModel() {
    const ko = t.knockout;
    const seedNo = (id) => ko.seeds.indexOf(id) + 1;
    const rounds = [];
    let alive = 0;
    for (let r = 0; r < ko.total; r++) {
      const entering = ko.seeds.filter((id) => ko.entry[id] === r).sort((x, y) => seedNo(x) - seedNo(y));
      const real = ko.rounds[r];
      let matches;
      if (real) {
        matches = real.matches.map((m) => ({ m, a: m.a, b: m.b }));
      } else {
        // Le coppie che entrano sono sempre meglio classificate dei vincenti del turno prima:
        // stanno in cima, i posti dei vincenti in fondo (la migliore contro la peggiore).
        const list = entering.concat(Array(alive).fill(null));
        matches = [];
        for (let i = 0; i < list.length / 2; i++) matches.push({ m: null, a: list[i], b: list[list.length - 1 - i] });
      }
      rounds.push({ name: C.roundName(ko.total, r), prev: r ? rounds[r - 1].name : '', matches });
      alive = matches.length;
    }
    return rounds;
  }

  // Primo "turno sui campi" di ogni turno del tabellone, dopo la fine dei gironi (per gli orari).
  function koStartSlots() {
    const perCourt = {};
    t.groups.forEach((g) => {
      perCourt[g.court] = (perCourt[g.court] || 0) + t.groupMatches.filter((m) => m.groupId === g.id).length;
    });
    let slot = Math.max(0, ...Object.values(perCourt));
    return bracketModel().map((r) => {
      const first = slot;
      slot += Math.ceil(r.matches.length / t.courts);
      return first;
    });
  }

  // Il tabellone intero come immagine SVG (orizzontale, con titolo e grafiche padel).
  function bracketSVG() {
    const ko = t.knockout;
    const rounds = bracketModel();
    const seedNo = (id) => ko.seeds.indexOf(id) + 1;
    const champ = C.champion(t);
    const slots = koStartSlots();
    const start = toMin(t.settings.startTime);
    const min = t.settings.matchMinutes || 30;
    const W = 250, G = 40, BOXH = 60, VG = 30, PAD = 32, HEAD = 96, TOP = HEAD + 58;
    const maxM = Math.max(1, ...rounds.map((r) => r.matches.length));
    const colH = Math.max(maxM * (BOXH + VG), 240);
    const cols = rounds.length + 1;
    const width = PAD * 2 + cols * W + (cols - 1) * G;
    const height = TOP + colH + PAD;
    const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
    const o = [];

    o.push(`<rect width="${width}" height="${height}" fill="${SHEET.bg}"/>`);
    // Testata blu con le linee del campo, racchette e palline.
    o.push(`<rect width="${width}" height="${HEAD}" fill="url(#hdr)"/>`);
    o.push(`<g fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2">
      <rect x="10" y="10" width="${width - 20}" height="${HEAD - 20}"/>
      <line x1="${width / 2}" y1="10" x2="${width / 2}" y2="${HEAD - 10}"/>
      <line x1="${width * 0.2}" y1="10" x2="${width * 0.2}" y2="${HEAD - 10}"/>
      <line x1="${width * 0.8}" y1="10" x2="${width * 0.8}" y2="${HEAD - 10}"/>
      <line x1="${width * 0.2}" y1="${HEAD / 2}" x2="${width * 0.8}" y2="${HEAD / 2}"/></g>`);
    o.push(crossedArt(PAD + 34, HEAD / 2 + 6, 62, { head: '#ffffff', holes: SHEET.navy, ball: SHEET.ball, stroke: SHEET.navy }));
    o.push(`<text x="${PAD + 84}" y="${HEAD / 2 - 2}" class="t1">${esc(cut(t.name, 60))}</text>`);
    o.push(`<text x="${PAD + 84}" y="${HEAD / 2 + 24}" class="t2">Tabellone${t.date ? ' · ' + formatDate(t.date) : ''} · ${ko.seeds.length} coppie</text>`);
    o.push(`<text x="${width - PAD}" y="${HEAD / 2 + 8}" class="brand" text-anchor="end">DF PADEL CUP</text>`);
    o.push(ballArt(width - PAD - 172, HEAD / 2 + 1, 11, { ball: SHEET.ball, stroke: SHEET.navy }));

    rounds.forEach((r, ri) => {
      const x = PAD + ri * (W + G);
      o.push(`<text x="${x}" y="${TOP - 26}" class="rh">${esc(r.name.toUpperCase())}</text>`);
      o.push(`<text x="${x}" y="${TOP - 8}" class="rt">ore ${fmtTime(start + slots[ri] * min)} · ${r.matches.length} ${r.matches.length === 1 ? 'partita' : 'partite'}</text>`);
      const sp = colH / r.matches.length;
      r.matches.forEach((mm, i) => {
        const y = TOP + sp * i + (sp - BOXH) / 2;
        const w = mm.m ? C.matchWinner(mm.m) : null;
        const sets = mm.m ? (mm.m.sets || []).filter((s) => s[0] != null && s[1] != null) : [];
        // Collegamenti verso il turno successivo.
        {
          o.push(`<line x1="${x + W}" y1="${y + BOXH / 2}" x2="${x + W + G / 2}" y2="${y + BOXH / 2}" stroke="${SHEET.line}" stroke-width="2"/>`);
        }
        if (ri > 0) {
          o.push(`<line x1="${x - G / 2}" y1="${y + BOXH / 2}" x2="${x}" y2="${y + BOXH / 2}" stroke="${SHEET.line}" stroke-width="2"/>`);
        }
        o.push(`<rect x="${x}" y="${y}" width="${W}" height="${BOXH}" rx="10" fill="${SHEET.box}" stroke="${SHEET.line}" stroke-width="1.5"/>`);
        const row = (id, side, yy) => {
          if (!id) {
            return `<text x="${x + 14}" y="${yy + 20}" class="ph">${r.prev ? 'Vincente ' + esc(r.prev.toLowerCase()) : 'Da definire'}</text>`;
          }
          const win = w === id, lose = w && w !== id;
          let s = '';
          if (win) s += `<rect x="${x + 1}" y="${yy + 1}" width="${W - 2}" height="${BOXH / 2 - 2}" rx="9" fill="${SHEET.soft}"/>`;
          s += `<circle cx="${x + 17}" cy="${yy + BOXH / 4}" r="10.5" fill="${win ? SHEET.ball : '#ffffff'}" stroke="${win ? SHEET.ball : SHEET.line}"/>`;
          s += `<text x="${x + 17}" y="${yy + BOXH / 4 + 4}" class="seed" text-anchor="middle">${seedNo(id)}</text>`;
          s += `<text x="${x + 34}" y="${yy + BOXH / 4 + 5}" class="nm${win ? ' win' : lose ? ' lose' : ''}">${esc(cut(C.teamName(TM[id]), sets.length > 1 ? 21 : 26))}</text>`;
          sets.forEach((st, k) => {
            s += `<text x="${x + W - 12 - (sets.length - 1 - k) * 20}" y="${yy + BOXH / 4 + 5}" class="sc${win ? ' win' : ''}" text-anchor="end">${st[side === 'a' ? 0 : 1]}</text>`;
          });
          return s;
        };
        o.push(row(mm.a, 'a', y));
        o.push(`<line x1="${x + 8}" y1="${y + BOXH / 2}" x2="${x + W - 8}" y2="${y + BOXH / 2}" stroke="${SHEET.line}"/>`);
        o.push(row(mm.b, 'b', y + BOXH / 2));
        if (mm.m) o.push(`<text x="${x + 4}" y="${y + BOXH + 15}" class="ct">Campo ${mm.m.court}</text>`);
      });
    });

    // Colonna dei vincitori con racchette e pallina.
    const cx = PAD + rounds.length * (W + G);
    const cy = TOP + colH / 2;
    o.push(`<line x1="${cx - G / 2}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="${SHEET.line}" stroke-width="2"/>`);
    o.push(`<rect x="${cx}" y="${cy - 80}" width="${W}" height="160" rx="16" fill="url(#hdr)"/>`);
    o.push(crossedArt(cx + W / 2, cy - 34, 64, { head: '#ffffff', holes: SHEET.navy, ball: SHEET.ball, stroke: SHEET.navy }));
    o.push(`<text x="${cx + W / 2}" y="${cy + 22}" class="wl" text-anchor="middle">VINCITORI</text>`);
    o.push(`<text x="${cx + W / 2}" y="${cy + 52}" class="wn" text-anchor="middle">${champ ? esc(cut(C.teamName(TM[champ]), 22)) : '?'}</text>`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tabellone ${esc(t.name)}">
      <defs>
        <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SHEET.navy}"/><stop offset="1" stop-color="#2a6fd4"/></linearGradient>
        <style>
          text { font-family: 'Barlow', 'Segoe UI', Roboto, Arial, sans-serif; }
          .t1 { font-family: 'Barlow Condensed', 'Barlow', Arial, sans-serif; font-size: 30px; font-weight: 800; fill: #ffffff; }
          .t2 { font-size: 15px; fill: #ffffff; opacity: 0.85; }
          .brand { font-family: 'Barlow Condensed', 'Barlow', Arial, sans-serif; font-size: 22px; font-weight: 800; fill: ${SHEET.ball}; letter-spacing: 1px; }
          .rh { font-family: 'Barlow Condensed', 'Barlow', Arial, sans-serif; font-size: 17px; font-weight: 800; fill: ${SHEET.blue}; letter-spacing: 0.5px; }
          .rt { font-size: 12px; fill: ${SHEET.muted}; }
          .nm { font-size: 14px; fill: ${SHEET.ink}; }
          .nm.win { font-weight: 700; fill: ${SHEET.blue}; }
          .nm.lose { fill: #97a3b6; }
          .ph { font-size: 13px; font-style: italic; fill: #9aa6b8; }
          .seed { font-size: 11px; font-weight: 700; fill: ${SHEET.ink}; }
          .sc { font-size: 15px; font-weight: 700; fill: ${SHEET.muted}; }
          .sc.win { fill: ${SHEET.blue}; }
          .ct { font-size: 11px; fill: ${SHEET.muted}; }
          .wl { font-size: 13px; font-weight: 700; fill: #ffffff; letter-spacing: 2px; }
          .wn { font-family: 'Barlow Condensed', 'Barlow', Arial, sans-serif; font-size: 22px; font-weight: 800; fill: ${SHEET.ball}; }
        </style>
      </defs>${o.join('')}</svg>`;
    return { svg, w: width, h: height };
  }

  // Stampa del tabellone in orizzontale: su una pagina (rimpicciolito) o su più fogli.
  function printBracket(mode) {
    ui.koView = 'full';
    render();
    const style = document.createElement('style');
    style.id = 'print-page';
    style.textContent = '@page { size: A4 landscape; margin: 8mm; }';
    document.head.appendChild(style);
    const cls = mode === 'fit' ? 'print-ko-fit' : 'print-ko-multi';
    document.body.classList.add(cls);
    const cleanup = () => {
      style.remove();
      document.body.classList.remove(cls);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  // Immagine orizzontale del tabellone: condivisa (WhatsApp dal telefono) o scaricata.
  async function shareBracket() {
    const { svg, w, h } = bracketSVG();
    // Sempre in orizzontale: si allarga solo se il tabellone è più alto del formato A4 orizzontale.
    const M = 24;
    let cw = w + 2 * M, ch = h + 2 * M;
    if (ch * Math.SQRT2 > cw) cw = Math.round(ch * Math.SQRT2);
    const scale = Math.min(2, 4096 / Math.max(cw, ch));
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cw * scale);
    canvas.height = Math.round(ch * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, ((cw - w) / 2) * scale, ((ch - h) / 2) * scale, w * scale, h * scale);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const slug = (t.name || 'torneo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'torneo';
    const file = new File([blob], `tabellone-${slug}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `Tabellone ${t.name}`, text: `Tabellone ${t.name}` });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // condivisione annullata
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Immagine del tabellone scaricata: puoi inviarla su WhatsApp');
  }

  /* ------------------------------------------------------------- calendario */

  // Risultato in breve, visto dalla prima coppia: "6-3 6-4".
  function setsText(m) {
    return (m.sets || []).filter((s) => s[0] != null && s[1] != null).map((s) => `${s[0]}-${s[1]}`).join('  ');
  }

  function calRow(m, n, label, current, time) {
    const w = C.matchWinner(m);
    const status = m.done
      ? `<span class="cal-score">${setsText(m)}</span>`
      : m.bad ? '<span class="cal-bad">da correggere</span>'
        : current ? '<span class="cal-now">In campo ora</span>' : '<span class="cal-todo">da giocare</span>';
    return `<li class="${m.done ? 'done' : ''} ${current ? 'now' : ''}">
      <span class="cal-n">${n}</span>
      <span class="cal-when"><span class="cal-time" data-help-key="cal-time">${time}</span><span class="cal-tag">${label}</span></span>
      <span class="cal-teams"><span class="${w === m.a ? 'win' : ''}">${name(m.a)}</span>
        <span class="cal-vs">–</span> <span class="${w === m.b ? 'win' : ''}">${name(m.b)}</span></span>
      ${status}
    </li>`;
  }

  // Calendario creato con il sorteggio: per ogni campo le partite nell'ordine in cui si giocano.
  function viewCalendario() {
    if (!t.groups.length) return empty('Il calendario si crea con il sorteggio dei gironi.', 'coppie', 'Vai alle coppie');
    const start = toMin(t.settings.startTime);
    const min = t.settings.matchMinutes || 30;
    const at = (slot) => fmtTime(start + slot * min);
    let longest = 0;
    const cols = [...groupsByCourt()].map(([court, list]) => {
      const matches = list.flatMap((g) => t.groupMatches
        .filter((m) => m.groupId === g.id)
        .sort((a, b) => a.order - b.order)
        .map((m) => ({ m, g })));
      const nextIdx = matches.findIndex(({ m }) => !m.done);
      const left = matches.filter(({ m }) => !m.done).length;
      longest = Math.max(longest, matches.length);
      return `<section class="card cal-court">
        <h2>Campo ${court}</h2>
        <p class="hint" style="margin-top:0">${list.map((g) => `Girone ${esc(g.name)}`).join(', poi ')} ·
          ${left ? `${left} ${left === 1 ? 'partita da giocare' : 'partite da giocare'}` : 'tutte giocate ✓'}</p>
        <ol class="cal">${matches.map(({ m, g }, i) => calRow(m, i + 1, 'Girone ' + esc(g.name), i === nextIdx, at(i))).join('')}</ol>
      </section>`;
    }).join('');

    let ko = '';
    if (t.knockout) {
      // Orari del tabellone: dopo la fine dei gironi, un turno alla volta sui campi disponibili.
      let slot = longest;
      ko = t.knockout.rounds.map((r) => {
        const byCourt = r.matches.slice().sort((a, b) => a.court - b.court);
        const first = slot;
        slot += Math.ceil(r.matches.length / t.courts);
        return `<section class="card">
          <h2>${r.name}</h2>
          <ol class="cal">${byCourt.map((m, i) => calRow(m, i + 1, `Campo ${m.court}`, false, at(first + Math.floor(i / t.courts)))).join('')}</ol>
        </section>`;
      }).join('');
    }

    return `
    <div class="toolbar"><span class="badge">${C.describeGroups(t.groups.map((g) => g.teamIds.length), t.courts)}</span>
      <span class="badge" data-help-key="cal-times">${ICON.clock} inizio ${esc(t.settings.startTime)} · ${min} min a partita</span>
      <span class="spacer"></span>
      <button class="btn small" data-action="goto" data-tab="coppie">${ICON.clock} Cambia orari</button>
      <button class="btn small" data-action="print">${ICON.print} Stampa</button></div>
    <p class="hint" style="margin:0 0 16px">Le partite di ogni campo si giocano nell'ordine indicato; gli orari sono una stima. I risultati si inseriscono nella scheda <strong>Gironi</strong>${t.knockout ? ' e nella scheda <strong>Tabellone</strong>' : ''}.</p>
    ${t.rules && t.rules.trim() ? `<section class="card rules-card"><h2 data-help-key="rules-view">Regolamento</h2><div class="rules-text">${esc(t.rules)}</div></section>` : ''}
    <div class="cal-grid">${cols}</div>
    ${ko}`;
  }

  /* ---------------------------------------------- pianificatore (simulazione) */

  const toMin = (hhmm) => {
    const [h, m] = String(hhmm || '09:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const fmtTime = (min) => {
    const x = ((Math.round(min) % 1440) + 1440) % 1440;
    return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
  };
  const fmtDur = (min) => (min < 60 ? `${min} min`
    : `${Math.floor(min / 60)} h${min % 60 ? ' ' + String(min % 60).padStart(2, '0') : ''}`);

  // Numeri del pianificatore: per il nuovo torneo ('new') oppure per il torneo aperto ('t').
  function planOf(target) {
    if (target === 'new') {
      if (!ui.newSim) ui.newSim = { n: 16, courts: 4, groups: 0, minutes: 30, start: '09:00', ko: { size: 0, direct: null, entry: null } };
      return ui.newSim;
    }
    return {
      n: t.teams.length, courts: t.courts, groups: t.settings.groupCount || 0,
      minutes: t.settings.matchMinutes || 30, start: t.settings.startTime || '09:00',
      ko: { size: t.settings.maxBracket || 0, direct: t.settings.bracketDirect, entry: t.settings.bracketEntry },
    };
  }

  // Gironi scelti (0 = quello consigliato).
  function planChoice(p) {
    const autoG = (C.groupSizes(p.n, p.courts) || []).length;
    const chosen = p.groups && C.groupRange(p.n).includes(p.groups) ? p.groups : autoG;
    return { autoG, chosen };
  }

  function stepper(target, field, label, value, help) {
    return `<div class="stepper" data-help-key="${help}">
      <span class="stepper-label">${label}</span>
      <div class="stepper-ctl">
        <button type="button" class="step-btn" data-action="plan-step" data-target="${target}" data-field="${field}" data-d="-1" aria-label="${label}: meno">−</button>
        <span class="stepper-val">${value}</span>
        <button type="button" class="step-btn" data-action="plan-step" data-target="${target}" data-field="${field}" data-d="1" aria-label="${label}: più">+</button>
      </div>
    </div>`;
  }

  // I quattro contatori: coppie, campi, minuti a partita, ora di inizio.
  function planSteppers(target) {
    const p = planOf(target);
    return `<div class="steppers">
      ${stepper(target, 'n', 'Coppie', p.n, 'sim-n')}
      ${stepper(target, 'courts', 'Campi', p.courts, 'sim-courts')}
      ${stepper(target, 'minutes', 'Minuti a partita', p.minutes, 'sim-minutes')}
      ${stepper(target, 'start', 'Inizio', p.start, 'sim-start')}
    </div>`;
  }

  // Scelta dei gironi e tempistiche, ricalcolate a ogni clic.
  function planDetails(target) {
    const p = planOf(target);
    const start = toMin(p.start);
    const opts = C.simulateOptions({ n: p.n, courts: p.courts, minutes: p.minutes, ko: p.ko });
    const { autoG, chosen } = planChoice(p);
    const s = opts.find((o) => o.groups === chosen);
    if (!s) return `<p class="warn" style="margin:0">Con ${p.n} coppie non si possono fare gironi da 3 o 4: cambia il numero di coppie.</p>`;

    const options = opts.map((o) => `
      <button type="button" class="sim-option ${o.groups === chosen ? 'active' : ''}" data-action="plan-groups" data-target="${target}" data-g="${o.groups}">
        <span class="so-title">${C.describeSizes(p.n, p.courts, o.groups)}${o.groups === autoG ? ' <span class="so-best">consigliato</span>' : ''}</span>
        <span class="so-line">${o.perCouple.min === o.perCouple.max ? o.perCouple.min : `${o.perCouple.min}–${o.perCouple.max}`} partite a coppia nei gironi</span>
        <span class="so-line">Gironi finiti alle <strong>${fmtTime(start + o.groupMinutes)}</strong></span>
        <span class="so-line">Torneo finito alle <strong>${fmtTime(start + o.totalMinutes)}</strong></span>
        ${o.idleCourts ? `<span class="so-line warn">${o.idleCourts} ${o.idleCourts === 1 ? 'campo resta libero' : 'campi restano liberi'}</span>` : ''}
        ${o.groups > o.courts ? '<span class="so-line warn">alcuni gironi giocano dopo</span>' : ''}
      </button>`).join('');

    const kpis = `
      <div class="kpis">
        <div class="kpi" data-help-key="kpi-matches"><span class="kpi-val">${s.groupMatches + s.rounds.reduce((a, r) => a + r.matches, 0)}</span><span class="kpi-lbl">partite in tutto</span></div>
        <div class="kpi" data-help-key="kpi-groups-end"><span class="kpi-val">${fmtTime(start + s.groupMinutes)}</span><span class="kpi-lbl">fine gironi (${fmtDur(s.groupMinutes)})</span></div>
        <div class="kpi" data-help-key="kpi-end"><span class="kpi-val">${fmtTime(start + s.totalMinutes)}</span><span class="kpi-lbl">fine torneo (${fmtDur(s.totalMinutes)})</span></div>
        <div class="kpi" data-help-key="kpi-wait"><span class="kpi-val">${fmtDur(s.maxWaitSlots * p.minutes)}</span><span class="kpi-lbl">attesa massima prima di giocare</span></div>
      </div>`;

    // Una barra per campo: i gironi in ordine, lunghi quanto le loro partite.
    const at = (slot) => fmtTime(start + slot * p.minutes);
    const lanes = s.lanes.map((l) => {
      const free = s.groupSlots - l.load;
      return `<div class="lane">
        <span class="lane-name">Campo ${l.court}</span>
        <div class="lane-bar">
          ${l.blocks.map((b) => `<span class="lane-block" style="flex-grow:${b.matches}" data-help="${esc(`Girone ${b.name}: ${b.size} coppie, ${b.matches} partite, dalle ${at(b.start)} alle ${at(b.start + b.matches)}`)}">
            <strong>${b.name}</strong><small>${at(b.start)}–${at(b.start + b.matches)}</small></span>`).join('')}
          ${free > 0 ? `<span class="lane-free" style="flex-grow:${free}" data-help="Campo libero dalle ${at(l.load)}">libero</span>` : ''}
        </div>
      </div>`;
    }).join('');

    // Tabellone: chi entra in ogni turno e a che ora.
    const ord = (x) => `${x}ª`;
    // Fasce della classifica generale: prime dei gironi, seconde, terze, quarte.
    const bands = [];
    let edge = 0;
    ['prime', 'seconde', 'terze', 'quarte'].forEach((label, i) => {
      const k = s.sizes.filter((x) => x > i).length;
      if (k) { bands.push({ label, from: edge + 1, to: edge + k }); edge += k; }
    });
    const bandText = (from, to) => {
      const inside = bands.filter((bd) => bd.from >= from && bd.to <= to);
      if (!inside.length || inside[0].from !== from || inside[inside.length - 1].to !== to) return '';
      const names = inside.map((bd) => bd.label);
      return ` (le ${names.length > 1 ? names.slice(0, -1).join(', ') + ' e le ' + names[names.length - 1] : names[0]} dei gironi)`;
    };
    let slot = s.groupSlots;
    const rounds = s.rounds.map((r) => {
      const who = [];
      if (r.enter) {
        const [from, to] = r.enter;
        who.push((from === to ? `entra la ${ord(from)}`
          : from === 1 ? `entrano le prime ${to}`
            : `entrano le coppie dalla ${ord(from)} alla ${ord(to)}`) + bandText(from, to));
      }
      if (r.winners) who.push(`${r.winners} ${r.winners === 1 ? 'vincente' : 'vincenti'} del turno prima`);
      const row = `<li><span class="cal-tag">${at(slot)}</span><strong>${r.name}</strong>
        <span class="muted">${r.matches} ${r.matches === 1 ? 'partita' : 'partite'} · ${who.join(' + ')}${r.slots > 1 ? ` · ${r.slots} turni sui campi` : ''}</span></li>`;
      slot += r.slots;
      return row;
    }).join('');
    const b = s.bracket;
    const entryOpts = C.bracketEntryOptions(b.size, Math.max(1, b.direct));
    const ENTRY = { 4: 'Semifinali', 8: 'Quarti', 16: 'Ottavi', 32: 'Sedicesimi', 64: 'Trentaduesimi' };
    const pow2 = (x) => x > 0 && (x & (x - 1)) === 0;
    const koControls = `
      <div class="steppers">
        ${stepper(target, 'kosize', 'Coppie nel tabellone', b.size === p.n ? `${b.size} <small>tutte</small>` : b.size, 'ko-size')}
        ${stepper(target, 'direct', 'Passano direttamente', b.direct, 'ko-direct')}
      </div>
      ${b.direct && entryOpts.length ? `<div class="option-row" data-help-key="ko-entry">
        <span class="option-label">${b.direct === 1 ? 'La prima entra' : `Le prime ${b.direct} entrano`} in</span>
        <div class="segmented" role="group" aria-label="Turno di ingresso">
          ${entryOpts.map((S) => `<button type="button" class="${S === b.entry ? 'active' : ''}" data-action="plan-entry" data-target="${target}" data-s="${S}">${ENTRY[S] || S}</button>`).join('')}
        </div>
      </div>` : `<p class="hint">Nessuna coppia salta i turni${pow2(b.size) ? '' : ': con un numero di coppie diverso da 4, 8, 16, 32 le migliori saltano solo il primo turno'}.</p>`}`;

    const notes = [];
    if (s.idleCourts) notes.push(`${s.idleCourts} ${s.idleCourts === 1 ? 'campo resta libero' : 'campi restano liberi'} durante i gironi.`);
    if (s.groups > p.courts) notes.push(`Ci sono più gironi che campi: alcune coppie aspettano fino a ${fmtDur(s.maxWaitSlots * p.minutes)} prima di giocare.`);
    if (s.perCouple.min !== s.perCouple.max) notes.push('Nei gironi da 3 si giocano 2 partite, in quelli da 4 se ne giocano 3.');

    return `
      <h3 class="plan-sub" data-help-key="sec-sim-options">Come dividere le ${p.n} coppie</h3>
      <div class="sim-options">${options}</div>
      <h3 class="plan-sub" data-help-key="sec-sim-result">Tempi</h3>
      ${kpis}
      <div class="lanes" data-help-key="sim-lanes">${lanes}</div>
      ${notes.length ? `<ul class="sim-notes">${notes.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <h3 class="plan-sub" data-help-key="sec-ko-plan">Tabellone</h3>
      ${koControls}
      <ol class="sim-rounds">${rounds}</ol>`;
  }

  /* ---------------------------------------------------------- impostazioni */

  function themePreview(p) {
    const vars = `--p-bg:${p.bg};--p-hero1:${p.hero1};--p-hero2:${p.hero2};--p-nav:${p.nav};--p-card:${p.card};--p-text:${p.text};--p-ball:${p.ball};--p-score:${p.score}`;
    return `<span class="preview" style="${vars}">
      <span class="p-hero"></span><span class="p-nav"><i></i><i></i><i></i></span>
      <span class="p-card"><b></b><s></s><s></s></span><span class="p-ball"></span></span>`;
  }

  function viewImpostazioni() {
    const padel = THEMES.find((x) => x.id === 'padel').p;
    const notte = THEMES.find((x) => x.id === 'notte').p;
    const nTornei = S.list().length;
    return `
    <section class="card">
      <h2 data-help-key="sec-theme">Tema</h2>
      <div class="theme-grid">${THEMES.map((th) => `
        <button class="theme-card ${prefs.theme === th.id ? 'active' : ''}" data-action="set-theme" data-id="${th.id}" data-help="${esc(th.desc)}">
          ${th.id === 'auto' ? `<span class="preview-split">${themePreview(padel)}${themePreview(notte)}</span>` : themePreview(th.p)}
          <span class="tname">${th.name}${prefs.theme === th.id ? '<span class="check">✓</span>' : ''}</span>
          <span class="tdesc">${th.desc}</span>
        </button>`).join('')}
      </div>
    </section>

    <section class="card">
      <h2 data-help-key="sec-size">Dimensione del testo</h2>
      <div class="segmented" role="group" aria-label="Dimensione del testo">
        ${SIZES.map((s, i) => `<button class="${prefs.size === s.id ? 'active' : ''}" data-action="set-size" data-id="${s.id}">
          <span class="aa" style="font-size:${0.9 + i * 0.2}em">${s.aa}</span>${s.name}</button>`).join('')}
      </div>
      <p class="hint">Utile a bordo campo: con il testo più grande i punteggi si leggono meglio dal telefono.</p>
    </section>

    <section class="card">
      <h2 data-help-key="sec-help">Aiuto</h2>
      <div class="switch-row">
        <p>Mostra una spiegazione passando il mouse su pulsanti, campi e colonne delle tabelle.</p>
        <label class="switch"><input type="checkbox" data-change="help-toggle" ${prefs.help ? 'checked' : ''} aria-label="Aiuto al passaggio del mouse"><span></span></label>
      </div>
    </section>

    <section class="card">
      <h2 data-help-key="sec-info">Informazioni</h2>
      <p class="muted" style="margin:0"><strong>DF Padel Cup versione ${C.VERSION}</strong><br>${nTornei} ${nTornei === 1 ? 'torneo salvato' : 'tornei salvati'} in questo browser.<br>
      Tema, testo e aiuto valgono solo per questo dispositivo e non modificano i tornei.</p>
    </section>`;
  }

  /* ---------------------------------------------------------------- azioni */

  function openTournament(id) {
    const x = S.load(id);
    if (!x) { toast('Torneo non trovato', true); return; }
    t = C.normalize(x);
    S.setCurrentId(id);
    ui.court = 0;
    ui.editGroups = false;
    go(t.knockout ? 'tabellone' : t.groups.length ? 'gironi' : 'coppie');
  }

  function exportTournament(id) {
    const x = S.load(id);
    if (!x) return;
    const blob = new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const slug = (x.name || 'torneo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug || 'torneo'}${x.date ? '-' + x.date : ''}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importTournament(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let x;
      try { x = JSON.parse(reader.result); } catch (e) { toast('File non valido', true); return; }
      if (!x || !x.id || !Array.isArray(x.teams) || !Array.isArray(x.groups) || !x.settings) {
        toast('Il file non contiene un torneo valido', true);
        return;
      }
      if (S.load(x.id) && !confirm('Questo torneo è già presente. Vuoi sostituirlo?\n(Annulla per importarlo come copia)')) {
        x.id = C.newTournament({}).id;
        x.name += ' (copia)';
      }
      S.save(C.normalize(x));
      openTournament(x.id);
      toast('Torneo importato');
    };
    reader.readAsText(file);
  }

  // Aggiungere o togliere coppie rende i gironi non più validi.
  function allowTeamChange() {
    if (!t.groups.length) return true;
    const hasResults = t.groupMatches.some(C.isPlayed) || t.knockout;
    if (hasResults && !confirm('I gironi sono già stati creati e ci sono risultati.\nModificando le coppie, gironi e risultati verranno cancellati. Continuare?')) return false;
    t.groups = [];
    t.groupMatches = [];
    t.knockout = null;
    toast('Gironi cancellati: ricreali quando le coppie sono pronte');
    return true;
  }

  // Riempie prima le righe vuote o con i nomi di default, poi aggiunge coppie in fondo se l'elenco non basta.
  function fillTeams(pairs) {
    const empties = t.teams.filter(C.isTeamPlaceholder);
    const extra = pairs.length - empties.length;
    if (extra > 0 && !allowTeamChange()) return null;
    pairs.forEach(([p1, p2], i) => {
      const tm = empties[i] || t.teams[t.teams.push(C.newTeam('', '')) - 1];
      tm.p1 = (p1 || '').trim();
      tm.p2 = (p2 || '').trim();
    });
    return { filled: Math.min(pairs.length, empties.length), added: Math.max(0, extra) };
  }

  function reassignCourts() {
    t.groups.forEach((g, i) => {
      g.court = (i % t.courts) + 1;
      g.turn = Math.floor(i / t.courts) + 1;
    });
    if (t.knockout) {
      t.knockout.rounds.forEach((r) => r.matches.forEach((m, i) => { if (m.court > t.courts) m.court = (i % t.courts) + 1; }));
    }
  }

  const actions = {
    goto: (el) => go(el.dataset.tab),
    print: () => window.print(),

    'set-theme': (el) => {
      prefs.theme = el.dataset.id;
      savePrefs();
      render();
      toast('Tema: ' + THEMES.find((x) => x.id === prefs.theme).name);
    },
    'set-size': (el) => { prefs.size = el.dataset.id; savePrefs(); render(); },

    'open-t': (el) => openTournament(el.dataset.id),
    'export-t': (el) => exportTournament(el.dataset.id),
    'delete-t': (el) => {
      const x = S.load(el.dataset.id);
      if (!x || !confirm(`Eliminare il torneo "${x.name}"?\nL'operazione non si può annullare: esportalo prima se vuoi tenerne una copia.`)) return;
      S.remove(x.id);
      if (t && t.id === x.id) t = null;
      render();
      toast('Torneo eliminato');
    },

    'bulk-add': () => {
      const ta = document.getElementById('bulkText');
      const pairs = ta.value.split('\n').map((l) => l.trim()).filter(Boolean)
        .map((l) => l.split(/\s*[/,;\t]\s*|\s+-\s+/).filter(Boolean))
        .map((p) => [p[0], p.slice(1).join(' ')]);
      if (!pairs.length) { toast('Nessuna coppia da inserire'); return; }
      const res = fillTeams(pairs);
      if (!res) return;
      commit();
      toast(res.added
        ? `${pairs.length} coppie inserite (${res.added} ${res.added === 1 ? 'riga aggiunta' : 'righe aggiunte'} in fondo)`
        : `${pairs.length} coppie inserite`);
    },
    'add-row': () => {
      if (!allowTeamChange()) return;
      const tm = C.defaultTeam(t.teams.length + 1);
      t.teams.push(tm);
      persist();
      ui.focus = 'p1-' + tm.id;
      render();
    },
    'team-up': (el) => moveTeam(el.dataset.id, -1),
    'team-down': (el) => moveTeam(el.dataset.id, 1),
    'team-del': (el) => {
      const tm = TM[el.dataset.id];
      if (!confirm(`Eliminare la coppia ${C.teamName(tm)}?`)) return;
      if (!allowTeamChange()) return;
      t.teams = t.teams.filter((x) => x.id !== tm.id);
      commit();
    },
    'make-groups': (el) => {
      const mode = ['casuale', 'ordine'].includes(el.dataset.mode) ? el.dataset.mode : 'teste';
      if (t.groups.length) {
        const hasResults = t.groupMatches.some(C.isPlayed) || t.knockout;
        const msg = hasResults
          ? 'Rifare i gironi cancella tutti i risultati inseriti e il tabellone. Continuare?'
          : 'I gironi attuali verranno sostituiti con un nuovo sorteggio. Continuare?';
        if (!confirm(msg)) return;
      }
      t.settings.drawMode = mode;
      C.buildGroups(t);
      ui.court = 0;
      persist();
      go('calendario');
      toast({
        casuale: 'Gironi sorteggiati',
        ordine: 'Gironi creati in ordine di bravura',
      }[mode] || 'Gironi creati con le teste di serie');
    },

    'ko-view': (el) => { ui.koView = el.dataset.v; render(); },
    'ko-zoom': (el) => {
      const sheet = view.querySelector('.ko-sheet');
      const wrap = view.querySelector('.ko-sheet-wrap');
      const cur = ui.koZoom || (wrap && sheet ? wrap.clientWidth / Number(sheet.dataset.w) : 1);
      if (el.dataset.z === 'fit') ui.koZoom = 0;
      else if (el.dataset.z === 'in') ui.koZoom = Math.min(3, cur * 1.25);
      else ui.koZoom = Math.max(0.2, cur / 1.25);
      render();
    },
    'ko-print': (el) => printBracket(el.dataset.mode),
    'ko-share': () => {
      shareBracket().catch(() => toast('Non sono riuscito a creare l\'immagine del tabellone', true));
    },
    'toggle-edit': () => { ui.editGroups = !ui.editGroups; ui.swapPick = null; render(); },
    'court-filter': (el) => { ui.court = parseInt(el.dataset.court, 10) || 0; render(); },

    // Pianificatore: − e + ricalcolano subito gironi e tempi.
    'plan-step': (el) => {
      const d = parseInt(el.dataset.d, 10);
      const f = el.dataset.field;
      const p = planOf(el.dataset.target);
      if (f === 'n') {
        let n = Math.min(200, Math.max(3, p.n + d));
        if (n === 5) n += d; // con 5 coppie non si fanno gironi: salta
        n = Math.max(3, n);
        if (el.dataset.target === 'new') { p.n = n; p.groups = 0; } else setTeamCount(n);
      } else if (f === 'courts') {
        const c = Math.min(20, Math.max(1, p.courts + d));
        if (el.dataset.target === 'new') { p.courts = c; p.groups = 0; } else setCourts(c);
      } else if (f === 'kosize' || f === 'direct') {
        const cur = C.simulate({ n: p.n, courts: p.courts, groups: p.groups, minutes: p.minutes, ko: p.ko });
        if (!cur) return;
        const b = cur.bracket;
        const ko = { size: p.ko.size, direct: b.direct, entry: b.entry };
        if (f === 'kosize') {
          const size = Math.min(p.n, Math.max(2, b.size + d));
          ko.size = size >= p.n ? 0 : size;
        } else {
          const c = C.bracketConfig(ko.size || p.n, Math.max(0, b.direct + d), b.entry);
          ko.direct = c.direct;
          ko.entry = c.entry;
        }
        setKo(el.dataset.target, ko);
      } else if (f === 'minutes') {
        const m = Math.min(180, Math.max(10, p.minutes + d * 5));
        if (el.dataset.target === 'new') p.minutes = m; else { t.settings.matchMinutes = m; persist(); }
      } else if (f === 'start') {
        const st = fmtTime(Math.min(23 * 60, Math.max(6 * 60, toMin(p.start) + d * 15)));
        if (el.dataset.target === 'new') p.start = st; else { t.settings.startTime = st; persist(); }
      }
      render();
    },
    'plan-entry': (el) => {
      const p = planOf(el.dataset.target);
      const cur = C.simulate({ n: p.n, courts: p.courts, groups: p.groups, minutes: p.minutes, ko: p.ko });
      setKo(el.dataset.target, { size: p.ko.size, direct: cur.bracket.direct, entry: parseInt(el.dataset.s, 10) });
      render();
    },
    'plan-groups': (el) => {
      const g = parseInt(el.dataset.g, 10);
      if (el.dataset.target === 'new') { planOf('new').groups = g; render(); return; }
      const { autoG } = planChoice(planOf('t'));
      const value = g === autoG ? 0 : g;
      if (value === (t.settings.groupCount || 0)) return;
      if (t.groups.length && t.groups.length !== g) {
        const hasResults = t.groupMatches.some((m) => C.isPlayed(m) || C.hasScore(m)) || t.knockout;
        if (!confirm(`I gironi già sorteggiati verranno cancellati${hasResults ? ', insieme ai risultati' : ''}: andranno rifatti. Continuare?`)) return;
        t.groups = []; t.groupMatches = []; t.knockout = null;
      }
      t.settings.groupCount = value;
      persist();
      render();
    },

    'set-format': (el) => {
      if (C.scoreFormat(t) === el.dataset.id) return;
      t.settings.scoreFormat = el.dataset.id;
      C.revalidateScores(t);
      persist();
      render();
      const bad = t.groupMatches.concat(t.knockout ? t.knockout.rounds.flatMap((r) => r.matches) : []).filter((m) => m.bad).length;
      toast(bad ? `Formato cambiato: ${bad} ${bad === 1 ? 'risultato da correggere' : 'risultati da correggere'}` : 'Formato: ' + C.FORMATS[el.dataset.id].label, !!bad);
    },
    'set-cross': (el) => { t.settings.crossGroup = el.dataset.id; persist(); render(); },

    // Scambio a due clic: prima una coppia, poi quella di un altro girone.
    'swap-pick': (el) => {
      const id = el.dataset.id;
      if (!ui.swapPick || ui.swapPick === id) { ui.swapPick = ui.swapPick === id ? null : id; render(); return; }
      const gA = t.groups.find((g) => g.teamIds.includes(ui.swapPick));
      const gB = t.groups.find((g) => g.teamIds.includes(id));
      if (gA === gB) { ui.swapPick = id; render(); return; }
      const lose = C.groupHasResults(t, gA.id) || C.groupHasResults(t, gB.id) || t.knockout;
      if (lose && !confirm(`I risultati dei gironi ${gA.name} e ${gB.name}${t.knockout ? ' e il tabellone' : ''} verranno cancellati. Continuare?`)) return;
      C.swapTeams(t, ui.swapPick, id);
      toast(`Scambiate: ${C.teamName(TM[ui.swapPick])} ↔ ${C.teamName(TM[id])}`);
      ui.swapPick = null;
      commit();
    },

    'make-ko': () => {
      C.createKnockout(t);
      persist();
      go('tabellone');
      toast('Tabellone generato');
    },
    'remake-ko': () => {
      if (!confirm('Rigenerare il tabellone? I risultati già inseriti nel tabellone verranno cancellati.')) return;
      C.createKnockout(t);
      persist();
      go('tabellone');
    },
  };

  // Salva un nome senza ridisegnare la pagina, così chi scrive veloce non perde
  // la selezione del campo successivo. Ridisegna solo se cambia lo stato della coppia.
  function setTeamName(el, field) {
    const tm = TM[el.dataset.id];
    const wasComplete = C.isTeamComplete(tm);
    tm[field] = el.value.trim();
    persist();
    if (C.isTeamComplete(tm) !== wasComplete) { setTimeout(render, 0); return; }
    const hint = document.getElementById('defaultsHint');
    if (hint) {
      const d = t.teams.filter((x) => C.isDefaultName(x.p1) || C.isDefaultName(x.p2)).length;
      hint.textContent = d ? `${d === 1 ? '1 coppia ha' : `${d} coppie hanno`} ancora i nomi di default: puoi creare i gironi lo stesso e correggerli dopo.` : '';
    }
  }

  // Scelte del tabellone: coppie ammesse, coppie dirette, turno di ingresso.
  function setKo(target, ko) {
    if (target === 'new') { planOf('new').ko = ko; return; }
    t.settings.maxBracket = ko.size || 0;
    t.settings.bracketDirect = ko.direct;
    t.settings.bracketEntry = ko.entry;
    persist();
    if (t.knockout) toast('Vale per il prossimo tabellone: rigeneralo dalla Classifica');
  }

  // Cambia il numero di campi del torneo aperto.
  function setCourts(n) {
    if (n === t.courts) return;
    t.courts = n;
    if (t.groups.length) {
      reassignCourts();
      const ideal = C.groupSizes(t.teams.length, n, t.settings.groupCount);
      toast(ideal && ideal.length !== t.groups.length
        ? `Con ${n} ${n === 1 ? 'campo' : 'campi'} conviene fare ${C.describeSizes(t.teams.length, n, t.settings.groupCount)}: rifai il sorteggio`
        : 'Campi dei gironi riassegnati', !!(ideal && ideal.length !== t.groups.length));
    }
    persist();
  }

  // Cambia il numero di coppie del torneo aperto (con le conferme necessarie).
  function setTeamCount(n) {
    if (n === t.teams.length) return;
    const lost = C.filledLostOnResize(t, n);
    if (lost && !confirm(`Per scendere a ${n} coppie verranno eliminate le ultime ${lost} ${lost === 1 ? 'coppia compilata' : 'coppie compilate'} dell'elenco. Continuare?`)) return;
    if (!allowTeamChange()) return;
    C.resizeTeams(t, n);
    persist();
  }

  function moveTeam(id, dir) {
    const i = t.teams.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= t.teams.length) return;
    [t.teams[i], t.teams[j]] = [t.teams[j], t.teams[i]];
    commit();
  }

  const changes = {
    import: (el) => { if (el.files[0]) importTournament(el.files[0]); },
    'help-toggle': (el) => {
      prefs.help = el.checked;
      savePrefs();
      toast(prefs.help ? 'Aiuto attivato' : 'Aiuto disattivato');
    },

    't-name': (el) => { t.name = el.value.trim() || 'Torneo'; commit(); },
    't-date': (el) => { t.date = el.value; commit(); },
    't-rules': (el) => { t.rules = el.value; persist(); toast('Regolamento salvato'); },
    maxBracket: (el) => {
      const n = parseInt(el.value, 10);
      t.settings.maxBracket = Number.isFinite(n) && n >= 2 ? n : 0;
      if (t.knockout) toast('Vale per il prossimo tabellone generato');
      commit();
    },
    'team-p1': (el) => setTeamName(el, 'p1'),
    'team-p2': (el) => setTeamName(el, 'p2'),

    gscore: (el) => {
      const m = t.groupMatches.find((x) => x.id === el.dataset.id);
      if (t.knockout) {
        if (!confirm('Il tabellone è già stato generato: modificando un risultato dei gironi verrà cancellato. Continuare?')) { render(); return; }
        t.knockout = null;
      }
      C.setGroupScore(t, m.id, setsWith(m, el));
      commit();
      if (m.bad) toast(m.err, true);
    },

    kscore: (el) => {
      const m = t.knockout.rounds.flatMap((r) => r.matches).find((x) => x.id === el.dataset.id);
      const sets = setsWith(m, el);
      const next = { ...m };
      C.applyScore(t, next, sets, true);
      if (C.matchWinner(next) !== C.matchWinner(m) && C.knockoutHasResultsAfter(t, m.id)
        && !confirm('Cambia il vincitore: i risultati dei turni successivi verranno cancellati. Continuare?')) {
        render();
        return;
      }
      C.setKnockoutScore(t, m.id, sets);
      commit();
      if (m.bad) toast(m.err, true);
      else if (C.champion(t)) toast('🏆 Torneo concluso!');
    },
  };

  /* ---------------------------------------------------------------- eventi */

  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (b && !b.disabled) go(b.dataset.tab);
  });

  view.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (el && actions[el.dataset.action]) {
      e.preventDefault();
      actions[el.dataset.action](el);
    }
  });

  view.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && changes[el.dataset.change]) changes[el.dataset.change](el);
  });

  view.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const data = Object.fromEntries(new FormData(f));
    if (f.dataset.form === 'new-t') {
      const p = planOf('new');
      if (!C.groupSizes(p.n, p.courts)) {
        toast(`Con ${p.n} coppie non si possono fare gironi da 3 o 4`, true);
        return;
      }
      const { autoG, chosen } = planChoice(p);
      t = C.newTournament({ name: (data.name || '').trim() || 'Torneo', date: data.date, courts: p.courts, count: p.n });
      t.settings.groupCount = chosen === autoG ? 0 : chosen;
      t.settings.matchMinutes = p.minutes;
      t.settings.startTime = p.start;
      t.settings.maxBracket = p.ko.size || 0;
      t.settings.bracketDirect = p.ko.direct;
      t.settings.bracketEntry = p.ko.entry;
      S.save(t);
      S.setCurrentId(t.id);
      ui.newSim = null;
      ui.newName = '';
      ui.newDate = '';
      ui.focus = t.teams.length ? 'p1-' + t.teams[0].id : null;
      go('coppie');
      toast(`Torneo creato con ${p.n} coppie: scrivi i nomi o crea subito i gironi`);
    }
  });

  // Cliccando su un nome di default lo seleziona, così scrivendo lo si sostituisce.
  view.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.matches('input[data-nav="team"]') && C.isDefaultName(el.value)) {
      el.select();
      // Con il mouse il clic sposta il cursore dopo il focus: riseleziona subito dopo.
      setTimeout(() => { if (document.activeElement === el && C.isDefaultName(el.value)) el.select(); }, 0);
    }
  });
  view.addEventListener('input', (e) => {
    if (e.target.matches('input[data-nav="team"]')) e.target.classList.toggle('is-default', C.isDefaultName(e.target.value));
  });

  // Nome e data del nuovo torneo restano scritti anche quando si usano − e +.
  view.addEventListener('input', (e) => {
    const f = e.target.form;
    if (!f || f.dataset.form !== 'new-t') return;
    if (e.target.name === 'name') ui.newName = e.target.value;
    if (e.target.name === 'date') ui.newDate = e.target.value;
  });

  // Invio passa al campo successivo (punteggi e nomi delle coppie).
  view.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.matches('input[data-side], input[data-nav]')) return;
    e.preventDefault();
    const sel = e.target.dataset.nav ? `input[data-nav="${e.target.dataset.nav}"]` : 'input[data-side]';
    const inputs = [...view.querySelectorAll(sel)].filter((i) => !i.disabled);
    const idx = inputs.indexOf(e.target);
    let next = inputs[idx + 1];
    // Se la partita è già decisa (es. 2-0 nei primi due set) salta al segnapunti successivo.
    const box = e.target.closest('[data-match]');
    if (box && next && next.closest('[data-match]') === box
      && C.evalSets(t, setsFromBoard(box), box.dataset.ko === '1').done) {
      next = inputs.slice(idx + 1).find((i) => i.closest('[data-match]') !== box);
    }
    if (!next) { e.target.blur(); return; }
    next.focus();
    if (next.type === 'number' || C.isDefaultName(next.value)) next.select();
  });

  /* ---------------------------------------------------------------- avvio */

  applyPrefs();
  document.getElementById('appVersion').textContent = 'v' + C.VERSION;
  // Con il tema automatico aggiorna il colore della barra del browser se cambia la modalità del dispositivo.
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPrefs);
  } catch (e) { /* browser datato */ }

  const currentId = S.getCurrentId();
  if (currentId) t = S.load(currentId);
  if (t) C.normalize(t);
  if (t) {
    let saved = null;
    try { saved = localStorage.getItem('ppt.tab'); } catch (e) { /* ignora */ }
    tab = saved || 'coppie';
  }
  render();
})();
