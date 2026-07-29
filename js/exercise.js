/* Odtwarzacz pojedynczego zadania: cwiczenie.html?m=07-if&z=3 */

import { wczytajModulZeSpisem, esc, htmlTresci, prostyMarkdown } from './dane.js';
import { Postep } from './progress.js';
import { utworzEdytor } from './editor.js';
import { podepnijWyczyszczeniePostepu } from './stopka.js';
import { Uruchamiacz } from './runner.js';
import {
    Konsola, ustawStan, pokazBlad, pokazWynik, schowajWynik,
    wyjsciaZgodne, htmlPorownania
} from './ui.js';

const PROB_DO_ROZWIAZANIA = 2;

const parametry = new URLSearchParams(location.search);
const idModulu = parametry.get('m');
const numerZadania = Math.max(1, parseInt(parametry.get('z'), 10) || 1);

const widok = document.getElementById('widok');
const elStan = document.getElementById('stan');

/* --- pomocnicze ----------------------------------------------------------- */

/** Kod zadania „uzupełnij" z podstawionymi wartościami z pól. */
function zlozKod(szablon, wartosci) {
    const czesci = szablon.split('___');
    return czesci.map((c, i) => c + (i < czesci.length - 1 ? (wartosci[i] ?? '') : '')).join('');
}

function poprawnaOdpowiedz(przyjmowane, wpisane) {
    const a = String(wpisane).trim();
    return przyjmowane.some(w => String(w).trim().toLowerCase() === a.toLowerCase());
}

/** Rozwiązanie zadania „uzupełnij" powstaje z pierwszej przyjmowanej odpowiedzi. */
function rozwiazanieZadania(zadanie) {
    if (zadanie.rozwiazanie) return zadanie.rozwiazanie;
    if (zadanie.typ === 'uzupelnij') return zlozKod(zadanie.kod, zadanie.luki.map(l => l[0]));
    return null;
}

/** Błąd, który wybuchł w kodzie sprawdzającym — najczęściej zła nazwa funkcji. */
function komunikatSprawdzenia(blad) {
    if (blad.nazwa === 'AssertionError') {
        return esc(blad.komunikat || 'Wynik nie zgadza się z oczekiwanym.');
    }
    const brakNazwy = String(blad.komunikat || '').match(/name '(.+?)' is not defined/);
    if (blad.nazwa === 'NameError' && brakNazwy) {
        return `Sprawdzarka szukała funkcji <code>${esc(brakNazwy[1])}</code> i jej nie znalazła. `
            + 'Nazwa w Twoim kodzie musi się zgadzać co do litery.';
    }
    if (blad.nazwa === 'TypeError') {
        return 'Funkcja istnieje, ale nie przyjmuje tylu wartości, ile podaje sprawdzarka. '
            + `<br><code>${esc(blad.komunikat)}</code>`;
    }
    return `Sprawdzenie nie mogło się wykonać: <code>${esc(blad.nazwa)}: ${esc(blad.komunikat)}</code>`;
}

/* --- widok ---------------------------------------------------------------- */

function htmlKoduZLukami(zadanie) {
    const czesci = zadanie.kod.split('___');
    return czesci.map((czesc, i) => {
        if (i === czesci.length - 1) return esc(czesc);
        const przyjmowane = zadanie.luki[i] || [''];
        const szerokosc = Math.max(4, ...przyjmowane.map(w => String(w).length)) + 2;
        return esc(czesc)
            + `<input class="luka" type="text" data-luka="${i}" size="1"`
            + ` style="width:${szerokosc}ch" spellcheck="false" autocapitalize="off"`
            + ` autocomplete="off" aria-label="Luka ${i + 1}">`;
    }).join('');
}

function htmlOczekiwanego(zadanie) {
    const tekst = zadanie.typ === 'uzupelnij'
        ? zadanie.wyjscie
        : (zadanie.sprawdzenie && zadanie.sprawdzenie.tryb === 'wyjscie'
            ? zadanie.sprawdzenie.oczekiwane : null);

    if (tekst === null || tekst === undefined || tekst === '') return '';

    // Część zadań pokazuje oczekiwany wynik już w treści — wtedy ramka
    // tylko powtarzałaby to samo dwa razy.
    if (zadanie.opis.includes(tekst.trim())) return '';

    return `<div class="oczekiwane-wyjscie">
        <strong>Program powinien wypisać</strong>
        <pre>${esc(tekst)}</pre>
    </div>`;
}

