import base64
import getpass
import hmac
import os
import re
import sqlite3
import sys
from contextlib import closing
from datetime import date
from email import policy
from email.parser import BytesParser
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

HOST = '127.0.0.1'
PORT = 4174
MAX_COVER_BYTES = 8 * 1024 * 1024
MAX_VIDEO_BYTES = 24 * 1024 * 1024
MAX_FORM_BYTES = MAX_COVER_BYTES + MAX_VIDEO_BYTES + 1024 * 1024
DRAFT_ROUTES = {'/': ('blog', 'Blog'), '/project': ('projects', 'Projects')}
COVER_ROUTES = {'/cover/blog': 'blog', '/cover/projects': 'projects'}
ASSETS = {
    '/preview.js': 'text/javascript; charset=utf-8',
    '/preview.css': 'text/css; charset=utf-8',
}
ASSET_DIR = Path(__file__).resolve().parent / 'dist'
MANAGE_ACTION = re.compile(r'/manage/([1-9][0-9]{0,17})/(visibility|delete)')


def database_path():
    return Path.home() / '.local' / 'share' / 'ryhub-studio' / 'drafts.sqlite3'


def open_database():
    path = database_path()
    folder = path.parent
    folder.mkdir(mode=0o700, parents=True, exist_ok=True)
    if folder.is_symlink() or folder.stat().st_mode & 0o077:
        raise SystemExit('The studio data directory must be private (0700).')
    if path.is_symlink() or (path.exists() and path.stat().st_mode & 0o077):
        raise SystemExit('The studio database must be private (0600).')
    fd = os.open(path, os.O_CREAT | os.O_RDONLY | os.O_NOFOLLOW, 0o600)
    os.close(fd)
    with closing(sqlite3.connect(path)) as db, db:
        db.execute('''CREATE TABLE IF NOT EXISTS drafts (
            kind TEXT PRIMARY KEY CHECK (kind IN ('blog', 'projects')),
            title TEXT NOT NULL,
            markdown TEXT NOT NULL
        )''')
        if db.execute('PRAGMA user_version').fetchone()[0] == 0:
            if db.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'draft'").fetchone():
                db.execute("INSERT OR IGNORE INTO drafts SELECT 'blog', title, markdown FROM draft WHERE id = 1")
            db.execute('PRAGMA user_version = 1')
        db.execute('''CREATE TABLE IF NOT EXISTS draft_details (
            kind TEXT PRIMARY KEY,
            entry_date TEXT NOT NULL,
            cover BLOB,
            cover_type TEXT
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL CHECK (kind IN ('blog', 'projects')),
            title TEXT NOT NULL,
            markdown TEXT NOT NULL,
            entry_date TEXT NOT NULL,
            cover BLOB,
            cover_type TEXT,
            hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1))
        )''')
        for table in ('draft_details', 'posts'):
            if 'video' not in {row[1] for row in db.execute(f'PRAGMA table_info({table})')}:
                db.execute(f'ALTER TABLE {table} ADD COLUMN video BLOB')
    return path


def video_response(db, table, row_id, length, range_header, head=False):
    headers = [('Accept-Ranges', 'bytes')]
    start, end = 0, length - 1
    status = 200
    if range_header is not None:
        match = re.fullmatch(r'bytes=([0-9]{0,18})-([0-9]{0,18})', range_header)
        if match and match[1]:
            start = int(match[1])
            if match[2]:
                end = min(end, int(match[2]))
        elif match and match[2]:
            start = max(0, length - int(match[2]))
        else:
            start = length
        if start > end:
            return 416, b'', headers + [('Content-Range', f'bytes */{length}')]
        status = 206
        headers.append(('Content-Range', f'bytes {start}-{end}/{length}'))
    count = end - start + 1
    headers.append(('Content-Length', str(count)))
    if head:
        return status, b'', headers
    with db.blobopen(table, 'video', row_id, readonly=True) as blob:
        blob.seek(start)
        return status, blob.read(count), headers


def cover_type(data):
    if data.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        return 'image/webp'
    raise ValueError('Choose a JPEG, PNG, or WebP photo.')


