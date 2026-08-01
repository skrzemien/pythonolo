# Python od A do Z

Statyczna strona z zadaniami z Pythona dla początkujących (ok. 12 lat). Kod pisze się
i uruchamia prosto w przeglądarce — bez instalowania czegokolwiek i bez konta.

**12 modułów, 110 zadań**: od `print` przez zmienne, warunki i pętle aż po funkcje,
słowniki i mini-projekty. Dwa pierwsze moduły są najdłuższe (po 12 zadań) — to
podstawy, na których stoi cała reszta.

## Jak to działa

- Python w przeglądarce to [Pyodide](https://pyodide.org) — prawdziwy CPython 3.14
  skompilowany do WebAssembly. Składnia i komunikaty błędów są identyczne jak
  w normalnym Pythonie.
- Kod uczy się wykonuje w Web Workerze, więc nieskończona pętla nie zawiesza strony —
  po 10 sekundach program jest zatrzymywany z komunikatem.
- Postęp zapisuje się w `localStorage` przeglądarki. Nic nie leci na żaden serwer.
- Zero budowania: czysty HTML, CSS i JavaScript. GitHub Pages serwuje pliki takie, jakie są.

## Dostępność

Na stronie głównej jest guzik **Tryb łatwiejszego czytania**. Włącza układ
przyjaźniejszy przy dysleksji — ustawienie zapamiętuje się i działa na wszystkich
podstronach, aż do wyłączenia tym samym guzikiem.

Co zmienia (wg wytycznych [British Dyslexia Association](https://www.bdadyslexia.org.uk/)):

- czcionka Verdana / Tahoma — szerokie, dobrze rozróżnialne litery,
- większy tekst (19 px) i luźniejsza interlinia (1,8),
- większe odstępy między literami, a jeszcze większe między wyrazami,
- krótsze linie tekstu (maks. ok. 58 znaków),
- zero kursywy i zero KAPITALIKÓW — utrudniają rozpoznanie kształtu wyrazu,
- większe guziki i pola do wpisywania (rosną razem z tekstem).

Kolorów tryb **nie zmienia** — tło i barwy tekstu zostają takie same jak zwykle.
To wyłącznie zmiana typografii.

Kod zostaje w czcionce o stałej szerokości nawet w tym trybie — wcięcia w Pythonie
muszą się zgadzać co do kolumny. Zmienia się tylko jego rozmiar i odstępy.

Bez specjalnej czcionki „dla dyslektyków". Badania (Rello i Baeza-Yates 2013,
Kuster i in. 2018) nie wykazały jej przewagi nad zwykłą bezszeryfową, a układ
robił się dziwaczny. Działa to, co wypisane wyżej. Dodatkowa korzyść: tryb nie
pobiera żadnych plików — Verdana i Tahoma są już w systemie.

Poza tym w całym serwisie:

- kontrast tekstu powyżej wymagań WCAG AA (najsłabsza para: 5,0:1),
- link „przejdź do treści" na początku każdej strony, widoczny po naciśnięciu Tab,
- wynik działania programu ogłaszany czytnikom ekranu (`role="log"`, `aria-live`),
- guziki wysokie na co najmniej 44 px, wygodne do trafienia palcem,
- animacje wyłączane przy systemowym ustawieniu „ogranicz ruch".

Dwa rodzaje zadań:

| Typ | Na czym polega |
|---|---|
| `uzupelnij` | Gotowy kod z lukami. Wpisujesz brakujące fragmenty, a po poprawnym uzupełnieniu program sam się uruchamia. |
| `napisz` | Piszesz kod od zera. Sprawdzarka porównuje wypisany wynik z oczekiwanym albo wywołuje Twoją funkcję własnymi testami. |

## Uruchomienie lokalnie

Strona używa modułów ES i `fetch`, więc otwarcie pliku przez `file://` nie zadziała —
potrzebny jest zwykły serwer HTTP:

```bash
python3 tools/serwer.py
```

Potem wejdź na `http://localhost:8123`. Port można podać jako argument: `python3 tools/serwer.py 9000`.

## Sprawdzanie treści zadań

Skrypt uruchamia wzorcowe rozwiązanie każdego zadania w lokalnym Pythonie i porównuje
wynik z tym, co obiecuje treść. Odpalaj po każdej zmianie w `data/`:

```bash
python3 tools/sprawdz-zadania.py
```

Można też sprawdzić pojedynczy moduł: `python3 tools/sprawdz-zadania.py 07-if`.

## Dodanie nowego zadania

Zadania siedzą w `data/<id-modułu>.json`, w tablicy `zadania`. Kolejność w pliku
= kolejność na stronie.

Zadanie typu **uzupełnij**:

```json
{
  "id": "for-1",
  "typ": "uzupelnij",
  "tytul": "Słowo łączące",
  "opis": "Uzupełnij słowo, które stoi między nazwą zmiennej a zestawem wartości.",
  "kod": "for i ___ range(3):\n    print(i)",
  "luki": [["in"]],
  "wyjscie": "0\n1\n2",
  "podpowiedzi": ["Po angielsku „w”.", "Wpisz `in`."]
}
```

Każde `___` w polu `kod` zamienia się w pole do wpisania. Tablica `luki` musi mieć
tyle samo elementów, co luk w kodzie — każdy element to lista **przyjmowanych**
odpowiedzi (wielkość liter nie ma znaczenia).

Zadanie typu **napisz**, sprawdzane po wypisanym wyniku:

```json
{
  "id": "for-4",
  "typ": "napisz",
  "tytul": "Pięć razy cześć",
  "opis": "Wypisz słowo `Cześć` pięć razy, każde w osobnej linii.",
  "start": "",
  "sprawdzenie": { "tryb": "wyjscie", "oczekiwane": "Cześć\nCześć\nCześć\nCześć\nCześć" },
  "podpowiedzi": ["`range(5)` da pięć obrotów."],
  "rozwiazanie": "for i in range(5):\n    print(\"Cześć\")"
}
```

Zadanie sprawdzane **testami** (gdy chodzi o funkcję, a nie o wypisany tekst):

```json
"sprawdzenie": {
  "tryb": "testy",
  "kod": "assert add(2, 3) == 5, \"add(2, 3) powinno dać 5\"\nassert add(0, 0) == 0, \"add(0, 0) powinno dać 0\""
}
```

Tekst po przecinku w `assert` jest tym, co zobaczy dziecko — pisz go po polsku
i konkretnie.

Jeśli zadanie korzysta z `input()`, podaj odpowiedzi z góry:

```json
"sprawdzenie": { "tryb": "wyjscie", "wejscie": ["3", "4"], "oczekiwane": "7" }
```

Zachęty z `input()` pokazują się w konsoli na szaro i **nie** wliczają się do
porównywanego wyniku — liczy się tylko to, co program wypisze przez `print`.

Pola `opis`, `wstep` i `podpowiedzi` obsługują skromny markdown: `` `kod` ``,
`**pogrubienie**`, listę punktowaną (`* `) i blok kodu w potrójnych grawisach.

### Uwaga na postęp uczniów

Postęp jest zapisywany pod **identyfikatorem** zadania, a nie pod jego pozycją:
`{"09-for": {"for-5": {"status": "ok"}}}`. Wynikają z tego dwie zasady:

- **Nigdy nie zmieniaj `id` istniejącego zadania** ani go nie usuwaj — uczeń
  straciłby zaliczenie.
- **Wstawianie nowych zadań w środek modułu jest bezpieczne.** Zaliczenia idą
  za zadaniem, nawet gdy przesunie się na dalszą pozycję. Zmienia się tylko
  numer w adresie `?z=N`, więc stary zakładkowany link może trafić w sąsiednie
  zadanie.

Nowe zadania dostają opisowe identyfikatory (`for-schodki`, `if-lub`), a nie
kolejny numer — dzięki temu od razu widać, co jest dopisane po wydaniu, i nie ma
ryzyka kolizji z istniejącą numeracją.

Dopisując zadania po wydaniu, dorzuć wpis do `data/zmiany.json` — trafi na stronę
**Zmiany** (guzik w stopce). We wpisie podajesz tylko identyfikatory zadań;
tytuły, moduły i adresy dolatują z plików modułów przy wyświetlaniu, więc linki
nie zgniją, gdy zadanie zmieni pozycję.

Po dopisaniu zadania zaktualizuj licznik i sprawdź treść:

```bash
python3 tools/sprawdz-zadania.py
```

Walidator sam zgłosi, jeśli `liczbaZadan` w `data/modules.json` przestanie się zgadzać.

## Publikacja na GitHub Pages

Repozytorium jest gotowe do serwowania z katalogu głównego — plik `.nojekyll` pilnuje,
żeby Jekyll niczego nie przerabiał.

1. `git init`, commit i push do repozytorium na GitHubie.
2. Settings → Pages → Source: `Deploy from a branch`, gałąź `main`, katalog `/ (root)`.
3. Po chwili strona jest pod `https://<użytkownik>.github.io/<repo>/`.

Strona pobiera Pyodide i CodeMirror z CDN jsDelivr, więc do działania potrzebny jest
internet. Pierwsze wejście ściąga ok. 10 MB Pyodide (kilka sekund), kolejne idą
z pamięci podręcznej przeglądarki.

## Struktura

```
index.html            strona główna z kafelkami modułów
modul.html            lista zadań w module
cwiczenie.html        pojedyncze zadanie
piaskownica.html      wolny edytor bez zadania
zmiany.html           lista tego, co doszło w zadaniach
css/style.css
js/pyodide-worker.js  worker: uruchamia kod w Pyodide
js/runner.js          limit czasu, Stop, restart workera
js/exercise.js        logika zadania i sprawdzania
js/bledy.js           tłumaczenie wyjątków Pythona na polskie podpowiedzi
js/progress.js        postęp w localStorage
js/stopka.js          guzik „Zacznij od nowa" w stopce każdej strony
js/dostepnosc.js      przełącznik trybu łatwiejszego czytania
js/zmiany.js          renderowanie listy zmian
data/                 treść zadań
data/zmiany.json      wpisy na stronę „Zmiany"
tools/                serwer lokalny i walidator treści
```
