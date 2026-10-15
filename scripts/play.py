#!/usr/bin/env python3
"""Serve a bundled Web build on loopback; no external Python dependencies."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser(description='Play Red Banner locally')
parser.add_argument('--port', type=int, default=8080)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'dist'
if not (root / 'index.html').is_file():
    raise SystemExit('Missing dist/index.html. Run npm ci && npm run build, or use the Web release ZIP.')
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
except OSError as error:
    raise SystemExit(f'Cannot listen on port {args.port}: {error}. Try --port 8081.')
print(f'Red Banner: http://127.0.0.1:{args.port}/  (Ctrl+C to stop)', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
