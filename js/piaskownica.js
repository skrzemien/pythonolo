/* Piaskownica — wolny edytor bez zadania. */

import { utworzEdytor } from './editor.js';
import { Uruchamiacz } from './runner.js';
import { Konsola, ustawStan, pokazBlad, schowajWynik } from './ui.js';
import { podepnijWyczyszczeniePostepu } from './stopka.js';

const KLUCZ_KODU = 'python-az:piaskownica';

const KOD_STARTOWY = `# Napisz tu, co chcesz, i naciśnij Uruchom (Ctrl+Enter).

print("Cześć! Tu Python.")

for i in range(1, 4):
    print(i, "razy 7 to", i * 7)
`;

const elStan = document.getElementById('stan');
const elWynik = document.getElementById('wynik');
const konsola = new Konsola(document.getElementById('konsola'));

const przyciskUruchom = document.getElementById('uruchom');
const przyciskStop = document.getElementById('stop');

let zapamietany = null;
try { zapamietany = localStorage.getItem(KLUCZ_KODU); } catch (e) { /* tryb prywatny */ }

const edytor = utworzEdytor(document.getElementById('edytor'), {
    wartosc: zapamietany || KOD_STARTOWY,
    onUruchom: () => uruchom()
});

edytor.on('change', () => {
    try { localStorage.setItem(KLUCZ_KODU, edytor.getValue()); } catch (e) { /* nieistotne */ }
});

const uruchamiacz = new Uruchamiacz({
    onStan: stan => {
        ustawStan(elStan, stan);
        przyciskUruchom.disabled = (stan === 'pracuje');
        przyciskStop.disabled = (stan !== 'pracuje');
    },
    onWyjscie: (strumien, tekst) => konsola.dopisz(strumien, tekst)
});

function daneWejsciowe() {
    const tekst = document.getElementById('wejscie').value;
    if (!tekst.trim()) return [];
    return tekst.replace(/\r\n?/g, '\n').split('\n');
}

async function uruchom() {
    konsola.wyczysc();
    schowajWynik(elWynik);

    const wynik = await uruchamiacz.uruchom({
        kod: edytor.getValue(),
        wejscie: daneWejsciowe()
    });

    if (!wynik.ok && wynik.blad) {
        pokazBlad(elWynik, wynik.blad);
    }
    if (wynik.ok && konsola.pusta) {
        konsola.info('(program zakończył się bez wypisywania czegokolwiek)');
    }
}

przyciskUruchom.addEventListener('click', uruchom);
przyciskStop.addEventListener('click', () => uruchamiacz.przerwij());

document.getElementById('wyczysc').addEventListener('click', () => {
    edytor.setValue('');
    edytor.focus();
});

podepnijWyczyszczeniePostepu();
