#!/usr/bin/env python3
"""Package source + prebuilt Web release; omit identity, caches and credentials."""
import argparse
import hashlib
import json
import plistlib
import shutil
import subprocess
import tempfile
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root / 'release')
parser.add_argument('--mac-app', type=Path, help='Optional built Apple Silicon .app; uses ditto to preserve its signature and executable permissions.')
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
artifacts = [source, web]
if args.mac_app:
    app = args.mac_app.resolve()
    with (app / 'Contents/Info.plist').open('rb') as f:
        info = plistlib.load(f)
    if info['CFBundleShortVersionString'] != version:
        raise SystemExit('Mac App version does not match the source release.')
    subprocess.run(['codesign', '--verify', '--deep', '--strict', str(app)], check=True)
    mac = args.output.resolve() / f'Red-Cliffs-III-v{version}-macOS-arm64.zip'
    with tempfile.TemporaryDirectory(dir=args.output) as temp:
        folder = Path(temp) / f'Red-Cliffs-III-v{version}-macOS-arm64'
        folder.mkdir()
        subprocess.run(['ditto', str(app), str(folder / app.name)], check=True)
        shutil.copy2(root / 'MACOS.md', folder / 'MACOS.md')
        subprocess.run(['ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', str(folder), str(mac)], check=True)
    artifacts.append(mac)
for path in artifacts:
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None
checksums = '\n'.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}' for path in artifacts) + '\n'
(args.output / f'SHA256SUMS-v{version}.txt').write_text(checksums)
print('Created '+', '.join(p.name for p in artifacts)+f' and SHA256SUMS-v{version}.txt')
