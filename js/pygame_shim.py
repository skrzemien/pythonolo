"""Lekka implementacja podstawowego API biblioteki pygame do nauki w przeglądarce
oraz automatycznego sprawdzania zadań w tools/sprawdz-zadania.py.

Zachowuje 100% zgodności ze składnią desktopowego Pygame (pygame / pygame-ce),
dzięki czemu ten sam kod można skopiować i uruchomić lokalnie na komputerze.
"""

import json

# --- Stałe zdarzeń i klawiszy (zgodne z SDL2 / Pygame) -----------------------

QUIT = 256
KEYDOWN = 768
KEYUP = 769
MOUSEBUTTONDOWN = 1025

K_BACKSPACE = 8
K_TAB = 9
K_RETURN = 13
K_ESCAPE = 27
K_SPACE = 32
K_a = 97
K_d = 100
K_s = 115
K_w = 119
K_RIGHT = 1073741903
K_LEFT = 1073741904
K_DOWN = 1073741905
K_UP = 1073741906


def _sprawdz_kolor(kolor):
    if not isinstance(kolor, (tuple, list)) or len(kolor) not in (3, 4):
        raise TypeError(
            "Kolor w Pygame zapisujemy jako krotkę trzech liczb (R, G, B), np. (255, 0, 0)."
        )
    skladowe = []
    for x in kolor:
        if isinstance(x, bool) or not isinstance(x, int):
            raise TypeError("Składowe koloru RGB muszą być liczbami całkowitymi od 0 do 255.")
        if x < 0 or x > 255:
            raise ValueError(f"Składowa koloru {x} wykracza poza zakres od 0 do 255.")
        skladowe.append(x)
    return tuple(skladowe[:3])


def _sprawdz_pare_liczb(wartosc, nazwa="współrzędne"):
    if not isinstance(wartosc, (tuple, list)) or len(wartosc) != 2:
        raise TypeError(f"Parametr {nazwa} musi być parą dwóch liczb (x, y), np. (100, 150).")
    x, y = wartosc
    if isinstance(x, bool) or isinstance(y, bool) or not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
        raise TypeError(f"Parametr {nazwa} musi zawierać dwie liczby.")
    return (int(round(x)), int(round(y)))


class Rect:
    """Prostokąt przechowujący położenie (x, y) oraz wymiary (width, height)."""

    def __init__(self, *args):
        if len(args) == 1 and isinstance(args[0], Rect):
            r = args[0]
            self.x, self.y, self.width, self.height = r.x, r.y, r.width, r.height
        elif len(args) == 1 and isinstance(args[0], (tuple, list)) and len(args[0]) == 4:
            self.x, self.y, self.width, self.height = [int(round(v)) for v in args[0]]
        elif len(args) == 2 and isinstance(args[0], (tuple, list)) and isinstance(args[1], (tuple, list)):
            self.x, self.y = [int(round(v)) for v in args[0]]
            self.width, self.height = [int(round(v)) for v in args[1]]
        elif len(args) == 4:
            self.x, self.y, self.width, self.height = [int(round(v)) for v in args]
        else:
            raise TypeError("Rect wymaga 4 liczb: pygame.Rect(x, y, szerokość, wysokość).")

    @property
    def w(self):
        return self.width

    @w.setter
    def w(self, val):
        self.width = int(round(val))

    @property
    def h(self):
        return self.height

    @h.setter
    def h(self, val):
        self.height = int(round(val))

    @property
    def left(self):
        return self.x

    @left.setter
    def left(self, val):
        self.x = int(round(val))

    @property
    def right(self):
        return self.x + self.width

    @right.setter
    def right(self, val):
        self.x = int(round(val)) - self.width

    @property
    def top(self):
        return self.y

    @top.setter
    def top(self, val):
        self.y = int(round(val))

    @property
    def bottom(self):
        return self.y + self.height

    @bottom.setter
    def bottom(self, val):
        self.y = int(round(val)) - self.height

    @property
    def centerx(self):
        return self.x + self.width // 2

    @centerx.setter
    def centerx(self, val):
        self.x = int(round(val)) - self.width // 2

    @property
    def centery(self):
        return self.y + self.height // 2

    @centery.setter
    def centery(self, val):
        self.y = int(round(val)) - self.height // 2

    @property
    def center(self):
        return (self.centerx, self.centery)

    @center.setter
    def center(self, val):
        cx, cy = _sprawdz_pare_liczb(val, "center")
        self.centerx = cx
        self.centery = cy

    @property
    def topleft(self):
        return (self.x, self.y)

    @topleft.setter
    def topleft(self, val):
        self.x, self.y = _sprawdz_pare_liczb(val, "topleft")

    @property
    def size(self):
        return (self.width, self.height)

    @size.setter
    def size(self, val):
        self.width, self.height = _sprawdz_pare_liczb(val, "size")

    def copy(self):
        return Rect(self.x, self.y, self.width, self.height)

    def move(self, dx, dy):
        return Rect(self.x + dx, self.y + dy, self.width, self.height)

    def move_ip(self, dx, dy):
        self.x += int(round(dx))
        self.y += int(round(dy))

    def colliderect(self, other):
        r = other if isinstance(other, Rect) else Rect(other)
        if self.width <= 0 or self.height <= 0 or r.width <= 0 or r.height <= 0:
            return False
        return (
            self.x < r.x + r.width
            and self.x + self.width > r.x
            and self.y < r.y + r.height
            and self.y + self.height > r.y
        )

    def collidepoint(self, *args):
        px, py = _sprawdz_pare_liczb(args[0] if len(args) == 1 else args, "punkt")
        return self.x <= px < self.x + self.width and self.y <= py < self.y + self.height

    def __eq__(self, other):
        if isinstance(other, Rect):
            return (self.x, self.y, self.width, self.height) == (other.x, other.y, other.width, other.height)
        return False

    def __repr__(self):
        return f"<rect({self.x}, {self.y}, {self.width}, {self.height})>"


