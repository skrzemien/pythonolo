/* Lista zadań w jednym module (modul.html?m=07-if). */

import { wczytajModulZeSpisem, sasiedniModul, esc, bezMarkdown, htmlTresci } from './dane.js';
import { Postep } from './progress.js';
import { podepnijWyczyszczeniePostepu } from './stopka.js';

const widok = document.getElementById('widok-modulu');
const idModulu = new URLSearchParams(location.search).get('m');

function wierszZadania(z, i, idModulu, zaliczoneId) {
    const ok = zaliczoneId.has(z.id);
    const typ = z.typ === 'uzupelnij'
        ? '<span class="plakietka">uzupełnij</span>'
        : '<span class="plakietka pisz">napisz kod</span>';

    return `
        <li class="${ok ? 'ok' : ''}">
            <a href="cwiczenie.html?m=${encodeURIComponent(idModulu)}&z=${i + 1}">
                <span class="znacznik">${ok ? '✓' : i + 1}</span>
                <span class="tresc">
                    <strong>${esc(z.tytul)}</strong>
                    <span>${esc(bezMarkdown(z.opis.split('\n')[0]))}</span>
                </span>
                ${typ}
            </a>
        </li>`;
}

async function start() {
    if (!idModulu) {
        widok.innerHTML = '<div class="blad-strony">Nie podano modułu. <a href="index.html">Wróć do listy</a>.</div>';
        return;
    }

    try {
        const { spis, wpis, modul } = await wczytajModulZeSpisem(idModulu);
        const zaliczoneId = Postep.zaliczoneIdWModule(idModulu);
        const zaliczone = modul.zadania.filter(z => zaliczoneId.has(z.id)).length;
        const razem = modul.zadania.length;
        const procent = razem ? Math.round((zaliczone / razem) * 100) : 0;

        document.title = `${wpis.tytul} — Python od A do Z`;

        const nastepny = sasiedniModul(spis, idModulu, 1);

        widok.innerHTML = `
            <h1>${esc(wpis.ikona || '')} ${esc(wpis.tytul)}</h1>
            <p class="podtytul">${esc(wpis.opis)}</p>

            ${modul.wstep ? `<div class="karta wstep-modulu">${htmlTresci(modul.wstep)}</div>` : ''}

            <div class="postep-globalny">
                <div class="naglowek">
                    <span>Postęp w module</span>
                    <span>${zaliczone} z ${razem} (${procent}%)</span>
                </div>
                <div class="pasek${zaliczone >= razem ? ' pelny' : ''}"><i style="width:${procent}%"></i></div>
            </div>

            <ul class="zadania">
                ${modul.zadania.map((z, i) => wierszZadania(z, i, idModulu, zaliczoneId)).join('')}
            </ul>

            <div class="nawigacja-zadan">
                <a class="przycisk" href="index.html">← Wszystkie moduły</a>
                <span class="rozpychacz"></span>
                ${nastepny ? `<a class="przycisk" href="modul.html?m=${encodeURIComponent(nastepny.id)}">Następny moduł: ${esc(nastepny.tytul)} →</a>` : ''}
            </div>`;
    } catch (e) {
        widok.innerHTML = `<div class="blad-strony"><strong>Nie udało się wczytać modułu.</strong><br>${esc(e.message)}</div>`;
    }
}

podepnijWyczyszczeniePostepu();
start();
