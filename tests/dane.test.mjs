import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { esc, prostyMarkdown, htmlTresci, wczytajModulZeSpisem } from '../js/dane.js';

test('esc escapuje znaki specjalne HTML łącznie z apostrofem', () => {
    assert.equal(esc('<a href="x" title=\'y\'>&'), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;');
});

test('prostyMarkdown zachowuje pojedyncze i podwójne gwiazdki wewnątrz kodu', () => {
    const wstep = 'Python liczy: `+`, `-`, `*`, `/`, a `**` podnosi do potęgi.';
    assert.equal(
        prostyMarkdown(wstep),
        'Python liczy: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, a <code>**</code> podnosi do potęgi.'
    );

    const podpowiedz = 'Zamiast przepisywać gwiazdki: `print("*" * 3)`.';
    assert.equal(
        prostyMarkdown(podpowiedz),
        'Zamiast przepisywać gwiazdki: <code>print(&quot;*&quot; * 3)</code>.'
    );
});

test('prostyMarkdown obsługuje pogrubienie, kursywę oraz nawiasy kątowe w tekście', () => {
    assert.equal(
        prostyMarkdown('Kliknij **Sprawdź** i zobacz *wynik* dla x <0> y.'),
        'Kliknij <strong>Sprawdź</strong> i zobacz <em>wynik</em> dla x &lt;0&gt; y.'
    );
    assert.equal(
        prostyMarkdown('Ważne **polecenie `a * b` działa**.'),
        'Ważne <strong>polecenie <code>a * b</code> działa</strong>.'
    );
});

test('żadne zadanie w data/*.json nie ma uszkodzonych znaczników <code> przez kursywę lub pogrubienie', () => {
    const spis = JSON.parse(fs.readFileSync(new URL('../data/modules.json', import.meta.url), 'utf8'));
    for (const m of spis.moduly) {
        const modul = JSON.parse(fs.readFileSync(new URL(`../data/${m.id}.json`, import.meta.url), 'utf8'));
        const wstepHtml = htmlTresci(modul.wstep);
        for (const fragment of wstepHtml.match(/<code>[\s\S]*?<\/code>/g) || []) {
            assert.ok(!fragment.includes('<em>') && !fragment.includes('<strong>'), `${m.id}/wstep: ${fragment}`);
        }
        for (const z of modul.zadania) {
            const opisHtml = htmlTresci(z.opis);
            for (const fragment of opisHtml.match(/<code>[\s\S]*?<\/code>/g) || []) {
                assert.ok(!fragment.includes('<em>') && !fragment.includes('<strong>'), `${z.id}/opis: ${fragment}`);
            }
            for (const p of z.podpowiedzi || []) {
                const podpHtml = prostyMarkdown(p);
                for (const fragment of podpHtml.match(/<code>[\s\S]*?<\/code>/g) || []) {
                    assert.ok(!fragment.includes('<em>') && !fragment.includes('<strong>'), `${z.id}/podpowiedz: ${fragment}`);
                }
            }
        }
    }
});

test('wczytajModulZeSpisem odrzuca nieprawidłowy identyfikator modułu bez wywoływania fetch', async () => {
    await assert.rejects(
        () => wczytajModulZeSpisem('../secret'),
        /Nie znam modułu/
    );
});
