/* Edytor kodu na bazie CodeMirror 5.
   Biblioteka ładowana zwykłym <script> w HTML, więc dostępna jako globalne
   CodeMirror — moduł tylko ją konfiguruje. */

/**
 * @param {HTMLElement} pojemnik
 * @param {object} opcje
 * @param {string} opcje.wartosc  kod początkowy
 * @param {() => void} opcje.onUruchom  wywoływane przez Ctrl+Enter
 */
export function utworzEdytor(pojemnik, { wartosc = '', onUruchom = () => {} } = {}) {
    const edytor = CodeMirror(pojemnik, {
        value: wartosc,
        mode: 'python',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        smartIndent: true,
        lineWrapping: true,
        // Renderuje cały dokument, dzięki czemu ramka rośnie razem z kodem.
        viewportMargin: Infinity,
        extraKeys: {
            // Tab wstawia spacje zamiast tabulatora — Python nie lubi mieszanki.
            Tab: cm => {
                if (cm.somethingSelected()) cm.indentSelection('add');
                else cm.replaceSelection(' '.repeat(4), 'end');
            },
            'Shift-Tab': cm => cm.indentSelection('subtract'),
            'Ctrl-Enter': () => onUruchom(),
            'Cmd-Enter': () => onUruchom()
        }
    });

    return edytor;
}
