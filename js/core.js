/*
 * DF Padel Cup - regole del torneo.
 * Solo logica pura: nessun accesso a DOM o salvataggio.
 * Funziona sia nel browser (window.PadelCore) sia in Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PadelCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Versione del programma e data dell'aggiornamento (AAAA-MM-GG): aggiornale a ogni rilascio
  // (vedi README, "Versioni").
  const VERSION = '1.6.1';
  const VERSION_DATE = '2026-09-27';

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Ordine delle partite nel girone: nessuna coppia gioca due volte di fila (girone da 4).
  const PAIRINGS = {
    4: [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]],
    3: [[0, 1], [1, 2], [2, 0]],
  };

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    const r = rng || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function newTournament({ name, date, courts, count }) {
    const teams = [];
    for (let i = 0; i < (parseInt(count, 10) || 0); i++) teams.push(defaultTeam(i + 1));
    return {
      version: 1,
      id: uid('t'),
      name: name || 'Torneo',
      date: date || '',
      courts: clampCourts(courts),
      settings: {
        drawMode: 'teste', // 'teste' (teste di serie + sorteggio) | 'ordine' (tutte in ordine di bravura) | 'casuale'
        scoreFormat: '1set', // '1set' | '3set' | '3set-stb' | 'libero' (vedi FORMATS)
        sevenAsSix: true, // in classifica 7-6 conta 6-6 e 7-5 conta 6-5
        crossGroup: 'assoluto', // 'assoluto' | 'media' (per partita giocata)
        maxBracket: 0, // 0 = tutte le coppie entrano nel tabellone
        bracketDirect: null, // coppie che passano direttamente (null = automatico: 4 sopra le 8 coppie)
        bracketEntry: null, // turno in cui entrano (4 semifinali, 8 quarti, 16 ottavi, 32 sedicesimi)
        groupCount: 0, // 0 = automatico (un girone per campo quando si può)
        matchMinutes: 30, // durata stimata di una partita, per gli orari del calendario
        startTime: '09:00',
      },
      teams,
      groups: [],
      groupMatches: [],
      knockout: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  function clampCourts(c) {
    const n = parseInt(c, 10);
    if (!Number.isFinite(n)) return 1;
    return Math.min(20, Math.max(1, n));
  }

  function newTeam(p1, p2) {
    return { id: uid('c'), p1: (p1 || '').trim(), p2: (p2 || '').trim(), coin: Math.random() };
  }

  function teamName(team) {
    if (!team || (!team.p1 && !team.p2)) return '—';
    return team.p1 && team.p2 ? team.p1 + ' / ' + team.p2 : team.p1 || team.p2;
  }

  // Una coppia è pronta quando ha entrambi i giocatori.
  function isTeamComplete(team) {
    return !!(team.p1 && team.p2);
  }

  function isTeamEmpty(team) {
    return !team.p1 && !team.p2;
  }

  // Nomi di default ("Giocatore 3A" / "Giocatore 3B"): le righe nascono già
  // compilate così i gironi si possono creare subito e i nomi correggere dopo.
  const DEFAULT_NAME = /^Giocatore \d+[AB]$/;

  function defaultTeam(n) {
    return newTeam('Giocatore ' + n + 'A', 'Giocatore ' + n + 'B');
  }

  function isDefaultName(s) {
    return DEFAULT_NAME.test(s || '');
  }

  // Riga ancora da riempire: vuota o con i soli nomi di default.
  function isTeamPlaceholder(team) {
    return isTeamEmpty(team) || (isDefaultName(team.p1) && isDefaultName(team.p2));
  }

  // Porta l'elenco a n coppie: aggiunge righe con nomi di default in fondo, oppure
  // toglie prima le righe ancora da riempire e poi, se serve, le ultime coppie.
  function resizeTeams(t, n) {
    while (t.teams.length < n) t.teams.push(defaultTeam(t.teams.length + 1));
    for (let i = t.teams.length - 1; i >= 0 && t.teams.length > n; i--) {
      if (isTeamPlaceholder(t.teams[i])) t.teams.splice(i, 1);
    }
    if (t.teams.length > n) t.teams.length = n;
  }

  // Quante coppie con nomi veri verrebbero eliminate portando l'elenco a n coppie.
  function filledLostOnResize(t, n) {
    const placeholders = t.teams.filter(isTeamPlaceholder).length;
    return Math.max(0, t.teams.length - n - placeholders);
  }

  /* ---------------------------------------------------------------- GIRONI */

  // Gironi da 3 o da 4. null se impossibile (1, 2, 5 coppie).
  // Regola: un girone per campo, quando si può. Pochi campi → meno gironi, quindi da 4;
  // tanti campi → più gironi, quindi da 3 (finiscono prima). Senza campi: più gironi da 4 possibile.
  // Con `groups` si sceglie a mano il numero di gironi (entro i limiti possibili).
  function groupSizes(n, courts, groups) {
    if (n < 3 || n === 5) return null;
    const minG = Math.ceil(n / 4); // tutti da 4 (o quasi)
    const maxG = Math.floor(n / 3); // tutti da 3 (o quasi)
    let g;
    if (groups) {
      g = Math.min(maxG, Math.max(minG, groups));
    } else if (courts) {
      g = Math.min(maxG, Math.max(minG, courts));
      // Meno gironi (quindi più partite per coppia) se si finisce alla stessa ora.
      const slots = groupSlots(sizesFor(n, g), courts);
      for (let k = minG; k < g; k++) {
        if (groupSlots(sizesFor(n, k), courts) <= slots) { g = k; break; }
      }
    } else {
      g = minG;
    }
    return sizesFor(n, g);
  }

  // n coppie in g gironi: prima quelli da 4, poi quelli da 3.
  function sizesFor(n, g) {
    const threes = 4 * g - n;
    const sizes = [];
    for (let i = 0; i < g; i++) sizes.push(i < g - threes ? 4 : 3);
    return sizes;
  }

  // Durata della fase a gironi in "turni di partita": il campo più carico
  // (girone i sul campo i % campi, come nel sorteggio).
  function groupSlots(sizes, courts) {
    const load = new Array(courts).fill(0);
    sizes.forEach((s, i) => { load[i % courts] += PAIRINGS[s].length; });
    return Math.max(...load);
  }

  // Numeri di gironi possibili per n coppie (dal minimo, tutti da 4, al massimo, tutti da 3).
  function groupRange(n) {
    if (n < 3 || n === 5) return [];
    const out = [];
    for (let g = Math.ceil(n / 4); g <= Math.floor(n / 3); g++) out.push(g);
    return out;
  }

  // Gironi del torneo, secondo coppie, campi ed eventuale scelta manuale.
  function tournamentSizes(t) {
    return groupSizes(t.teams.length, t.courts, t.settings.groupCount || 0);
  }

  function describeSizes(n, courts, groups) {
    const sizes = groupSizes(n, courts, groups);
    return sizes ? describeGroups(sizes, courts) : null;
  }

  // Descrizione completa: "4 gironi da 4 coppie su 4 campi",
  // "5 gironi su 4 campi: 1 da 4 coppie e 4 da 3 coppie", "3 gironi da 4 coppie su 3 campi (1 campo libero)".
  function describeGroups(sizes, courts) {
    const G = sizes.length;
    const fours = sizes.filter((s) => s === 4).length;
    const threes = G - fours;
    const used = courts ? Math.min(G, courts) : 0;
    const free = courts ? courts - used : 0;
    const where = used ? ` su ${used} ${used === 1 ? 'campo' : 'campi'}` : '';
    const idle = free ? ` (${free} ${free === 1 ? 'campo libero' : 'campi liberi'})` : '';
    const gironi = (k) => `${k} ${k === 1 ? 'girone' : 'gironi'}`;
    if (!fours || !threes) return `${gironi(G)} da ${fours ? 4 : 3} coppie${where}${idle}`;
    return `${gironi(G)}${where}: ${fours} da 4 coppie e ${threes} da 3 coppie${idle}`;
  }

  // Numero di teste di serie: una per girone.
  function seedCount(n, courts, groups) {
    const sizes = groupSizes(n, courts, groups);
    return sizes ? sizes.length : 0;
  }

  // Ordine delle teste di serie in un tabellone di tennis, dall'alto in basso:
  // la 1 in alto, la 2 in basso, le altre incrociate (4 → 1,4,3,2; 8 → 1,8,5,4,3,6,7,2).
  function tennisOrder(n) {
    let order = [1];
    while (order.length < n) {
      const m = order.length * 2 + 1;
      order = order.flatMap((s, i) => (i % 2 === 0 ? [s, m - s] : [m - s, s]));
    }
    return order;
  }

  // Posizione (0 = la più forte) che ogni girone ha nella prima fascia, secondo il tabellone di tennis.
  function groupSeedRanks(G) {
    let size = 1;
    while (size < G) size *= 2;
    return tennisOrder(size).filter((s) => s <= G).map((s) => s - 1);
  }

  // Tutte le coppie in ordine di bravura: fascia 1 = le prime G, fascia 2 = le successive G, ...
  // Nella fascia 1 la 1 va nel girone A (in alto), la 2 nell'ultimo (in basso), le altre incrociate;
  // nelle fasce pari l'ordine si inverte (serpentina), così i gironi hanno la stessa forza complessiva.
  function rankedBuckets(t, sizes) {
    const G = sizes.length;
    const rank = groupSeedRanks(G);
    const buckets = sizes.map(() => []);
    let k = 0;
    for (let pos = 0; pos < 4; pos++) {
      const groups = [...Array(G).keys()].filter((g) => sizes[g] > pos);
      const want = (g) => (pos % 2 === 0 ? rank[g] : G - 1 - rank[g]);
      groups.sort((a, b) => want(a) - want(b));
      for (const g of groups) buckets[g].push(t.teams[k++].id);
    }
    return buckets;
  }

  // Crea i gironi.
  //  - 'teste':   le prime G coppie dell'elenco sono teste di serie (la 1ª nel girone A,
  //               la 2ª nel B, ...); tutte le altre vengono sorteggiate.
  //  - 'ordine':  tutte le coppie in ordine di bravura, disposte come nel tabellone di tennis.
  //  - 'casuale': tutte le coppie sorteggiate.
  function buildGroups(t, rng) {
    const sizes = tournamentSizes(t);
    if (!sizes) throw new Error('Numero di coppie non valido per gironi da 3 o 4.');
    const G = sizes.length;
    t.seedOrder = t.teams.map((x) => x.id); // ordine di bravura al momento del sorteggio
    let buckets;
    if (t.settings.drawMode === 'ordine') {
      buckets = rankedBuckets(t, sizes);
    } else {
      const order = t.settings.drawMode === 'casuale'
        ? shuffle(t.teams, rng)
        : t.teams.slice(0, G).concat(shuffle(t.teams.slice(G), rng));
      buckets = sizes.map(() => []);
      let k = 0;
      for (let pos = 0; pos < 4; pos++) {
        const idx = [...Array(G).keys()];
        if (pos % 2 === 1) idx.reverse();
        for (const g of idx) if (sizes[g] > pos) buckets[g].push(order[k++].id);
      }
    }
    t.groups = buckets.map((teamIds, i) => ({
      id: uid('g'),
      name: LETTERS[i] || 'G' + (i + 1),
      teamIds,
      court: (i % t.courts) + 1,
      turn: Math.floor(i / t.courts) + 1,
    }));
    t.groupMatches = [];
    t.groups.forEach((g) => { t.groupMatches.push(...scheduleGroup(g)); });
    t.knockout = null;
    return t;
  }

  function scheduleGroup(group) {
    return PAIRINGS[group.teamIds.length].map(([i, j], order) => ({
      id: uid('m'),
      groupId: group.id,
      order,
      a: group.teamIds[i],
      b: group.teamIds[j],
      sets: [],
      done: false,
    }));
  }

  // Scambia due coppie di gironi diversi e rigenera le partite dei due gironi.
  function swapTeams(t, teamA, teamB) {
    const gA = t.groups.find((g) => g.teamIds.includes(teamA));
    const gB = t.groups.find((g) => g.teamIds.includes(teamB));
    if (!gA || !gB || gA === gB) return;
    gA.teamIds[gA.teamIds.indexOf(teamA)] = teamB;
    gB.teamIds[gB.teamIds.indexOf(teamB)] = teamA;
    t.groupMatches = t.groupMatches.filter((m) => m.groupId !== gA.id && m.groupId !== gB.id);
    t.groupMatches.push(...scheduleGroup(gA), ...scheduleGroup(gB));
    t.knockout = null;
  }

  /* ------------------------------------------------------------- PUNTEGGI */

  // Formati delle partite:
  //  '1set'     un set tennistico
  //  '3set'     al meglio dei 3 set
  //  '3set-stb' 2 set + eventuale super tie-break a 10 al posto del terzo set
  //  'libero'   game liberi (partite a tempo), pareggio possibile nei gironi
  const FORMATS = {
    '1set': { sets: 1, label: 'Un set' },
    '3set': { sets: 3, label: 'Al meglio dei 3 set' },
    '3set-stb': { sets: 3, label: '2 set + super tie-break', stb: true },
    libero: { sets: 1, label: 'Game liberi (a tempo)' },
  };

  function scoreFormat(t) {
    const f = t.settings && t.settings.scoreFormat;
    if (f === 'set' || !FORMATS[f]) return '1set'; // 'set' = valore delle prime versioni
    return f;
  }

  // Conteggio dei game in classifica: 7-6 vale 6-6 e 7-5 vale 6-5 (predefinito).
  function sevenCountsAsSix(t) {
    return !(t.settings && t.settings.sevenAsSix === false);
  }

  function setCount(t) {
    return FORMATS[scoreFormat(t)].sets;
  }

  // Set tennistico: 6-0 … 6-4, 7-5, 7-6 (tie-break).
  function isValidSet(a, b) {
    const hi = Math.max(a, b), lo = Math.min(a, b);
    return (hi === 6 && lo <= 4) || (hi === 7 && (lo === 5 || lo === 6));
  }

  // Super tie-break: si arriva a 10 con almeno 2 punti di vantaggio (10-8, 11-9, 12-10…).
  function isValidSuperTB(a, b) {
    const hi = Math.max(a, b), lo = Math.min(a, b);
    return Number.isInteger(hi) && Number.isInteger(lo) && lo >= 0 && hi >= 10 && hi - lo >= 2 && (hi === 10 || hi - lo === 2);
  }

  const isNum = (v) => Number.isInteger(v);

  // Valuta i set inseriti. Restituisce:
  //  done   partita conclusa con un risultato valido
  //  error  messaggio se il punteggio non è valido (null se va bene o se è ancora incompleto)
  //  win    'a' | 'b' | null (null anche per il pareggio nei game liberi)
  //  ga/gb  game totali (il super tie-break conta 1 game a chi lo vince)
  //  sa/sb  set vinti
  function evalSets(t, sets, knockout) {
    const fmt = scoreFormat(t);
    const conf = FORMATS[fmt];
    const res = { done: false, error: null, win: null, ga: 0, gb: 0, sa: 0, sb: 0 };
    const list = (sets || []).slice(0, conf.sets);

    if (fmt === 'libero') {
      const [a, b] = list[0] || [];
      if (!isNum(a) || !isNum(b)) return res;
      Object.assign(res, { ga: a, gb: b, sa: a > b ? 1 : 0, sb: b > a ? 1 : 0 });
      if (a === b && knockout) { res.error = 'Pareggio: serve un vincitore'; return res; }
      res.done = true;
      res.win = a > b ? 'a' : b > a ? 'b' : null;
      return res;
    }

    const need = conf.sets === 1 ? 1 : 2; // set da vincere
    for (let i = 0; i < conf.sets; i++) {
      const [a, b] = list[i] || [];
      const filled = isNum(a) && isNum(b);
      const any = isNum(a) || isNum(b);
      const decided = res.sa === need || res.sb === need;
      if (decided) {
        if (any) res.error = `Il ${i + 1}° set non serve: la partita è già finita`;
        break;
      }
      if (!filled) break; // set ancora da giocare o a metà
      const stb = conf.stb && i === 2;
      if (stb ? !isValidSuperTB(a, b) : !isValidSet(a, b)) {
        res.error = stb
          ? 'Super tie-break non valido: a 10 con 2 punti di vantaggio'
          : `${conf.sets > 1 ? `${i + 1}° set` : 'Set'} non valido: 6-0…6-4, 7-5 o 7-6`;
        break;
      }
      if (stb) {
        if (a > b) res.ga++; else res.gb++;
      } else {
        // Regola del torneo: in classifica il 7 conta come 6 (7-6 → 6-6, 7-5 → 6-5);
        // la vittoria del set resta comunque a chi l'ha vinto.
        const cap = sevenCountsAsSix(t) ? (x) => Math.min(x, 6) : (x) => x;
        res.ga += cap(a);
        res.gb += cap(b);
      }
      if (a > b) res.sa++; else res.sb++;
    }
    if (!res.error && (res.sa === need || res.sb === need)) {
      res.done = true;
      res.win = res.sa > res.sb ? 'a' : 'b';
    }
    return res;
  }

  // Registra un punteggio (lista di set [[a, b], ...]).
  // Un risultato non valido resta visibile ma non conta finché non viene corretto.
  function applyScore(t, m, sets, knockout) {
    m.sets = (sets || []).map((s) => [isNum(s[0]) ? s[0] : null, isNum(s[1]) ? s[1] : null]);
    const r = evalSets(t, m.sets, knockout);
    m.done = r.done;
    m.bad = !!r.error;
    m.err = r.error;
    m.win = r.win;
    m.ga = r.ga; m.gb = r.gb;
    m.sa = r.sa; m.sb = r.sb;
  }

  function scoreError(t, sets, knockout) {
    return evalSets(t, sets, knockout).error;
  }

  function setGroupScore(t, matchId, sets) {
    applyScore(t, t.groupMatches.find((m) => m.id === matchId), sets, false);
  }

  // Converte i tornei salvati con le prime versioni (punteggio ga/gb senza set).
  function normalize(t) {
    const fix = (m, ko) => {
      if (!m.sets) m.sets = isNum(m.ga) || isNum(m.gb) ? [[m.ga, m.gb]] : [];
      if (m.done === undefined) applyScore(t, m, m.sets, ko);
    };
    t.groupMatches.forEach((m) => fix(m, false));
    if (t.knockout) t.knockout.rounds.forEach((r) => r.matches.forEach((m) => fix(m, true)));
    if (t.settings.scoreFormat === 'set') t.settings.scoreFormat = '1set';
    // Impostazioni aggiunte nelle versioni successive.
    if (t.settings.groupCount === undefined) t.settings.groupCount = 0;
    if (!t.settings.matchMinutes) t.settings.matchMinutes = 30;
    if (!t.settings.startTime) t.settings.startTime = '09:00';
    if (t.settings.sevenAsSix === undefined) {
      // Regola introdotta nella 1.6: ricalcola i game delle partite già giocate.
      t.settings.sevenAsSix = true;
      revalidateScores(t);
    }
    return t;
  }

  // Ricontrolla tutti i punteggi (per esempio dopo aver cambiato il formato delle partite).
  function revalidateScores(t) {
    t.groupMatches.forEach((m) => applyScore(t, m, m.sets, false));
    const ko = t.knockout;
    if (!ko) return;
    ko.rounds.forEach((r) => r.matches.forEach((m) => applyScore(t, m, m.sets, true)));
    const firstOpen = ko.rounds.findIndex((r) => !roundComplete(r));
    if (firstOpen >= 0) ko.rounds.length = firstOpen + 1;
    advanceKnockout(t);
  }

  function isPlayed(m) {
    return !!m.done;
  }

  function hasScore(m) {
    return (m.sets || []).some((s) => isNum(s[0]) || isNum(s[1]));
  }

  function groupHasResults(t, groupId) {
    return t.groupMatches.some((m) => m.groupId === groupId && (isPlayed(m) || hasScore(m)));
  }

  /* ----------------------------------------------------------- CLASSIFICHE */

  // Criteri: partite vinte, game vinti, game persi (meno è meglio), scontro diretto, monetina.
  function groupStandings(t, group) {
    const teamsById = indexTeams(t);
    const matches = t.groupMatches.filter((m) => m.groupId === group.id);
    const rows = group.teamIds.map((id) => ({
      teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gw: 0, gl: 0, coin: teamsById[id] ? teamsById[id].coin : 0, decidedBy: null,
    }));
    const byId = Object.fromEntries(rows.map((r) => [r.teamId, r]));
    for (const m of matches) {
      if (!isPlayed(m)) continue;
      const ra = byId[m.a], rb = byId[m.b];
      ra.played++; rb.played++;
      ra.gw += m.ga; ra.gl += m.gb;
      rb.gw += m.gb; rb.gl += m.ga;
      if (m.win === 'a') { ra.won++; rb.lost++; }
      else if (m.win === 'b') { rb.won++; ra.lost++; }
      else { ra.drawn++; rb.drawn++; }
    }
    const key = (r) => [r.won, r.gw, -r.gl];
    rows.sort((x, y) => cmpKeys(key(y), key(x)));

    // Risolve i gruppi di coppie ancora pari con scontro diretto e poi monetina.
    const out = [];
    let i = 0;
    while (i < rows.length) {
      let j = i + 1;
      while (j < rows.length && cmpKeys(key(rows[i]), key(rows[j])) === 0) j++;
      const tied = rows.slice(i, j);
      // Senza partite giocate resta l'ordine del girone.
      if (tied.length > 1 && tied.some((r) => r.played)) resolveTie(tied, matches);
      out.push(...tied);
      i = j;
    }
    out.forEach((r, idx) => { r.pos = idx + 1; });
    const complete = matches.every(isPlayed);
    return { group, rows: out, complete };
  }

  function resolveTie(tied, matches) {
    const ids = new Set(tied.map((r) => r.teamId));
    const h2h = Object.fromEntries(tied.map((r) => [r.teamId, 0]));
    for (const m of matches) {
      if (!isPlayed(m) || !ids.has(m.a) || !ids.has(m.b)) continue;
      if (m.win === 'a') h2h[m.a]++;
      else if (m.win === 'b') h2h[m.b]++;
    }
    tied.sort((x, y) => (h2h[y.teamId] - h2h[x.teamId]) || (y.coin - x.coin));
    // Segna quale criterio ha deciso la posizione rispetto alla coppia successiva.
    for (let k = 0; k < tied.length - 1; k++) {
      const by = h2h[tied[k].teamId] !== h2h[tied[k + 1].teamId] ? 'scontro diretto' : 'monetina';
      if (!tied[k].decidedBy) tied[k].decidedBy = by;
      if (!tied[k + 1].decidedBy) tied[k + 1].decidedBy = by;
    }
  }

  function cmpKeys(a, b) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return 0;
  }

  // Classifica generale: prima tutte le prime dei gironi, poi le seconde, ecc.
  // Dentro ogni fascia: vinte, game vinti, game persi, monetina (lo scontro diretto non esiste tra gironi diversi).
  function overallRanking(t) {
    const standings = t.groups.map((g) => groupStandings(t, g));
    const maxSize = Math.max(0, ...t.groups.map((g) => g.teamIds.length));
    const avg = t.settings.crossGroup === 'media';
    const val = (r, f) => (avg ? (r.played ? r[f] / r.played : 0) : r[f]);
    const ranking = [];
    for (let pos = 0; pos < maxSize; pos++) {
      const band = standings
        .filter((s) => s.rows[pos])
        .map((s) => ({ ...s.rows[pos], groupName: s.group.name, groupPos: pos + 1 }));
      band.sort((x, y) => cmpKeys([val(y, 'won'), val(y, 'gw'), -val(y, 'gl'), y.coin], [val(x, 'won'), val(x, 'gw'), -val(x, 'gl'), x.coin]));
      ranking.push(...band);
    }
    ranking.forEach((r, i) => { r.rank = i + 1; });
    const complete = standings.every((s) => s.complete);
    return { ranking, complete };
  }

  /* ------------------------------------------------------------- TABELLONE */

  // Piano del tabellone per n coppie: in quale turno entra ogni testa di serie.
  // Sopra le 8 coppie le prime 4 entrano sempre ai quarti; le altre si qualificano
  // nei turni precedenti e le meglio classificate saltano il primo turno se serve.
  // Coppie che passano direttamente e turno in cui entrano (entry = coppie in quel turno:
  // 4 semifinali, 8 quarti, 16 ottavi, 32 sedicesimi). Predefinito: sopra le 8 coppie le prime 4
  // vanno ai quarti; fino a 8 coppie tabellone normale (le migliori saltano il primo turno se servono).
  function bracketConfig(n, direct, entry) {
    const auto = n > 8 ? { direct: 4, entry: 8 } : { direct: 0, entry: 2 };
    let D = direct == null ? auto.direct : Math.max(0, Math.floor(direct));
    if (D === 0 || n < 3) return { direct: 0, entry: 2 };
    let S = 2;
    while (S * 2 <= (entry || auto.entry)) S *= 2;
    while (S > n && S > 2) S /= 2; // servono almeno tante coppie quante ne stanno nel turno
    while (D >= S && S * 2 <= n) S *= 2; // troppe coppie dirette: entrano più presto
    if (D >= S) D = S - 1;
    return { direct: D, entry: S };
  }

  // Turni possibili in cui far entrare `direct` coppie, con n coppie nel tabellone.
  function bracketEntryOptions(n, direct) {
    const out = [];
    for (let S = 4; S <= n; S *= 2) if (direct < S) out.push(S);
    return out;
  }

  // Piano del tabellone per n coppie: in quale turno entra ogni coppia (per posizione in classifica).
  // Le `direct` migliori entrano nel turno da `entry` coppie; le altre si qualificano nei turni
  // precedenti, dove le meglio classificate saltano il primo turno quando serve.
  function bracketPlan(n, direct, entry) {
    if (n < 2) return null;
    const cfg = bracketConfig(n, direct, entry);
    const D = cfg.direct, S = cfg.entry;
    const M = n - D; // coppie che devono qualificarsi
    const Q = S - D; // posti da conquistare nel turno di ingresso
    let P = Q, k = 0;
    while (P < M) { P *= 2; k++; }
    const byes = P - M;
    const entryRound = [];
    for (let i = 0; i < n; i++) {
      if (i < D) entryRound.push(k);
      else entryRound.push(k > 0 && i - D < byes ? 1 : 0);
    }
    return { total: k + Math.log2(S), entry: entryRound, direct: D, entrySize: S };
  }

  function roundName(total, r) {
    const slots = Math.pow(2, total - r);
    return {
      2: 'Finale', 4: 'Semifinali', 8: 'Quarti di finale', 16: 'Ottavi di finale',
      32: 'Sedicesimi di finale', 64: 'Trentaduesimi di finale',
    }[slots] || 'Turno ' + (r + 1);
  }

  function createKnockout(t) {
    const { ranking } = overallRanking(t);
    const limit = t.settings.maxBracket > 0 ? Math.min(t.settings.maxBracket, ranking.length) : ranking.length;
    const seeds = ranking.slice(0, limit).map((r) => r.teamId);
    const plan = bracketPlan(seeds.length, t.settings.bracketDirect, t.settings.bracketEntry);
    if (!plan) throw new Error('Servono almeno 2 coppie per il tabellone.');
    const entry = {};
    seeds.forEach((id, i) => { entry[id] = plan.entry[i]; });
    t.knockout = { seeds, entry, total: plan.total, rounds: [] };
    advanceKnockout(t);
    return t.knockout;
  }

  function matchWinner(m) {
    if (!isPlayed(m)) return null;
    return m.win === 'a' ? m.a : m.win === 'b' ? m.b : null;
  }

  function roundComplete(round) {
    return round.matches.every((m) => matchWinner(m));
  }

  // Coppie che partecipano al turno r: chi entra in quel turno + vincenti del turno precedente.
  function roundParticipants(ko, r) {
    const ids = ko.seeds.filter((id) => ko.entry[id] === r);
    if (r > 0) ids.push(...ko.rounds[r - 1].matches.map(matchWinner));
    return ids;
  }

  // Più forte contro più debole: testa di serie migliore contro la peggiore rimasta.
  function buildRound(t, r) {
    const ko = t.knockout;
    const seedIdx = (id) => ko.seeds.indexOf(id);
    const ids = roundParticipants(ko, r).sort((a, b) => seedIdx(a) - seedIdx(b));
    const matches = [];
    for (let i = 0; i < ids.length / 2; i++) {
      matches.push({
        id: uid('k'), a: ids[i], b: ids[ids.length - 1 - i], sets: [], done: false,
        court: (i % t.courts) + 1,
      });
    }
    return { index: r, name: roundName(ko.total, r), matches };
  }

  // Genera i turni successivi quando quello corrente è completo.
  function advanceKnockout(t) {
    const ko = t.knockout;
    if (!ko) return;
    if (ko.rounds.length === 0) ko.rounds.push(buildRound(t, 0));
    while (ko.rounds.length < ko.total && roundComplete(ko.rounds[ko.rounds.length - 1])) {
      ko.rounds.push(buildRound(t, ko.rounds.length));
    }
  }

  // Aggiorna il risultato di una partita del tabellone. Se cambia il vincitore,
  // i turni successivi vengono ricalcolati. Restituisce true se sono stati cancellati turni.
  function setKnockoutScore(t, matchId, sets) {
    const ko = t.knockout;
    const r = ko.rounds.findIndex((rd) => rd.matches.some((m) => m.id === matchId));
    const m = ko.rounds[r].matches.find((x) => x.id === matchId);
    const before = matchWinner(m);
    applyScore(t, m, sets, true);
    let truncated = false;
    if (matchWinner(m) !== before && ko.rounds.length > r + 1) {
      ko.rounds.length = r + 1;
      truncated = true;
    }
    advanceKnockout(t);
    return truncated;
  }

  function knockoutHasResultsAfter(t, matchId) {
    const ko = t.knockout;
    const r = ko.rounds.findIndex((rd) => rd.matches.some((m) => m.id === matchId));
    return ko.rounds.slice(r + 1).some((rd) => rd.matches.some(isPlayed));
  }

  function champion(t) {
    const ko = t.knockout;
    if (!ko || ko.rounds.length !== ko.total) return null;
    const final = ko.rounds[ko.total - 1];
    return final.matches.length === 1 ? matchWinner(final.matches[0]) : null;
  }

  /* ----------------------------------------------------------- SIMULAZIONE */

  // Simula un torneo: n coppie, campi, numero di gironi (0 = automatico), minuti per partita.
  // I tempi sono in "turni di partita" (slot): ogni campo gioca una partita alla volta.
  // ko: { size (0 = tutte), direct, entry } come in bracketConfig.
  function simulate({ n, courts, groups, minutes, ko }) {
    const sizes = groupSizes(n, courts, groups);
    if (!sizes) return null;
    const lanes = [];
    for (let c = 1; c <= courts; c++) lanes.push({ court: c, blocks: [], load: 0 });
    // Stessa assegnazione dei gironi ai campi usata dal sorteggio: girone i → campo (i % campi).
    sizes.forEach((size, i) => {
      const lane = lanes[i % courts];
      const matches = PAIRINGS[size].length;
      lane.blocks.push({ name: LETTERS[i] || 'G' + (i + 1), size, matches, start: lane.load });
      lane.load += matches;
    });
    const groupSlots = Math.max(...lanes.map((l) => l.load));
    // Attesa più lunga prima della prima partita: il girone che parte per ultimo,
    // più una partita (nel girone c'è sempre una coppia che non gioca la prima).
    const maxWaitSlots = Math.max(...lanes.flatMap((l) => l.blocks.map((b) => b.start + 1)));

    const k = ko || {};
    const nb = k.size > 0 ? Math.min(k.size, n) : n; // coppie nel tabellone
    const plan = bracketPlan(nb, k.direct, k.entry);
    const rounds = [];
    let alive = 0;
    for (let r = 0; plan && r < plan.total; r++) {
      // Chi entra in questo turno (posizioni in classifica, sempre consecutive).
      const ranks = plan.entry.map((e, i) => (e === r ? i + 1 : 0)).filter(Boolean);
      const winners = alive;
      const inRound = winners + ranks.length;
      const matches = inRound / 2;
      rounds.push({
        name: roundName(plan.total, r), matches, slots: Math.ceil(matches / courts),
        enter: ranks.length ? [ranks[0], ranks[ranks.length - 1]] : null, winners,
      });
      alive = matches;
    }
    const koSlots = rounds.reduce((s, r) => s + r.slots, 0);
    const groupMatches = sizes.reduce((s, x) => s + PAIRINGS[x].length, 0);
    return {
      n, courts, minutes, sizes,
      groups: sizes.length,
      lanes,
      idleCourts: lanes.filter((l) => !l.blocks.length).length,
      groupMatches,
      perCouple: { min: sizes.includes(3) ? 2 : 3, max: sizes.includes(4) ? 3 : 2 },
      groupSlots, maxWaitSlots, rounds, koSlots,
      bracket: plan ? { size: nb, direct: plan.direct, entry: plan.entrySize } : null,
      groupMinutes: groupSlots * minutes,
      koMinutes: koSlots * minutes,
      totalMinutes: (groupSlots + koSlots) * minutes,
    };
  }

  // Tutte le divisioni possibili in gironi, per confrontarle.
  function simulateOptions({ n, courts, minutes, ko }) {
    return groupRange(n).map((g) => simulate({ n, courts, groups: g, minutes, ko }));
  }

  function indexTeams(t) {
    return Object.fromEntries(t.teams.map((x) => [x.id, x]));
  }

  return {
    VERSION, VERSION_DATE, LETTERS, newTournament, newTeam, teamName, clampCourts,
    isTeamComplete, isTeamEmpty, defaultTeam, isDefaultName, isTeamPlaceholder, resizeTeams, filledLostOnResize,
    groupSizes, groupRange, tournamentSizes, describeSizes, describeGroups, seedCount, simulate, simulateOptions, tennisOrder, groupSeedRanks, buildGroups, swapTeams, isPlayed, groupHasResults,
    FORMATS, sevenCountsAsSix, isValidSet, isValidSuperTB, evalSets, scoreError, scoreFormat, setCount, applyScore,
    setGroupScore, revalidateScores, normalize, hasScore,
    groupStandings, overallRanking,
    bracketConfig, bracketEntryOptions, bracketPlan, roundName, createKnockout, matchWinner, roundComplete, roundParticipants,
    advanceKnockout, setKnockoutScore, knockoutHasResultsAfter, champion, indexTeams, shuffle,
  };
});
