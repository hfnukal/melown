# Zadání:
Vytvořte jednoduchou webovou službu pro provádění složitých výpočetních
operací.

Uživatel zadá službě úkol pro výpočet. Služba úkol příjme a připraví ke zpracování. Na dotaz
uživatele indikuje stav a pokrok v provádění úkolu. Uživatel má možnost úkol přerušit, či
úplně odstranit.

Pro účely tohoto zadání považujme úkol za slepý. K jeho vytvoření ve službě tedy není
potřeba zadávat žádné další parametry či údaje.
Uživatelova interakce se službou probíhá pomocí API. Autentizaci a autorizaci uživatelů není
třeba řešit.

Služba se bude skládat ze 2 hlavních komponent:

Executor – Výkonová část, provádějící výpočetní operace. Pro potřeby testovací úlohy se
jedná o slepé výpočetní operace. U každého úkolu si tedy Executor dobu běhu zvolí náhodně
z rozsahu 5 sekund až 2 minuty. Provádění úkolu může skončit (náhodně generovanou)
chybou, kterou je třeba zachytit a dle jejího typu reagovat.

Customer – Komponenta s vnějším API. Je schopna přijmout úkol ke zpracování. Vede si
záznamy o prováděnych a dokončených úkolech, jejich stavech a pokroku provádění. Je
schopna řídit provádění úkolů (zastavit, znovu spustit, odstranit).

Customer i Executor mohou běžet na jiných serverech. Zatímco Customer běží vždy jeden,

Executorů může běžet více.

Vaše úkoly:
    - Navrhněte architekturu a datový model služby a vhodně je zdokumentujte.
    - Navrhněte API pro přístup ke službě a vhodně jej zdokumentujte.
    - Implementujte komponenty Customer a Executor.
    - Připravte nasazovací plán pro instalaci služby na virtuální servery s OS Debian, tak aby po instalaci služba fungovala a úkoly obsluhovalo duo Executorů.
    - Zdrojové kódy a dokumentaci odevzdejte v git repository.

Volitelná rozšíření:
    - Webové UI – vytvořte jednoduché UI pro správu úkolů ve webové službě.
    - Žurnál provádění úkolu – každý úkol zná svoji historii stavů.
    - Statistika – API či UI zobrazuje statistiku provedených úkolů ve službě, dobu jejich běhu, atp.
    - Orchestrátor – Komponenta pro řízení životního cyklu Executorů. Nahlíží do fronty úkolů a podle definovaných parametrů vytváří spouští a zastavuje/ruší instance

Executorů na základě vytíženosti aplikace.
    - Prioritizace úkolů pro zpracování.

V případě dotazů se obracejte na: Jaromír Deák <jaromir.deak@hexagon.com>

# Dokumentace

## Spouštení pomocí Dockeru

Požadavky:
    - nainstalovaný b269c9 Docker
    - volné porty 3000 a 3333

```
./run.sh
```

Zastavení

```
./stop.sh
```

## API

Api server s implentací.

```
cd api
npm i
npm run api
```

Swagger Dokumentace API na http://localhost:3333/api-docs/

Kromě REST API poskytuje ješte WebSocket komunikaci o průběhu zpracování.

## UI

Webové UI pro správu úkolů.

```
cd ui
npm run dev
```

