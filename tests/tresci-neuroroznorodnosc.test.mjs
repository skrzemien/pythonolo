import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const KATALOG_DANYCH = new URL('../data/', import.meta.url);
const KATALOG_JS = new URL('../js/', import.meta.url);

const spis = JSON.parse(fs.readFileSync(new URL('modules.json', KATALOG_DANYCH), 'utf8'));
const moduly = spis.moduly.map(m => JSON.parse(fs.readFileSync(new URL(`${m.id}.json`, KATALOG_DANYCH), 'utf8')));

function bezBlokowKodu(tekst) {
    return String(tekst || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]+`/g, ' ');
}

test('treści zadań i komunikaty JS nie zawierają form męskoosobowych ani potocznych idiomów', () => {
    const zakazaneWzorce = [
        /\bpodałeś\b/i,
        /\bwpisałeś\b/i,
        /\bzrobiłeś\b/i,
        /\bspróbuj sam\b/i,
        /\bsiedzi w zmiennej\b/i,
        /\bzałatwi(?:a)? sprawę\b/i,
        /\bułatwi sprawę\b/i,
        /\bkręci(?:ć)? się w kółko\b/i,
        /\butknęłaby\b/i,
        /\bprzykleić się\b/i,
        /\bsurowego tekstu\b/i,
        /\bw białe pola\b/i
    ];

    for (const modul of moduly) {
        for (const wzor of zakazaneWzorce) {
            assert.doesNotMatch(modul.wstep, wzor, `${modul.id}/wstep narusza ${wzor}`);
        }
        for (const z of modul.zadania) {
            const pelnyTekst = [z.tytul, z.opis, ...(z.podpowiedzi || [])].join('\n');
            for (const wzor of zakazaneWzorce) {
                assert.doesNotMatch(pelnyTekst, wzor, `${modul.id}/${z.id} narusza ${wzor}`);
            }
        }
    }

    for (const plik of ['bledy.js', 'exercise.js', 'stopka.js', 'ui.js']) {
        const kod = fs.readFileSync(new URL(plik, KATALOG_JS), 'utf8');
        for (const wzor of zakazaneWzorce) {
            assert.doesNotMatch(kod, wzor, `js/${plik} narusza ${wzor}`);
        }
    }
});

test('identyfikatory kodu i słowa kluczowe w opisach zadań są wyróżnione w grawisach', () => {
    const slowaKluczowe = new Set([
        'print', 'input', 'int', 'float', 'str', 'type', 'len', 'range', 'sum',
        'min', 'max', 'round', 'append', 'strip', 'upper', 'lower', 'split',
        'items', 'if', 'elif', 'else', 'while', 'for', 'in', 'and', 'or', 'not',
        'break', 'continue', 'def', 'return', 'True', 'False', 'None', 'sep', 'end'
    ]);

    for (const modul of moduly) {
        for (const z of modul.zadania) {
            let kodUzupelniony = z.kod || '';
            if (z.typ === 'uzupelnij' && Array.isArray(z.luki)) {
                const czesci = kodUzupelniony.split('___');
                kodUzupelniony = czesci
                    .map((c, i) => c + (i < czesci.length - 1 ? (z.luki[i]?.[0] ?? '') : ''))
                    .join('');
            }
            const kodZrodlowy = [kodUzupelniony, z.start || '', z.rozwiazanie || '']
                .join('\n')
                .replace(/#.*/g, '')
                .replace(/"[^"]*"|'[^']*'/g, ' ');
            const identyfikatory = new Set(kodZrodlowy.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []);
            const czystyOpis = bezBlokowKodu(z.opis);

            for (const id of identyfikatory) {
                if (id.length >= 2) {
                    const flagi = slowaKluczowe.has(id) ? 'iu' : 'u';
                    const wzor = new RegExp(`(?<![\\p{L}\\p{N}_])${id}(?![\\p{L}\\p{N}_])`, flagi);
                    assert.doesNotMatch(
                        czystyOpis,
                        wzor,
                        `${modul.id}/${z.id}: nieoznaczony identyfikator lub słowo kluczowe "${id}" w opisie`
                    );
                }
            }
        }
    }
});

test('zadania z własnym wywołaniem input() wyjaśniają, że tekst pytania jest dowolny', () => {
    for (const modul of moduly) {
        for (const z of modul.zadania) {
            const wejscie = z.wejscie || z.sprawdzenie?.wejscie || [];
            if (!wejscie.length || z.typ !== 'napisz') continue;
            const startMaInput = /\binput\s*\(/.test(z.start || '');
            if (!startMaInput) {
                assert.match(
                    z.opis,
                    /Tekst pytania wewnątrz `input\(\.\.\.\)` może być dowolny/,
                    `${modul.id}/${z.id}: brak informacji o dowolności tekstu zachęty w input()`
                );
            }
        }
    }
});
