/* Tryb czytania dla dyslektyków.

   Sam przełącznik jest na stronie głównej, ale ustawienie działa na całej
   stronie — leży w localStorage, a każda podstrona odczytuje je krótkim
   skryptem w <head>, zanim cokolwiek się narysuje (żeby nie mrugało). */

const KLUCZ = 'python-az:tryb-czytania';
const TRYB = 'dysleksja';

export function trybWlaczony() {
    return document.documentElement.dataset.tryb === TRYB;
}

function zapisz(wlaczony) {
    try {
        if (wlaczony) localStorage.setItem(KLUCZ, TRYB);
        else localStorage.removeItem(KLUCZ);
    } catch (e) {
        // Tryb prywatny albo zablokowany localStorage — ustawienie zadziała
        // do końca wizyty, po prostu się nie zapamięta.
        console.warn('Nie udało się zapisać trybu czytania:', e);
    }
}

function opiszPrzycisk(przycisk, wlaczony) {
    przycisk.setAttribute('aria-pressed', String(wlaczony));
    przycisk.innerHTML = wlaczony
        ? '<span aria-hidden="true">✓</span> Tryb czytania włączony'
        : '<span aria-hidden="true">🔠</span> Tryb łatwiejszego czytania';
    przycisk.title = wlaczony
        ? 'Wyłącz większy tekst i szersze odstępy'
        : 'Większy tekst, szersze odstępy między literami, cieplejsze tło';
}

function opiszStan(pojemnik, wlaczony) {
    if (!pojemnik) return;
    pojemnik.hidden = !wlaczony;
    pojemnik.textContent = wlaczony
        ? 'Tryb łatwiejszego czytania jest włączony na wszystkich stronach: '
            + 'większy tekst, szersze odstępy między literami i wierszami, '
            + 'kremowe tło zamiast białego. Wyłączysz go tym samym guzikiem.'
        : '';
}

export function ustaw(wlaczony) {
    if (wlaczony) document.documentElement.dataset.tryb = TRYB;
    else delete document.documentElement.dataset.tryb;
    zapisz(wlaczony);
}

/** Podpina przełącznik, jeśli strona go ma. */
export function podepnijTrybCzytania() {
    const przycisk = document.getElementById('tryb-czytania');
    if (!przycisk) return;

    const info = document.getElementById('tryb-czytania-info');
    opiszPrzycisk(przycisk, trybWlaczony());
    opiszStan(info, trybWlaczony());

    przycisk.addEventListener('click', () => {
        const nowy = !trybWlaczony();
        ustaw(nowy);
        opiszPrzycisk(przycisk, nowy);
        opiszStan(info, nowy);
    });
}
