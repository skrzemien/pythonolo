import test from 'node:test';
import assert from 'node:assert/strict';
import { podepnijCzytanie } from '../js/czytanie.js';

function przygotuj(obsluga = true, tresc = 'Tytuł. Napisz program.') {
    const przycisk = new EventTarget();
    przycisk.setAttribute = (klucz, wartosc) => { przycisk[klucz] = wartosc; };
    const status = { textContent: '' };
    const okno = new EventTarget();
    const wypowiedzi = [];
    let anulowania = 0;
    let glosy = [{ lang: 'en-US' }, { lang: 'pl-PL', localService: true }];
    if (obsluga) {
        okno.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
        okno.speechSynthesis = {
            getVoices: () => glosy,
            speak: mowa => wypowiedzi.push(mowa),
            cancel: () => { anulowania++; }
        };
    }
    podepnijCzytanie(przycisk, status, tresc, okno);
    return { przycisk, status, okno, wypowiedzi,
        klik: () => przycisk.dispatchEvent(new Event('click')),
        ustawGlosy: lista => { glosy = lista; },
        anulowania: () => anulowania };
}

test('czyta dopiero po kliknięciu, po polsku, i kończy stan czytania', () => {
    const p = przygotuj();
    assert.equal(p.wypowiedzi.length, 0);
    p.klik();
    assert.equal(p.wypowiedzi[0].text, 'Tytuł. Napisz program.');
    assert.equal(p.wypowiedzi[0].lang, 'pl-PL');
    assert.equal(p.wypowiedzi[0].voice.lang, 'pl-PL');
    assert.match(p.przycisk.textContent, /Zatrzymaj/);
    p.wypowiedzi[0].onend();
    assert.match(p.przycisk.textContent, /Czytaj/);
});

test('stop i spóźnione zdarzenie nie przerywają kolejnego czytania', () => {
    const p = przygotuj();
    p.klik();
    const pierwsza = p.wypowiedzi[0];
    const przed = p.anulowania();
    p.klik();
    assert.ok(p.anulowania() > przed);
    assert.match(p.przycisk.textContent, /Czytaj/);
    p.klik();
    pierwsza.onend();
    assert.match(p.przycisk.textContent, /Zatrzymaj/);
});

test('brak API wyłącza przycisk i wyjaśnia przyczynę', () => {
    const p = przygotuj(false);
    assert.equal(p.przycisk.disabled, true);
    assert.match(p.status.textContent, /nie obsługuje/);
});

test('błąd mowy pozwala spróbować ponownie', () => {
    const p = przygotuj();
    p.klik();
    p.wypowiedzi[0].onerror({ error: 'language-unavailable' });
    assert.match(p.status.textContent, /polski głos/);
    assert.match(p.przycisk.textContent, /Czytaj/);
    p.klik();
    assert.equal(p.wypowiedzi.length, 2);
});

test('wybiera głosy dostępne w chwili kliknięcia, także po opóźnionym ładowaniu', () => {
    const p = przygotuj();
    p.ustawGlosy([]);
    p.klik();
    assert.equal(p.wypowiedzi[0].lang, 'pl-PL');
    p.klik();
    p.ustawGlosy([{ lang: 'pl_PL', localService: true }]);
    p.klik();
    assert.equal(p.wypowiedzi[1].voice.lang, 'pl_PL');
});

test('opuszczenie strony zatrzymuje mowę i pozwala wrócić z historii', () => {
    const p = przygotuj();
    p.klik();
    const przed = p.anulowania();
    p.okno.dispatchEvent(new Event('pagehide'));
    assert.ok(p.anulowania() > przed);
    assert.match(p.przycisk.textContent, /Czytaj/);
    p.klik();
    assert.equal(p.wypowiedzi.length, 2);
});

test('śledzi słowo przez boundary, a bez boundary czyta i zaznacza kolejne zdania', () => {
    const zaznaczenia = [];
    const czesci = ['Ala ma kota.', 'Kot śpi.'].map(tekst => ({
        tekst, zaznacz: (od, ile) => zaznaczenia.push([tekst, od, ile])
    }));
    const p = przygotuj(true, () => czesci);
    p.klik();
    assert.equal(p.wypowiedzi[0].text, 'Ala ma kota.');
    p.wypowiedzi[0].onstart();
    assert.deepEqual(zaznaczenia.at(-1), ['Ala ma kota.', 0, 12]);
    p.wypowiedzi[0].onboundary({ name: 'word', charIndex: 4, charLength: 2 });
    assert.deepEqual(zaznaczenia.at(-1), ['Ala ma kota.', 4, 2]);
    p.wypowiedzi[0].onend();
    assert.equal(p.wypowiedzi[1].text, 'Kot śpi.');
    p.wypowiedzi[1].onstart();
    assert.deepEqual(zaznaczenia.at(-1), ['Kot śpi.', 0, 8]);
    p.wypowiedzi[1].onend();
    assert.deepEqual(zaznaczenia.at(-1), ['Kot śpi.', 0, 0]);
});

