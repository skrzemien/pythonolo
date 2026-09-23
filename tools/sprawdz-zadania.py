#!/usr/bin/env python3
"""Sprawdza treść zadań w data/*.json.

Dla każdego zadania uruchamia wzorcowe rozwiązanie w lokalnym Pythonie i porównuje
wynik z tym, co obiecuje treść. Zadania „uzupełnij” sprawdza dla każdej przyjmowanej
odpowiedzi w każdej luce. Poza tym pilnuje:

* zgodności liczby luk `___` z tablicą `luki`,
* unikalności identyfikatorów zadań,
* zgodności `liczbaZadan` w data/modules.json z plikami modułów,
* tego, że sam kod startowy nie zalicza zadania,
* tego, że wszystkie przygotowane odpowiedzi dla input() zostały wykorzystane,
* tego, że data/zmiany.json odwołuje się tylko do istniejących zadań.

Użycie:
    python3 tools/sprawdz-zadania.py           # wszystkie moduły
    python3 tools/sprawdz-zadania.py 07-if     # jeden moduł
"""

import builtins
import contextlib
import io
import json
import re
import sys
from pathlib import Path

KATALOG = Path(__file__).resolve().parent.parent / 'data'


def normalizuj(tekst):
    """To samo co normalizuj() w js/ui.js: bez spacji na końcach linii i pustych linii na końcu."""
    tekst = str(tekst or '').replace('\r\n', '\n').replace('\r', '\n')
    linie = [re.sub(r'[ \t]+$', '', linia) for linia in tekst.split('\n')]
    return re.sub(r'\n+$', '', '\n'.join(linie))


def uruchom(kod, wejscie=None, kod_testu=None):
    """Wykonuje kod jak worker na stronie. Zwraca (wypisane, błąd albo None, niewykorzystane wejście)."""
    kolejka = [str(x) for x in (wejscie or [])]

    def wczytaj(zacheta=''):
        if not kolejka:
            raise EOFError('program prosi o dane, których zadanie nie przewiduje')
        return kolejka.pop(0)

    bufor = io.StringIO()
    oryginalny_input = builtins.input
    builtins.input = wczytaj
    blad = None
    try:
        with contextlib.redirect_stdout(bufor):
            przestrzen = {'__name__': '__main__'}
            exec(compile(kod, '<program>', 'exec'), przestrzen)
            if kod_testu:
                exec(compile(kod_testu, '<sprawdzenie>', 'exec'), przestrzen)
    except BaseException as e:  # noqa: BLE001 — chcemy złapać też SystemExit i KeyboardInterrupt
        blad = f'{type(e).__name__}: {e}'
    finally:
        builtins.input = oryginalny_input
    return bufor.getvalue(), blad, len(kolejka)


def wejscie_zadania(zadanie):
    return zadanie.get('wejscie') or (zadanie.get('sprawdzenie') or {}).get('wejscie') or []


def sprawdz_uzupelnij(zadanie, zglos):
    czesci = zadanie['kod'].split('___')
    liczba_luk = len(czesci) - 1
    if liczba_luk != len(zadanie['luki']):
        zglos(f'w kodzie jest {liczba_luk} luk, a w "luki" {len(zadanie["luki"])} pozycji')
        return

    for i, przyjmowane in enumerate(zadanie['luki']):
        for odpowiedz in przyjmowane:
            wartosci = [luka[0] for luka in zadanie['luki']]
            wartosci[i] = odpowiedz
            kod = ''.join(c + (wartosci[j] if j < liczba_luk else '') for j, c in enumerate(czesci))
            wypisane, blad, _ = uruchom(kod, wejscie_zadania(zadanie))
            if blad:
                zglos(f'luka {i + 1} = {odpowiedz!r}: {blad}')
            elif normalizuj(wypisane) != normalizuj(zadanie.get('wyjscie', '')):
                zglos(f'luka {i + 1} = {odpowiedz!r}: wypisuje {wypisane!r}, '
                      f'a treść obiecuje {zadanie.get("wyjscie")!r}')


def sprawdz_napisz(zadanie, zglos):
    sprawdzenie = zadanie.get('sprawdzenie') or {}
    tryb = sprawdzenie.get('tryb')
    kod_testu = sprawdzenie.get('kod') if tryb == 'testy' else None
    wejscie = wejscie_zadania(zadanie)

    rozwiazanie = zadanie.get('rozwiazanie')
    if not rozwiazanie:
        zglos('brak pola "rozwiazanie"')
        return

    wypisane, blad, zostalo = uruchom(rozwiazanie, wejscie, kod_testu)
    if blad:
        zglos(f'wzorcowe rozwiązanie nie przechodzi: {blad}')
    elif tryb == 'wyjscie' and normalizuj(wypisane) != normalizuj(sprawdzenie.get('oczekiwane')):
        zglos(f'rozwiązanie wypisuje {wypisane!r}, a oczekiwane jest {sprawdzenie.get("oczekiwane")!r}')
    if zostalo:
        zglos(f'rozwiązanie nie wykorzystało {zostalo} przygotowanych odpowiedzi dla input()')

    wypisane, blad, _ = uruchom(zadanie.get('start', ''), wejscie, kod_testu)
    if not blad and (tryb == 'testy' or normalizuj(wypisane) == normalizuj(sprawdzenie.get('oczekiwane'))):
        zglos('sam kod startowy zalicza zadanie')


def main():
    wybrany = sys.argv[1] if len(sys.argv) > 1 else None
    spis = json.loads((KATALOG / 'modules.json').read_text(encoding='utf-8'))
    problemy = []
    identyfikatory = set()
    liczba_zadan = 0

    for wpis in spis['moduly']:
        modul = json.loads((KATALOG / f'{wpis["id"]}.json').read_text(encoding='utf-8'))
        zadania = modul['zadania']
        for zadanie in zadania:
            if zadanie['id'] in identyfikatory:
                problemy.append(f'{wpis["id"]}/{zadanie["id"]}: identyfikator się powtarza')
            identyfikatory.add(zadanie['id'])

        if len(zadania) != wpis['liczbaZadan']:
            problemy.append(f'{wpis["id"]}: liczbaZadan w modules.json to {wpis["liczbaZadan"]}, '
                            f'a zadań jest {len(zadania)}')
        if wybrany and wpis['id'] != wybrany:
            continue

        for zadanie in zadania:
            liczba_zadan += 1

            def zglos(tekst, z=zadanie):
                problemy.append(f'{wpis["id"]}/{z["id"]}: {tekst}')

            if zadanie['typ'] == 'uzupelnij':
                sprawdz_uzupelnij(zadanie, zglos)
            else:
                sprawdz_napisz(zadanie, zglos)

    zmiany = json.loads((KATALOG / 'zmiany.json').read_text(encoding='utf-8'))
    for wpis in zmiany['wpisy']:
        for idz in wpis.get('noweZadania', []):
            if idz not in identyfikatory:
                problemy.append(f'zmiany.json ({wpis["data"]}): nie ma zadania {idz}')

    print(f'Sprawdzone zadania: {liczba_zadan}')
    if problemy:
        print('\n'.join(problemy))
        sys.exit(1)
    print('Wszystko się zgadza.')


if __name__ == '__main__':
    main()
