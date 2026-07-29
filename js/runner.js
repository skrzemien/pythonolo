/* Warstwa nad workerem Pyodide: jedno uruchomienie naraz, limit czasu,
   przycisk Stop i automatyczne postawienie workera na nowo po ubiciu. */

const LIMIT_MS = 10000;

export class Uruchamiacz {
    /**
     * @param {object} opcje
     * @param {(stan: 'ladowanie'|'gotowy'|'pracuje'|'blad') => void} opcje.onStan
     * @param {(strumien: 'stdout'|'stderr'|'wejscie', tekst: string) => void} opcje.onWyjscie
     */
    constructor({ onStan = () => {}, onWyjscie = () => {} } = {}) {
        this.onStan = onStan;
        this.onWyjscie = onWyjscie;
        this.worker = null;
        this.gotowy = false;
        this.biezace = null;      // { id, resolve, timer }
        this.licznikId = 0;
        this.postawWorkera();
    }

    postawWorkera() {
        this.gotowy = false;
        this.onStan('ladowanie');

        this.worker = new Worker('js/pyodide-worker.js', { type: 'module' });
        this.worker.onmessage = ({ data }) => this.odbierz(data);
        this.worker.onerror = e => {
            this.onStan('blad');
            this.zakoncz({
                ok: false,
                stdout: '',
                blad: {
                    nazwa: 'BladSrodowiska',
                    komunikat: e.message || 'Nie udało się uruchomić silnika Pythona.',
                    zrodlo: 'srodowisko'
                }
            });
        };
    }

    odbierz(data) {
        if (data.typ === 'gotowy') {
            this.gotowy = true;
            this.onStan(this.biezace ? 'pracuje' : 'gotowy');
            return;
        }

        if (data.typ === 'blad-startu') {
            this.onStan('blad');
            this.zakoncz({
                ok: false,
                stdout: '',
                blad: {
                    nazwa: 'BladSrodowiska',
                    komunikat: 'Nie udało się pobrać Pythona. Sprawdź połączenie z internetem.',
                    pelny: data.komunikat,
                    zrodlo: 'srodowisko'
                }
            });
            return;
        }

        // Wiadomości z ubitego już przebiegu ignorujemy.
        if (!this.biezace || data.id !== this.biezace.id) return;

        if (data.typ === 'wyjscie') {
            this.onWyjscie(data.strumien, data.tekst);
        } else if (data.typ === 'koniec') {
            this.zakoncz({ ok: data.ok, stdout: data.stdout, blad: data.blad });
        }
    }

    zakoncz(wynik) {
        const biezace = this.biezace;
        if (!biezace) return;
        clearTimeout(biezace.timer);
        this.biezace = null;
        this.onStan(this.gotowy ? 'gotowy' : 'ladowanie');
        biezace.resolve(wynik);
    }

    /**
     * Uruchamia kod. Zwraca { ok, stdout, blad, przerwane }.
     * Kolejne wywołanie przerywa poprzednie.
     */
    uruchom({ kod, kodTestu = null, wejscie = [], limitMs = LIMIT_MS }) {
        if (this.biezace) this.przerwij();

        const id = ++this.licznikId;
        this.onStan('pracuje');

        return new Promise(resolve => {
            this.biezace = {
                id,
                resolve,
                timer: setTimeout(() => this.przerwij(true), limitMs)
            };
            this.worker.postMessage({ typ: 'uruchom', id, kod, kodTestu, wejscie });
        });
    }

    /** Ubija worker i stawia nowy. `zaDlugo` rozróżnia Stop od limitu czasu. */
    przerwij(zaDlugo = false) {
        if (!this.biezace) return;

        this.worker.terminate();

        const biezace = this.biezace;
        clearTimeout(biezace.timer);
        this.biezace = null;

        this.postawWorkera();

        biezace.resolve({
            ok: false,
            stdout: '',
            przerwane: true,
            blad: zaDlugo ? {
                nazwa: 'ZaDlugo',
                komunikat: 'Program działał za długo (ponad 10 sekund) i został zatrzymany. '
                    + 'Sprawdź, czy nie masz pętli, która nigdy się nie kończy.',
                zrodlo: 'srodowisko'
            } : {
                nazwa: 'Zatrzymane',
                komunikat: 'Program zatrzymany.',
                zrodlo: 'srodowisko'
            }
        });
    }

    get zajety() {
        return this.biezace !== null;
    }
}
