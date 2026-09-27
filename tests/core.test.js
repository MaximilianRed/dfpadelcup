// Test della logica del torneo. Esegui con: node tests/core.test.js
const assert = require('assert');
const C = require('../js/core.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok  ', name); }
  catch (e) { console.error('FAIL', name, '\n     ', e.message); process.exitCode = 1; }
}

function makeTournament(nTeams, courts = 4) {
  const t = C.newTournament({ name: 'Test', courts });
  for (let i = 1; i <= nTeams; i++) t.teams.push(C.newTeam('A' + i, 'B' + i));
  return t;
}

// Gioca tutte le partite dei gironi: vince sempre la coppia iscritta prima (6-2).
function playGroups(t) {
  const order = (id) => t.teams.findIndex((x) => x.id === id);
  for (const m of t.groupMatches) {
    C.setGroupScore(t, m.id, order(m.a) < order(m.b) ? [[6, 2]] : [[2, 6]]);
  }
}

// Inserisce il risultato della partita tra x e y, con i set visti dalla parte di x.
function score(t, x, y, ...sets) {
  const m = t.groupMatches.find((m) => (m.a === x && m.b === y) || (m.a === y && m.b === x));
  C.setGroupScore(t, m.id, m.a === x ? sets : sets.map(([p, q]) => [q, p]));
  return m;
}

test('dimensioni gironi', () => {
  assert.deepStrictEqual(C.groupSizes(16), [4, 4, 4, 4]);
  assert.deepStrictEqual(C.groupSizes(14), [4, 4, 3, 3]);
  assert.deepStrictEqual(C.groupSizes(9), [3, 3, 3]);
  assert.deepStrictEqual(C.groupSizes(6), [3, 3]);
  assert.deepStrictEqual(C.groupSizes(7), [4, 3]);
  assert.strictEqual(C.groupSizes(5), null);
  assert.strictEqual(C.groupSizes(2), null);
  for (let n = 6; n <= 80; n++) {
    const s = C.groupSizes(n);
    assert.strictEqual(s.reduce((a, b) => a + b, 0), n);
    assert.ok(s.every((x) => x === 3 || x === 4));
  }
});

test('gironi secondo i campi: pochi campi → da 4, tanti campi → da 3', () => {
  assert.deepStrictEqual(C.groupSizes(12, 3), [4, 4, 4]);
  assert.deepStrictEqual(C.groupSizes(12, 4), [3, 3, 3, 3]);
  assert.deepStrictEqual(C.groupSizes(12, 1), [4, 4, 4]);
  assert.deepStrictEqual(C.groupSizes(18, 6), [3, 3, 3, 3, 3, 3]);
  assert.deepStrictEqual(C.groupSizes(18, 4), [4, 4, 4, 3, 3]); // minimo 5 gironi
  assert.deepStrictEqual(C.groupSizes(16, 2), [4, 4, 4, 4]);
  // 5 gironi finirebbero alla stessa ora di 4 gironi da 4: meglio più partite per tutti.
  assert.deepStrictEqual(C.groupSizes(16, 5), [4, 4, 4, 4]);
  assert.deepStrictEqual(C.groupSizes(16, 20), [4, 4, 4, 4]);
  assert.deepStrictEqual(C.groupSizes(15, 5), [3, 3, 3, 3, 3]); // 5 da 3 finiscono prima di 3 da 4 + 1 da 3
  for (let n = 6; n <= 60; n++) {
    for (let c = 1; c <= 20; c++) {
      const s = C.groupSizes(n, c);
      assert.strictEqual(s.reduce((a, b) => a + b, 0), n, `n=${n} c=${c}`);
      assert.ok(s.every((x) => x === 3 || x === 4), `n=${n} c=${c}`);
      // Se i gironi sono più dei campi, sono il minimo possibile (tutti da 4 o quasi).
      if (s.length > c) assert.strictEqual(s.length, Math.ceil(n / 4), `n=${n} c=${c}`);
    }
  }
});

