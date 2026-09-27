# DF Padel Cup

Web app per organizzare tornei di padel: gironi da 3 o 4 coppie, classifica generale e tabellone a eliminazione diretta.

## Come si usa

1. **Tornei → Nuovo torneo**: nome e data, poi con − e + coppie, campi, minuti a partita e ora di inizio.
   Subito sotto compaiono la **scelta dei gironi** (tutte le divisioni possibili a confronto, con quella
   consigliata) e i **tempi**: occupazione dei campi, fine gironi, fine torneo, attese, orari del tabellone.
   *Crea torneo* prepara le righe con nomi di default (Giocatore 1A / Giocatore 1B, ...), così i gironi si
   possono creare subito e i nomi correggere dopo. Numeri e tempi si cambiano anche dopo, nella scheda Coppie.
   Nella parte *Tabellone* si decide quante coppie entrano, quante passano direttamente e in quale turno
   (semifinali, quarti, ottavi, sedicesimi); per ogni turno è scritto chi ci entra.
   Nella scheda Coppie c'è anche il **regolamento** a testo libero, che compare in cima al Calendario.
2. **Coppie**: scrivi i nomi (Invio passa al campo successivo) oppure incolla un elenco (`Rossi / Bianchi`, una per riga).
   Quando tutte le coppie sono complete scegli come formare i gironi:
   - **Sorteggio casuale**: tutte le coppie sorteggiate;
   - **Con teste di serie**: le prime coppie dell'elenco (una per girone) vanno la 1ª nel girone A,
     la 2ª nel B, ecc.; tutte le altre vengono sorteggiate;
   - **In ordine di bravura**: tutte le coppie sono teste di serie (1 = la più forte). Come nel tabellone
     di tennis la 1 va nel primo girone, la 2 nell'ultimo, le altre incrociate; le fasce successive
     si alternano in senso inverso, così i gironi hanno la stessa forza (16 coppie: A 1-8-9-16, B 4-5-12-13,
     C 3-6-11-14, D 2-7-10-15).
3. **Calendario**: si crea da solo con il sorteggio. Per ogni campo mostra le partite nell'ordine in cui
   si giocano, con l'orario previsto; la prossima da giocare è evidenziata.
4. **Gironi**: inserisci i game di ogni partita (Invio passa al campo successivo). Si può filtrare per campo.
   Con *Modifica composizione* si scambiano due coppie cliccandole una dopo l'altra.
5. **Classifica**: quando i gironi sono conclusi, premi *Genera il tabellone*.
6. **Tabellone**: *Tabellone completo* mostra tutto il tabellone, dal primo turno alla finale (con i posti ancora
   da definire), da ingrandire con − / + o «Adatta». Si stampa in orizzontale su **1 pagina** o **su più fogli**
   (stampante o «Salva come PDF») e si **condivide** come immagine orizzontale (WhatsApp dal telefono).
   In *Inserisci risultati* si segnano i punteggi; i turni successivi si creano da soli.

In **Impostazioni** si scelgono il tema (Padel, Padel notte, Campo verde, Classico o Automatico),
la dimensione del testo e se mostrare l'aiuto. Valgono solo per il dispositivo in uso.

Passando il mouse su qualsiasi voce (pulsanti, campi, intestazioni delle tabelle, etichette) compare una spiegazione.

## Regole

- **Punteggio**: si segnano i game di ogni set, come nel tennis. Formati (in *Regole e dati del torneo*):
  - **Un set** (predefinito): 6-0…6-4, 7-5 o 7-6;
  - **Al meglio dei 3 set**: vince chi fa 2 set; il 3° si gioca solo sull'1-1;
  - **2 set + super tie-break**: sull'1-1 si gioca un tie-break a 10 (almeno 2 punti di vantaggio);
  - **Game liberi**: per le partite a tempo (pareggio possibile nei gironi, non nel tabellone).

  I punteggi non validi (es. 6-5) vengono segnati in rosso e non contano finché non si correggono.
  **Conteggio dei game** (predefinito, modificabile): in classifica il 7 conta come 6, cioè 7-6 vale 6-6
  (la vittoria va a chi vince il tie-break) e 7-5 vale 6-5.
  La partita la vince chi vince più set; i "game vinti" in classifica sono la somma dei game di tutti i set
  (il super tie-break conta come 1 game).

