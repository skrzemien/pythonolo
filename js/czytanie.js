/* Czytanie polecenia przez syntezator mowy przeglądarki. */
const KLUCZ_TEMPA = 'python-az:tempo-czytania';
const TEMPO_DOMYSLNE = 1;

export function podepnijCzytanie(przycisk, status, tekst, okno = window, { pauza, suwak, opisTempa } = {}) {
    const synteza = okno.speechSynthesis;
    let biezaca = null;
    let czesci = [];
    // Pozycja w czytanym zdaniu: od niej wznawiamy po pauzie i zmianie tempa.
    let indeks = 0;
    let pozycja = 0;
    let wstrzymane = false;
    let tempo = wczytajTempo();
    const wyczysc = () => czesci.forEach(c => c.zaznacz?.(0, 0));

    function wczytajTempo() {
        let zapisane = null;
        try { zapisane = okno.localStorage?.getItem(KLUCZ_TEMPA); } catch (e) { /* tryb prywatny */ }
        const liczba = Number(zapisane);
        return zapisane !== null && liczba >= 0.5 && liczba <= 2 ? liczba : TEMPO_DOMYSLNE;
    }

    function pokazTempo() {
        if (suwak) suwak.value = String(tempo);
        if (opisTempa) opisTempa.textContent = tempo.toFixed(1).replace('.', ',') + '×';
    }

    function ustawStan() {
        const aktywne = Boolean(biezaca) || wstrzymane;
        przycisk.textContent = aktywne ? '⏹ Zatrzymaj czytanie' : '🔊 Czytaj polecenie';
        if (pauza) {
            pauza.hidden = !aktywne;
            pauza.textContent = wstrzymane ? '▶ Wznów' : '⏸ Pauza';
        }
    }

    ustawStan();
    pokazTempo();
    if (!synteza || !okno.SpeechSynthesisUtterance) {
        przycisk.disabled = true;
        if (suwak) suwak.disabled = true;
        status.textContent = 'Ta przeglądarka nie obsługuje czytania na głos.';
        return;
    }

    // Wbudowane pause()/resume() zawodzą w części przeglądarek (np. Chrome na
    // Androidzie), więc pauza przerywa mowę i zapamiętuje ostatnie słowo.
    function przerwij() {
        // Zdarzenie anulowanej wypowiedzi może nadejść już po kolejnym kliknięciu.
        biezaca = null;
        synteza.cancel();
    }

    function zatrzymaj() {
        przerwij();
        wstrzymane = false;
        wyczysc();
        ustawStan();
        status.textContent = '';
    }

    przycisk.addEventListener('click', () => {
        if (biezaca || wstrzymane) {
            zatrzymaj();
            return;
        }

        status.textContent = '';
        try {
            synteza.cancel();
            czesci = typeof tekst === 'function' ? tekst() : [{ tekst }];
            czytajCzesc(0, 0);
        } catch (e) {
            awaria();
        }
    });

    pauza?.addEventListener('click', () => {
        if (wstrzymane) {
            wstrzymane = false;
            status.textContent = '';
            czytajCzesc(indeks, pozycja);
        } else if (biezaca) {
            przerwij();
            wstrzymane = true;
            ustawStan();
            status.textContent = 'Czytanie wstrzymane.';
        }
    });

    suwak?.addEventListener('input', () => {
        const liczba = Number(suwak.value);
        if (!(liczba > 0)) return;
        tempo = liczba;
        pokazTempo();
        try { okno.localStorage?.setItem(KLUCZ_TEMPA, String(tempo)); } catch (e) { /* tryb prywatny */ }
        // Nowe tempo działa od razu: czytamy dalej od bieżącego słowa.
        if (biezaca) {
            przerwij();
            czytajCzesc(indeks, pozycja);
        }
    });

    function awaria() {
        biezaca = null;
        wstrzymane = false;
        wyczysc();
        ustawStan();
        status.textContent = 'Nie udało się odczytać polecenia. Sprawdź, czy masz dostępny polski głos w systemie lub przeglądarce, i spróbuj ponownie.';
    }

    function czytajCzesc(nr, od) {
        const czesc = czesci[nr];
        if (!czesc) {
            biezaca = null;
            wyczysc();
            ustawStan();
            return;
        }
        indeks = nr;
        pozycja = od;
        const reszta = czesc.tekst.slice(od);
        if (!reszta.trim()) {
            czesc.zaznacz?.(0, 0);
            czytajCzesc(nr + 1, 0);
            return;
        }
        try {
            const mowa = new okno.SpeechSynthesisUtterance(reszta);
            mowa.lang = 'pl-PL';
            mowa.rate = tempo;
            // Lista może być pusta przy otwarciu strony. Odczytujemy ją na nowo
            // przy każdym kliknięciu; bez listy silnik dobiera głos do języka.
            const polskie = synteza.getVoices().filter(g => /^pl(?:[-_]|$)/i.test(g.lang));
            const glos = polskie.find(g => g.localService) || polskie[0];
            if (glos) mowa.voice = glos;

            biezaca = mowa;
            ustawStan();
            mowa.onstart = () => {
                if (biezaca === mowa) czesc.zaznacz?.(od, reszta.length);
            };
            mowa.onboundary = ev => {
                if (biezaca !== mowa || ev.name !== 'word') return;
                if (!Number.isInteger(ev.charIndex) || ev.charIndex < 0 || ev.charIndex >= reszta.length) return;
                const ile = ev.charLength > 0 ? ev.charLength
                    : (reszta.slice(ev.charIndex).match(/^\S+/)?.[0].length || 0);
                if (!ile) return;
                pozycja = od + ev.charIndex;
                czesc.zaznacz?.(pozycja, ile);
            };
            mowa.onend = () => {
                if (biezaca !== mowa) return;
                czesc.zaznacz?.(0, 0);
                czytajCzesc(nr + 1, 0);
            };
            mowa.onerror = () => {
                if (biezaca !== mowa) return;
                awaria();
            };
            synteza.speak(mowa);
        } catch (e) {
            awaria();
        }
    }

    okno.addEventListener('pagehide', zatrzymaj);
}

