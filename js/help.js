/*
 * Aiuto contestuale: passando il mouse su una voce compare una spiegazione.
 *
 * Il testo viene cercato, in quest'ordine, con:
 *   data-help="testo"          testo scritto direttamente nell'elemento
 *   data-help-key="chiave"     chiave del dizionario TEXT qui sotto
 *   data-tab, data-action, data-change, name   chiavi automatiche (tab:, action:, change:, field:)
 */
(function (root) {
  'use strict';

  const TEXT = {
    /* --- schede */
    'tab:tornei': 'Crea un nuovo torneo, apri quelli salvati, esporta un torneo in un file di backup o importalo.',
    'tab:coppie': 'Impostazioni del torneo e iscrizione delle coppie. Da qui si creano i gironi.',
    'tab:gironi': 'Classifiche dei gironi e inserimento dei risultati di ogni partita.',
    'tab:classifica': 'Classifica generale di tutte le coppie dopo i gironi. Da qui si genera il tabellone.',
    'tab:tabellone': 'Fase a eliminazione diretta: inserisci i risultati fino alla finale.',

    /* --- tornei */
    'sec-new': 'Crea un torneo nuovo: nome, data e numeri. Tutto si può cambiare anche dopo, nella scheda Coppie.',
    'sec-saved': 'Tornei salvati in questo browser, dal più recente. Il torneo aperto è evidenziato.',
    'field:name': 'Nome del torneo: compare in alto e nell\'elenco dei tornei salvati.',
    'field:date': 'Giorno in cui si gioca il torneo.',
    'field:courts': 'Quanti campi avete a disposizione (da 1 a 20). Ogni girone gioca su un campo; se i gironi sono più dei campi si gioca in più turni.',
    'new-t-submit': 'Crea il torneo e passa all\'inserimento delle coppie.',
    'action:open-t': 'Apre questo torneo per continuare a lavorarci.',
    'action:export-t': 'Scarica il torneo in un file (.json): serve come backup o per spostarlo su un altro telefono o computer.',
    'action:delete-t': 'Cancella definitivamente il torneo da questo browser. Esportalo prima se vuoi tenerne una copia.',
    'change:import': 'Carica un torneo da un file .json esportato in precedenza.',

    /* --- impostazioni e coppie */
    'sec-settings': 'Impostazioni del torneo aperto. Le modifiche vengono salvate subito.',
    'change:t-name': 'Nome del torneo.',
    'change:t-date': 'Giorno in cui si gioca il torneo.',
    'change:t-courts': 'Campi disponibili (da 1 a 20). Se i gironi esistono già, campi e turni vengono riassegnati in automatico.',
    'field:count': 'Quante coppie partecipano. L\'app prepara subito le righe con nomi di default (Giocatore 1A, 1B, ...) da correggere.',
    'change:t-count': 'Quante coppie partecipano. Aumentandolo si aggiungono righe in fondo; diminuendolo si tolgono prima le righe con i nomi di default.',
    'action:add-row': 'Aggiunge una coppia con nomi di default in fondo all\'elenco.',
    'sec-draw': 'Quando tutte le coppie hanno i nomi, scegli come formare i gironi.',
    'action:make-groups': 'Crea i gironi e il calendario delle partite. Rifarli cancella i risultati già inseriti.',
    'draw-random': 'Tutte le coppie vengono mescolate a caso e distribuite nei gironi. Si attiva quando tutte le coppie hanno i nomi.',
    'rank-no': 'Numero di bravura della coppia: la sua posizione nell\'elenco delle coppie (1 = la più forte).',
    'draw-ranked':'Tutte le coppie sono teste di serie, dalla 1 (la più forte, in cima all\'elenco) all\'ultima. Come nel tabellone di tennis: la 1 nel primo girone, la 2 nell\'ultimo, le altre incrociate; le fasce successive si alternano in senso inverso, così i gironi hanno la stessa forza. Nessun sorteggio.',
    'draw-seeded':'Come nei tabelloni di tennis: le teste di serie (le prime dell\'elenco) vanno una per girone, così non si incontrano nei gironi; tutte le altre coppie vengono sorteggiate.',
    'badge-draw': 'Come sono stati formati i gironi: sorteggio casuale, teste di serie oppure tutte in ordine di bravura.',
    'team-num-tds': 'Testa di serie: con il sorteggio a teste di serie finisce in un girone diverso dalle altre teste di serie (la 1ª nel girone A, la 2ª nel B, ...).',
    'change:crossGroup': 'Per la classifica generale. Nei gironi da 3 si giocano 2 partite, in quelli da 4 se ne giocano 3: con "Media per partita giocata" il confronto tra coppie di gironi diversi è più equo.',
    'change:maxBracket': 'Quante coppie entrano nel tabellone, prese dall\'alto della classifica generale. Lascia vuoto per farle entrare tutte.',
    'sec-teams': 'Elenco delle coppie. Le prime dell\'elenco sono le teste di serie: mettile in ordine di forza con le frecce.',
    'badge-teams': 'Coppie con entrambi i nomi inseriti, sul totale.',
    'bulk-summary': 'Apre un riquadro dove incollare molte coppie in una volta, per esempio copiate da WhatsApp.',
    'bulk-text': 'Una coppia per riga. Separa i due giocatori con / oppure , (esempio: Rossi / Bianchi).',
    'action:bulk-add': 'Inserisce le coppie del riquadro sostituendo prima le righe con i nomi di default; se non bastano ne aggiunge in fondo.',
    'team-num': 'Posizione nell\'elenco.',
    'change:team-p1': 'Primo giocatore. In grigio corsivo il nome di default: cliccando si seleziona e basta scrivere. Invio passa al campo successivo.',
    'change:team-p2': 'Secondo giocatore. In grigio corsivo il nome di default: cliccando si seleziona e basta scrivere. Invio passa al campo successivo.',
    'action:team-up': 'Sposta la coppia più in alto nell\'elenco.',
    'action:team-down': 'Sposta la coppia più in basso nell\'elenco.',
    'action:team-del': 'Elimina la coppia. Se i gironi sono già stati creati andranno rifatti.',
    'groups-summary': 'Come verranno divise le coppie: il più possibile in gironi da 4, le rimanenti in gironi da 3.',

    /* --- gironi */
    'badge-matches': 'Partite dei gironi giocate sul totale.',
    'action:toggle-edit': 'Permette di scambiare coppie tra gironi diversi, per esempio per separare due coppie forti.',
    'action:print': 'Stampa la pagina (o salvala in PDF dalla finestra di stampa).',
    'group-title': 'Ogni girone gioca tutte le partite sullo stesso campo: tutti contro tutti.',
    'group-done': 'Tutte le partite di questo girone hanno un risultato.',
    'group-court': 'Campo su cui gioca questo girone, assegnato dal sorteggio. L\'ordine delle partite è nella scheda Calendario.',
    'court-filter': 'Mostra solo i gironi di un campo: utile se sei a bordo di un campo.',
    'action:court-filter': 'Mostra solo i gironi di questo campo.',
    'action:swap-pick': 'Clicca una coppia e poi quella di un altro girone per scambiarle.',
    'tab:calendario': 'Le partite di ogni campo nell\'ordine in cui si giocano, create con il sorteggio. La prossima da giocare è evidenziata.',
    'k-court': 'Campo su cui si gioca questa partita.',
    'change:gscore': 'Game vinti da questa coppia in questo set. Un set finisce 6-0…6-4, 7-5 o 7-6: altri punteggi vengono segnalati in rosso e non contano. Invio passa al campo successivo.',
    'opt-format': 'Come si gioca ogni partita, per gironi e tabellone.',
    'fmt-1set': 'Una partita = un set: 6-0…6-4, 7-5 o 7-6.',
    'fmt-3set': 'Al meglio dei 3 set: vince chi arriva a 2 set.',
    'fmt-3set-stb': 'Due set; sull\'1-1 si gioca un super tie-break a 10 punti al posto del terzo set.',
    'fmt-libero': 'Game liberi, per le partite a tempo: nei gironi è possibile il pareggio.',
    'opt-cross': 'Serve per la classifica generale quando ci sono gironi da 3 e da 4.',
    'cross-assoluto': 'Contano le vittorie e i game totali.',
    'cross-media': 'Vittorie e game divisi per le partite giocate: più equo tra gironi da 3 (2 partite) e da 4 (3 partite).',
    'change:scoreFormat':'Come si gioca ogni partita: un set, al meglio dei 3 set, 2 set + super tie-break a 10, oppure game liberi per le partite a tempo. Vale per gironi e tabellone.',
    'col-set': 'Game del set. Un set finisce 6-0…6-4, 7-5 o 7-6 (tie-break).',
    'col-stb': 'Super tie-break al posto del terzo set: si arriva a 10 punti con almeno 2 di vantaggio (10-8, 11-9, ...). In classifica conta come 1 game.',
    'sets-won': 'Set vinti in questa partita.',
    'th-pos': 'Posizione in classifica.',
    'th-coppia': 'Coppia di giocatori.',
    'th-g': 'Partite giocate.',
    'th-v': 'Partite vinte: è il primo criterio della classifica.',
    'th-n': 'Partite pareggiate (possibili se si gioca a tempo). Un pareggio non conta come vittoria.',
    'th-p': 'Partite perse.',
    'th-gv': 'Game vinti: secondo criterio della classifica, a parità di vittorie.',
    'th-gp': 'Game persi: terzo criterio, meno ne hai persi meglio è.',
    'th-v-media': 'Partite vinte in media per partita giocata (primo criterio).',
    'th-gv-media': 'Game vinti in media per partita giocata (secondo criterio).',
    'th-gp-media': 'Game persi in media per partita giocata (terzo criterio, meno è meglio).',
    'tag-h2h': 'Pari su vittorie, game vinti e game persi: la posizione è decisa dalla partita giocata tra loro.',
    'tag-coin': 'Pari su tutti i criteri, anche lo scontro diretto: la posizione è decisa da un sorteggio automatico.',

    /* --- classifica */
    'sec-ranking': 'Classifica di tutte le coppie: prima tutte le prime dei gironi, poi le seconde, e così via.',
    'band': 'Fascia della classifica generale: contiene le coppie arrivate in questa posizione nel proprio girone.',
    'th-gir': 'Girone in cui ha giocato la coppia.',
    'th-entra': 'Turno del tabellone in cui entra la coppia: le meglio classificate saltano i primi turni.',
    'zone-out': 'Oltre il numero massimo di coppie ammesse al tabellone.',
    'action:make-ko': 'Crea il tabellone dalla classifica generale: la più forte contro la più debole.',
    'action:remake-ko': 'Ricrea il tabellone da zero: i risultati già inseriti nel tabellone vengono cancellati.',

    /* --- tabellone */
    'badge-ko': 'Coppie ammesse al tabellone.',
    'champion': 'Vincitori del torneo!',
    'round-title': 'Turno del tabellone. In ogni turno la coppia meglio classificata affronta la peggiore rimasta.',
    'pending': 'Questo turno si crea da solo quando tutte le partite del turno precedente hanno un vincitore.',
    'seed': 'Posizione della coppia nella classifica generale.',
    'change:kscore': 'Game vinti da questa coppia in questo set. Vince chi vince più set; quando la partita è finita la vincente passa al turno successivo.',

    /* --- simulazione */
    'sec-plan': 'Cambia coppie, campi, minuti e ora di inizio con − e +: gironi e orari si ricalcolano subito.',
    'sim-n': 'Quante coppie partecipano.',
    'sim-courts': 'Quanti campi avete a disposizione.',
    'sim-minutes': 'Quanto dura in media una partita, cambio campo compreso. Un set dura di solito 30-40 minuti, al meglio dei 3 set 60-90.',
    'sim-start': 'A che ora inizia la prima partita.',
    'sec-sim-options': 'Tutti i modi possibili di dividere le coppie in gironi da 3 e da 4. Clicca per sceglierne uno.',
    'action:plan-groups': 'Scegli questa divisione in gironi.',
    'sec-ko-plan': 'Come si gioca il tabellone: quante coppie entrano, quante passano direttamente e in quale turno.',
    'ko-size': 'Quante coppie entrano nel tabellone, prese dall\'alto della classifica generale. Al massimo tutte.',
    'ko-direct': 'Quante coppie, le migliori della classifica, saltano i primi turni ed entrano direttamente più avanti.',
    'ko-entry': 'Il turno in cui entrano le coppie che passano direttamente.',
    'action:plan-entry': 'Le coppie che passano direttamente entrano in questo turno.',
    'rules': 'Testo libero: scrivi qui il regolamento del torneo. Compare in cima al Calendario, anche in stampa.',
    'rules-view': 'Il regolamento scritto nella scheda Coppie.',
    'badge-groups': 'Come sono divise le coppie nei gironi e su quanti campi.',
    'action:plan-step': 'Cambia il valore: gironi e orari si ricalcolano subito.',
    'sec-sim-result': 'Come andrebbe il torneo con i numeri scelti.',
    'kpi-matches': 'Partite totali: gironi più tabellone.',
    'kpi-groups-end': 'Ora in cui finiscono tutti i gironi.',
    'kpi-end': 'Ora in cui finisce la finale, se si rispettano i tempi.',
    'kpi-wait': 'Il tempo più lungo che una coppia aspetta prima della sua prima partita.',
    'sim-lanes': 'Una barra per campo: i gironi che ci giocano, in ordine, con gli orari.',
    'action:goto': 'Vai alla sezione indicata.',
    'manual-groups': 'Il numero di gironi è stato scelto a mano invece di quello consigliato.',
    'cal-time': 'Orario previsto della partita, calcolato con l\'ora di inizio e la durata delle partite.',
    'cal-times': 'Ora di inizio e durata delle partite usate per gli orari. Si cambiano nella scheda Coppie.',

    /* --- impostazioni */
    'tab:impostazioni': 'Tema dei colori, dimensione del testo e aiuto. Valgono solo per questo dispositivo.',
    'sec-theme': 'Scegli i colori dell\'app. Il cambio è immediato e non modifica i tornei.',
    'sec-size': 'Ingrandisce tutto il testo dell\'app, compresi i punteggi.',
    'action:set-size': 'Imposta questa dimensione del testo.',
    'sec-help': 'Attiva o disattiva queste spiegazioni al passaggio del mouse.',
    'change:help-toggle': 'Attiva o disattiva le spiegazioni al passaggio del mouse.',
    'sec-info': 'Dati sull\'app in questo browser.',
  };

  const tip = document.createElement('div');
  tip.id = 'help-tip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  let anchor = null;
  let timer = null;

  function helpFor(target) {
    if (!root.PadelHelp.enabled) return null;
    let el = target.closest('[data-help],[data-help-key],[data-tab],[data-action],[data-change],[name],label');
    if (!el) return null;
    if (el.tagName === 'LABEL' && !el.dataset.help && !el.dataset.helpKey) {
      el = el.querySelector('input,select,textarea');
      if (!el) return null;
    }
    if (el.dataset.help) return { el, text: el.dataset.help };
    const keys = [
      el.dataset.helpKey,
      el.dataset.tab && 'tab:' + el.dataset.tab,
      el.dataset.action && 'action:' + el.dataset.action,
      el.dataset.change && 'change:' + el.dataset.change,
      el.name && 'field:' + el.name,
    ];
    for (const k of keys) {
      if (k && TEXT[k]) {
        const off = el.disabled && el.closest('.tabs') ? ' (Crea o apri prima un torneo.)' : '';
        return { el, text: TEXT[k] + off };
      }
    }
    return null;
  }

  function show(el, text) {
    tip.textContent = text;
    tip.className = 'show';
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight, m = 8;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(m, Math.min(left, window.innerWidth - w - m));
    let top = r.bottom + m;
    if (top + h > window.innerHeight - m) top = r.top - h - m;
    tip.style.left = left + 'px';
    tip.style.top = Math.max(m, top) + 'px';
  }

  function hide() {
    clearTimeout(timer);
    anchor = null;
    tip.className = '';
  }

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const h = helpFor(e.target);
    if (h && h.el === anchor) return;
    hide();
    if (!h) return;
    anchor = h.el;
    timer = setTimeout(() => { if (anchor === h.el && h.el.isConnected) show(h.el, h.text); }, 350);
  });
  document.documentElement.addEventListener('mouseleave', hide);
  document.addEventListener('pointerdown', hide);
  document.addEventListener('keydown', hide);
  window.addEventListener('scroll', hide, true);

  root.PadelHelp = { TEXT, hide, helpFor, enabled: true };
})(typeof self !== 'undefined' ? self : this);
