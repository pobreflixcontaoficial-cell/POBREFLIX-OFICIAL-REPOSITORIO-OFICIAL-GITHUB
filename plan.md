# Pobreflix Integrado — plano de implementação

## Escopo
Conectar as páginas HTML existentes em uma experiência navegável, substituir comportamentos demonstrativos de cadastro/login por fluxos persistentes, integrar Supabase com configuração por variáveis de ambiente, criar painel administrativo protegido por allowlist de UID/email e adicionar gestão de conteúdo e SEO. O player deve executar `assets/video/pobreflix-intro.mp4` antes do vídeo selecionado, com transição automática e botão de pular.

## Abordagem
- Preservar o visual e a maior parte do HTML fornecido, adicionando uma camada compartilhada em `assets/pobreflix.js` e `assets/pobreflix.css`.
- Usar Supabase Auth para sessão e cadastro; nenhuma senha ou chave privada ficará no código público.
- Usar tabelas Supabase para perfis, títulos, favoritos, contatos e configurações SEO, com RLS e checagem dupla no frontend e nas políticas do banco.
- Usar allowlist de administrador por UID/email configurada no frontend apenas como UX; operações administrativas devem depender das políticas RLS e/ou de uma função segura no backend.
- Implementar o player como uma máquina de estados `intro -> conteúdo`, com fallback para o conteúdo caso a intro falhe, sem impedir o acesso do usuário.
- Exibir na home, depois da intro e antes do conteúdo inicial, uma tela de escolha de assinatura em vidro vermelho/preto com Bronze, Prata, Platina, Ouro, Diamante e Premium, sem preços ou valores.
- Exibir antes das assinaturas uma etapa de seleção múltipla de dispositivos, inspirada na referência fornecida, com cartões para TV, smartphone/tablet, computador, videogame, streaming e decodificador.
- Gerar `manus-routes.json`, iniciar servidor estático e executar verificações automatizadas de links, HTML e JavaScript.

## Estrutura
- `*.html`: páginas entregues e conectadas.
- `assets/pobreflix.js`: navegação compartilhada, sessão Supabase, cadastro/login, favoritos, painel e player.
- `assets/pobreflix.css`: componentes adicionados e responsividade.
- `assets/video/pobreflix-intro.mp4`: intro enviada pelo usuário.
- `supabase/schema.sql`: tabelas, índices, RLS e seeds mínimos.
- `server.js`: servidor estático local para Preview e fallback de rotas.
- `manus-routes.json`: manifesto das páginas servido na raiz para o Preview.

## Dependências e bloqueios
A URL do projeto Supabase e a chave pública anon ainda precisam ser fornecidas/configuradas como segredos do ambiente. A conta administradora deve existir no Supabase Auth com o UID/email autorizado; a senha não será embutida no frontend.

## Design
- Movimento: streaming editorial dark com acentos vermelhos e superfícies translúcidas (0,06).
- Movimento: dashboard operacional minimalista sobre carvão e âmbar (0,07).
- Movimento: catálogo maximalista neon com navegação flutuante (0,08).

Escolhido: streaming editorial dark. Princípios: hierarquia cinematográfica, foco no conteúdo, estados de sessão claros e feedback imediato. Paleta: carvão para reduzir distração, vermelho como ação/brand, branco suave para leitura. Layout: páginas preservam a composição existente e recebem navegação compartilhada e trilhas de contexto. Assinatura: botão de reprodução vermelho, cartões com foco e overlay de intro. Interações: ações destrutivas pedem confirmação e estados de salvamento são explícitos. Animação: transições curtas, sem autoplay do conteúdo antes da intenção do usuário. Tipografia: sistema sans-serif com pesos fortes nos títulos. Voz: direta e informal, com CTAs como “Continuar assistindo” e “Salvar alteração”.
