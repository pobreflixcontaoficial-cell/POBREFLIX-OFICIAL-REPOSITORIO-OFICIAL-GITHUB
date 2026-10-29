# Executar e hospedar a versão demonstrativa

## Requisitos e início local

Use Node.js 18 ou mais recente. O servidor usa APIs nativas do Node e não requer pacote npm adicional para iniciar:

```bash
cp .env.example .env
# Edite SUPABASE_URL e SUPABASE_ANON_KEY somente se for conectar o projeto correto.
npm start
```

Acesse `http://localhost:3000`. Para as verificações incluídas, execute `npm test`. O arquivo `.env` real não acompanha o pacote; nunca publique chaves `service_role`.

## Docker

```bash
docker build -t pobreflix-demo .
docker run --rm -p 3000:3000 --env-file .env pobreflix-demo
```

O servidor responde em `/health`, publica o manifesto de rotas e o sitemap e aceita `Range` para arquivos MP4. Ele impede acesso HTTP a arquivos de configuração e diretórios internos.

## Supabase

`supabase/schema.sql` foi alterado apenas nesta cópia local. Revise e aplique-o manualmente no projeto Supabase correto; nenhuma migração remota foi executada ou validada nesta entrega. Use somente a chave anon/publishable no navegador. Login, catálogo, favoritos e mensagens dependem da configuração do projeto e das políticas RLS.

## Reprodução, downloads e denúncias

O player só reproduz uma fonte autorizada configurada em `video_url` ou `title_sources`. Sem fonte, exibe um estado vazio em vez de reproduzir um MP4 de exemplo. `download.html` demonstra a escolha de conteúdo, episódio e fila, mas não baixa arquivos nem habilita visualização offline. `denunciar.html` salva demonstrações apenas no navegador; ainda não envia denúncias a uma equipe.

Antes da publicação, confirme os direitos de todo o conteúdo, conecte uma infraestrutura de mídia e download autorizada, configure o backend de denúncias, valide privacidade/termos e só então anuncie disponibilidade de apps ou lojas.

## Escopo do painel

O painel administrativo foi deixado de lado conforme solicitado. O arquivo existente no ZIP original não foi alterado, e o anexo separado de painel não foi integrado a esta revisão.
