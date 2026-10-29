const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const excluded = new Set(['painel.admin.html']);
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html') && !excluded.has(name));
const failures = [];
const standalone = new Set(['media-center.html', 'perfis.html', 'download.html', 'denunciar.html', 'baixar-pobreflix.html', 'tela de download.html']);
const sharedRequired = new Set(['index.html', 'catalago.html', 'detalhes.html', 'playervideo.html', 'login.html', 'signup.html', 'editar-perfil.html', 'central-ajuda.html', 'contato.html']);
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (!/^<!doctype html>/i.test(html)) failures.push(`${file}: sem doctype`);
  if (!/<html[^>]*\blang=["']pt-BR["']/i.test(html)) failures.push(`${file}: lang pt-BR ausente`);
  if (sharedRequired.has(file) && !html.includes('assets/pobreflix.js')) failures.push(`${file}: camada compartilhada ausente`);
  if (!standalone.has(file) && !html.includes('assets/pobreflix.js') && !sharedRequired.has(file)) {
    // A página pode ser puramente estática; esta regra não exige scripts de backend globalmente.
  }
  for (const match of html.matchAll(/(?:href|src)=["']([^"'#?]+)["']/gi)) {
    const target = match[1];
    if (target.includes('${') || target.includes('{{') || target.includes('avatarImage.') || target.includes('item.image')) continue;
    if (/^(https?:|data:|mailto:|tel:|javascript:|\/\/)/i.test(target)) continue;
    const resolved = path.resolve(root, target);
    if (!resolved.startsWith(root) || !fs.existsSync(resolved)) failures.push(`${file}: referência ausente ${target}`);
  }
}
for (const required of ['download.html', 'denunciar.html', 'baixar-pobreflix.html']) {
  if (!fs.existsSync(path.join(root, required))) failures.push(`página ausente: ${required}`);
}
const routesFile = path.join(root, 'manus-routes.json');
if (!fs.existsSync(routesFile)) failures.push('rotas: manifesto ausente');
else {
  try {
    const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8')).routes || [];
    const paths = routes.map(route => route.path);
    if (new Set(paths).size !== paths.length) failures.push('rotas: caminho duplicado');
    for (const route of ['/baixar-pobreflix.html', '/download.html', '/denunciar.html']) if (!paths.includes(route)) failures.push(`rota ausente: ${route}`);
    for (const route of routes) {
      if (route.path === '/' || route.path === '/painel.admin.html') continue;
      const file = path.resolve(root, decodeURIComponent(route.path.replace(/^\/+/, '')));
      if (!file.startsWith(root) || !fs.existsSync(file)) failures.push(`rota sem arquivo: ${route.path}`);
    }
  } catch (error) { failures.push(`rotas: JSON inválido (${error.message})`); }
}
if (!fs.existsSync(path.join(root, 'assets/video/pobreflix-intro.mp4'))) failures.push('intro: asset ausente');
const player = fs.readFileSync(path.join(root, 'playervideo.html'), 'utf8');
if (!player.includes("q.get('video')||''")) failures.push('player: fonte vazia deveria ser o padrão');
if (player.includes("q.get('video')||'assets/video/pobreflix-demo.mp4'")) failures.push('player: fallback de demonstração ativo');
for (const file of ['NetflixIntro_P_atualizada.html', 'kawE_intro_desenvolvedor.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (/data:video\/[^;]+;base64,/i.test(html)) failures.push(`${file}: vídeo base64 embutido ainda presente`);
}
const shared = fs.readFileSync(path.join(root, 'assets', 'pobreflix.js'), 'utf8');
if (!shared.includes('safeNextUrl')) failures.push('login: validação de redirecionamento ausente');
const schema = fs.readFileSync(path.join(root, 'supabase', 'schema.sql'), 'utf8');
for (const term of ['title_sources.title_id', 't.published = true', 'char_length(coalesce(message']) if (!schema.includes(term)) failures.push(`schema: regra ausente (${term})`);
if (fs.existsSync(path.join(root, '.env'))) failures.push('.env real não deve estar no pacote de projeto');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`OK: ${htmlFiles.length} páginas (painel excluído), referências, rotas, player, schema e limites de mídia verificados.`);
