# Instrukcje dla agentów AI (`pythonolo` — Python od A do Z)

Ten plik definiuje obowiązujące zasady merytoryczne, językowe, dostępnościowe i techniczne dla wszystkich agentów AI edytujących kod, komunikaty interfejsu oraz treść zadań w repozytorium.

## 1. Kontekst projektu i grupa docelowa

**Python od A do Z** to statyczna strona edukacyjna do nauki Pythona w przeglądarce (Pyodide / CPython 3.14 w Web Workerze, zero backendu, zero budowania).

Docelowi odbiorcy to **dzieci i młodzież (ok. 11–14 lat)** stawiający pierwsze kroki w programowaniu, ze **szczególnym uwzględnieniem uczniów neuroróżnorodnych**:
- w **spektrum autyzmu (ASD)** — przetwarzających tekst dosłownie, wrażliwych na niejednoznaczność, brak precyzji, ukryte założenia oraz niespójną strukturę,
- z **ADHD** — potrzebujących krótkich porcji informacji (*chunking*), jednoznacznego wyróżnienia elementów kodu w tekście, szybkiej i wspierającej informacji zwrotnej bez oceniania (*RSD — Rejection Sensitive Dysphoria*) oraz niskiego obciążenia pamięci roboczej,
- z **dysleksją** i trudnościami w czytaniu — korzystających z wbudowanego trybu łatwiejszego czytania oraz syntezatora mowy (`Web Speech API`).

## 2. Podstawy naukowe wytycznych

Każda treść w `data/*.json` oraz komunikat w `js/*.js` i `*.html` musi być zgodna z poniższymi standardami:
1. **W3C WAI COGA** (*Making Content Usable for People with Cognitive and Learning Disabilities*, Seeman i in., 2021) — wzorce *Use Literal Language*, *Use Clear Step-by-Step Instructions*, *Provide Clear Help and Feedback*.
2. **CAST Universal Design for Learning (UDL Guidelines 2.2 / 3.0)** — wyjaśnianie symboli i składni (2.1, 2.2), wsparcie funkcji wykonawczych i pamięci roboczej (6.1–6.3), bezpieczne środowisko bez zagrożeń afektywnych (7.3, 8.4).
3. **Teoria obciążenia poznawczego (Cognitive Load Theory — Sweller, 1988; Sweller, van Merriënboer i Paas, 2019)** — redukcja obciążenia ubocznego (*extraneous load*) wynikającego z mieszania nazw zmiennych z polską prozą lub rozproszenia uwagi (*split-attention*).
4. **Pedagogika informatyki (PRIMM — Sentance, Waite i Kallia, 2019; badania nad włączającą edukacją CS — Israel i in., 2015, 2020; Raspberry Pi Foundation Pedagogy)** — stopniowanie samodzielności od uzupełniania luk (`uzupelnij`) do pisania kodu (`napisz`) z jawnym wzorem oczekiwanego efektu (*What A Good One Looks Like*).
5. **British Dyslexia Association (BDA Style Guide)** — czytelna typografia, brak ścian tekstu, brak pisania całych zdań WERSALIKAMI lub kursywą.

## 3. Zasady redagowania zadań i komunikatów (ASD / ADHD)

### 3.1. Dosłowność i precyzja (zakaz idiomów i metafor)
- **Pisz dosłownie.** Unikaj frazeologizmów, potocznych przenośni i personifikacji kodu:
  - Źle: *„Siódemka siedzi w zmiennej `a`”*, *„To załatwia sprawę”*, *„F-string ułatwi sprawę”*, *„Pętla kręci się w kółko”*, *„Pętla utknęłaby na trójce”*, *„Wykrzyknik musi przykleić się do imienia”*, *„Opakuj surowy tekst”*, *„Wypisz tę liczbę, która wygrywa”*.
  - Dobrze: *„Liczba `7` jest zapisana w zmiennej `a`”*, *„Wystarczy `return n % 2 == 0`”*, *„Pętla powtarza się bez końca”*, *„Wykrzyknik zapisz bezpośrednio po imieniu, bez spacji”*, *„Zamień tekst zwrócony przez `input()` na liczbę przez `int(...)`”*, *„Wypisz większą wartość”*.
