/* Wczytywanie danych z katalogu data/ — wspólne dla wszystkich stron. */

const pamiec = new Map();

async function pobierzJson(sciezka) {
    if (pamiec.has(sciezka)) return pamiec.get(sciezka);

    const obietnica = fetch(sciezka).then(odp => {
        if (!odp.ok) throw new Error(`Nie udało się wczytać ${sciezka} (HTTP ${odp.status})`);
        return odp.json();
    });

    pamiec.set(sciezka, obietnica);
    // Nie zapamiętujemy nieudanych prób — inaczej jedna usterka sieci
    // psułaby stronę aż do odświeżenia.
    obietnica.catch(() => pamiec.delete(sciezka));
    return obietnica;
}

/** Spis modułów: { tytul, podtytul, moduly: [...] } */
export function wczytajSpisModulow() {
    return pobierzJson('data/modules.json');
}

/** Zadania jednego modułu: { id, tytul, wstep, zadania: [...] } */
export function wczytajModul(idModulu) {
    return pobierzJson(`data/${idModulu}.json`);
}

/** Wpis modułu ze spisu + jego zadania, w jednym miejscu. */
export async function wczytajModulZeSpisem(idModulu) {
    const [spis, modul] = await Promise.all([
        wczytajSpisModulow(),
        wczytajModul(idModulu)
    ]);
    const wpis = spis.moduly.find(m => m.id === idModulu);
    if (!wpis) throw new Error(`Nie znam modułu „${idModulu}".`);
    return { spis, wpis, modul };
}

/** Sąsiedni moduł w kolejności ze spisu (kierunek: 1 lub -1). */
export function sasiedniModul(spis, idModulu, kierunek) {
    const i = spis.moduly.findIndex(m => m.id === idModulu);
    if (i < 0) return null;
    return spis.moduly[i + kierunek] || null;
}

/** Escape do bezpiecznego wstawiania tekstu w innerHTML. */
export function esc(tekst) {
    return String(tekst)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Sam tekst, bez znaczników — do krótkich podsumowań na listach. */
export function bezMarkdown(tekst) {
    return String(tekst).replace(/[`*]/g, '');
}

/**
 * Minimalny markdown w treściach zadań: `kod`, **pogrubienie**, *kursywa*.
 * Wejście jest najpierw escapowane, więc HTML z pliku JSON nie zadziała.
 */
export function prostyMarkdown(tekst) {
    return esc(tekst)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

/**
 * Cała treść zadania albo wstęp modułu: akapity, listy punktowane
 * oraz bloki kodu ograniczone potrójnym grawisem.
 */
export function htmlTresci(tekst) {
    const linie = String(tekst || '').split('\n');
    const wyjscie = [];
    let akapit = [];
    let lista = [];
    let blokKodu = null;

    const zamknijAkapit = () => {
        if (akapit.length) {
            wyjscie.push(`<p>${prostyMarkdown(akapit.join('\n')).replace(/\n/g, '<br>')}</p>`);
            akapit = [];
        }
    };
    const zamknijListe = () => {
        if (lista.length) {
            wyjscie.push(`<ul>${lista.map(p => `<li>${prostyMarkdown(p)}</li>`).join('')}</ul>`);
            lista = [];
        }
    };

    for (const linia of linie) {
        if (linia.trim().startsWith('```')) {
            if (blokKodu === null) {
                zamknijAkapit(); zamknijListe();
                blokKodu = [];
            } else {
                wyjscie.push(`<pre class="blok-kodu">${esc(blokKodu.join('\n'))}</pre>`);
                blokKodu = null;
            }
            continue;
        }
        if (blokKodu !== null) { blokKodu.push(linia); continue; }

        if (/^\s*\*\s+/.test(linia)) {
            zamknijAkapit();
            lista.push(linia.replace(/^\s*\*\s+/, ''));
            continue;
        }
        zamknijListe();

        if (linia.trim() === '') zamknijAkapit();
        else akapit.push(linia);
    }

    if (blokKodu !== null) wyjscie.push(`<pre class="blok-kodu">${esc(blokKodu.join('\n'))}</pre>`);
    zamknijListe();
    zamknijAkapit();
    return wyjscie.join('');
}
