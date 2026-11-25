/* Tłumaczenie wyjątków Pythona na podpowiedź po polsku.
   Oryginalny komunikat zawsze zostaje pokazany obok — dziecko ma się nauczyć
   go czytać, a nie tylko dostać gotową odpowiedź. */

/** Reguły sprawdzane po kolei; pierwsza pasująca wygrywa. */
const REGULY = [
    // --- błędy składni ---
    {
        nazwa: 'SyntaxError',
        wzor: /expected ':'/i,
        tekst: 'Brakuje dwukropka. Linie z `if`, `else`, `for`, `while` i `def` muszą kończyć się znakiem `:`.'
    },
    {
        nazwa: 'SyntaxError',
        wzor: /unterminated string literal|EOL while scanning string/i,
        tekst: 'Niedomknięty tekst. Napis musi mieć cudzysłów na początku i na końcu, np. `"Cześć"`.'
    },
    {
        nazwa: 'SyntaxError',
        wzor: /was never closed|unexpected EOF/i,
        tekst: 'Otwarty nawias, którego nic nie zamyka. Policz nawiasy `(` i `)` — musi ich być tyle samo.'
    },
    {
        nazwa: 'SyntaxError',
        wzor: /invalid decimal literal|leading zeros/i,
        tekst: 'Nieprawidłowy zapis liczby lub nazwy zmiennej. Nazwa zmiennej nie może zaczynać się od cyfry, a liczba całkowita od zera (np. `05`).'
    },
    {
        nazwa: 'SyntaxError',
        wzor: /cannot assign to|invalid syntax.*=|assign to literal/i,
        tekst: 'Sprawdź znaki równości: `=` przypisuje wartość do zmiennej, a `==` sprawdza, czy dwie rzeczy są równe.'
    },
    {
        nazwa: 'SyntaxError',
        wzor: /Missing parentheses in call to 'print'/i,
        tekst: 'W Pythonie 3 `print` wymaga nawiasów: `print("tekst")`.'
    },
    {
        nazwa: 'SyntaxError',
        tekst: 'Python nie rozumie zapisu w tej linii. Najczęstsze przyczyny: brak dwukropka `:`, '
            + 'niedomknięty nawias albo cudzysłów, literówka w słowie kluczowym.'
    },

    // --- wcięcia ---
    {
        nazwa: 'IndentationError',
        wzor: /expected an indented block/i,
        tekst: 'Po dwukropku musi być wcięcie. Linie w środku `if`, `for`, `while` albo `def` '
            + 'zaczynamy 4 spacjami od lewej.'
    },
    {
        nazwa: 'IndentationError',
        wzor: /unexpected indent/i,
        tekst: 'Ta linia ma wcięcie, którego nic nie wymaga. Usuń spacje z początku linii.'
    },
    {
        nazwa: 'IndentationError',
        tekst: 'Wcięcia się nie zgadzają. Wszystkie linie w tym samym bloku muszą mieć '
            + 'dokładnie tyle samo spacji z lewej strony.'
    },
    {
        nazwa: 'TabError',
        tekst: 'W kodzie mieszają się tabulatory i spacje. Używaj tylko spacji — 4 na jeden poziom wcięcia.'
    },

    // --- nazwy ---
    {
        nazwa: 'NameError',
        wzor: /name '(.+?)' is not defined/i,
        tekst: (m) => `Python nie zna nazwy \`${m[1]}\`. Sprawdź literówkę albo czy ta zmienna `
            + `(lub funkcja) została utworzona wcześniej — zawsze najpierw tworzymy, potem używamy.`
    },

    // --- typy ---
    {
        nazwa: 'TypeError',
        wzor: /can only concatenate str \(not "(.+?)"\) to str|unsupported operand type\(s\) for \+: '(.+?)' and '(.+?)'/i,
        tekst: 'Nie da się dodać tekstu do liczby. Zamień liczbę na tekst przez `str(liczba)` '
            + 'albo użyj f-stringa: `f"Mam {wiek} lat"`.'
    },
    {
        nazwa: 'TypeError',
        wzor: /'(.+?)' object is not callable/i,
        tekst: (m) => `Próbujesz wywołać \`${m[1]}\` jak funkcję, a ta wartość nie jest funkcją. `
            + `Sprawdź, czy wcześniej nie utworzono zmiennej o tej samej nazwie co funkcja (np. \`print = ...\`).`
    },
    {
        nazwa: 'TypeError',
        wzor: /takes (\d+) positional arguments? but (\d+) (?:was|were) given/i,
        tekst: (m) => `Funkcja oczekuje innej liczby argumentów (oczekiwano: \`${m[1]}\`, podano: \`${m[2]}\`). `
            + `Policz wartości wpisane w nawiasach.`
    },
    {
        nazwa: 'TypeError',
        wzor: /missing (\d+) required positional argument/i,
        tekst: 'Funkcji brakuje argumentu. Sprawdź, ile wartości trzeba podać w nawiasach.'
    },
    {
        nazwa: 'TypeError',
        wzor: /'(.+?)' object is not subscriptable/i,
        tekst: 'Nawiasów kwadratowych `[ ]` można używać na tekstach, listach i słownikach — nie na liczbach.'
    },
    {
        nazwa: 'TypeError',
        tekst: 'Niezgodne typy danych — na przykład użyto liczby tam, gdzie potrzebny jest tekst. '
            + 'Do zamiany typu służą `str()`, `int()` oraz `float()`.'
    },

    // --- wartości ---
    {
        nazwa: 'ValueError',
        wzor: /invalid literal for int\(\) with base 10: '(.*)'/i,
        tekst: (m) => `\`int()\` nie umie zamienić \`"${m[1]}"\` na liczbę całkowitą. `
            + `Zamieniać można tylko tekst, w którym są same cyfry.`
    },
    {
        nazwa: 'ValueError',
        wzor: /could not convert string to float/i,
        tekst: '`float()` nie umie zamienić tego tekstu na liczbę. Ułamki zapisujemy z kropką, np. `3.5`.'
    },
    {
        nazwa: 'ValueError',
        wzor: /not in list/i,
        tekst: 'Szukanej wartości nie ma na liście. Sprawdź pisownię — wielkość liter ma znaczenie.'
    },
    {
        nazwa: 'ValueError',
        tekst: 'Wartość ma odpowiedni typ, ale nieprawidłową zawartość lub zakres. Sprawdź dokładnie przekazywane dane.'
    },

    // --- reszta ---
    {
        nazwa: 'ZeroDivisionError',
        tekst: 'Dzielenie przez zero. W matematyce i w Pythonie to niedozwolone — '
            + 'sprawdź wartość dzielnika przed dzieleniem.'
    },
    {
        nazwa: 'IndexError',
        tekst: 'Sięgasz po element, którego nie ma. Elementy liczymy od `0`, '
            + 'więc w liście 3-elementowej ostatni ma numer `2`.'
    },
    {
        nazwa: 'KeyError',
        wzor: /'(.*)'/,
        tekst: (m) => `W słowniku nie ma klucza \`${m[1]}\`. Sprawdź pisownię — wielkość liter ma znaczenie.`
    },
    {
        nazwa: 'AttributeError',
        wzor: /'(.+?)' object has no attribute '(.+?)'/i,
        tekst: (m) => `Typ \`${m[1]}\` nie ma metody ani atrybutu o nazwie \`${m[2]}\`. Sprawdź pisownię `
            + `nazwy po kropce (np. \`append\`, a nie \`apend\`).`
    },
    {
        nazwa: 'ImportError',
        tekst: 'Nie udało się zaimportować modułu. Na tej stronie dostępne są wbudowane moduły Pythona (np. `math`, `random`) oraz `pygame`.'
    },
    {
        nazwa: 'ModuleNotFoundError',
        tekst: 'Nie ma takiego modułu. Sprawdź nazwę po słowie `import`.'
    },
    {
        nazwa: 'RecursionError',
        tekst: 'Funkcja wywołuje samą siebie bez końca. Potrzebny warunek, który przerwie ten łańcuch.'
    },
    {
        nazwa: 'EOFError',
        tekst: 'Program prosi o dane przez `input()`, ale zadanie ich nie przewiduje. '
            + 'Usuń `input()` albo rozwiąż zadanie bez pytania użytkownika.'
    },
    {
        nazwa: 'AssertionError',
        tekst: 'Sprawdzenie wykryło, że wynik jest inny niż oczekiwany.'
    },
    {
        nazwa: 'KeyboardInterrupt',
        tekst: 'Program został przerwany.'
    }
];

