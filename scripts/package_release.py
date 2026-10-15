#!/usr/bin/env python3
"""Package source + prebuilt Web release; omit identity, caches and credentials."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root / 'release')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
if not (root / 'dist/index.html').is_file():
    raise SystemExit('Run npm run build before packaging.')
excluded = {'.git', '.openai', 'node_modules', 'target', 'release', '__pycache__'}
source = args.output / f'three-kingdoms-battle-v{version}-source.zip'
web = args.output / f'three-kingdoms-battle-v{version}-web.zip'
with zipfile.ZipFile(source, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if path.is_file() and not any(part in excluded for part in path.relative_to(root).parts) and path.name not in {'.DS_Store', '.env'}:
            archive.write(path, Path('three-kingdoms-battle') / path.relative_to(root))
with zipfile.ZipFile(web, 'w', zipfile.ZIP_DEFLATED) as archive:
    files = list((root / 'dist').rglob('*')) + [root / p for p in ['scripts/play.py', 'play.command', 'play.cmd', 'QUICKSTART.md']]
    for path in files:
        if path.is_file(): archive.write(path, Path('red-banner-web') / path.relative_to(root))
for path in (source, web):
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
checksums = '\n'.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}' for path in (source, web)) + '\n'
(args.output / f'SHA256SUMS-v{version}.txt').write_text(checksums)
print(f'Created {source.name}, {web.name} and SHA256SUMS-v{version}.txt')