function htmlPanelu(zadanie) {
    if (zadanie.typ === 'uzupelnij') {
        return `
            <p class="legenda-luk">Wpisz brakujące fragmenty w białe pola, a potem kliknij <strong>Sprawdź</strong>.</p>
            <div class="kod-z-lukami" id="kod-luki">${htmlKoduZLukami(zadanie)}</div>`;
    }
    return '<div class="edytor" id="edytor"></div>';
}

function render({ wpis, modul, zadanie, poprzednie, nastepne }) {
    const zaliczone = Postep.czyZaliczone(idModulu, zadanie.id);
    const proby = Postep.liczbaProb(idModulu, zadanie.id);
    const linkModulu = `modul.html?m=${encodeURIComponent(idModulu)}`;

    document.getElementById('okruszki').innerHTML =
        `<a href="index.html">Moduły</a> › <a href="${linkModulu}">${esc(wpis.tytul)}</a>`
        + ` › Zadanie ${numerZadania} z ${modul.zadania.length}`;

    document.title = `${zadanie.tytul} — ${wpis.tytul}`;

    widok.innerHTML = `
        <div class="cwiczenie">
            <section class="karta tresc-zadania">
                <h1>${esc(zadanie.tytul)}${zaliczone ? ' ✓' : ''}</h1>
                <div class="opis">${htmlTresci(zadanie.opis)}</div>
                ${htmlOczekiwanego(zadanie)}

                <div class="pomoc">
                    ${zadanie.podpowiedzi && zadanie.podpowiedzi.length
                        ? '<button class="przycisk maly" id="podpowiedz">💡 Podpowiedź</button>' : ''}
                    ${rozwiazanieZadania(zadanie)
                        ? '<button class="przycisk maly" id="pokaz-rozwiazanie">👁 Pokaż rozwiązanie</button>' : ''}
                </div>
                <div id="podpowiedzi"></div>
                <div id="miejsce-rozwiazania"></div>
            </section>

            <section class="panel-kodu">
                <div class="pasek-narzedzi">
                    <button class="przycisk glowny" id="uruchom">▶ Uruchom</button>
                    <button class="przycisk" id="stop" disabled>⏹ Stop</button>
                    <button class="przycisk zielony" id="sprawdz">✓ Sprawdź</button>
                    <button class="przycisk maly" id="reset">↺ Reset</button>
                </div>
                ${htmlPanelu(zadanie)}
                <div class="wynik" id="wynik" role="status"></div>
                <div class="konsola" id="konsola" role="log" aria-live="polite"
                     aria-label="Wynik działania programu"></div>
            </section>
        </div>

        <div class="nawigacja-zadan">
            ${poprzednie
                ? `<a class="przycisk" href="cwiczenie.html?m=${encodeURIComponent(idModulu)}&z=${numerZadania - 1}">← Poprzednie</a>`
                : `<a class="przycisk" href="${linkModulu}">← Lista zadań</a>`}
            <span class="rozpychacz"></span>
            <a class="przycisk" href="${linkModulu}">Lista zadań</a>
            ${nastepne
                ? `<a class="przycisk${zaliczone ? ' glowny' : ''}" id="nastepne" href="cwiczenie.html?m=${encodeURIComponent(idModulu)}&z=${numerZadania + 1}">Następne →</a>`
                : ''}
        </div>`;

    return { zaliczone, proby };
}

/* --- logika --------------------------------------------------------------- */