/**
 * @param {{nazwa: string, komunikat: string}} blad
 * @returns {string|null} podpowiedź po polsku albo null, jeśli brak reguły
 */
export function wyjasnijBlad(blad) {
    if (!blad || !blad.nazwa) return null;

    for (const regula of REGULY) {
        if (regula.nazwa !== blad.nazwa) continue;
        if (!regula.wzor) {
            return typeof regula.tekst === 'function' ? regula.tekst([]) : regula.tekst;
        }
        const trafienie = String(blad.komunikat || '').match(regula.wzor);
        if (trafienie) {
            return typeof regula.tekst === 'function' ? regula.tekst(trafienie) : regula.tekst;
        }
    }
    return null;
}

/** Krótki, przyjazny nagłówek błędu. */
export function naglowekBledu(blad) {
    if (!blad) return 'Wystąpił błąd podczas uruchamiania';
    if (blad.nazwa === 'ZaDlugo') return 'Program działał za długo';
    if (blad.nazwa === 'Zatrzymane') return 'Program zatrzymany';
    if (blad.zrodlo === 'srodowisko') return 'Problem z uruchomieniem';
    if (blad.nazwa === 'SyntaxError' || blad.nazwa === 'IndentationError' || blad.nazwa === 'TabError') {
        return blad.linia ? `Błąd składni w linii ${blad.linia}` : 'Błąd składni';
    }
    return blad.linia ? `Błąd w linii ${blad.linia}: ${blad.nazwa}` : `Błąd: ${blad.nazwa}`;
}
