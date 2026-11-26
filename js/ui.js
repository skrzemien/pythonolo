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

/* --- podgląd okna Pygame (<canvas>) --------------------------------------- */

function kolorCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function narysujKlatke(ctx, szerokosc, wysokosc, polecenia) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, szerokosc, wysokosc);

    for (const p of polecenia || []) {
        const styl = p.kolor ? kolorCss(p.kolor) : '#ffffff';
        if (p.typ === 'fill') {
            ctx.fillStyle = styl;
            ctx.fillRect(0, 0, szerokosc, wysokosc);
        } else if (p.typ === 'rect') {
            if (p.promien > 0 && typeof ctx.roundRect === 'function') {
                ctx.beginPath();
                ctx.roundRect(p.x, p.y, p.w, p.h, p.promien);
                if (p.grubosc > 0) {
                    ctx.strokeStyle = styl;
                    ctx.lineWidth = p.grubosc;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = styl;
                    ctx.fill();
                }
            } else if (p.grubosc > 0) {
                ctx.strokeStyle = styl;
                ctx.lineWidth = p.grubosc;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
            } else {
                ctx.fillStyle = styl;
                ctx.fillRect(p.x, p.y, p.w, p.h);
            }
        } else if (p.typ === 'circle') {
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
            if (p.grubosc > 0) {
                ctx.strokeStyle = styl;
                ctx.lineWidth = p.grubosc;
                ctx.stroke();
            } else {
                ctx.fillStyle = styl;
                ctx.fill();
            }
        } else if (p.typ === 'line') {
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.strokeStyle = styl;
            ctx.lineWidth = p.grubosc || 1;
            ctx.stroke();
        } else if (p.typ === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(
                p.x + p.w / 2, p.y + p.h / 2,
                Math.max(0, p.w / 2), Math.max(0, p.h / 2),
                0, 0, Math.PI * 2
            );
            if (p.grubosc > 0) {
                ctx.strokeStyle = styl;
                ctx.lineWidth = p.grubosc;
                ctx.stroke();
            } else {
                ctx.fillStyle = styl;
                ctx.fill();
            }
        } else if (p.typ === 'polygon' && p.punkty?.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(p.punkty[0][0], p.punkty[0][1]);
            for (let i = 1; i < p.punkty.length; i++) {
                ctx.lineTo(p.punkty[i][0], p.punkty[i][1]);
            }
            ctx.closePath();
            if (p.grubosc > 0) {
                ctx.strokeStyle = styl;
                ctx.lineWidth = p.grubosc;
                ctx.stroke();
            } else {
                ctx.fillStyle = styl;
                ctx.fill();
            }
        } else if (p.typ === 'text') {
            ctx.fillStyle = styl;
            ctx.font = `600 ${Math.max(12, Math.round((p.rozmiar || 24) * 0.72))}px sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(p.tekst || '', p.x, p.y);
        }
    }
}

export class EkranGry {
    constructor(element) {
        this.el = element;
        this.timer = null;
    }

    get widoczny() {
        return Boolean(this.el && !this.el.hidden);
    }

    wyczysc() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (!this.el) return;
        this.el.hidden = true;
        this.el.innerHTML = '';
    }

    pokaz(dane) {
        if (!this.el || !dane) return;
        this.wyczysc();

        const { szerokosc, wysokosc, tytul, fps, klatki = [] } = dane;
        const wieleKlatek = klatki.length > 1;

        this.el.innerHTML = `
            <div class="ekran-naglowek">
                <span class="ekran-tytul">🎮 ${esc(tytul || 'Okno Pygame')}</span>
                <span class="ekran-wymiary">${Number(szerokosc)} × ${Number(wysokosc)} px</span>
                ${wieleKlatek ? '<button type="button" class="przycisk maly ekran-powtorz">↻ Odtwórz ruch</button>' : ''}
            </div>
            <div class="ekran-obszar">
                <canvas width="${Number(szerokosc)}" height="${Number(wysokosc)}"
                        role="img" aria-label="Podgląd okna gry Pygame"></canvas>
            </div>`;
        this.el.hidden = false;

        const canvas = this.el.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const ograniczRuch = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        const odtworz = (wymusAnimacje = false) => {
            if (this.timer !== null) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            if (!klatki.length) {
                narysujKlatke(ctx, szerokosc, wysokosc, []);
                return;
            }
            if (!wieleKlatek || (ograniczRuch && !wymusAnimacje)) {
                narysujKlatke(ctx, szerokosc, wysokosc, klatki[klatki.length - 1]);
                return;
            }
            const odstepMs = Math.round(1000 / Math.min(60, Math.max(5, fps || 30)));
            let indeks = 0;
            const krok = () => {
                narysujKlatke(ctx, szerokosc, wysokosc, klatki[indeks]);
                indeks++;
                if (indeks < klatki.length) {
                    this.timer = setTimeout(krok, odstepMs);
                } else {
                    this.timer = null;
                }
            };
            krok();
        };

        odtworz(false);
        this.el.querySelector('.ekran-powtorz')?.addEventListener('click', () => odtworz(true));
    }
}

/* --- kopiowanie kodu do schowka ------------------------------------------- */

export function podepnijKopiowanie(przycisk, pobierzKod) {
    if (!przycisk) return;
    let timer = null;
    const etykieta = przycisk.textContent;

    przycisk.addEventListener('click', async () => {
        const tekst = pobierzKod();
        let skopiowano = false;
        try {
            await navigator.clipboard.writeText(tekst);
            skopiowano = true;
        } catch (e) {
            const pole = document.createElement('textarea');
            pole.value = tekst;
            pole.style.position = 'fixed';
            pole.style.opacity = '0';
            document.body.appendChild(pole);
            pole.select();
            try { skopiowano = document.execCommand('copy'); } catch (_) { /* brak obsługi */ }
            pole.remove();
        }
        if (timer !== null) clearTimeout(timer);
        przycisk.textContent = skopiowano ? '✓ Skopiowano kod' : 'Nie udało się skopiować';
        timer = setTimeout(() => {
            przycisk.textContent = etykieta;
            timer = null;
        }, 2000);
    });
}