class Surface:
    """Powierzchnia rysowania (główne okno gry albo wyrenderowany napis)."""

    def __init__(self, size, _tekst=None):
        if not isinstance(size, (tuple, list)) or len(size) != 2:
            raise TypeError(
                "Rozmiar powierzchni zapisz jako krotkę dwóch liczb (szerokość, wysokość), np. (400, 300)."
            )
        w, h = size
        if isinstance(w, bool) or isinstance(h, bool) or not isinstance(w, int) or not isinstance(h, int) or w <= 0 or h <= 0:
            raise ValueError("Szerokość i wysokość okna muszą być dodatnimi liczbami całkowitymi.")
        self._width = w
        self._height = h
        self._polecenia = []
        self._tlo = (0, 0, 0)
        self._tekst = _tekst

    def fill(self, color, rect=None):
        rgb = _sprawdz_kolor(color)
        if rect is None:
            self._tlo = rgb
            self._polecenia = [{"typ": "fill", "kolor": list(rgb)}]
            return Rect(0, 0, self._width, self._height)
        r = rect if isinstance(rect, Rect) else Rect(rect)
        self._polecenia.append({
            "typ": "rect",
            "kolor": list(rgb),
            "x": r.x, "y": r.y, "w": r.width, "h": r.height,
            "grubosc": 0, "promien": 0
        })
        return r.copy()

    def blit(self, source, dest):
        if not isinstance(source, Surface):
            raise TypeError("Pierwszym argumentem blit() musi być obiekt Surface.")
        if isinstance(dest, Rect):
            x, y = dest.x, dest.y
        else:
            x, y = _sprawdz_pare_liczb(dest, "pozycja docelowa")
        if source._tekst is not None:
            self._polecenia.append({
                "typ": "text",
                "tekst": source._tekst["tekst"],
                "kolor": list(source._tekst["kolor"]),
                "rozmiar": source._tekst["rozmiar"],
                "x": x,
                "y": y
            })
        else:
            self._polecenia.append({
                "typ": "rect",
                "kolor": list(source._tlo),
                "x": x, "y": y, "w": source._width, "h": source._height,
                "grubosc": 0, "promien": 0
            })
        return Rect(x, y, source._width, source._height)

    def get_size(self):
        return (self._width, self._height)

    def get_width(self):
        return self._width

    def get_height(self):
        return self._height

    def get_rect(self, **kwargs):
        r = Rect(0, 0, self._width, self._height)
        for k, v in kwargs.items():
            setattr(r, k, v)
        return r


# --- Stan środowiska dla pojedynczego uruchomienia ---------------------------

