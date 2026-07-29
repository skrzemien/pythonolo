/* Postęp nauki — zapisywany w localStorage przeglądarki.
   Brak kont i serwera: postęp żyje na tym urządzeniu i w tej przeglądarce.

   Kształt danych:
   {
     "01-print": {
       "print-1": { "status": "ok", "proby": 2 },
       "print-2": { "status": "probowane", "proby": 5 }
     }
   }
*/

const KLUCZ = 'python-az:postep';

function wczytajWszystko() {
    try {
        const surowe = localStorage.getItem(KLUCZ);
        if (!surowe) return {};
        const dane = JSON.parse(surowe);
        return (dane && typeof dane === 'object') ? dane : {};
    } catch (e) {
        // Uszkodzony wpis albo zablokowany localStorage (tryb prywatny).
        // Nie psujemy strony — po prostu działamy bez zapamiętywania.
        console.warn('Nie udało się odczytać postępu:', e);
        return {};
    }
}

function zapiszWszystko(dane) {
    try {
        localStorage.setItem(KLUCZ, JSON.stringify(dane));
    } catch (e) {
        console.warn('Nie udało się zapisać postępu:', e);
    }
}

export const Postep = {
    /** Stan pojedynczego zadania albo null, jeśli jeszcze nietknięte. */
    stanZadania(idModulu, idZadania) {
        const dane = wczytajWszystko();
        return (dane[idModulu] && dane[idModulu][idZadania]) || null;
    },

    /** Czy zadanie zostało zaliczone. */
    czyZaliczone(idModulu, idZadania) {
        const stan = this.stanZadania(idModulu, idZadania);
        return !!stan && stan.status === 'ok';
    },

    /** Liczba prób sprawdzenia danego zadania. */
    liczbaProb(idModulu, idZadania) {
        const stan = this.stanZadania(idModulu, idZadania);
        return stan ? (stan.proby || 0) : 0;
    },

    /**
     * Zapisuje wynik sprawdzenia. Zaliczenia nie da się cofnąć kolejną
     * nieudaną próbą — raz zdobyty znaczek zostaje.
     */
    zapiszProbe(idModulu, idZadania, zaliczone) {
        const dane = wczytajWszystko();
        if (!dane[idModulu]) dane[idModulu] = {};
        const poprzedni = dane[idModulu][idZadania] || { status: 'probowane', proby: 0 };
        dane[idModulu][idZadania] = {
            status: (zaliczone || poprzedni.status === 'ok') ? 'ok' : 'probowane',
            proby: (poprzedni.proby || 0) + 1
        };
        zapiszWszystko(dane);
    },

    /** Ile zadań w module zostało zaliczonych. */
    zaliczoneWModule(idModulu) {
        const dane = wczytajWszystko();
        const modul = dane[idModulu];
        if (!modul) return 0;
        return Object.values(modul).filter(z => z && z.status === 'ok').length;
    },

    /** Zestaw identyfikatorów zaliczonych zadań w module. */
    zaliczoneIdWModule(idModulu) {
        const dane = wczytajWszystko();
        const modul = dane[idModulu] || {};
        return new Set(Object.keys(modul).filter(id => modul[id] && modul[id].status === 'ok'));
    },

    /** Suma zaliczonych zadań we wszystkich modułach z listy. */
    zaliczoneRazem(idyModulow) {
        return idyModulow.reduce((suma, id) => suma + this.zaliczoneWModule(id), 0);
    },

    wyczysc() {
        try {
            localStorage.removeItem(KLUCZ);
        } catch (e) {
            console.warn('Nie udało się wyczyścić postępu:', e);
        }
    }
};
