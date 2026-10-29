const http = require('http');
const { server } = require('../server.js');
const cases = [
  ['/.env', 404], ['/server.js', 404], ['/supabase/schema.sql', 404], ['/tests/check-site.js', 404], ['/package.json', 404], ['/MAPA_ARQUIVOS.md', 404],
  ['/%2e%2e/%2e%2e/etc/passwd', 404], ['/%E0%A4%A', 400], ['/index.html', 200], ['/assets/pobreflix.js', 200],
  ['/health', 200], ['/download.html', 200], ['/denunciar.html', 200], ['/baixar-pobreflix.html', 200], ['/sitemap.xml', 200], ['/robots.txt', 200]
];
function request(port, route, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: route, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  let fail = 0;
  try {
    for (const [route, expected] of cases) {
      const result = await request(port, route);
      if (result.status !== expected) { fail++; console.error(`FALHOU ${route}: esperado ${expected}, recebido ${result.status}`); }
    }
    const range = await request(port, '/assets/video/pobreflix-demo.mp4', { Range: 'bytes=0-15' });
    if (range.status !== 206 || !/^bytes 0-15\//.test(range.headers['content-range'] || '') || range.body.length !== 16) {
      fail++; console.error(`FALHOU Range MP4: status=${range.status}, Content-Range=${range.headers['content-range'] || 'ausente'}, bytes=${range.body.length}`);
    }
  } catch (error) { fail++; console.error(`FALHA de teste: ${error.message}`); }
  server.close();
  if (fail) process.exit(1);
  console.log(`OK: ${cases.length} rotas de servidor e requisição parcial MP4 verificadas.`);
});
