import json
import re
import sqlite3
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from server import HOST, database_path, video_response

PORT = 4175
LIST = re.compile(r'/posts/(blog|projects)')
POST = re.compile(r'/posts/(blog|projects)/([1-9][0-9]{0,17})(/cover|/video)?')
IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}


class PublicFeed(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, status, body=b'', content_type='application/json', headers=()):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        if not any(name == 'Content-Length' for name, _ in headers):
            self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'none'; sandbox")
        for name, value in headers:
            self.send_header(name, value)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def json(self, value):
        self.reply(200, json.dumps(value).encode('utf-8'))

    def project_video(self, post_id, head=False):
        with closing(sqlite3.connect(self.server.database.as_uri() + '?mode=ro', uri=True)) as db:
            db.execute('BEGIN')
            row = db.execute("SELECT length(video) FROM posts WHERE id = ? AND kind = 'projects' "
                             'AND hidden = 0 AND video IS NOT NULL', (post_id,)).fetchone()
            if row:
                status, body, headers = video_response(db, 'posts', post_id, row[0], self.headers.get('Range'), head=head)
        if row:
            self.reply(status, body, 'video/mp4', headers)
        else:
            self.reply(404)

    def do_HEAD(self):
        item = POST.fullmatch(self.path)
        if not item or item[1] != 'projects' or item[3] != '/video':
            self.reply(404)
            return
        try:
            self.project_video(int(item[2]), head=True)
        except sqlite3.Error:
            self.reply(503)

    def do_GET(self):
        listing = LIST.fullmatch(self.path)
        item = POST.fullmatch(self.path)
        if not (listing or item):
            self.reply(404)
            return
        try:
            if item and item[3] == '/video':
                if item[1] == 'projects':
                    self.project_video(int(item[2]))
                else:
                    self.reply(404)
                return
            with closing(sqlite3.connect(self.server.database.as_uri() + '?mode=ro', uri=True)) as db:
                db.row_factory = sqlite3.Row
                if listing:
                    rows = db.execute('SELECT id, title, entry_date AS date FROM posts WHERE kind = ? AND hidden = 0 '
                                      'ORDER BY id DESC', (listing[1],)).fetchall()
                    self.json([dict(row) for row in rows])
                    return
                key = (item[1], int(item[2]))
                if item[3] == '/cover':
                    row = db.execute('SELECT cover, cover_type FROM posts WHERE kind = ? AND id = ? AND hidden = 0', key).fetchone()
                    if row and row['cover'] and row['cover_type'] in IMAGE_TYPES:
                        self.reply(200, row['cover'], row['cover_type'])
                    else:
                        self.reply(404)
                    return
                row = db.execute('SELECT title, markdown, entry_date AS date, cover IS NOT NULL AS has_cover, '
                                 "(kind = 'projects' AND video IS NOT NULL) AS has_video "
                                 'FROM posts WHERE kind = ? AND id = ? AND hidden = 0', key).fetchone()
                if row:
                    self.json(dict(row))
                else:
                    self.reply(404)
        except sqlite3.Error:
            self.reply(503)


if __name__ == '__main__':
    with ThreadingHTTPServer((HOST, PORT), PublicFeed) as server:
        server.database = database_path()
        print(f'Public feed listening at http://{HOST}:{PORT}', flush=True)
        server.serve_forever()
