"""Publish token totals from local coding logs; never publish session content."""
import json
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from zoneinfo import ZoneInfo

ZONE = ZoneInfo('America/Chicago')
ROOTS = [('claude', '.claude/projects'), ('codex', '.codex/sessions'), ('omp', '.omp/agent/sessions')]


class Collector:
    def __init__(self, home):
        self.home = home
        self.files = {}
        self.records = {}

    def ingest(self, source, row, state, filename):
        timestamp = row.get('timestamp')
        if not timestamp:
            return
        date = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).astimezone(ZONE).date().isoformat()
        message = row.get('message') or {}
        usage = message.get('usage') or {}
        if source == 'claude' and row.get('type') == 'assistant' and usage:
            key = ('claude', message.get('id') or row.get('uuid'))
            total = sum(usage.get(k, 0) for k in ('input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'))
            cached = usage.get('cache_read_input_tokens', 0)
            provider = 'claude'
        elif source == 'omp' and message.get('role') == 'assistant' and usage:
            name = message.get('provider', '')
            if name == 'anthropic':
                provider = 'claude'
            elif name.startswith('openai'):
                provider = 'codex'
            else:
                return
            # responseId deduplicates copied/branched messages, including native
            # Claude transcripts if the same provider response was recorded there.
            response = message.get('responseId')
            key = ('claude', response) if provider == 'claude' and response else ('omp', response or (filename, row.get('id')))
            total = sum(usage.get(k, 0) for k in ('input', 'output', 'cacheRead', 'cacheWrite'))
            cached = usage.get('cacheRead', 0)
        elif source == 'codex':
            payload = row.get('payload') or {}
            if row.get('type') == 'session_meta':
                state['session'] = payload.get('id', filename)
                return
            if payload.get('type') != 'token_count':
                return
            totals = (payload.get('info') or {}).get('total_token_usage')
            if not totals:
                return
            # Codex emits cumulative session totals, sometimes repeated. Use
            # their positive deltas, not the sum of cumulative snapshots.
            current = (totals.get('total_tokens', 0), totals.get('cached_input_tokens', 0))
            previous = state.get('totals', (0, 0))
            state['totals'] = current
            total, cached = (max(0, a - b) for a, b in zip(current, previous))
            if not total:
                return
            key = ('codex', state.get('session', filename), current)
            provider = 'codex'
        else:
            return
        if total > 0:
            # Streaming Claude records update the same message. Keep the largest
            # snapshot instead of counting its partial output repeatedly.
            old = self.records.get(key)
            if old is None or total >= old[2]:
                self.records[key] = (date, provider, total, cached)

    def collect(self):
        day_start = datetime.now(ZONE).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
        for source, root in ROOTS:
            for path in (self.home / root).rglob('*.jsonl'):
                try:
                    stat = path.stat()
                    if stat.st_mtime < day_start:
                        continue
                    state = self.files.setdefault(str(path), {'offset': 0, 'inode': stat.st_ino})
                    if stat.st_ino != state['inode'] or stat.st_size < state['offset']:
                        state.clear()
                        state.update(offset=0, inode=stat.st_ino)
                    if stat.st_size == state['offset']:
                        continue
                    with path.open('rb') as stream:
                        stream.seek(state['offset'])
                        while line := stream.readline():
                            if not line.endswith(b'\n'):
                                break  # Writer hasn't finished this record yet.
                            try:
                                self.ingest(source, json.loads(line), state, str(path))
                            except (ValueError, TypeError, KeyError):
                                pass
                            state['offset'] = stream.tell()
                except OSError:
                    continue
        now = datetime.now(ZONE)
        providers = {p: {'tokens': 0, 'cached': 0} for p in ('claude', 'codex')}
        for date, provider, total, cached in self.records.values():
            if date == now.date().isoformat():
                providers[provider]['tokens'] += total
                providers[provider]['cached'] += cached
        return {'date': now.date().isoformat(), 'timezone': str(ZONE), 'updatedAt': now.isoformat(), 'providers': providers}


def serve():
    collector = Collector(Path.home())
    snapshot = collector.collect()

    def refresh():
        nonlocal snapshot
        while True:
            time.sleep(60)
            try:
                snapshot = collector.collect()
            except Exception:
                # Keep the timestamp of the last successful collection, so the
                # browser can recognize stale data rather than display fake zeroes.
                import traceback
                traceback.print_exc()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path != '/usage.json':
                self.send_error(404)
                return
            body = json.dumps(snapshot).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', 'https://ryhub.dev')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    threading.Thread(target=refresh, daemon=True).start()
    HTTPServer(('127.0.0.1', 8081), Handler).serve_forever()


if __name__ == '__main__':
    serve()