async function start() {
    if (!idModulu) {
        widok.innerHTML = '<div class="blad-strony">Nie podano modułu. <a href="index.html">Wróć do listy</a>.</div>';
        return;
    }

    let dane;
    try {
        dane = await wczytajModulZeSpisem(idModulu);
    } catch (e) {
        widok.innerHTML = `<div class="blad-strony"><strong>Nie udało się wczytać zadania.</strong><br>${esc(e.message)}</div>`;
        return;
    }

    const { wpis, modul } = dane;
    const zadanie = modul.zadania[numerZadania - 1];
    if (!zadanie) {
        widok.innerHTML = `<div class="blad-strony">W tym module nie ma zadania numer ${numerZadania}.
            <a href="modul.html?m=${encodeURIComponent(idModulu)}">Wróć do listy zadań</a>.</div>`;
        return;
    }

    const { proby } = render({
        wpis, modul, zadanie,
        poprzednie: numerZadania > 1,
        nastepne: numerZadania < modul.zadania.length
    });

    const elWynik = document.getElementById('wynik');
    const konsola = new Konsola(document.getElementById('konsola'));
    const przyciskUruchom = document.getElementById('uruchom');
    const przyciskStop = document.getElementById('stop');
    const przyciskSprawdz = document.getElementById('sprawdz');

    const uruchamiacz = new Uruchamiacz({
        onStan: stan => {
            ustawStan(elStan, stan);
            const pracuje = (stan === 'pracuje');
            przyciskUruchom.disabled = pracuje;
            przyciskSprawdz.disabled = pracuje;
            przyciskStop.disabled = !pracuje;
        },
        onWyjscie: (strumien, tekst) => konsola.dopisz(strumien, tekst)
    });

    /* --- pobieranie kodu w zależności od typu zadania --- */

    let edytor = null;
    let poluLuk = [];

    if (zadanie.typ === 'uzupelnij') {
        poluLuk = Array.from(document.querySelectorAll('.luka'));
        poluLuk.forEach(pole => {
            pole.addEventListener('input', () => pole.classList.remove('ok', 'zle'));
            pole.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') { ev.preventDefault(); sprawdz(); }
            });
        });
        if (poluLuk[0]) poluLuk[0].focus();
    } else {
        edytor = utworzEdytor(document.getElementById('edytor'), {
            wartosc: zadanie.start || '',
            onUruchom: () => uruchom()
        });
    }

    const biezacyKod = () => zadanie.typ === 'uzupelnij'
        ? zlozKod(zadanie.kod, poluLuk.map(p => p.value))
        : edytor.getValue();

    /* --- uruchamianie --- */

    async function uruchom() {
        konsola.wyczysc();
        schowajWynik(elWynik);

        const wynik = await uruchamiacz.uruchom({
            kod: biezacyKod(),
            wejscie: zadanie.wejscie || (zadanie.sprawdzenie && zadanie.sprawdzenie.wejscie) || []
        });

        if (!wynik.ok && wynik.blad) pokazBlad(elWynik, wynik.blad);
        else if (konsola.pusta) konsola.info('(program nic nie wypisał)');
        return wynik;
    }

    /* --- sprawdzanie --- */

    function zapiszWynik(ok) {
        Postep.zapiszProbe(idModulu, zadanie.id, ok);
        odblokujRozwiazanie();
    }

    function sukces(dodatek = '') {
        pokazWynik(elWynik, 'ok', '🎉 Dobrze! Zadanie zaliczone.', dodatek);
        const nastepne = document.getElementById('nastepne');
        if (nastepne) nastepne.classList.add('glowny');
        document.querySelector('.tresc-zadania h1').textContent = `${zadanie.tytul} ✓`;
    }

    async function sprawdzUzupelnij() {
        let wszystkoOk = true;
        poluLuk.forEach((pole, i) => {
            const ok = poprawnaOdpowiedz(zadanie.luki[i] || [], pole.value);
            pole.classList.toggle('ok', ok);
            pole.classList.toggle('zle', !ok);
            if (!ok) wszystkoOk = false;
        });

        if (!wszystkoOk) {
            zapiszWynik(false);
            const puste = poluLuk.some(p => !p.value.trim());
            pokazWynik(elWynik, 'zle', 'Jeszcze nie to.',
                puste ? 'Wypełnij wszystkie pola.' : 'Pola zaznaczone na czerwono trzeba poprawić. Zajrzyj do podpowiedzi.');
            return;
        }

        // Wszystkie luki dobrze — pokazujemy od razu, co program robi.
        const wynik = await uruchom();
        if (!wynik.ok) {
            zapiszWynik(false);
            return;
        }
        zapiszWynik(true);
        sukces('Kod uruchomił się — wynik widać niżej.');
    }

    async function sprawdzNapisz() {
        const sprawdzenie = zadanie.sprawdzenie || { tryb: 'wyjscie', oczekiwane: '' };
        konsola.wyczysc();
        schowajWynik(elWynik);

        const wynik = await uruchamiacz.uruchom({
            kod: biezacyKod(),
            kodTestu: sprawdzenie.tryb === 'testy' ? sprawdzenie.kod : null,
            wejscie: sprawdzenie.wejscie || zadanie.wejscie || []
        });

        if (!wynik.ok) {
            zapiszWynik(false);
            if (wynik.blad && wynik.blad.zrodlo === 'sprawdzenie') {
                pokazWynik(elWynik, 'zle', 'Prawie!', komunikatSprawdzenia(wynik.blad));
            } else if (wynik.blad) {
                pokazBlad(elWynik, wynik.blad);
            }
            return;
        }

        if (sprawdzenie.tryb === 'testy') {
            zapiszWynik(true);
            sukces();
            return;
        }

        if (wyjsciaZgodne(sprawdzenie.oczekiwane, wynik.stdout)) {
            zapiszWynik(true);
            sukces();
        } else {
            zapiszWynik(false);
            pokazWynik(elWynik, 'zle', 'Wynik jest inny niż oczekiwany.',
                htmlPorownania(sprawdzenie.oczekiwane, wynik.stdout));
        }
    }

    const sprawdz = () => zadanie.typ === 'uzupelnij' ? sprawdzUzupelnij() : sprawdzNapisz();

    /* --- podpowiedzi i rozwiązanie --- */

    let odslonietePodpowiedzi = 0;
    const przyciskPodpowiedz = document.getElementById('podpowiedz');

    if (przyciskPodpowiedz) {
        przyciskPodpowiedz.addEventListener('click', () => {
            const tekst = zadanie.podpowiedzi[odslonietePodpowiedzi];
            if (tekst === undefined) return;
            const el = document.createElement('div');
            el.className = 'podpowiedz';
            el.innerHTML = `<strong>Podpowiedź ${odslonietePodpowiedzi + 1}:</strong> ${prostyMarkdown(tekst)}`;
            document.getElementById('podpowiedzi').appendChild(el);
            odslonietePodpowiedzi++;
            if (odslonietePodpowiedzi >= zadanie.podpowiedzi.length) {
                przyciskPodpowiedz.disabled = true;
                przyciskPodpowiedz.textContent = '💡 To wszystkie podpowiedzi';
            }
        });
    }

    const przyciskRozwiazanie = document.getElementById('pokaz-rozwiazanie');

    function odblokujRozwiazanie() {
        if (!przyciskRozwiazanie) return;
        const dosc = Postep.liczbaProb(idModulu, zadanie.id) >= PROB_DO_ROZWIAZANIA
            || Postep.czyZaliczone(idModulu, zadanie.id);
        przyciskRozwiazanie.disabled = !dosc;
        przyciskRozwiazanie.title = dosc
            ? ''
            : `Najpierw spróbuj sam — rozwiązanie odblokuje się po ${PROB_DO_ROZWIAZANIA} próbach.`;
    }

    if (przyciskRozwiazanie) {
        odblokujRozwiazanie();
        przyciskRozwiazanie.addEventListener('click', () => {
            const miejsce = document.getElementById('miejsce-rozwiazania');
            if (miejsce.dataset.pokazane) return;
            miejsce.dataset.pokazane = '1';
            miejsce.innerHTML = `<details class="rozwiazanie" open>
                <summary>Przykładowe rozwiązanie</summary>
                <pre>${esc(rozwiazanieZadania(zadanie))}</pre>
            </details>`;
            przyciskRozwiazanie.disabled = true;
        });
    }

    /* --- pozostałe przyciski --- */

    przyciskUruchom.addEventListener('click', uruchom);
    przyciskSprawdz.addEventListener('click', sprawdz);
    przyciskStop.addEventListener('click', () => uruchamiacz.przerwij());

    document.getElementById('reset').addEventListener('click', () => {
        konsola.wyczysc();
        schowajWynik(elWynik);
        if (zadanie.typ === 'uzupelnij') {
            poluLuk.forEach(p => { p.value = ''; p.classList.remove('ok', 'zle'); });
            if (poluLuk[0]) poluLuk[0].focus();
        } else {
            edytor.setValue(zadanie.start || '');
            edytor.focus();
        }
    });

    if (proby === 0 && zadanie.typ === 'napisz') edytor.focus();
}

podepnijWyczyszczeniePostepu();
start();
