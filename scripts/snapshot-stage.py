"""Stream a JSON(.gz) export into a new, isolated SQLite copy; never overwrite."""
import argparse, gzip, hashlib, json, sqlite3, time, resource
from pathlib import Path

class Stream:
    def __init__(self, file):
        self.file, self.buffer, self.pos, self.eof = file, '', 0, False
        self.digest = hashlib.sha256()
    def more(self):
        chunk = self.file.read(65536)
        self.digest.update(chunk.encode('utf-8'))
        self.buffer, self.pos = self.buffer[self.pos:] + chunk, 0
        self.eof = not chunk
    def char(self):
        while True:
            while self.pos < len(self.buffer) and self.buffer[self.pos].isspace(): self.pos += 1
            if self.pos < len(self.buffer): return self.buffer[self.pos]
            if self.eof: return ''
            self.more()
    def token(self, expected):
        if self.char() != expected: raise ValueError('Expected ' + expected)
        self.pos += 1
    def value(self):
        self.char()
        while True:
            try:
                value, self.pos = json.JSONDecoder().raw_decode(self.buffer, self.pos)
                return value
            except json.JSONDecodeError:
                if self.eof: raise
                if len(self.buffer) - self.pos > 16000000: raise ValueError('Oversize record')
                self.more()

def stage(source, output):
    started = time.monotonic()
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('xb'): pass
    db = sqlite3.connect(output)
    counts = {}
    try:
        db.executescript('''CREATE TABLE items(user_id TEXT,id TEXT,data TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,id));
CREATE TABLE relations(user_id TEXT,id TEXT,from_id TEXT,to_id TEXT,kind TEXT,quantity INTEGER,PRIMARY KEY(user_id,id));
CREATE TABLE preferences(user_id TEXT PRIMARY KEY,data TEXT NOT NULL);
CREATE TABLE notices(user_id TEXT,id TEXT,data TEXT NOT NULL,PRIMARY KEY(user_id,id));
CREATE TABLE scans(user_id TEXT,id TEXT,data TEXT NOT NULL,PRIMARY KEY(user_id,id));
CREATE TABLE local_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);''')
        opener = gzip.open if source.suffix == '.gz' else open
        with opener(source, 'rt', encoding='utf-8', newline='') as file:
            stream = Stream(file); stream.token('{')
            while stream.char() != '}':
                key = stream.value(); stream.token(':')
                if key in ['items','archived','relations','notices','scans']:
                    stream.token('['); count = 0
                    while stream.char() != ']':
                        value = stream.value(); text = json.dumps(value, ensure_ascii=False, separators=(',',':'))
                        if key in ['items','archived']: db.execute('INSERT INTO items VALUES(?,?,?,?)', ('local-audit',value['id'],text,value.get('createdAt','')))
                        elif key == 'relations': db.execute('INSERT INTO relations VALUES(?,?,?,?,?,?)', ('local-audit',value['id'],value['fromId'],value['toId'],value['kind'],value['quantity']))
                        else: db.execute('INSERT INTO '+key+' VALUES(?,?,?)', ('local-audit',value['id'],text))
                        count += 1
                        if count % 200 == 0: db.commit()
                        if stream.char() == ',': stream.token(',')
                        elif stream.char() != ']': raise ValueError('Invalid array')
                    stream.token(']'); counts[key] = count
                else:
                    value = stream.value()
                    if key == 'prefs': db.execute('INSERT INTO preferences VALUES(?,?)', ('local-audit',json.dumps(value, ensure_ascii=False, separators=(',',':'))))
                if stream.char() == ',': stream.token(',')
                elif stream.char() != '}': raise ValueError('Invalid object')
            stream.token('}')
            if stream.char(): raise ValueError('Trailing data')
            digest = stream.digest.hexdigest()
        report = dict(format='local-snapshot-copy-v1',inputSha256=digest,counts=counts,elapsedSeconds=time.monotonic()-started,maxRssKiB=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,sourceRequests=0)
        db.execute('INSERT INTO local_meta VALUES(?,?)', ('snapshot',json.dumps(report)))
        db.commit()
        return report
    except BaseException:
        db.close(); output.unlink(missing_ok=True)
        raise
    finally: db.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    print(json.dumps(stage(args.snapshot,args.output)))
