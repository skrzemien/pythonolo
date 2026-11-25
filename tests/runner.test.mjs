import test from 'node:test';
import assert from 'node:assert/strict';
import { Uruchamiacz } from '../js/runner.js';

function przygotujUruchamiacz() {
    const workery = [];
    const stany = [];
    const wyjscia = [];

    const uruchamiacz = new Uruchamiacz({
        onStan: s => stany.push(s),
        onWyjscie: (strumien, tekst) => wyjscia.push([strumien, tekst]),
        tworzWorkera: () => {
            const w = {
                wiadomosci: [],
                ubity: false,
                onmessage: null,
                onerror: null,
                postMessage(msg) { this.wiadomosci.push(msg); },
                terminate() { this.ubity = true; }
            };
            workery.push(w);
            return w;
        }
    });

    return { uruchamiacz, workery, stany, wyjscia };
}

test('czas pobierania Pyodide nie wlicza się do limitu wykonania kodu', async () => {
    const { uruchamiacz, workery } = przygotujUruchamiacz();
    const w = workery[0];

    // Użytkownik klika Uruchom zanim worker zgłosi gotowość, z krótkim limitem 25 ms.
    const obietnica = uruchamiacz.uruchom({ kod: 'print(1)', limitMs: 25 });

    // Mija więcej niż limitMs podczas samego pobierania Pyodide — worker nie może zostać ubity.
    await new Promise(r => setTimeout(r, 45));
    assert.equal(w.ubity, false);
    assert.equal(workery.length, 1);

    // Pyodide kończy ładowanie i od razu zwraca wynik programu.
    const id = w.wiadomosci[0].id;
    w.onmessage({ data: { typ: 'gotowy' } });
    w.onmessage({ data: { typ: 'wyjscie', id, strumien: 'stdout', tekst: '1\n' } });
    w.onmessage({ data: { typ: 'koniec', id, ok: true, stdout: '1\n', blad: null } });

    const wynik = await obietnica;
    assert.equal(wynik.ok, true);
    assert.equal(wynik.stdout, '1\n');
    assert.equal(w.ubity, false);
});

test('po zgłoszeniu gotowości przekroczenie limitMs przerywa nieskończoną pętlę i stawia nowego workera', async () => {
    const { uruchamiacz, workery } = przygotujUruchamiacz();
    const w = workery[0];

    const obietnica = uruchamiacz.uruchom({ kod: 'while True: pass', limitMs: 25 });
    w.onmessage({ data: { typ: 'gotowy' } });

    const wynik = await obietnica;
    assert.equal(wynik.ok, false);
    assert.equal(wynik.przerwane, true);
    assert.equal(wynik.blad.nazwa, 'ZaDlugo');
    assert.equal(w.ubity, true);
    assert.equal(workery.length, 2);
});