/** Mapuje pozycje syntezatora na tekst, zachowując znaczniki kodu i pogrubienia. */
export function przygotujCzytanie(elementy) {
    return elementy.flatMap(element => {
        const dokument = element.ownerDocument;
        element.querySelectorAll('.slowo-lektora').forEach(span => span.replaceWith(...span.childNodes));
        element.normalize();
        const slowa = [];
        let tekst = '';
        function odwiedz(wezel) {
            if (wezel.nodeType === 3) {
                const fragment = dokument.createDocumentFragment();
                for (const czesc of wezel.textContent.match(/\s+|\S+/g) || []) {
                    const od = tekst.length;
                    tekst += czesc;
                    if (/^\s+$/.test(czesc)) fragment.append(dokument.createTextNode(czesc));
                    else {
                        const span = dokument.createElement('span');
                        span.className = 'slowo-lektora';
                        span.textContent = czesc;
                        fragment.append(span);
                        slowa.push({ span, od, koniec: tekst.length });
                    }
                }
                wezel.replaceWith(fragment);
            } else if (wezel.nodeName === 'BR') tekst += '\n';
            else Array.from(wezel.childNodes).forEach(odwiedz);
        }
        odwiedz(element);
        const zdania = typeof Intl.Segmenter === 'function'
            ? Array.from(new Intl.Segmenter('pl', { granularity: 'sentence' }).segment(tekst))
            : Array.from(tekst.matchAll(/[^.!?\n]+[.!?]*\s*/g), m => ({ segment: m[0], index: m.index }));
        return zdania.filter(z => z.segment.trim()).map(z => ({
            tekst: z.segment,
            zaznacz(od, ile) {
                const poczatek = z.index + od;
                slowa.forEach(s => s.span.classList.toggle('czytane-teraz',
                    ile > 0 && s.od < poczatek + ile && s.koniec > poczatek));
            }
        }));
    });
}
