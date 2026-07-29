/* Wspólne elementy interfejsu: konsola wyjścia, wskaźnik stanu Pythona,
   ramka z wynikiem sprawdzenia i porównanie wyjść. */

import { esc, prostyMarkdown } from './dane.js';
import { wyjasnijBlad, naglowekBledu } from './bledy.js';

/* --- konsola -------------------------------------------------------------- */

export class Konsola {
    constructor(element) {
        this.el = element;
        this.pusta = true;
        this.wyczysc();
    }

    wyczysc() {
        this.el.innerHTML = '<span class="pusto">Tu pojawi się wynik działania programu.</span>';
        this.pusta = true;
    }

    #przygotuj() {
        if (this.pusta) {
            this.el.innerHTML = '';
            this.pusta = false;
        }
    }

    /** @param {'stdout'|'stderr'|'wejscie'} strumien */
    dopisz(strumien, tekst) {
        if (!tekst) return;
        this.#przygotuj();

        const span = document.createElement('span');
        if (strumien === 'stderr') span.className = 'stderr';
        if (strumien === 'wejscie') span.className = 'info';
        span.textContent = tekst;
        this.el.appendChild(span);
        this.el.scrollTop = this.el.scrollHeight;
    }

    info(tekst) {
        this.dopisz('wejscie', tekst.endsWith('\n') ? tekst : tekst + '\n');
    }
}

/* --- wskaźnik stanu ------------------------------------------------------- */

const OPISY_STANU = {
    ladowanie: 'Przygotowuję Pythona…',
    gotowy: 'Python gotowy',
    pracuje: 'Program działa…',
    blad: 'Python niedostępny'
};

export function ustawStan(element, stan) {
    element.className = `stan-pythona ${stan}`;
    element.innerHTML = `<span class="kropka"></span><span>${OPISY_STANU[stan] || ''}</span>`;
}

/* --- porównywanie wyjść --------------------------------------------------- */

/** Usuwa spacje na końcach linii i puste linie na końcu — reszta liczy się dokładnie. */
export function normalizuj(tekst) {
    return String(tekst ?? '')
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map(l => l.replace(/[ \t]+$/, ''))
        .join('\n')
        .replace(/\n+$/, '');
}

export function wyjsciaZgodne(oczekiwane, otrzymane) {
    return normalizuj(oczekiwane) === normalizuj(otrzymane);
}

/** Kolumny „oczekiwane" i „twoje" z podświetloną pierwszą różniącą się linią. */
export function htmlPorownania(oczekiwane, otrzymane) {
    const a = normalizuj(oczekiwane).split('\n');
    const b = normalizuj(otrzymane).split('\n');
    const ile = Math.max(a.length, b.length);

    let pierwszaRoznica = -1;
    for (let i = 0; i < ile; i++) {
        if (a[i] !== b[i]) { pierwszaRoznica = i; break; }
    }

    const kolumna = (linie) => linie.map((l, i) => {
        if (l === undefined) return '<span class="brak">(brak linii)</span>';
        const tresc = l === '' ? '&nbsp;' : esc(l);
        return i === pierwszaRoznica ? `<span class="rozna-linia">${tresc}</span>` : tresc;
    }).join('\n');

    const doDlugosci = (linie) => Array.from({ length: ile }, (_, i) => linie[i]);

    return `
        <div class="porownanie">
            <div><strong>Powinno być</strong><pre>${kolumna(doDlugosci(a))}</pre></div>
            <div><strong>Twój wynik</strong><pre>${kolumna(doDlugosci(b))}</pre></div>
        </div>`;
}

/* --- ramka z wynikiem ----------------------------------------------------- */

export function pokazWynik(element, rodzaj, naglowek, szczegolHtml = '') {
    element.className = `wynik widoczny ${rodzaj}`;
    element.innerHTML = `<div class="naglowek">${naglowek}</div>`
        + (szczegolHtml ? `<div class="szczegol">${szczegolHtml}</div>` : '');
}

export function schowajWynik(element) {
    element.className = 'wynik';
    element.innerHTML = '';
}

/** Ramka opisująca błąd wykonania: polska podpowiedź + oryginalny komunikat. */
export function pokazBlad(element, blad) {
    const podpowiedz = wyjasnijBlad(blad);
    const oryginal = blad.zrodlo === 'srodowisko'
        ? ''
        : `<br><br><code>${esc(blad.nazwa)}: ${esc(blad.komunikat)}</code>`;

    pokazWynik(
        element,
        blad.nazwa === 'Zatrzymane' ? 'info' : 'zle',
        esc(naglowekBledu(blad)),
        (podpowiedz ? prostyMarkdown(podpowiedz) : esc(blad.komunikat)) + oryginal
    );
}