def parse_form(body, boundary):
    if not isinstance(boundary, str) or not re.fullmatch(r'[A-Za-z0-9-]{1,70}', boundary):
        raise ValueError('Invalid form.')
    header = f'Content-Type: multipart/form-data; boundary={boundary}\r\n\r\n'.encode('ascii')
    form = BytesParser(policy=policy.default).parsebytes(header + body)
    fields = {}
    if form.defects or not form.is_multipart():
        raise ValueError('Invalid form.')
    for part in form.iter_parts():
        name = part.get_param('name', header='content-disposition')
        if (part.get_content_disposition() != 'form-data' or name in fields
                or name not in {'title', 'markdown', 'date', 'cover', 'remove_cover', 'video', 'remove_video', 'action'}
                or part.is_multipart()):
            raise ValueError('Invalid form.')
        fields[name] = part.get_payload(decode=True)
    return fields


class Studio(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def reply(self, status, body='', headers=(), content_type='text/html; charset=utf-8'):
        content = body.encode('utf-8') if isinstance(body, str) else body
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        if not any(name == 'Content-Length' for name, _ in headers):
            self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('Content-Security-Policy',
                         "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob:; "
                         "media-src 'self' blob:; "
                         "form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.send_header('X-Content-Type-Options', 'nosniff')
        for name, value in headers:
            self.send_header(name, value)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(content)

    def authorize(self):
        if self.headers.get_all('Host') != [self.server.authority]:
            self.reply(403)
        elif not hmac.compare_digest(self.headers.get('Authorization', '').encode(), self.server.auth):
            self.reply(401, 'Sign in to Studio.', [('WWW-Authenticate', 'Basic realm="Studio", charset="UTF-8"')])
        else:
            return True
        return False

    def management_page(self, title, content):
        self.reply(200, f'''<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Studio</title>
<link rel="stylesheet" href="/preview.css">
<main class="editor">
  <nav aria-label="Studio"><a href="/">Blog</a> / <a href="/project">Projects</a> / <a href="/manage">Manage</a></nav>
  <h1>{title}</h1>
  {content}
</main>
</html>''')

    def show_manage(self):
        with closing(sqlite3.connect(self.server.database)) as db:
            rows = db.execute('SELECT id, kind, title, hidden FROM posts ORDER BY id DESC').fetchall()
        sections = []
        for kind, label in DRAFT_ROUTES.values():
            items = []
            for post_id, post_kind, title, hidden in rows:
                if post_kind != kind:
                    continue
                checked = ' checked' if hidden else ''
                items.append(f'''<li>
  <p><strong>{escape(title)}</strong> — {'Hidden' if hidden else 'Visible'}</p>
  <form method="post" action="/manage/{post_id}/visibility">
    <label><span><input type="checkbox" name="hidden" value="1"{checked}> Hide from site</span></label>
    <button>Save visibility</button>
    <a href="/manage/{post_id}/delete">Delete…</a>
  </form>
</li>''')
            content = '<ul>' + ''.join(items) + '</ul>' if items else '<p>No published posts yet.</p>'
            sections.append(f'<section><h2>{label}</h2>{content}</section>')
        self.management_page('Manage posts', ''.join(sections))

    def confirm_delete(self, post_id):
        with closing(sqlite3.connect(self.server.database)) as db:
            post = db.execute('SELECT title FROM posts WHERE id = ?', (post_id,)).fetchone()
        if post is None:
            self.reply(404)
            return
        self.management_page('Delete post?', f'''
<p>Delete <strong>{escape(post[0])}</strong> permanently? Hide it instead if you might want it back.</p>
<form method="post" action="/manage/{post_id}/delete">
  <button name="confirm" value="delete">Delete permanently</button>
  <a href="/manage">Cancel</a>
</form>''')

    def update_managed_post(self, post_id, action):
        if self.headers.get_content_type() != 'application/x-www-form-urlencoded':
            self.reply(415)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 <= size <= 256:
                raise ValueError
            form = parse_qs(self.rfile.read(size).decode('ascii'), strict_parsing=True, max_num_fields=1)
            if action == 'delete' and form != {'confirm': ['delete']}:
                raise ValueError
            if action == 'visibility' and form not in ({}, {'hidden': ['1']}):
                raise ValueError
        except ValueError:
            self.reply(400)
            return
        with closing(sqlite3.connect(self.server.database)) as db, db:
            if action == 'delete':
                result = db.execute('DELETE FROM posts WHERE id = ?', (post_id,))
            else:
                result = db.execute('UPDATE posts SET hidden = ? WHERE id = ?', (int(bool(form)), post_id))
        if not result.rowcount:
            self.reply(404)
            return
        self.reply(303, headers=[('Location', '/manage')])

    def draft_video(self, head=False):
        with closing(sqlite3.connect(self.server.database)) as db:
            db.execute('BEGIN')
            row = db.execute("SELECT rowid, length(video) FROM draft_details WHERE kind = 'projects' AND video IS NOT NULL").fetchone()
            if row:
                response = video_response(db, 'draft_details', *row, self.headers.get('Range'), head=head)
        if row:
            self.reply(*response, content_type='video/mp4')
        else:
            self.reply(404)

    def do_HEAD(self):
        if self.path == '/video/projects' and self.authorize():
            self.draft_video(head=True)
        elif self.path != '/video/projects':
            self.reply(404)

    def do_GET(self):
        if not self.authorize():
            return
        if self.path == '/video/projects':
            self.draft_video()
            return
        if self.path == '/manage':
            self.show_manage()
            return
        manage = MANAGE_ACTION.fullmatch(self.path)
        if manage and manage[2] == 'delete':
            self.confirm_delete(int(manage[1]))
            return
        if self.path in ASSETS:
            try:
                content = (ASSET_DIR / self.path[1:]).read_bytes()
            except FileNotFoundError:
                self.reply(404)
            else:
                self.reply(200, content, content_type=ASSETS[self.path])
            return
        if self.path in COVER_ROUTES:
            with closing(sqlite3.connect(self.server.database)) as db:
                photo = db.execute('SELECT cover, cover_type FROM draft_details WHERE kind = ? AND cover IS NOT NULL',
                                   (COVER_ROUTES[self.path],)).fetchone()
            if photo:
                self.reply(200, photo[0], content_type=photo[1])
            else:
                self.reply(404)
            return
        if self.path not in DRAFT_ROUTES:
            self.reply(404)
            return
        kind, label = DRAFT_ROUTES[self.path]
        with closing(sqlite3.connect(self.server.database)) as db:
            draft = db.execute('SELECT title, markdown FROM drafts WHERE kind = ?', (kind,)).fetchone()
            details = db.execute('SELECT entry_date, cover IS NOT NULL, video IS NOT NULL FROM draft_details WHERE kind = ?',
                                 (kind,)).fetchone()
        title, markdown = draft or ('', '')
        entry_date, has_cover, has_video = details or ('', False, False)
        cover_url = f'/cover/{kind}' if has_cover else ''
        video_url = '/video/projects' if kind == 'projects' and has_video else ''
        video_field = '''<label>Video (optional, MP4 up to 24 MB)
            <input type="file" name="video" accept="video/mp4,.mp4">
          </label>''' if kind == 'projects' else ''
        remove_video_field = '''<label><span><input type="checkbox" name="remove_video"> Remove saved video</span></label>''' if video_url else ''
        date_field = (f'<label>Date (optional) <input type="date" name="date" value="{escape(entry_date)}" '
                      'max="9999-12-31"></label>') if kind == 'blog' else ''
        remove_field = '<label><span><input type="checkbox" name="remove_cover"> Remove saved photo</span></label>' if has_cover else ''
        switcher = ' / '.join(
            f'<a href="{path}"' + (' aria-current="page"' if path == self.path else '') + f'>{name}</a>'
            for path, (_, name) in DRAFT_ROUTES.items()
        )
        self.reply(200, f'''<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Studio — {label}</title>
<link rel="stylesheet" href="/preview.css">
<script src="/preview.js" defer></script>
<div class="studio">
  <section class="editor">
    <h1>Studio — {label}</h1>
    <nav aria-label="Studio">{switcher} / <a href="/manage">Manage</a></nav>
    <form id="draft-form" data-page="#{kind}" data-cover="{cover_url}" data-video="{video_url}" action="{self.path}"
          method="post" enctype="multipart/form-data" autocomplete="off">
      <label>Title <input name="title" value="{escape(title)}" maxlength="200"></label>
      {date_field}
      <label>Cover photo (optional, up to 8 MB)
        <input type="file" name="cover" accept="image/jpeg,image/png,image/webp">
      </label>
      {remove_field}
      {video_field}
      {remove_video_field}
      <label>Markdown <textarea name="markdown" rows="20">
{escape(markdown)}</textarea></label>
      <button>Save draft</button>
      <button name="action" value="publish">Publish as new post</button>
      <p>Publishing makes the text and original media public.</p>
    </form>
  </section>
  <section aria-labelledby="preview-label">
    <h2 id="preview-label">Live preview</h2>
    <div id="post-preview"></div>
  </section>
</div>
</html>''')

    def do_POST(self):
        if not self.authorize():
            return
        if self.headers.get_all('Origin') != [f'http://{self.server.authority}']:
            self.reply(403)
            return
        manage = MANAGE_ACTION.fullmatch(self.path)
        if manage:
            self.update_managed_post(int(manage[1]), manage[2])
            return
        if self.path not in DRAFT_ROUTES:
            self.reply(404)
            return
        kind, _ = DRAFT_ROUTES[self.path]
        if self.headers.get_content_type() != 'multipart/form-data':
            self.reply(415)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= MAX_FORM_BYTES:
                self.reply(413)
                return
            fields = parse_form(self.rfile.read(size), self.headers.get_boundary())
            action = fields.get('action', b'')
            if action not in (b'', b'publish'):
                raise ValueError
            title = fields['title'].decode('utf-8')
            if action == b'publish' and not title.strip():
                self.reply(400, 'Add a title before publishing.')
                return
            markdown = fields['markdown'].decode('utf-8')
            entry_date = fields.get('date', b'').decode('ascii') if kind == 'blog' else ''
            if entry_date and date.fromisoformat(entry_date).isoformat() != entry_date:
                raise ValueError
            if len(title) > 200 or len(fields['markdown']) > 512 * 1024:
                raise ValueError
            cover = fields.get('cover') or None
            video = fields.get('video') or None
            if kind != 'projects' and (video or 'remove_video' in fields):
                raise ValueError
            if video and len(video) > MAX_VIDEO_BYTES:
                self.reply(413, 'The video must be 24 MB or smaller.')
                return
            if video and (len(video) < 16 or video[4:8] != b'ftyp'):
                self.reply(400, 'Choose an MP4 video.')
                return
            if cover and len(cover) > MAX_COVER_BYTES:
                self.reply(413, 'The cover photo must be 8 MB or smaller.')
                return
        except (KeyError, ValueError):
            self.reply(400, 'Invalid draft.')
            return
        try:
            media_type = cover_type(cover) if cover else None
        except ValueError as error:
            self.reply(400, str(error))
            return
        remove_cover = 'remove_cover' in fields and cover is None
        remove_video = 'remove_video' in fields and video is None
        with closing(sqlite3.connect(self.server.database)) as db, db:
            db.execute('INSERT OR REPLACE INTO drafts VALUES (?, ?, ?)', (kind, title, markdown))
            db.execute('''INSERT INTO draft_details (kind, entry_date, cover, cover_type, video) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(kind) DO UPDATE SET entry_date = excluded.entry_date,
                    cover = CASE WHEN ? THEN NULL ELSE COALESCE(excluded.cover, draft_details.cover) END,
                    cover_type = CASE WHEN ? THEN NULL ELSE COALESCE(excluded.cover_type, draft_details.cover_type) END,
                    video = CASE WHEN ? THEN NULL ELSE COALESCE(excluded.video, draft_details.video) END
                ''', (kind, entry_date, cover, media_type, video, remove_cover, remove_cover, remove_video))
            if action == b'publish':
                db.execute('''INSERT INTO posts (kind, title, markdown, entry_date, cover, cover_type, video)
                    SELECT d.kind, d.title, d.markdown, m.entry_date, m.cover, m.cover_type, m.video
                    FROM drafts d JOIN draft_details m ON m.kind = d.kind WHERE d.kind = ?''', (kind,))
        destination = '/manage' if action == b'publish' else self.path
        self.reply(303, headers=[('Location', destination)])


def main():
    os.umask(0o077)
    if not sys.stdin.isatty():
        raise SystemExit('Run Studio from an interactive terminal.')
    password = getpass.getpass('Studio password: ')
    with ThreadingHTTPServer((HOST, PORT), Studio) as server:
        server.authority = f'{HOST}:{PORT}'
        server.database = open_database()
        server.auth = b'Basic ' + base64.b64encode(f'studio:{password}'.encode())
        del password
        print(f'Studio is listening at http://{server.authority}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