_stan = {
    "zainicjowano": False,
    "zamknieto": False,
    "tytul": "Okno Pygame",
    "ekran": None,
    "klatki": [],
    "fps": 60,
    "scenariusz": [],          # lista kroków: {"zdarzenia": [...], "klawisze": [...]}
    "indeks_kroku": 0,
    "domyslny_limit_krokow": 5,
    "wywolania_event_get": 0,
    "biezace_klawisze": set(),
    "wyslij_do_hosta": None,
}


def _resetuj_stan(scenariusz=None, wyslij_do_hosta=None):
    _stan["zainicjowano"] = False
    _stan["zamknieto"] = False
    _stan["tytul"] = "Okno Pygame"
    _stan["ekran"] = None
    _stan["klatki"] = []
    _stan["fps"] = 60
    _stan["scenariusz"] = list(scenariusz or [])
    _stan["indeks_kroku"] = 0
    _stan["domyslny_limit_krokow"] = 5
    _stan["wywolania_event_get"] = 0
    _stan["biezace_klawisze"] = set()
    _stan["wyslij_do_hosta"] = wyslij_do_hosta


def _publikuj_ekran():
    ekran = _stan["ekran"]
    if ekran is None or _stan["wyslij_do_hosta"] is None:
        return
    klatki = _stan["klatki"]
    # Jeśli uczeń narysował coś na ekranie, ale zapomniał o flip(), i tak
    # wysyłamy podgląd klatki tylko gdy flip() wywołano — brak flip() pokaże czarne okno,
    # tak samo jak w prawdziwym Pygame.
    dane = {
        "szerokosc": ekran._width,
        "wysokosc": ekran._height,
        "tytul": _stan["tytul"],
        "fps": _stan["fps"],
        "klatki": klatki[-120:],  # maks. 120 ostatnich klatek animacji
    }
    _stan["wyslij_do_hosta"](json.dumps(dane))


def init():
    _stan["zainicjowano"] = True
    _stan["zamknieto"] = False
    return (6, 0)


def quit():
    _stan["zamknieto"] = True


def get_init():
    return _stan["zainicjowano"] and not _stan["zamknieto"]


class _DisplayModule:
    def set_mode(self, size):
        ekran = Surface(size)
        _stan["ekran"] = ekran
        return ekran

    def set_caption(self, title):
        _stan["tytul"] = str(title)

    def get_caption(self):
        return (_stan["tytul"], _stan["tytul"])

    def get_surface(self):
        return _stan["ekran"]

    def flip(self):
        ekran = _stan["ekran"]
        if ekran is None:
            raise RuntimeError("Najpierw utwórz okno przez pygame.display.set_mode((szerokość, wysokość)).")
        if not ekran._polecenia:
            klatka = [{"typ": "fill", "kolor": list(ekran._tlo)}]
        else:
            klatka = [dict(p) for p in ekran._polecenia]
        _stan["klatki"].append(klatka)

    def update(self):
        self.flip()


class _DrawModule:
    def _sprawdz_surface(self, surface):
        if not isinstance(surface, Surface):
            raise TypeError("Pierwszym argumentem rysowania musi być powierzchnia okna (np. screen).")

    def rect(self, surface, color, rect_arg, width=0, border_radius=0):
        self._sprawdz_surface(surface)
        rgb = _sprawdz_kolor(color)
        r = rect_arg if isinstance(rect_arg, Rect) else Rect(rect_arg)
        surface._polecenia.append({
            "typ": "rect",
            "kolor": list(rgb),
            "x": r.x, "y": r.y, "w": r.width, "h": r.height,
            "grubosc": int(width),
            "promien": int(border_radius)
        })
        return r.copy()

    def circle(self, surface, color, center, radius, width=0):
        self._sprawdz_surface(surface)
        rgb = _sprawdz_kolor(color)
        cx, cy = _sprawdz_pare_liczb(center, "środek koła")
        r = int(round(radius))
        if r < 0:
            raise ValueError("Promień koła nie może być ujemny.")
        surface._polecenia.append({
            "typ": "circle",
            "kolor": list(rgb),
            "cx": cx, "cy": cy, "r": r,
            "grubosc": int(width)
        })
        return Rect(cx - r, cy - r, r * 2, r * 2)

    def line(self, surface, color, start_pos, end_pos, width=1):
        self._sprawdz_surface(surface)
        rgb = _sprawdz_kolor(color)
        x1, y1 = _sprawdz_pare_liczb(start_pos, "początek linii")
        x2, y2 = _sprawdz_pare_liczb(end_pos, "koniec linii")
        surface._polecenia.append({
            "typ": "line",
            "kolor": list(rgb),
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "grubosc": max(1, int(width))
        })
        left, top = min(x1, x2), min(y1, y2)
        return Rect(left, top, abs(x2 - x1) + 1, abs(y2 - y1) + 1)

    def ellipse(self, surface, color, rect_arg, width=0):
        self._sprawdz_surface(surface)
        rgb = _sprawdz_kolor(color)
        r = rect_arg if isinstance(rect_arg, Rect) else Rect(rect_arg)
        surface._polecenia.append({
            "typ": "ellipse",
            "kolor": list(rgb),
            "x": r.x, "y": r.y, "w": r.width, "h": r.height,
            "grubosc": int(width)
        })
        return r.copy()

    def polygon(self, surface, color, points, width=0):
        self._sprawdz_surface(surface)
        rgb = _sprawdz_kolor(color)
        if not isinstance(points, (tuple, list)) or len(points) < 3:
            raise ValueError("Wielokąt wymaga listy co najmniej 3 punktów.")
        pkt = [list(_sprawdz_pare_liczb(p, "punkt wielokąta")) for p in points]
        surface._polecenia.append({
            "typ": "polygon",
            "kolor": list(rgb),
            "punkty": pkt,
            "grubosc": int(width)
        })
        xs = [p[0] for p in pkt]
        ys = [p[1] for p in pkt]
        return Rect(min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))