- **Analogie oznaczaj jawnie jako porównanie**, a nie dosłowny fakt:
  - Źle: *„Zmienna to pudełko.”*
  - Dobrze: *„Zmienną możesz potraktować jak podpisane pudełko, w którym przechowujesz jedną wartość.”*
- **Prawdziwość techniczna:** nie podawaj uproszczeń sprzecznych z rzeczywistym działaniem Pythona 3 (np. pisz *„w nazwach zmiennych nie używamy spacji i zwyczajowo unikamy polskich liter”* zamiast sugerować, że Python zgłosi błąd składni przy polskiej literze; pisz *„liczba z częścią dziesiętną, np. `3.5`”* zamiast niejednoznacznego słowa *„ułamek”*).

### 3.2. Obowiązkowe wyróżnianie kodu w grawisach (`` `...` ``)
Uczniowie z ADHD skanują tekst wzrokiem, a uczniowie w spektrum autyzmu czytają go ściśle znak po znaku. W języku polskim jednoliterowe zmienne (`a`, `i`, `w`, `o`, `z`) wyglądają identycznie jak spójniki i przyimki, a angielskie słowa (`in`, `or`, `not`, `print`, `input`) zlewają się ze zdaniem.
- **Każdy element kodu w tekście polecenia i podpowiedzi MUSI być ujęty w `` `...` ``**:
  - nazwy zmiennych i argumentów: `` `a` ``, `` `b` ``, `` `i` ``, `` `n` ``, `` `score` ``, `` `clean_name` ``,
  - słowa kluczowe i funkcje/metody: `` `print` ``, `` `input` ``, `` `int` ``, `` `float` ``, `` `str` ``, `` `len` ``, `` `range` ``, `` `sum` ``, `` `append` ``, `` `strip` ``, `` `if` ``, `` `elif` ``, `` `else` ``, `` `while` ``, `` `for` ``, `` `in` ``, `` `break` ``, `` `continue` ``, `` `def` ``, `` `return` ``, `` `True` ``, `` `False` ``,
  - operatory i parametry nazwane: `` `+` ``, `` `==` ``, `` `!=` ``, `` `>=` ``, `` `//` ``, `` `%` ``, `` `**` ``, `` `sep` ``, `` `end` ``,
  - dokładne wartości liczbowe i tekstowe, które uczeń ma wpisać lub porównać: `` `12` ``, `` `"Ala"` `` lub `` `Cześć! Uczę się Pythona.` `` (żeby było całkowicie jasne, czy kropka lub spacja należy do napisu, czy kończy zdanie instrukcji).

### 3.3. Porcjowanie informacji (*Chunking*) i przewidywalny układ
Każde pole `opis` musi mieć stałą, przewidywalną budowę:
1. **Cel zadania (1 krótkie zdanie na górze)** — co program lub funkcja ma zrobić (bez zagłębiania się w szczegóły składni).
2. **Kroki wykonania (lista `* `, 2–4 punkty)** — w kolejności pisania kodu:
   - jeden punkt opisuje jedną główną czynność,
   - zdania powinny być krótkie i bezpośrednie (docelowo do 16–18 słów; unikaj zdań wielokrotnie złożonych),
   - liczby oznaczające ilości, indeksy, argumenty i wcięcia zapisuj cyframi (`0`, `3`, `4 spacje`), nie słownie.
3. **Informacja o `input()` (tylko w zadaniach z wejściem)** — zawsze w tej samej, przewidywalnej formie:
   - `Na tej stronie odpowiedzi są przygotowane z góry. Program otrzyma kolejno: \`...\`. Nie wpisuj ich ręcznie podczas uruchamiania.`
   - Jeśli uczeń sam pisze wywołanie `input(...)`, zaznacz, że tekst pytania wewnątrz `input(...)` może być dowolny, bo sprawdzarka ocenia wyłącznie wynik wypisany przez `print()`.
