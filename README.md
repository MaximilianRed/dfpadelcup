# DF Padel Cup

Web app per organizzare tornei di padel: gironi da 3 o 4 coppie, classifica generale e tabellone a eliminazione diretta.

## Come si usa

1. **Tornei**: crea un torneo (nome, data, campi da 1 a 20, numero di coppie). L'app prepara le righe con nomi di default
   (Giocatore 1A / Giocatore 1B, ...), così i gironi si possono creare subito e i nomi correggere dopo.
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
   si giocano; la prossima da giocare è evidenziata.
4. **Gironi**: inserisci i game di ogni partita (Invio passa al campo successivo). Si può filtrare per campo.
   Con *Modifica composizione* si scambiano due coppie cliccandole una dopo l'altra.
5. **Classifica**: quando i gironi sono conclusi, premi *Genera il tabellone*.
6. **Tabellone**: inserisci i risultati; i turni successivi si creano da soli.

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
  La partita la vince chi vince più set; i "game vinti" in classifica sono la somma dei game di tutti i set
  (il super tie-break conta come 1 game).

- **Gironi**: da 3 o da 4 coppie, un girone per campo quando si può: con pochi campi gironi da 4,
  con tanti campi gironi da 3 (finiscono prima). Se i gironi sono più dei campi, alcuni giocano dopo.
  Non si possono fare con 1, 2 o 5 coppie.
- **Classifica del girone**: partite vinte → game vinti → game persi (meno è meglio) → scontro diretto → monetina.
- **Classifica generale**: prima tutte le prime dei gironi, poi le seconde, ecc.; dentro ogni fascia
  partite vinte → game vinti → game persi → monetina. Nelle impostazioni si può usare la media per partita,
  più equa se ci sono gironi da 3 e da 4.
- **Tabellone**: le prime 4 entrano ai quarti. Le altre si qualificano nei turni precedenti; se servono
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
