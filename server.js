const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
function loadDotEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#') || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
loadDotEnv();
const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/(?:rest|auth)\/v1\/?$/i, '').replace(/\/+$/, '');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8',
};

function safePath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  if (decoded.includes('\0')) return null;
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const full = path.resolve(ROOT, relative);
  return full.startsWith(ROOT + path.sep) ? full : null;
}

const PRIVATE_DIRS = ['supabase', 'tests', 'node_modules'];
const PRIVATE_FILES = ['server.js', 'package.json', 'package-lock.json', 'Dockerfile', 'app.config.ts', 'HOSTING.md', 'MAPA_ARQUIVOS.md', 'TODO.md', 'plan.md', 'README.txt', 'README.md', 'MAPA_ARQUIVOS.md'];
function isPrivate(full) {
  const rel = path.relative(ROOT, full);
  const parts = rel.split(path.sep);
  if (parts.some(p => p.startsWith('.'))) return true; // .env, .git, .dockerignore...
  if (PRIVATE_DIRS.includes(parts[0])) return true;
  return parts.length === 1 && PRIVATE_FILES.includes(parts[0]);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function serveFile(req, res, file) {
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && ext === '.mp4') {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2] || 1));
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start <= end && start < stat.size && end < stat.size) {
          res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'public, max-age=3600' });
          return fs.createReadStream(file, { start, end }).pipe(res);
        }
      }
      return send(res, 416, 'Range Not Satisfiable', { 'Content-Range': `bytes */${stat.size}` });
    }
    const headers = { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': ext === '.mp4' ? 'public, max-age=3600' : 'no-store' };
    if (ext === '.mp4') headers['Accept-Ranges'] = 'bytes';
    res.writeHead(200, headers);
    if (req.method !== 'HEAD') fs.createReadStream(file).pipe(res); else res.end();
  });
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed');
  if (parsed.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true, service: 'pobreflix' }), { 'Content-Type': 'application/json; charset=utf-8' });
  if (parsed.pathname === '/api/runtime-config') {
    return send(res, 200, JSON.stringify({
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      adminUid: process.env.ADMIN_UID || '01fbcfb4-5943-4c96-bd28-f21cf64a850f',
      adminEmail: process.env.ADMIN_EMAIL || 'pobreflix.conta.oficial@gmail.com',
    }), { 'Content-Type': 'application/json; charset=utf-8' });
  }
  if (['/admin', '/admin/', '/admin.html'].includes(parsed.pathname)) {
    return send(res, 302, '', { Location: '/painel.admin.html' });
  }
  if (parsed.pathname === '/sitemap.xml') {
    const pages = ['/', '/index.html', '/catalago.html', '/detalhes.html', '/baixar-pobreflix.html', '/download.html', '/denunciar.html', '/sobre.html', '/media-center.html', '/central-ajuda.html', '/ajuda.html', '/contato.html', '/privacidade.html', '/termos.html', '/avisos-legais.html'];
    const origin = `${parsed.protocol}//${parsed.host}`;
    return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`, { 'Content-Type': 'application/xml; charset=utf-8' });
  }
  if (parsed.pathname === '/robots.txt') return send(res, 200, 'User-agent: *\nAllow: /\nDisallow: /painel.admin.html\nDisallow: /api/\nSitemap: /sitemap.xml\n', { 'Content-Type': 'text/plain; charset=utf-8' });
  const file = safePath(parsed.pathname);
  if (!file) return send(res, 400, 'Bad request');
  if (isPrivate(file)) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  serveFile(req, res, file);
});

if (require.main === module) server.listen(PORT, '0.0.0.0', () => console.log(`Pobreflix listening on ${PORT}`));

module.exports = { server, isPrivate, safePath };
