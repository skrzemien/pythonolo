/* Strona główna: kafelki modułów + paski postępu. */

import { wczytajSpisModulow, esc } from './dane.js';
import { Postep } from './progress.js';
import { podepnijWyczyszczeniePostepu } from './stopka.js';
import { podepnijTrybCzytania } from './dostepnosc.js';

const lista = document.getElementById('lista-modulow');

function kafelek(m) {
    const zaliczone = Postep.zaliczoneWModule(m.id);
    const razem = m.liczbaZadan || 0;
    const procent = razem ? Math.round((zaliczone / razem) * 100) : 0;
    const ukonczony = razem > 0 && zaliczone >= razem;

    return `
        <a class="kafelek${ukonczony ? ' ukonczony' : ''}" href="modul.html?m=${encodeURIComponent(m.id)}">
            <div class="naglowek">
                <span class="ikona" aria-hidden="true">${esc(m.ikona || '📘')}</span>
                <span class="numer">MODUŁ ${m.numer}</span>
            </div>
            <h3>${esc(m.tytul)}</h3>
            <p>${esc(m.opis)}</p>
            <div class="pasek${ukonczony ? ' pelny' : ''}"><i style="width:${procent}%"></i></div>
            <div class="postep-opis">
                <span>${zaliczone} z ${razem} zadań</span>
                <span>${procent}%</span>
            </div>
        </a>`;
}

function pokazPostepGlobalny(moduly) {
    const razem = moduly.reduce((s, m) => s + (m.liczbaZadan || 0), 0);
    const zaliczone = Postep.zaliczoneRazem(moduly.map(m => m.id));
    if (!razem) return;

    const procent = Math.round((zaliczone / razem) * 100);
    const pojemnik = document.getElementById('postep-globalny');
    const pasek = document.getElementById('postep-pasek');

    document.getElementById('postep-liczby').textContent = `${zaliczone} z ${razem} zadań (${procent}%)`;
    pasek.querySelector('i').style.width = `${procent}%`;
    pasek.classList.toggle('pelny', zaliczone >= razem);
    pojemnik.hidden = false;
}

async function start() {
    try {
        const spis = await wczytajSpisModulow();

        document.getElementById('tytul').textContent = spis.tytul;
        document.getElementById('podtytul').textContent = spis.podtytul;
        document.title = `${spis.tytul} — zadania z programowania`;

        lista.innerHTML = `<div class="moduly">${spis.moduly.map(kafelek).join('')}</div>`;
        pokazPostepGlobalny(spis.moduly);
    } catch (e) {
        lista.innerHTML = `<div class="blad-strony"><strong>Nie udało się wczytać listy modułów.</strong>
            <br>${esc(e.message)}
            <br><br>Jeśli otwierasz plik bezpośrednio z dysku, uruchom lokalny serwer:
            <code>python3 -m http.server 8000</code></div>`;
    }
}

podepnijTrybCzytania();
podepnijWyczyszczeniePostepu();
start();
