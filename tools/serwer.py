#!/usr/bin/env python3
"""Lokalny serwer HTTP do podglądu strony: python3 tools/serwer.py [port]"""

import functools
import http.server
import sys
from pathlib import Path

KATALOG = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123

obsluga = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(KATALOG))
# Moduły ES muszą przyjść z typem JavaScript, inaczej przeglądarka ich nie uruchomi.
obsluga.func.extensions_map['.js'] = 'text/javascript'
obsluga.func.extensions_map['.mjs'] = 'text/javascript'

with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), obsluga) as serwer:
    print(f'Strona działa pod http://localhost:{PORT} — Ctrl+C kończy.')
    try:
        serwer.serve_forever()
    except KeyboardInterrupt:
        pass
