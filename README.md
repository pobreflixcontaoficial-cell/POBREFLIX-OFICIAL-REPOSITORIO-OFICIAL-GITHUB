# Pobreflix — versão demonstrativa

Este repositório contém uma interface web demonstrativa. Não presume que exista catálogo de mídia autorizado, serviço de streaming, download offline, cobrança ou distribuição oficial de aplicativos. Antes de publicar, confirme os direitos e conecte serviços e arquivos reais.

## Executar localmente

1. Instale Node.js 18 ou mais recente.
2. Copie `.env.example` para `.env` e preencha apenas os valores necessários (`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `PORT`). O pacote de entrega não inclui `.env`.
3. Inicie com `npm start` e acesse `http://localhost:3000`. Não há dependências npm adicionais declaradas.
4. Rode `npm test` para as verificações estáticas e de servidor incluídas.

Nunca use a chave `service_role` no frontend ou neste servidor público. Se uma chave real já foi commitada ou publicada, revogue-a e gere outra.

## Supabase

O arquivo `supabase/schema.sql` foi atualizado localmente. Ele não foi executado no projeto Supabase nem validado contra o banco remoto. Revise o diff e aplique-o manualmente em um ambiente controlado. A política de leitura pública de fontes agora exige fonte ativa e título publicado; a política de mensagens limita comprimentos, mas não implementa CAPTCHA, rate limit, validação robusta de email ou proteção contra abuso.

O login, cadastro, catálogo dinâmico, favoritos e formulários que dependem do Supabase só funcionam depois de configurar e validar a conexão e as políticas. Erros de configuração agora devem ser informados sem impedir a página local de inicializar.

## Mídia, player e downloads

O player não usa mais um MP4 de demonstração como substituto do título. Ele precisa de uma URL de mídia configurada e autorizada (`video_url` ou uma fonte ativa em `title_sources`). Sem isso, mostra um estado vazio e não reproduz o filme.

`download.html` é uma demonstração de seleção e fila; não existe serviço de download offline nem arquivo real associado aos itens. Séries vindas do banco não exibem temporadas/episódios inventados: este projeto ainda não tem um modelo de metadados de episódios conectado. Os exemplos estáticos são identificados como demonstrativos.

A página independente `denunciar.html` grava demonstrações somente no `localStorage` deste navegador. Não envia denúncias a uma equipe. Os demais formulários de suporte dependem de configuração do Supabase e de uma política de privacidade adequada.

## Perfis e conteúdo legal

A seleção e os nomes em `perfis.html` ficam somente neste navegador/dispositivo; não sincronizam com conta ou nuvem. Preços, pagamentos, disponibilidade de apps, canais de privacidade/contato, vagas e textos legais precisam ser fornecidos e validados pelo proprietário antes de qualquer publicação como informação oficial.

## Rotas e testes

`manus-routes.json` lista as rotas declaradas. O servidor entrega o sitemap em `/sitemap.xml`, protege arquivos internos e oferece suporte a requisições HTTP Range para MP4. Os testes locais verificam os arquivos protegidos, páginas principais, referências locais, manifest/rotas e resposta parcial de mídia. Eles não validam Supabase, credenciais, direitos autorais, instalação em lojas, cobranças nem serviços externos.

## Painel administrativo

O painel foi deixado de lado conforme solicitado: o arquivo existente no ZIP original não foi alterado e o novo anexo de painel não foi integrado a esta revisão.