test('numero di gironi scelto a mano', () => {
  assert.deepStrictEqual(C.groupRange(16), [4, 5]);
  assert.deepStrictEqual(C.groupRange(12), [3, 4]);
  assert.deepStrictEqual(C.groupSizes(12, 4, 3), [4, 4, 4]); // scelta: 3 gironi anche con 4 campi
  assert.deepStrictEqual(C.groupSizes(12, 1, 4), [3, 3, 3, 3]);
  assert.deepStrictEqual(C.groupSizes(12, 4, 9), [3, 3, 3, 3]); // oltre il massimo: limitato
  const t = makeTournament(12);
  t.settings.groupCount = 3;
  C.buildGroups(t);
  assert.strictEqual(t.groups.length, 3);
});

test('simulazione: campi, attese e durata', () => {
  // 12 coppie, 4 campi, 4 gironi da 3: tutti in campo insieme, 3 partite per campo.
  let s = C.simulate({ n: 12, courts: 4, groups: 4, minutes: 30 });
  assert.strictEqual(s.groupSlots, 3);
  assert.strictEqual(s.idleCourts, 0);
  assert.deepStrictEqual(s.perCouple, { min: 2, max: 2 });
  assert.strictEqual(s.groupMatches, 12);
  // Tabellone di 12: ottavi (4 partite) quarti (4) semifinali (2) finale (1) su 4 campi = 4 turni.
  assert.deepStrictEqual(s.rounds.map((r) => [r.matches, r.slots]), [[4, 1], [4, 1], [2, 1], [1, 1]]);
  assert.strictEqual(s.totalMinutes, (3 + 4) * 30);
  // 3 gironi da 4 sugli stessi 4 campi: un campo libero e 6 partite per campo.
  s = C.simulate({ n: 12, courts: 4, groups: 3, minutes: 30 });
  assert.strictEqual(s.idleCourts, 1);
  assert.strictEqual(s.groupSlots, 6);
  // 16 coppie su 2 campi: 2 gironi per campo, il secondo aspetta 6 partite (+1).
  s = C.simulate({ n: 16, courts: 2, groups: 0, minutes: 30 });
  assert.deepStrictEqual(s.lanes.map((l) => l.blocks.map((b) => b.start)), [[0, 6], [0, 6]]);
  assert.strictEqual(s.maxWaitSlots, 7);
  assert.strictEqual(C.simulateOptions({ n: 16, courts: 4, minutes: 30 }).length, 2);
  assert.strictEqual(C.simulate({ n: 5, courts: 2, minutes: 30 }), null);
});

test('teste di serie: la 1ª nel girone A, la 2ª nel B, ...', () => {
  for (const n of [9, 14, 16, 22]) {
    const t = makeTournament(n);
    C.buildGroups(t);
    const G = C.seedCount(n, t.courts);
    const seeds = t.teams.slice(0, G).map((x) => t.groups.findIndex((g) => g.teamIds.includes(x.id)));
    assert.deepStrictEqual(seeds, [...Array(G).keys()], `n=${n}`);
    // Ogni girone ha esattamente una testa di serie, in prima posizione.
    t.groups.forEach((g, i) => assert.strictEqual(g.teamIds[0], t.teams[i].id));
    assert.strictEqual(t.groups.flatMap((g) => g.teamIds).length, n);
  }
});

test('teste di serie: le altre coppie sono sorteggiate', () => {
  const t = makeTournament(16);
  let seed = 1;
  const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const layouts = new Set();
  for (let k = 0; k < 5; k++) {
    C.buildGroups(t, rng);
    layouts.add(t.groups.map((g) => g.teamIds.join()).join('|'));
  }
  assert.ok(layouts.size > 1);
});

test('ordine del tabellone di tennis', () => {
  assert.deepStrictEqual(C.tennisOrder(4), [1, 4, 3, 2]);
  assert.deepStrictEqual(C.tennisOrder(8), [1, 8, 5, 4, 3, 6, 7, 2]);
});

