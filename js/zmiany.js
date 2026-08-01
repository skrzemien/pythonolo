/* Strona „Zmiany" — lista tego, co doszło w zadaniach.

   Wpisy siedzą w data/zmiany.json i podają tylko identyfikatory nowych zadań.
   Tytuły, moduły i adresy dolatują z plików modułów przy każdym wyświetleniu,
   więc linki nie zgniją, gdy zadanie zmieni pozycję. */

import { wczytajSpisModulow, wczytajModul, esc, htmlTresci, prostyMarkdown } from './dane.js';
import { Postep } from './progress.js';
import { podepnijWyczyszczeniePostepu } from './stopka.js';

const widok = document.getElementById('lista-zmian');

/** Mapa: identyfikator zadania -> gdzie ono jest i jak się nazywa. */
async function zbudujSkorowidz(spis) {
    const moduly = await Promise.all(spis.moduly.map(m => wczytajModul(m.id)));
    const skorowidz = new Map();

    spis.moduly.forEach((wpis, i) => {
        moduly[i].zadania.forEach((zadanie, indeks) => {
            skorowidz.set(zadanie.id, {
                idModulu: wpis.id,
                tytulModulu: wpis.tytul,
                numerModulu: wpis.numer,
                pozycja: indeks + 1,
                tytul: zadanie.tytul,
                typ: zadanie.typ
            });
        });
    });

    return skorowidz;
}

function htmlZadania(id, skorowidz) {
    const z = skorowidz.get(id);

    // Zadanie wymienione we wpisie, ale usunięte z modułu — pokazujemy szarą
    // pozycję zamiast martwego linku.
    if (!z) {
        return `<li><span class="tresc"><strong>${esc(id)}</strong>
            <span>zadania już nie ma w kursie</span></span></li>`;
    }

    const zaliczone = Postep.czyZaliczone(z.idModulu, id);
    const adres = `cwiczenie.html?m=${encodeURIComponent(z.idModulu)}&z=${z.pozycja}`;
    const plakietka = z.typ === 'uzupelnij'
        ? '<span class="plakietka">uzupełnij</span>'
        : '<span class="plakietka pisz">napisz kod</span>';

    return `
        <li class="${zaliczone ? 'ok' : ''}">
            <a href="${adres}">
                <span class="znacznik">${zaliczone ? '✓' : z.numerModulu}</span>
                <span class="tresc">
                    <strong>${esc(z.tytul)}</strong>
                    <span>Moduł ${z.numerModulu}: ${esc(z.tytulModulu)}</span>
                </span>
                ${plakietka}
            </a>
        </li>`;
}

function htmlWpisu(wpis, skorowidz) {
    const nowe = wpis.noweZadania || [];

    return `
        <article class="karta wpis-zmian">
            <div class="wpis-naglowek">
                <h2>${esc(wpis.tytul)}</h2>
                <time datetime="${esc(wpis.data)}">${esc(wpis.data)}</time>
            </div>

            ${wpis.opis ? htmlTresci(wpis.opis) : ''}

            ${wpis.punkty && wpis.punkty.length
                ? `<ul class="lista-zmian">${wpis.punkty.map(p => `<li>${prostyMarkdown(p)}</li>`).join('')}</ul>`
                : ''}

            ${nowe.length ? `
                <h3 class="naglowek-zadan">Nowe zadania (${nowe.length})</h3>
                <ul class="zadania">${nowe.map(id => htmlZadania(id, skorowidz)).join('')}</ul>` : ''}

            ${wpis.stopka ? `<p class="wpis-stopka">${prostyMarkdown(wpis.stopka)}</p>` : ''}
        </article>`;
}

async function start() {
    try {
        const [spis, zmiany] = await Promise.all([
            wczytajSpisModulow(),
            fetch('data/zmiany.json').then(o => {
                if (!o.ok) throw new Error(`HTTP ${o.status}`);
                return o.json();
            })
        ]);

        const wpisy = zmiany.wpisy || [];
        if (!wpisy.length) {
            widok.innerHTML = '<p class="ladowanie">Na razie nic tu nie ma.</p>';
            return;
        }

        const skorowidz = await zbudujSkorowidz(spis);
        widok.innerHTML = wpisy.map(w => htmlWpisu(w, skorowidz)).join('');
    } catch (e) {
        widok.innerHTML = `<div class="blad-strony"><strong>Nie udało się wczytać listy zmian.</strong>
            <br>${esc(e.message)}</div>`;
    }
}

podepnijWyczyszczeniePostepu();
start();
