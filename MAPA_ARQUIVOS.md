# Mapa técnico — Pobreflix demonstrativa

Este documento descreve a cópia local revisada. A configuração operacional do usuário não foi incluída; não existe `.env` real neste pacote.

## Aplicação

- `server.js`: servidor Node, arquivos estáticos, `/health`, manifesto/sitemap, proteção de caminhos internos e suporte a `Range` para MP4.
- `assets/pobreflix.js` e `assets/pobreflix.css`: sessão e componentes compartilhados; integrações Supabase condicionais; validação do parâmetro `next` para impedir redirecionamento a outra origem.
- `index.html`, `catalago.html`, `detalhes.html`: páginas públicas de entrada, catálogo e detalhes. Dados estáticos são identificados como demonstração e não substituem metadados validados.
- `playervideo.html`: player sem vídeo substituto; só inicia mídia quando há uma fonte autorizada. Filme e série recebem contextos separados; páginas estáticas de série são explicitamente demonstrativas, e títulos remotos sem metadados não recebem episódios fictícios.
- `download.html`: seletor demonstrativo de filmes/séries, episódios, preferências e fila. Não há serviço nem arquivo offline conectado.
- `denunciar.html`: formulário demonstrativo; no estado atual a confirmação informa que o conteúdo fica local e não é enviada.
- `baixar-pobreflix.html`: apresentação de plataformas. Não contém instaladores assinados ou publicação em lojas.
- `perfis.html`: seleção/edição demonstrativa com persistência local no navegador; não sincroniza com a conta.
- `privacidade.html`, `termos.html`, `avisos-legais.html`, `sobre.html`, `ajuda.html`, `central-ajuda.html`, `contato.html`: páginas informativas que precisam de validação final do proprietário antes de publicação.
- `manus-routes.json`: manifesto de rotas.
- `supabase/schema.sql`: schema e políticas modificados localmente; ainda não aplicados ao serviço remoto.
- `tests/check-site.js`, `tests/check-private.js`: validações de arquivos, referências, rotas, proteções HTTP e Range de mídia.
- `README.md`, `HOSTING.md`, `TODO.md`: configuração, limites e pendências.

## Integridade e recursos

Imagens base64 grandes de páginas públicas foram extraídas para `assets/embedded-*` e deduplicadas. Não há fallback de vídeo de demonstração no player. A documentação de início foi alinhada ao que realmente funciona localmente.

## Fora do escopo desta revisão

O painel existente no pacote original foi deixado intocado, conforme solicitado, e o anexo separado não foi integrado nem verificado nesta rodada. Não publique ou execute qualquer migração por inferência: primeiro valide o projeto de destino, permissões, conteúdo e direitos.