test('ordine di bravura: 16 coppie come nel tennis, gironi equilibrati', () => {
  const t = makeTournament(16);
  t.settings.drawMode = 'ordine';
  C.buildGroups(t);
  const seed = (id) => t.teams.findIndex((x) => x.id === id) + 1;
  const layout = t.groups.map((g) => g.teamIds.map(seed));
  assert.deepStrictEqual(layout, [[1, 8, 9, 16], [4, 5, 12, 13], [3, 6, 11, 14], [2, 7, 10, 15]]);
  layout.forEach((g) => assert.strictEqual(g.reduce((a, b) => a + b, 0), 34));
  // Sempre uguale: non c'è sorteggio.
  C.buildGroups(t);
  assert.deepStrictEqual(t.groups.map((g) => g.teamIds.map(seed)), layout);
});

test('ordine di bravura: 1 in alto, 2 in basso, tutte assegnate', () => {
  for (let n = 3; n <= 40; n++) {
    if (!C.groupSizes(n)) continue;
    const t = makeTournament(n);
    t.settings.drawMode = 'ordine';
    C.buildGroups(t);
    const seed = (id) => t.teams.findIndex((x) => x.id === id) + 1;
    assert.strictEqual(seed(t.groups[0].teamIds[0]), 1, `n=${n}`);
    if (t.groups.length > 1) assert.strictEqual(seed(t.groups[t.groups.length - 1].teamIds[0]), 2, `n=${n}`);
    assert.strictEqual(new Set(t.groups.flatMap((g) => g.teamIds)).size, n, `n=${n}`);
    t.groups.forEach((g, i) => assert.strictEqual(g.teamIds.length, C.groupSizes(n, t.courts)[i]));
  }
});

test('sorteggio casuale: tutte le coppie assegnate', () => {
  const t = makeTournament(14);
  t.settings.drawMode = 'casuale';
  C.buildGroups(t);
  assert.strictEqual(new Set(t.groups.flatMap((g) => g.teamIds)).size, 14);
  assert.strictEqual(t.groupMatches.length, 6 + 6 + 3 + 3);
});

test('numero di coppie: nomi di default e ridimensionamento', () => {
  const t = C.newTournament({ name: 'x', count: 6 });
  assert.strictEqual(t.teams.length, 6);
  assert.deepStrictEqual([t.teams[2].p1, t.teams[2].p2], ['Giocatore 3A', 'Giocatore 3B']);
  // Con i nomi di default le coppie sono già complete: i gironi si possono creare subito.
  assert.ok(t.teams.every(C.isTeamComplete));
  assert.ok(t.teams.every(C.isTeamPlaceholder));
  assert.ok(!C.isDefaultName('Giocatore Rossi'));
  t.teams[0].p1 = 'A'; t.teams[0].p2 = 'B';
  t.teams[5].p1 = 'C'; t.teams[5].p2 = 'D';
  // Scendendo a 3 si tolgono prima le righe con i nomi di default: le due coppie vere restano.
  assert.strictEqual(C.filledLostOnResize(t, 3), 0);
  C.resizeTeams(t, 3);
  assert.strictEqual(t.teams.length, 3);
  assert.strictEqual(t.teams.filter((x) => !C.isTeamPlaceholder(x)).length, 2);
  // Scendendo a 1 si perde una coppia compilata.
  assert.strictEqual(C.filledLostOnResize(t, 1), 1);
  C.resizeTeams(t, 8);
  assert.strictEqual(t.teams.length, 8);
  assert.strictEqual(t.teams[7].p1, 'Giocatore 8A');
});

test('campi e turni quando i gironi superano i campi', () => {
  const t = makeTournament(24, 4);
  C.buildGroups(t);
  assert.deepStrictEqual(t.groups.map((g) => [g.court, g.turn]), [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2]]);
});

test('classifica girone: vinte > game vinti > game persi', () => {
  const t = makeTournament(4);
  C.buildGroups(t);
  const [a, b, c, d] = t.groups[0].teamIds;
  score(t, a, b, [6, 4]); score(t, c, d, [6, 1]); score(t, a, c, [7, 5]);
  score(t, b, d, [6, 0]); score(t, a, d, [2, 6]); score(t, b, c, [6, 3]);
  // a: 2V gw15 ; b: 2V gw16 ; c: 1V ; d: 1V
  const s = C.groupStandings(t, t.groups[0]);
  assert.deepStrictEqual(s.rows.map((r) => r.teamId).slice(0, 2), [b, a]);
  assert.ok(s.complete);
});