4. **Stałe zakończenie (instrukcja działania + wzór wyniku)**:
   - dla `uzupelnij`: `Kliknij **Sprawdź**. Po poprawnym uzupełnieniu kod uruchomi się sam. Porównaj wynik ze wzorem:` + wzór wyniku (lub w zadaniach graficznych `pygame` bez `print`: `Kliknij **Sprawdź**. Po poprawnym uzupełnieniu kod uruchomi się sam i wyświetli okno gry poniżej.`),
   - dla `napisz` (`tryb: "wyjscie"`): `Kliknij **Uruchom** i porównaj wynik ze wzorem poniżej. Gdy wynik się zgadza, kliknij **Sprawdź**.` + wzór wyniku,
   - dla `napisz` (`tryb: "testy"` — funkcja): `Kliknij **Sprawdź**. Sprawdzarka wywoła Twoją funkcję dla kilku zestawów danych (nie musisz dodawać \`print\`). Jeśli pojawi się komunikat błędu, popraw wskazany przypadek.`,
   - dla `napisz` (`tryb: "testy"` — skrypt graficzny `pygame`): `Kliknij **Uruchom**, aby zobaczyć podgląd okna gry poniżej, a następnie kliknij **Sprawdź**. Jeśli pojawi się komunikat błędu, popraw wskazany element.`

### 3.4. Jawność warunków brzegowych
- Zawsze precyzuj, czy granice zakresu należą do wyniku (*„od `1` do `5` włącznie”*, *„co najmniej `20` (czyli `>= 20`)”*).
- W zadaniach z funkcjami (`tryb: "testy"`) wskaż zachowanie dla przypadków brzegowych testowanych przez `assert` (np. pusta lista `[]`, wartość `0`, liczby ujemne, równe argumenty).
- Określaj dokładne odstępy i znaki interpunkcyjne w oczekiwanym tekście (np. spacja po dwukropku, brak spacji przed `!`).

### 3.5. Bezpieczny emocjonalnie, włączający i bezosobowy ton
- **Zakaz form nacechowanych płciowo** zwracających się do ucznia: nigdy nie używaj form *„podałeś / podałaś”*, *„wpisałeś”*, *„zrobiłeś”*, *„spróbuj sam / sama”*. Stosuj tryb rozkazujący 2. osoby liczby pojedynczej (*„Wpisz”*, *„Sprawdź”*, *„Spróbuj samodzielnie”*) lub formy bezosobowe (*„Podano…”*).
- ** Rzeczowe komunikaty błędów (wsparcie przy RSD w ADHD):** komunikat błędu w `js/bledy.js`, `js/exercise.js` oraz tekst po przecinku w `assert` muszą spokojnie nazywać przyczynę i następny krok naprawczy. Unikaj ogólników (*„Jeszcze nie to”*, *„Coś poszło nie tak”*, *„Coś nie pasuje”*), wykrzykników w komunikatach błędów oraz oceniania ucznia.
- **Zgodność z rzeczywistym interfejsem i WCAG 1.4.1:** nie odwołuj się do nieistniejących kolorów kontrolek (np. nie pisz *„białe pola”*, gdy pola `.luka` mają ciemne tło) ani nie używaj samego koloru jako jedynej wskazówki (*„wyróżnione pola”* zamiast samego *„czerwone pola”*).

## 4. Reguły techniczne i ochrona postępu uczniów

1. **Nienaruszalność identyfikatorów:** postęp ucznia w `localStorage` jest zapisywany pod kluczem `id` zadania (`{"09-for": {"for-5": {"status": "ok"}}}`). **Nigdy nie zmieniaj `id` istniejącego zadania ani go nie usuwaj.**
2. **Dodawanie nowych zadań:**
   - nadawaj opisowe identyfikatory (np. `for-schodki`, `listy-srednia-ocen`),
   - zaktualizuj pole `liczbaZadan` w `data/modules.json`,
   - dodaj wpis w `data/zmiany.json` (tytuły i linki wyliczają się dynamicznie w `js/zmiany.js`).
3. **Architektura zero-build:**
   - czysty HTML, CSS i moduły ES (`js/*.js`), bez bundlerów i zależności npm w kodzie produkcyjnym,
   - escapuj dane wstawiane do `innerHTML` funkcją `esc()` z `js/dane.js`.
4. **Obowiązkowa weryfikacja przed zakończeniem pracy:**
   Po każdej zmianie w `data/` lub `js/` uruchom oba polecenia i upewnij się, że kończą się bez błędów:
   ```bash
   python tools/sprawdz-zadania.py
   node --test
   ```
