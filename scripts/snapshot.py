"""Verify or extract the checked-in catalogue snapshot with Python 3 stdlib."""
import argparse
import gzip
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'snapshots' / '2026-10-26'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['verify', 'extract'])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.command == 'extract' and not args.output:
        parser.error('extract requires --output; existing files are never overwritten')
    meta = json.loads((SNAPSHOT / 'manifest.json').read_text(encoding='utf-8'))
    compressed = (SNAPSHOT / 'collector-radar-backup.json.gz').read_bytes()
    if hashlib.sha256(compressed).hexdigest() != meta['gzipSha256']:
        raise ValueError('Compressed snapshot checksum mismatch')
    raw = gzip.decompress(compressed)
    if len(raw) != meta['rawBytes'] or hashlib.sha256(raw).hexdigest() != meta['rawSha256']:
        raise ValueError('Uncompressed snapshot checksum mismatch')
    data = json.loads(raw)
    for key, count in [('items', 'activeProducts'), ('archived', 'archivedProducts'), ('relations', 'relations')]:
        if len(data[key]) != meta[count]:
            raise ValueError('Unexpected count: ' + key)
    records = data['items'] + data['archived']
    by_id = {item['id']: item for item in records}
    if len(by_id) != len(records):
        raise ValueError('Duplicate product IDs')
    if any(r['fromId'] not in by_id or r['toId'] not in by_id for r in data['relations']):
        raise ValueError('Missing relation endpoint')
    queue = json.loads((ROOT / 'lib/radar/editorial-manifest.json').read_text(encoding='utf-8'))
    if len(queue['ids']) != queue['total'] or queue['total'] != meta['editorialQueue']:
        raise ValueError('Review queue count mismatch')
    statuses = Counter()
    for ident in queue['ids']:
        item = by_id.get(ident)
        status = 'missing' if item is None else 'archived' if item.get('archivedInto') else item.get('editorial', {}).get('status', 'pending')
        statuses[status] += 1
    if dict(statuses) != meta['liveStoredReviewCounts']:
        raise ValueError('Review status mismatch')
    if args.command == 'extract':
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open('xb') as output:
            output.write(raw)
        print('Extracted: ' + str(args.output.resolve()))
    print(json.dumps({'verified': True, 'active': len(data['items']), 'archived': len(data['archived']),
                      'relations': len(data['relations']), 'review': dict(statuses)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