- **Gironi**: da 3 o da 4 coppie, un girone per campo quando si può: con pochi campi gironi da 4,
  con tanti campi gironi da 3, ma solo se così il torneo finisce prima (a parità di orario si preferiscono
  gironi da 4, con più partite per tutti). Se i gironi sono più dei campi, alcuni giocano dopo.
  Nella scelta dei gironi si può prendere a mano un'altra divisione.
  Non si possono fare con 1, 2 o 5 coppie.
- **Classifica del girone**: partite vinte → game vinti → game persi (meno è meglio) → scontro diretto → monetina.
- **Classifica generale**: prima tutte le prime dei gironi, poi le seconde, ecc.; dentro ogni fascia
  partite vinte → game vinti → game persi → monetina. Nelle impostazioni si può usare la media per partita,
  più equa se ci sono gironi da 3 e da 4.
- **Tabellone** (predefinito, modificabile): le prime 4 entrano ai quarti. Le altre si qualificano nei turni precedenti; se servono
  turni con numeri dispari, le meglio classificate saltano il primo turno. In ogni turno la coppia meglio
  classificata affronta la peggiore rimasta. Non sono ammessi pareggi.

| Coppie | Sedicesimi | Ottavi | Quarti |
|---|---|---|---|
| 8  | – | – | 1–8 |
| 12 | – | 5–12 | 1–4 + 4 vincenti |
| 16 | 9–16 | 5–8 + 4 vincenti | 1–4 + 4 vincenti |
| 20 | 5–20 | 8 vincenti | 1–4 + 4 vincenti |

## Dati

I tornei sono salvati nel browser del dispositivo. Usa **Esporta** per fare un backup o spostare un torneo
su un altro dispositivo, e **Importa** per ricaricarlo.

## Per sviluppatori

- `js/core.js`: regole del torneo (logica pura, testabile con Node)
- `js/storage.js`: salvataggio (da sostituire con le API REST di WordPress nella versione online)
- `js/app.js`: interfaccia
- `js/help.js`: testi dell'aiuto al passaggio del mouse (dizionario `TEXT`)
- Test: `node tests/core.test.js`
- In locale: `python -m http.server 8765` e apri http://localhost:8765
  (funziona anche aprendo direttamente `index.html`)

## Versioni

La versione e la data dell'aggiornamento sono scritte nella testata dell'app e in *Impostazioni → Informazioni*
(si cambiano in `js/core.js`, costanti `VERSION` e `VERSION_DATE`). A ogni nuova versione aggiorna anche `?v=...` negli indirizzi
dei file in `index.html`: così i browser scaricano subito i file nuovi invece di usare quelli vecchi in memoria
(un test controlla che le due versioni coincidano).

- **1.6.1** (27/09/2026) — Data dell'aggiornamento accanto al numero di versione.
- **1.6.0** — Regole del punteggio scritte per esteso e modificabili (Impostazioni e scheda Coppie);
  regola "il 7 conta come 6" (7-6 → 6-6, 7-5 → 6-5).
- **1.5.0** — Tabellone completo con zoom, stampa orizzontale su 1 pagina o più fogli, condivisione come
  immagine; grafiche di racchette e palline; nel pianificatore le fasce dei gironi ("le prime dei gironi").
- **1.4.0** — Tabellone configurabile (coppie ammesse, coppie dirette, turno di ingresso) con chi entra in
  ogni turno; regolamento a testo libero; descrizioni complete dei gironi ("4 gironi da 4 coppie su 4 campi").
- **1.3.0** — La simulazione è il modo di creare il torneo: numeri, scelta dei gironi e tempi subito
  in *Nuovo torneo* e nella scheda Coppie; tolta la scheda Simula.
- **1.2.0** — Simulazione in tempo reale (coppie, campi, gironi, orari); orari previsti nel calendario;
  numero di versione visibile.
- **1.1.0** — Calendario automatico; sorteggio "in ordine di bravura"; gironi adattati ai campi;
  niente menu a tendina.
- **1.0.0** — Prima versione: gironi, classifiche, tabellone, set tennistici, temi.
