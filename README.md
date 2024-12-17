# Compito Rapsodoo - Aron Winkler

## Installazione dipendenze

Per eseguire il progetto in modalità sviluppo, è necessario installare le dependencies del front-end. Per il back-end scritto in Python, invece, le dipendenze sono gestite direttamente da Docker.

```bash
cd src/front-end
# Se yarn è disponibile
yarn
# Oppure
npm install
```

## Avvio in modalità sviluppo

Per avviare il progetto è richisto che Docker sia installato sul sistema.

Se [tmuxnator](https://github.com/tmuxinator/tmuxinator) è installato sul sistema, il progetto si può avviare tramite il seguente comando:

```bash
cd devops
# Omettere l'argomento `tmux` se tmuxnator non è disponibile
./run-dev.sh tmux
```

Questo comando esegue una serie di passaggi:

- Scarica / aggiorna i dati COVID dalla [repository](https://github.com/pcm-dpc/COVID-19)
- Avvia i contenitori tramite docker-compose
- Avvia il front-end in modalità di sviluppo
- Se si è specificato il flag `tmux`, viene aperta una sessione con 4 pannelli che mostrano rispettivamente le logs dei container: `front-end`, `database`, `back-end`, `celery`
- Senza l'opzione tmux, non c'è spartizione, e vengono mostrati solamente le logs del back-end

Alla chiusura della sessione, vengono spenti anche i container Docker.
