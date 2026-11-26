import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { Uruchamiacz } from '../js/runner.js';

test('Uruchamiacz przekazuje dane ekranu Pygame do callbacku onEkran', async () => {
    const ekrany = [];
    let workerRef = null;

    const uruchamiacz = new Uruchamiacz({
        onEkran: dane => ekrany.push(dane),
        tworzWorkera: () => {
            workerRef = {
                wiadomosci: [],
                onmessage: null,
                onerror: null,
                postMessage(msg) { this.wiadomosci.push(msg); },
                terminate() {}
            };
            return workerRef;
        }
    });

    const scenariusz = [{ klawisze: [1073741903] }];
    const obietnica = uruchamiacz.uruchom({ kod: 'import pygame', scenariuszPygame: scenariusz });
    const wyslana = workerRef.wiadomosci[0];
    assert.deepEqual(wyslana.scenariuszPygame, scenariusz);

    workerRef.onmessage({ data: { typ: 'gotowy' } });
    workerRef.onmessage({
        data: {
            typ: 'ekran',
            id: wyslana.id,
            dane: { szerokosc: 400, wysokosc: 300, tytul: 'Test', fps: 60, klatki: [[{ typ: 'fill', kolor: [1, 2, 3] }]] }
        }
    });
    workerRef.onmessage({ data: { typ: 'koniec', id: wyslana.id, ok: true, stdout: '', blad: null } });

    const wynik = await obietnica;
    assert.equal(wynik.ok, true);
    assert.equal(ekrany.length, 1);
    assert.equal(ekrany[0].szerokosc, 400);
    assert.equal(ekrany[0].tytul, 'Test');
});

test('moduł pygame_shim.py poprawnie obsługuje Rect, rysowanie, kolizje i walidację błędów', () => {
    const skrypt = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("pygame", "js/pygame_shim.py")
pygame = importlib.util.module_from_spec(spec)
sys.modules["pygame"] = pygame
spec.loader.exec_module(pygame)

odebrane = []
pygame._resetuj_stan([{"klawisze": [pygame.K_RIGHT]}], lambda d: odebrane.append(json.loads(d)))
pygame.init()
assert pygame.get_init() is True

# Błąd przy braku krotki w set_mode(400, 300)
try:
    pygame.display.set_mode(400, 300)
    raise AssertionError("Powinien wystąpić TypeError")
except TypeError:
    pass

screen = pygame.display.set_mode((400, 300))
pygame.display.set_caption("Próba")
r1 = pygame.Rect(10, 20, 30, 40)
r2 = pygame.Rect(25, 30, 30, 40)
assert r1.colliderect(r2) is True
r1.right = 400
assert r1.x == 370
r_out = pygame.Rect(-15, 290, 30, 30)
r_out.clamp_ip(screen.get_rect())
assert (r_out.x, r_out.y) == (0, 270)

running = True
kroki = 0
while running:
    for ev in pygame.event.get():
        if ev.type == pygame.QUIT:
            running = False
    if pygame.key.get_pressed()[pygame.K_RIGHT]:
        kroki += 1
    screen.fill((10, 20, 30))
    pygame.draw.rect(screen, (100, 150, 200), r1)
    pygame.draw.circle(screen, (255, 200, 0), (50, 50), 15)
    pygame.display.flip()

pygame._publikuj_ekran()
pygame.quit()
assert kroki == 1
assert len(odebrane) == 1
assert odebrane[0]["szerokosc"] == 400
assert len(odebrane[0]["klatki"]) == 2
print("OK")
`;
    const wyjscie = execFileSync('python', ['-B', '-c', skrypt], { encoding: 'utf8' });
    assert.equal(wyjscie.trim(), 'OK');
});