test('classifica girone: scontro diretto', () => {
  const t = makeTournament(4);
  t.settings.scoreFormat = 'libero';
  C.buildGroups(t);
  const [a, b, c, d] = t.groups[0].teamIds;
  // a e b: 2 vinte, 16 game vinti, 13 persi. a ha battuto b.
  score(t, a, b, [6, 5]); score(t, a, c, [6, 2]); score(t, a, d, [4, 6]);
  score(t, b, c, [6, 3]); score(t, b, d, [5, 4]); score(t, c, d, [6, 0]);
  const s = C.groupStandings(t, t.groups[0]);
  assert.deepStrictEqual(s.rows.slice(0, 2).map((r) => r.teamId), [a, b]);
  assert.strictEqual(s.rows[0].decidedBy, 'scontro diretto');
});

test('classifica girone: cerchio perfetto -> monetina', () => {
  const t = makeTournament(3);
  C.buildGroups(t);
  const [a, b, c] = t.groups[0].teamIds;
  score(t, b, a, [6, 4]); score(t, a, c, [6, 4]); score(t, c, b, [6, 4]);
  // Tutti a 1 vittoria, 10 game vinti, 10 persi: cerchio perfetto -> monetina
  const s = C.groupStandings(t, t.groups[0]);
  assert.ok(s.rows.every((r) => r.decidedBy === 'monetina'));
});

