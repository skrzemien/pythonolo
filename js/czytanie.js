/* Czytanie polecenia przez syntezator mowy przeglądarki. */
export function podepnijCzytanie(przycisk, status, tekst, okno = window) {
    const synteza = okno.speechSynthesis;
    let biezaca = null;

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
            const mowa = new okno.SpeechSynthesisUtterance(tekst);
            mowa.lang = 'pl-PL';
            mowa.rate = 0.95;
            // Lista może być pusta przy otwarciu strony. Odczytujemy ją na nowo
            // przy każdym kliknięciu; bez listy silnik dobiera głos do języka.
            const polskie = synteza.getVoices().filter(g => /^pl(?:[-_]|$)/i.test(g.lang));
            const glos = polskie.find(g => g.localService) || polskie[0];
            if (glos) mowa.voice = glos;

            biezaca = mowa;
            ustawStan(true);
            mowa.onend = () => {
                if (biezaca !== mowa) return;
                biezaca = null;
                ustawStan(false);
            };
            mowa.onerror = () => {
                if (biezaca !== mowa) return;
                biezaca = null;
                ustawStan(false);
                status.textContent = 'Nie udało się odczytać polecenia. Sprawdź, czy masz dostępny polski głos w systemie lub przeglądarce, i spróbuj ponownie.';
            };
            synteza.speak(mowa);
        } catch (e) {
            biezaca = null;
            ustawStan(false);
            status.textContent = 'Czytanie jest niedostępne. Spróbuj ponownie lub użyj innej przeglądarki.';
        }
    });

    okno.addEventListener('pagehide', zatrzymaj);
}