class Event:
    def __init__(self, typ_zdarzenia, **atrybuty):
        self.type = typ_zdarzenia
        for k, v in atrybuty.items():
            setattr(self, k, v)

    def __repr__(self):
        return f"<Event(type={self.type})>"


class _EventModule:
    Event = Event

    def get(self):
        _stan["wywolania_event_get"] += 1
        if _stan["wywolania_event_get"] > 500:
            raise RuntimeError(
                "Pętla gry wykonała ponad 500 obrotów bez zakończenia. "
                "Sprawdź, czy obsługujesz zdarzenie pygame.QUIT i zmieniasz zmienną sterującą pętlą na False."
            )

        indeks = _stan["indeks_kroku"]
        scenariusz = _stan["scenariusz"]
        _stan["indeks_kroku"] = indeks + 1

        if scenariusz:
            if indeks < len(scenariusz):
                krok = scenariusz[indeks]
                _stan["biezace_klawisze"] = set(krok.get("klawisze", []))
                return [Event(z["type"], **{k: v for k, v in z.items() if k != "type"}) for z in krok.get("zdarzenia", [])]
            _stan["biezace_klawisze"] = set()
            return [Event(QUIT)]

        # Domyślny przebieg bez scenariusza: kilka czystych klatek, a potem zamknięcie okna.
        _stan["biezace_klawisze"] = set()
        if indeks >= _stan["domyslny_limit_krokow"]:
            return [Event(QUIT)]
        return []


class _KeyState:
    def __init__(self, wcisniete):
        self._wcisniete = set(wcisniete)

    def __getitem__(self, klawisz):
        return klawisz in self._wcisniete


class _KeyModule:
    def get_pressed(self):
        return _KeyState(_stan["biezace_klawisze"])


class Clock:
    def __init__(self):
        self._ostatnie_fps = 60

    def tick(self, framerate=60):
        fps = max(1, int(framerate)) if framerate else 60
        self._ostatnie_fps = fps
        _stan["fps"] = fps
        return max(1, 1000 // fps)

    def get_fps(self):
        return float(self._ostatnie_fps)


class _TimeModule:
    Clock = Clock

    def delay(self, ms):
        return max(0, int(ms))


class Font:
    def __init__(self, name=None, size=24):
        self._size = max(8, int(size))

    def render(self, text, antialias, color):
        rgb = _sprawdz_kolor(color)
        napis = str(text)
        szer = max(1, int(len(napis) * self._size * 0.55))
        wys = int(self._size * 1.25)
        return Surface((szer, wys), _tekst={"tekst": napis, "kolor": rgb, "rozmiar": self._size})


class _FontModule:
    Font = Font

    def init(self):
        pass

    def SysFont(self, name, size, bold=False, italic=False):
        return Font(name, size)


display = _DisplayModule()
draw = _DrawModule()
event = _EventModule()
key = _KeyModule()
time = _TimeModule()
font = _FontModule()
