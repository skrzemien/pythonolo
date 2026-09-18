import test from 'node:test';
import assert from 'node:assert/strict';
import { podepnijCzytanie } from '../js/czytanie.js';

function przygotuj(obsluga = true) {
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
    podepnijCzytanie(przycisk, status, 'Tytuł. Napisz program.', okno);
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
