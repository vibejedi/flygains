"""Download the three official MaleCNS v1.0 tables; no credentials required."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen
from datetime import datetime, timezone

BASE = 'https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/'
FILES = (
    'body-annotations-male-cns-v1.0-minconf-0.5.feather',
    'body-neurotransmitters-male-cns-v1.0.feather',
    'connectome-weights-male-cns-v1.0-minconf-0.5.feather',
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('data/mcns'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = args.output / 'manifest.json'
    old = json.loads(manifest.read_text()) if manifest.exists() else {'files': []}
    recorded = {item['name']: item for item in old.get('files', [])}
    entries = []
    print('Downloading approximately 1.2 GB of public data. No brain simulation is started.')
    for name in FILES:
        dest = args.output / name
        if dest.exists():
            if name not in recorded:
                raise RuntimeError(f'{dest} exists without a manifest; move it before retrying.')
            with dest.open('rb') as stream:
                digest = hashlib.file_digest(stream, 'sha256').hexdigest()
            if digest != recorded[name]['sha256']:
                raise RuntimeError(f'{dest} differs from its manifest; move it before retrying.')
            entries.append(recorded[name])
            print(f'Already verified: {name}')
            continue
        partial = dest.with_suffix('.feather.partial')
        if partial.exists():
            raise RuntimeError(f'Incomplete file exists: {partial}. Remove it to retry this download.')
        print(f'Downloading: {name}', flush=True)
        sha = hashlib.sha256()
        size = 0
        with urlopen(BASE + name, timeout=120) as response, partial.open('xb') as output:
            expected = response.headers.get('Content-Length')
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                sha.update(chunk)
                size += len(chunk)
        if expected is not None and size != int(expected):
            raise RuntimeError(f'Incomplete download: {name}')
        with partial.open('rb') as check:
            start = check.read(6)
            check.seek(-6, 2)
            end = check.read(6)
        if not (start == end == b'ARROW1' or start[:4] == b'FEA1'):
            raise RuntimeError(f'Unexpected file format: {name}')
        entry = {'name': name, 'url': BASE + name, 'bytes': size, 'sha256': sha.hexdigest(),
                 'downloaded_at': datetime.now(timezone.utc).isoformat()}
        entries.append(entry)
        partial.rename(dest)
        temp = manifest.with_suffix('.json.tmp')
        temp.write_text(json.dumps({'dataset': 'male-cns:v1.0', 'source_page':
            'https://male-cns.janelia.org/download/', 'files': entries}, indent=2))
        temp.replace(manifest)
    print('Done. Inspect table schemas and annotations before building a neural model.')


if __name__ == '__main__':
    main()