test('stop usuwa zaznaczenie i ignoruje spóźnione boundary oraz end', () => {
    const zakresy = [];
    const p = przygotuj(true, () => [{ tekst: 'Ala ma kota.', zaznacz: (...x) => zakresy.push(x) }]);
    p.klik();
    const mowa = p.wypowiedzi[0];
    mowa.onstart();
    p.klik();
    assert.deepEqual(zakresy.at(-1), [0, 0]);
    mowa.onboundary({ name: 'word', charIndex: 4, charLength: 0 });
    mowa.onend();
    assert.deepEqual(zakresy.at(-1), [0, 0]);
    assert.equal(p.wypowiedzi.length, 1);
});

function przygotujZeSterowaniem(tresc, pamiec = {}) {
    const zrob = () => { const el = new EventTarget(); el.textContent = ''; return el; };
    const pauza = zrob();
    const suwak = zrob();
    suwak.value = '1';
    const opisTempa = zrob();
    const przycisk = zrob();
    const status = { textContent: '' };
    const okno = new EventTarget();
    const wypowiedzi = [];
    okno.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    okno.speechSynthesis = { getVoices: () => [], speak: m => wypowiedzi.push(m), cancel: () => {} };
    okno.localStorage = { getItem: k => pamiec[k] ?? null, setItem: (k, v) => { pamiec[k] = v; } };
    podepnijCzytanie(przycisk, status, tresc, okno, { pauza, suwak, opisTempa });
    return { przycisk, pauza, suwak, opisTempa, status, wypowiedzi, pamiec,
        klik: el => el.dispatchEvent(new Event('click')),
        tempo: v => { suwak.value = String(v); suwak.dispatchEvent(new Event('input')); } };
}

test('pauza zatrzymuje w miejscu i wznawia od ostatniego słowa', () => {
    const p = przygotujZeSterowaniem('Ala ma kota. Kot śpi.');
    assert.equal(p.pauza.hidden, true);
    p.klik(p.przycisk);
    assert.equal(p.pauza.hidden, false);
    const mowa = p.wypowiedzi[0];
    mowa.onboundary({ name: 'word', charIndex: 7, charLength: 4 });
    p.klik(p.pauza);
    assert.match(p.pauza.textContent, /Wznów/);
    assert.match(p.status.textContent, /wstrzymane/);
    mowa.onend();
    assert.equal(p.wypowiedzi.length, 1);
    p.klik(p.pauza);
    assert.equal(p.wypowiedzi[1].text, 'kota. Kot śpi.');
    assert.match(p.pauza.textContent, /Pauza/);
    p.wypowiedzi[1].onboundary({ name: 'word', charIndex: 6, charLength: 3 });
    p.klik(p.pauza);
    p.klik(p.pauza);
    assert.equal(p.wypowiedzi[2].text, 'Kot śpi.');
});

test('stop podczas pauzy wraca do początku', () => {
    const p = przygotujZeSterowaniem('Ala ma kota.');
    p.klik(p.przycisk);
    p.wypowiedzi[0].onboundary({ name: 'word', charIndex: 4, charLength: 2 });
    p.klik(p.pauza);
    p.klik(p.przycisk);
    assert.equal(p.pauza.hidden, true);
    assert.match(p.przycisk.textContent, /Czytaj/);
    p.klik(p.przycisk);
    assert.equal(p.wypowiedzi.at(-1).text, 'Ala ma kota.');
});

test('suwak zmienia tempo od bieżącego słowa i zapamiętuje je', () => {
    const p = przygotujZeSterowaniem('Ala ma kota.', { 'python-az:tempo-czytania': '1.5' });
    assert.equal(p.suwak.value, '1.5');
    assert.equal(p.opisTempa.textContent, '1,5×');
    p.klik(p.przycisk);
    assert.equal(p.wypowiedzi[0].rate, 1.5);
    p.wypowiedzi[0].onboundary({ name: 'word', charIndex: 4, charLength: 2 });
    p.tempo(0.7);
    assert.equal(p.wypowiedzi[1].text, 'ma kota.');
    assert.equal(p.wypowiedzi[1].rate, 0.7);
    assert.equal(p.pamiec['python-az:tempo-czytania'], '0.7');
    p.wypowiedzi[0].onend();
    assert.equal(p.wypowiedzi.length, 2);
});