test('piano tabellone: 12 coppie -> 1-4 quarti, 5-12 ottavi', () => {
  const p = C.bracketPlan(12);
  assert.strictEqual(p.total, 4);
  assert.deepStrictEqual(p.entry, [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('piano tabellone: 16 coppie -> 1-4 quarti, 5-8 ottavi, 9-16 sedicesimi', () => {
  const p = C.bracketPlan(16);
  assert.strictEqual(p.total, 5);
  assert.deepStrictEqual(p.entry, [2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('piano tabellone: ogni turno ha un numero pari di coppie', () => {
  for (let n = 2; n <= 80; n++) {
    const p = C.bracketPlan(n);
    let alive = 0;
    for (let r = 0; r < p.total; r++) {
      const inRound = alive + p.entry.filter((e) => e === r).length;
      assert.ok(inRound % 2 === 0 && inRound >= 2, `n=${n} turno ${r}: ${inRound}`);
      alive = inRound / 2;
    }
    assert.strictEqual(alive, 1, `n=${n}`);
    if (n > 8) assert.deepStrictEqual(p.entry.slice(0, 4), Array(4).fill(p.total - 3));
  }
});

test('ottavi con 12 coppie: 5-12, 6-11, 7-10, 8-9', () => {
  const t = makeTournament(12);
  C.buildGroups(t);
  playGroups(t);
  C.createKnockout(t);
  const ko = t.knockout;
  const rank = (id) => ko.seeds.indexOf(id) + 1;
  assert.strictEqual(ko.rounds[0].name, 'Ottavi di finale');
  assert.deepStrictEqual(ko.rounds[0].matches.map((m) => [rank(m.a), rank(m.b)]), [[5, 12], [6, 11], [7, 10], [8, 9]]);
});

test('quarti: forte contro debole con i vincenti reali', () => {
  const t = makeTournament(12);
  C.buildGroups(t);
  playGroups(t);
  C.createKnockout(t);
  const ko = t.knockout;
  const rank = (id) => ko.seeds.indexOf(id) + 1;
  // Vincono: 12 (sorpresa), 6, 10 (sorpresa), 8
  const winners = { 0: 'b', 1: 'a', 2: 'b', 3: 'a' };
  ko.rounds[0].matches.forEach((m, i) => {
    C.setKnockoutScore(t, m.id, [winners[i] === 'a' ? [6, 3] : [3, 6]]);
  });
  assert.strictEqual(ko.rounds.length, 2);
  assert.strictEqual(ko.rounds[1].name, 'Quarti di finale');
  // In gioco: 1,2,3,4,6,8,10,12 -> 1-12, 2-10, 3-8, 4-6
  assert.deepStrictEqual(ko.rounds[1].matches.map((m) => [rank(m.a), rank(m.b)]), [[1, 12], [2, 10], [3, 8], [4, 6]]);
});

test('torneo completo fino al vincitore e modifica di un risultato', () => {
  const t = makeTournament(20);
  C.buildGroups(t);
  playGroups(t);
  C.createKnockout(t);
  const ko = t.knockout;
  let guard = 0;
  while (!C.champion(t) && guard++ < 20) {
    const r = ko.rounds[ko.rounds.length - 1];
    for (const m of r.matches) if (!C.matchWinner(m)) C.setKnockoutScore(t, m.id, [[6, 4]]);
  }
  assert.ok(C.champion(t));
  assert.strictEqual(ko.rounds[ko.rounds.length - 1].name, 'Finale');
  // Cambio il vincitore di una partita del primo turno: i turni successivi vengono ricalcolati.
  const m0 = ko.rounds[0].matches[0];
  const truncated = C.setKnockoutScore(t, m0.id, [[2, 6]]);
  assert.ok(truncated);
  assert.strictEqual(ko.rounds.length, 2);
  assert.strictEqual(C.champion(t), null);
});

test('pareggio nel tabellone non fa avanzare', () => {
  const t = makeTournament(8);
  C.buildGroups(t);
  playGroups(t);
  C.createKnockout(t);
  const m = t.knockout.rounds[0].matches[0];
  C.setKnockoutScore(t, m.id, [[5, 5]]);
  assert.strictEqual(C.matchWinner(m), null);
});

test('classifica generale: prima tutte le prime dei gironi', () => {
  const t = makeTournament(14);
  C.buildGroups(t);
  playGroups(t);
  const { ranking, complete } = C.overallRanking(t);
  assert.ok(complete);
  assert.deepStrictEqual(ranking.map((r) => r.groupPos), [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4]);
});

test('set tennistico: punteggi validi e non validi', () => {
  const ok = [[6, 0], [6, 4], [4, 6], [7, 5], [5, 7], [7, 6], [6, 7]];
  const ko = [[6, 5], [5, 5], [6, 6], [8, 6], [4, 3], [7, 4], [7, 7], [0, 0], [3, 6.5]];
  ok.forEach(([a, b]) => assert.ok(C.isValidSet(a, b), `${a}-${b} dovrebbe essere valido`));
  ko.forEach(([a, b]) => assert.ok(!C.isValidSet(a, b), `${a}-${b} non dovrebbe essere valido`));
});

test('set non valido: resta visibile ma non conta', () => {
  const t = makeTournament(4);
  C.buildGroups(t);
  const m = t.groupMatches[0];
  C.setGroupScore(t, m.id, [[6, 5]]);
  assert.deepStrictEqual(m.sets, [[6, 5]]);
  assert.ok(m.bad && !C.isPlayed(m));
  assert.ok(C.scoreError(t, [[6, 5]]));
  assert.strictEqual(C.groupStandings(t, t.groups[0]).rows.reduce((s, r) => s + r.played, 0), 0);
  C.setGroupScore(t, m.id, [[7, 5]]);
  assert.ok(C.isPlayed(m));
  // Punteggio a metà (manca un numero): nessun errore, ma non ancora giocata.
  C.setGroupScore(t, m.id, [[6, null]]);
  assert.ok(!m.bad && !C.isPlayed(m));
});

test('al meglio dei 3 set', () => {
  const t = makeTournament(4);
  t.settings.scoreFormat = '3set';
  C.buildGroups(t);
  const [a, b, c, d] = t.groups[0].teamIds;
  // Vince chi fa più set, anche con meno game: a vince 0-6 7-5 7-6 (14 game a 17).
  let m = score(t, a, b, [0, 6], [7, 5], [7, 6]);
  assert.ok(C.isPlayed(m));
  assert.strictEqual(C.matchWinner(m), a);
  // 2-0: partita finita dopo due set.
  m = score(t, c, d, [6, 2], [6, 3]);
  assert.strictEqual(C.matchWinner(m), c);
  // 1-1: serve il terzo set.
  m = score(t, a, c, [6, 2], [3, 6]);
  assert.ok(!C.isPlayed(m) && !m.bad);
  // Terzo set inserito dopo un 2-0: errore.
  m = score(t, a, d, [6, 2], [6, 3], [6, 1]);
  assert.ok(m.bad && /non serve/.test(m.err));
  // Secondo set non valido.
  m = score(t, b, c, [6, 2], [6, 5]);
  assert.ok(m.bad && /2° set/.test(m.err));
  // Game: a ha fatto 14 game, b 17.
  const rows = C.groupStandings(t, t.groups[0]).rows;
  const ra = rows.find((r) => r.teamId === a), rb = rows.find((r) => r.teamId === b);
  assert.deepStrictEqual([ra.won, ra.gw, ra.gl, rb.gw], [1, 14, 17, 17]);
});

test('2 set + super tie-break', () => {
  const ok = [[10, 8], [10, 0], [8, 10], [11, 9], [12, 10], [15, 13]];
  const ko = [[10, 9], [9, 7], [11, 8], [12, 9], [10, 10]];
  ok.forEach(([a, b]) => assert.ok(C.isValidSuperTB(a, b), `${a}-${b}`));
  ko.forEach(([a, b]) => assert.ok(!C.isValidSuperTB(a, b), `${a}-${b}`));
  const t = makeTournament(4);
  t.settings.scoreFormat = '3set-stb';
  C.buildGroups(t);
  const [a, b] = t.groups[0].teamIds;
  const m = score(t, a, b, [6, 4], [3, 6], [10, 7]);
  assert.strictEqual(C.matchWinner(m), a);
  // Il super tie-break conta come un game: 6+3+1 = 10 game per a, 4+6 = 10 per b.
  assert.deepStrictEqual([m.a === a ? m.ga : m.gb, m.a === a ? m.gb : m.ga], [10, 10]);
  // Un 6-4 al posto del super tie-break non è valido.
  score(t, a, b, [6, 4], [3, 6], [6, 4]);
  assert.ok(m.bad && /Super tie-break/.test(m.err));
});

test('game liberi: 6-5 va bene nei gironi, il pareggio no nel tabellone', () => {
  const t = makeTournament(8);
  t.settings.scoreFormat = 'libero';
  C.buildGroups(t);
  C.setGroupScore(t, t.groupMatches[0].id, [[6, 5]]);
  assert.ok(C.isPlayed(t.groupMatches[0]));
  C.setGroupScore(t, t.groupMatches[1].id, [[5, 5]]);
  assert.ok(C.isPlayed(t.groupMatches[1]));
  playGroups(t);
  C.createKnockout(t);
  const km = t.knockout.rounds[0].matches[0];
  C.setKnockoutScore(t, km.id, [[4, 4]]);
  assert.strictEqual(C.matchWinner(km), null);
  // Tornando al set tennistico il 6-5 dei gironi diventa non valido.
  C.setGroupScore(t, t.groupMatches[0].id, [[6, 5]]);
  t.settings.scoreFormat = '1set';
  C.revalidateScores(t);
  assert.ok(t.groupMatches[0].bad);
});

test('tornei delle versioni precedenti (punteggio senza set)', () => {
  const t = makeTournament(4);
  t.settings.scoreFormat = 'set';
  C.buildGroups(t);
  t.groupMatches.forEach((m) => { delete m.sets; delete m.done; m.ga = 6; m.gb = 3; });
  C.normalize(t);
  assert.strictEqual(t.settings.scoreFormat, '1set');
  assert.ok(t.groupMatches.every((m) => C.isPlayed(m) && m.sets.length === 1));
});

test('scambio coppie tra gironi', () => {
  const t = makeTournament(8);
  C.buildGroups(t);
  const a = t.groups[0].teamIds[0], b = t.groups[1].teamIds[0];
  C.swapTeams(t, a, b);
  assert.ok(t.groups[0].teamIds.includes(b) && t.groups[1].teamIds.includes(a));
  assert.strictEqual(t.groupMatches.length, 12);
});

console.log(`\n${passed} test superati`);
