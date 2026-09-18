/* Czytanie polecenia przez syntezator mowy przeglądarki. */
export function podepnijCzytanie(przycisk, status, tekst, okno = window) {
    const synteza = okno.speechSynthesis;
    let biezaca = null;
    let czesci = [];
    const wyczysc = () => czesci.forEach(c => c.zaznacz?.(0, 0));

    function ustawStan(czyta) {
        przycisk.textContent = czyta ? '⏹ Zatrzymaj czytanie' : '🔊 Czytaj polecenie';
    }

    ustawStan(false);
    if (!synteza || !okno.SpeechSynthesisUtterance) {
        przycisk.disabled = true;
        status.textContent = 'Ta przeglądarka nie obsługuje czytania na głos.';
        return;
    }

    function zatrzymaj() {
        // Zdarzenie anulowanej wypowiedzi może nadejść już po kolejnym kliknięciu.
        biezaca = null;
        wyczysc();
        synteza.cancel();
        ustawStan(false);
        status.textContent = '';
    }

    przycisk.addEventListener('click', () => {
        if (biezaca) {
            zatrzymaj();
            return;
        }

        status.textContent = '';
        try {
            synteza.cancel();
            czesci = typeof tekst === 'function' ? tekst() : [{ tekst }];
            czytajCzesc(0);
        } catch (e) {
            awaria();
        }
    });

    function awaria() {
        biezaca = null;
        wyczysc();
        ustawStan(false);
        status.textContent = 'Nie udało się odczytać polecenia. Sprawdź, czy masz dostępny polski głos w systemie lub przeglądarce, i spróbuj ponownie.';
    }

    function czytajCzesc(indeks) {
        const czesc = czesci[indeks];
        if (!czesc) {
            biezaca = null;
            wyczysc();
            ustawStan(false);
            return;
        }
        try {
            const mowa = new okno.SpeechSynthesisUtterance(czesc.tekst);
            mowa.lang = 'pl-PL';
            mowa.rate = 0.95;
            // Lista może być pusta przy otwarciu strony. Odczytujemy ją na nowo
            // przy każdym kliknięciu; bez listy silnik dobiera głos do języka.
            const polskie = synteza.getVoices().filter(g => /^pl(?:[-_]|$)/i.test(g.lang));
            const glos = polskie.find(g => g.localService) || polskie[0];
            if (glos) mowa.voice = glos;

            biezaca = mowa;
            ustawStan(true);
            mowa.onstart = () => {
                if (biezaca === mowa) czesc.zaznacz?.(0, czesc.tekst.length);
            };
            mowa.onboundary = ev => {
                if (biezaca !== mowa || ev.name !== 'word') return;
                if (!Number.isInteger(ev.charIndex) || ev.charIndex < 0 || ev.charIndex >= czesc.tekst.length) return;
                const ile = ev.charLength > 0 ? ev.charLength
                    : (czesc.tekst.slice(ev.charIndex).match(/^\S+/)?.[0].length || 0);
                if (ile) czesc.zaznacz?.(ev.charIndex, ile);
            };
            mowa.onend = () => {
                if (biezaca !== mowa) return;
                czesc.zaznacz?.(0, 0);
                czytajCzesc(indeks + 1);
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
