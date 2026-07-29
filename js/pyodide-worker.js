/* Web Worker uruchamiający kod Pythona przez Pyodide.
 *
 * Dlaczego worker, a nie główny wątek: uczeń prędzej czy później napisze
 * `while True:`. W workerze da się to przerwać przez worker.terminate();
 * na głównym wątku zawiesiłoby całą stronę razem z przyciskiem "Stop".
 *
 * Worker jest modułem ES (`new Worker(..., { type: 'module' })`) — dzięki temu
 * Pyodide dochodzi zwykłym `import`, bez `importScripts`.
 *
 * Protokół wiadomości
 *   main -> worker: { typ: 'uruchom', id, kod, kodTestu?, wejscie? }
 *   worker -> main: { typ: 'gotowy' }
 *                   { typ: 'blad-startu', komunikat }
 *                   { typ: 'wyjscie', id, strumien: 'stdout'|'stderr'|'wejscie', tekst }
 *                   { typ: 'koniec', id, ok, stdout, blad? }
 */

import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.3/full/pyodide.mjs';

// Ta sama wersja co w imporcie powyżej — Pyodide potrzebuje jej też do
// dociągnięcia plików .wasm i biblioteki standardowej.
const BAZA = 'https://cdn.jsdelivr.net/pyodide/v314.0.3/full/';

let pyodide = null;
let idBiezacego = null;
let buforStdout = '';

/* --- warstwa Pythona ------------------------------------------------------ */

const PRELUDIUM = `
import builtins, json, sys, traceback
import _host  # moduł zarejestrowany po stronie JavaScriptu

_kolejka_wejscia = []

def _ustaw_wejscie(dane):
    _kolejka_wejscia.clear()
    if dane:
        _kolejka_wejscia.extend(str(x) for x in dane)

def _wczytaj(prompt=""):
    """Zamiennik input(). Dane bierze z listy przygotowanej w zadaniu.

    Zachęta i wpisana wartość idą osobnym kanałem, żeby nie mieszały się
    z tym, co program faktycznie wypisuje przez print() — porównanie
    wyniku z oczekiwanym musi widzieć tylko print().
    """
    if prompt:
        _host.echoWejscia(str(prompt))
    if not _kolejka_wejscia:
        raise EOFError(
            "Program prosi o dane od użytkownika, ale to zadanie ich nie przewiduje."
        )
    wartosc = _kolejka_wejscia.pop(0)
    _host.echoWejscia(str(wartosc) + "\\n")
    return wartosc

builtins.input = _wczytaj

def _uruchom(kod, kod_testu):
    """Wykonuje kod ucznia w świeżej przestrzeni nazw.

    Zwraca None przy sukcesie albo JSON z opisem błędu.
    """
    przestrzen = {"__name__": "__main__"}
    zrodlo = "program"
    try:
        exec(compile(kod, "<program>", "exec"), przestrzen)
        if kod_testu:
            zrodlo = "sprawdzenie"
            exec(compile(kod_testu, "<sprawdzenie>", "exec"), przestrzen)
    except BaseException as e:
        slad = e.__traceback__
        # Pierwsza ramka to samo wywołanie exec() w tej funkcji — nieciekawa
        # dla ucznia, więc ją pomijamy.
        if slad is not None:
            slad = slad.tb_next
        return json.dumps({
            "nazwa": type(e).__name__,
            "komunikat": str(e),
            "pelny": "".join(traceback.format_exception(type(e), e, slad)),
            "zrodlo": zrodlo,
            "linia": getattr(e, "lineno", None) if isinstance(e, SyntaxError) else _linia_bledu(slad),
        })
    finally:
        try:
            sys.stdout.flush()
            sys.stderr.flush()
        except Exception:
            pass
    return None

def _linia_bledu(slad):
    """Numer linii w kodzie ucznia, w którym wybuchł błąd."""
    numer = None
    while slad is not None:
        if slad.tb_frame.f_code.co_filename in ("<program>", "<sprawdzenie>"):
            numer = slad.tb_lineno
        slad = slad.tb_next
    return numer
`;

/* --- start ---------------------------------------------------------------- */

function wyslijWyjscie(strumien, tekst) {
    if (strumien === 'stdout') buforStdout += tekst;
    self.postMessage({ typ: 'wyjscie', id: idBiezacego, strumien, tekst });
}

async function przygotuj() {
    pyodide = await loadPyodide({ indexURL: BAZA });

    pyodide.setStdout({ batched: tekst => wyslijWyjscie('stdout', tekst + '\n') });
    pyodide.setStderr({ batched: tekst => wyslijWyjscie('stderr', tekst + '\n') });

    pyodide.registerJsModule('_host', {
        echoWejscia: tekst => wyslijWyjscie('wejscie', tekst)
    });

    pyodide.runPython(PRELUDIUM);
    self.postMessage({ typ: 'gotowy' });
}

const start = przygotuj().catch(e => {
    self.postMessage({ typ: 'blad-startu', komunikat: String(e && e.message || e) });
    throw e;
});

/* --- obsługa poleceń ------------------------------------------------------ */

self.onmessage = async ({ data }) => {
    if (data.typ !== 'uruchom') return;

    idBiezacego = data.id;
    buforStdout = '';

    try {
        await start;

        pyodide.globals.get('_ustaw_wejscie')(pyodide.toPy(data.wejscie || []));

        const wynik = pyodide.globals.get('_uruchom')(data.kod, data.kodTestu || null);

        self.postMessage({
            typ: 'koniec',
            id: data.id,
            ok: wynik === null || wynik === undefined,
            stdout: buforStdout,
            blad: wynik ? JSON.parse(wynik) : null
        });
    } catch (e) {
        // Awaria po stronie Pyodide/przeglądarki, nie błąd w kodzie ucznia.
        self.postMessage({
            typ: 'koniec',
            id: data.id,
            ok: false,
            stdout: buforStdout,
            blad: {
                nazwa: 'BladSrodowiska',
                komunikat: String(e && e.message || e),
                pelny: String(e && e.stack || e),
                zrodlo: 'srodowisko',
                linia: null
            }
        });
    }
};
