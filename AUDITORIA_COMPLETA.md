# Auditoria técnica consolidada — Pobreflix

**Data de consolidação:** 28 de outubro de 2026  
**Base:** resultados de cinco revisões independentes do snapshot ZIP fornecido.

> **Nota de segurança:** este relatório não reabre nem reproduz valores do arquivo `.env`. Registra apenas a presença do arquivo e a avaliação já fornecida pelas revisões. Não incluir valores de credenciais em tickets, commits ou cópias deste relatório.

## 1. Resumo executivo

As cinco revisões identificaram um snapshot com estrutura funcional e algumas proteções documentadas, mas que ainda não deve ser tratado como produto pronto para publicação. Os bloqueios mais importantes são: (1) o ZIP inclui um `.env` cuja configuração foi classificada como aparentemente não-placeholder; (2) o redirecionamento pós-login usa diretamente o parâmetro `next`; (3) a política RLS de fontes de mídia não exige que o título associado esteja publicado; (4) o fluxo principal de assistir não chega ao player funcional; e (5) a central de mídia se incorpora recursivamente. Também há páginas de download que não correspondem às rotas declaradas e fluxos de perfil, suporte, recuperação de conta e download que são incompletos ou demonstrativos.

A documentação e a apresentação do produto têm discrepâncias relevantes: links rotulados como documentos legais oficiais retornam aos próprios resumos, instruções de ajuda descrevem mecanismos de acesso não corroborados pela implementação documentada, e as páginas divergem quanto a gratuidade, assinatura e funcionalidades. Há ainda lacunas de acessibilidade, desempenho potencial e testes automatizados, sem que tenha sido medida a experiência em navegador.

**Conclusão:** corrigir primeiro o empacotamento do `.env`, a autorização/leitura de fontes no banco, a validação de `next` e os bloqueios dos fluxos centrais. Antes de publicar, alinhar rotas, páginas legais e textos à implementação real, e testar os fluxos integrados. As observações abaixo são de análise estática; não constituem teste de invasão, parecer jurídico, validação de conformidade WCAG nem confirmação de comportamento em produção.

Não foram relatadas falhas de execução dos agentes/revisores (`failures: []`). Há, contudo, limites de cobertura específicos, registrados em “Escopo e limites”; nenhuma conclusão deve ser interpretada como validação de partes não inspecionadas.

## 2. Escopo e limites

A consolidação reúne revisões estáticas de segurança/autenticação/backend; navegação e completude funcional; conteúdo editorial, privacidade, termos, suporte e carreiras; acessibilidade, responsividade e desempenho; e build, deploy, testes e documentação. As revisões leram conjuntos diferentes de arquivos, incluindo HTMLs, JavaScript, CSS, `server.js`, módulos administrativos, `supabase/schema.sql`, manifestos de rotas, arquivos de configuração, documentação e testes. As referências de linha abaixo são as fornecidas nos resultados individuais e se referem ao snapshot/árvore de trabalho inspecionados.

**Limites importantes:**

- O ZIP e o código não foram executados; nenhum fluxo foi testado em navegador, leitor de tela ou dispositivo real. Não foram enviados formulários nem feitas requisições externas.
- Os testes existentes foram inspecionados, mas não executados. Não se confirmou build, `npm test`, inicialização do servidor, resposta HTTP, suporte real a `Range` ou integração com Supabase.
- Não houve acesso às configurações remotas do Supabase, dados atuais, políticas efetivamente aplicadas, grants, MFA, confirmação de e-mail, rate limits, CAPTCHA ou chaves atualmente ativas. A exposição concreta de fontes de títulos não publicados depende dos dados existentes.
- Não se verificou se o `.env` do ZIP foi publicado em um servidor ou distribuído além do arquivo analisado. Não foram inspecionadas hospedagem/TLS, cabeçalhos de segurança, logs, backups, pipeline de CI nem dependências/CDNs em execução.
- A revisão editorial avalia coerência e apresentação do snapshot, não suficiência ou conformidade jurídica. A configuração e o comportamento reais dos serviços podem divergir dos textos.
- A auditoria de performance não mediu transferência, LCP, custo de renderização, requisições ou consumo de memória. A revisão de acessibilidade não mediu contraste nem certificou conformidade WCAG.
- Um dos escopos funcionais não inspecionou `assets/pobreflix.js`, estilos compartilhados, schema/servidor nem conteúdo efetivo do ZIP; outras revisões cobriram partes desses itens. Linhas longas e blocos inline/base64 limitaram algumas leituras. A consolidação preserva essa diferença e não extrapola o escopo de cada achado.
- Uma varredura estática percorreu 28 páginas HTML e os atributos locais `href`, `src`, `poster` e `action`: encontrou duas ocorrências de links para `download.html?id=1` sem arquivo correspondente no ZIP e cinco fragmentos (`#amanda`, `#caio`, `#bruna`, `#lucas`, `#larissa`) sem elemento-âncora correspondente. Esses fragmentos podem estar sendo usados como identificadores de clique, mas não são âncoras navegáveis no HTML. Links construídos exclusivamente por JavaScript não foram cobertos.
- A mesma varredura encontrou documentos HTML muito grandes: `kawE_intro_desenvolvedor.html` (~2,76 MiB), `editar-perfil.html` (~2,27 MiB), `catalago.html` (~1,16 MiB), `painel.admin.html` (~1,01 MiB) e `index.html` (~0,74 MiB). São tamanhos em disco, não medições de tráfego ou desempenho.
- Esta auditoria cobre exatamente o snapshot de `sobre.zip`. A tela independente `denunciar.html` criada depois e não presente no ZIP não foi avaliada; no snapshot, o formulário de denúncia existente em detalhes ainda é descrito pelo código como demonstrativo.

## 3. Achados agrupados por prioridade de correção

“Prioridade 1/2/3” é uma ordem de tratamento sintetizada para orientar a correção, não uma escala CVSS nem a transcrição dos níveis atribuídos individualmente pelos revisores. “Defeito confirmado” significa confirmado no código/texto estático inspecionado, não reproduzido em execução. “Recomendação” identifica melhoria ou controle sugerido, não defeito observado. Riscos condicionais são descritos como tais.

### Prioridade 1 — tratar antes de nova distribuição/publicação

#### A1. O ZIP contém `.env` com configuração aparentemente não-placeholder — **risco confirmado de distribuição; sem evidência de chave privilegiada**

**Evidência:** no arquivo `/home/ubuntu/upload/sobre.zip` existe o caminho `.env`; a revisão identificou variáveis de configuração com valores classificados como aparentemente não-placeholder, sem reproduzir os valores. Não foi encontrado nome de variável `SERVICE_ROLE` nesse arquivo. O servidor bloqueia arquivos ocultos (`server.js:36–41, 95–98`) e `.dockerignore` exclui `.env` (`.dockerignore:3–4`), mas essas proteções não retiram o arquivo do ZIP.

**Avaliação:** a inclusão no artefato confirma que a configuração nele contida foi entregue a destinatários do ZIP. Pelos nomes verificados, não há evidência de chave privilegiada; a chave anon é destinada a uso público e há configuração de runtime exposta (`server.js:78–84`). Não se afirma comprometimento de credencial privilegiada. Há, porém, risco de divulgar configuração operacional e de que segredos futuros/adicionais sejam empacotados inadvertidamente.

**Correção recomendada:** retirar `.env` dos artefatos distribuídos; incluir apenas `.env.example` com placeholders; rejeitar `.env` em checagem de empacotamento e revisar artefatos antes da publicação. Avaliar rotação somente se houver evidência de segredo privilegiado exposto; não rotacionar uma chave pública anon apenas por sua presença, sem avaliar políticas e projeto.

#### A2. Autorização de fontes de mídia não verifica publicação do título — **política confirmada; exposição concreta condicional**

**Evidência:** `supabase/schema.sql:147–148` restringe a leitura pública de títulos a `published=true`; a política `public active sources read` em `supabase/schema.sql:177` permite `SELECT` sobre `title_sources` quando `active=true`, sem condição sobre o título relacionado. A política correspondente também aparece no schema do ZIP.

**Risco:** se houver fontes ativas ligadas a títulos não publicados, usuários anônimos com a chave pública poderão consultar registros e URLs de vídeo/legenda diretamente no Supabase. A condição e a política permissiva são confirmadas; a existência de dados nessa condição e sua exposição concreta não foram verificadas.

**Correção recomendada:** exigir na política que a fonte ativa pertença a título publicado (por exemplo, `EXISTS`/junção por `title_id`) e manter uma exceção explícita e apropriada para administradores. Avaliar se os campos de origem devem ser públicos mesmo para títulos publicados.

#### A3. A ação “Assistir” de detalhes não encaminha ao player — **defeito confirmado no snapshot**

**Evidência:** `detalhes.html:179` declara player local de demonstração e necessidade de backend/arquivo. Em `detalhes.html:202`, `#watch` abre apenas `#playerOverlay`; `#pause` alterna texto e exibe toast. Em `detalhes.html:190`, “Assistir” de episódio também abre o overlay, sem passar mídia a `playervideo.html`.

**Impacto:** o fluxo central catálogo/detalhes → reprodução termina em simulação, sem iniciar o player nem preservar episódio selecionado.

**Correção recomendada:** integrar os botões ao player com ID, temporada, episódio e fonte autorizada de mídia; se não houver mídia, mostrar indisponibilidade claramente. Usar overlay somente quando houver finalidade e conteúdo reais, como trailer.

#### A4. A central de mídia incorpora a si própria — **defeito confirmado no snapshot**

**Evidência:** `media-center.html:23–27` define links para `media-center.html` e um `<iframe src="media-center.html">` dentro da mesma página.

**Impacto:** cada cópia tenta incorporar outra cópia, causando recursão de iframes/cargas, consumo desnecessário e experiência potencialmente instável ou vazia.

**Correção recomendada:** remover a auto-incorporação ou apontar o iframe para destino oficial distinto/conteúdo real; corrigir também links que retornam ao wrapper.

#### A5. Fontes legais anunciadas como oficiais levam ao próprio resumo — **defeito confirmado de navegação; não é conclusão jurídica**

**Evidência:** `termos.html:16–19` chama a página de resumo não oficial e avisa sobre a versão em inglês; ainda assim, os links “Abrir os Termos de Uso oficiais” e “Fonte” em `termos.html:37–38` retornam a `termos.html`. O mesmo padrão ocorre em `privacidade.html:16–19, 34–38` (“política oficial completa”/“Fonte oficial”) e `avisos-legais.html:16–19, 29–33` (avisos/fonte oficiais).

**Impacto:** o visitante pode acreditar que abriu o documento integral vigente, embora continue em um resumo não oficial. Os avisos de resumo mitigam, mas não eliminam a ambiguidade criada pelos rótulos.

**Correção recomendada:** usar URLs verificadas para documentos integrais aplicáveis ou remover os rótulos “oficial/completa” e declarar indisponibilidade da fonte. Revisão profissional jurídica é recomendada antes de apresentar documentos como aplicáveis; esta auditoria não conclui conformidade.

#### A6. Aviso de privacidade não caracteriza claramente o tratamento do produto e o contato não funciona como canal — **lacuna confirmada no snapshot**

**Evidência:** `privacidade.html:18–32` resume coleta/uso genericamente e menciona publicidade, empresas do grupo e parceiros, reconhecendo conteúdo suplementar dos EUA e variação regional (`:19`). O e-mail `privacy@pobreflix.com` em `privacidade.html:38` aponta para `index.html`, não para `mailto:`. `README.md:5, 9–17` descreve autenticação Supabase; `README.md:27` e `TODO.md:7, 9` mencionam mensagens/dados de usuários e integração pendente.

**Impacto:** o leitor não consegue confirmar qual entidade/canal atende solicitações de privacidade, nem distinguir práticas genéricas das operações do produto. O tratamento real não foi verificado.

**Correção recomendada:** confirmar e documentar dados efetivamente coletados, finalidades, compartilhamento, retenção, controles e canal funcional; alinhar à implementação e às regiões atendidas. Recomenda-se revisão especializada antes de usar como aviso aplicável.

#### A7. Instruções de ajuda descrevem fluxos de acesso não corroborados — **inconsistência confirmada**

**Evidência:** `ajuda.html:17–28` descreve conteúdo exclusivo pago, login em TV por QR, códigos de quatro dígitos por e-mail/SMS, links de TV e login por aparelhos. `README.md:6` descreve cadastro/login com Supabase Auth via e-mail/senha; `README.md:35` informa que dependem do Supabase e não foram testados. `TODO.md:6` também descreve e-mail/senha, sem confirmar QR, OTP, SMS ou login de TV.

**Impacto:** usuários podem seguir instruções de mecanismos inexistentes ou não confirmados.

**Correção recomendada:** validar cada passo contra o produto executável; remover ou substituir fluxos não implementados e declarar limitações enquanto a integração não for testada.

#### A8. Vídeos de introdução são embutidos e pré-carregados — **risco de desempenho/acessibilidade confirmado estaticamente**

**Evidência:** `NetflixIntro_P_atualizada.html` e `kawE_intro_desenvolvedor.html` usam `<video preload="auto">` e `<source>` com grande URI `data:video/mp4;base64`; no trecho inspecionado não há `controls` nem `<track>`.

**Impacto:** mídia incorporada pode ampliar o documento e consumir transferência/memória antes da reprodução. Sem controles ou alternativa textual verificável, usuários podem ter dificuldade para controlar/compreender conteúdo audiovisual. Não houve medição nem reprodução do vídeo.

**Correção recomendada:** servir mídia como arquivo separado, usar `preload="metadata"` ou `none` conforme o fluxo, oferecer controles operáveis por teclado e legendas/transcrição quando pertinentes, e verificar alternativa a movimento.

### Prioridade 2 — corrigir antes do lançamento

#### M1. Redirecionamento pós-login controlado por `next` sem validação — **defeito confirmado**

**Evidência:** `assets/pobreflix.js:60–63` navega diretamente para `new URLSearchParams(location.search).get('next')` após `signInWithPassword`.

**Risco:** um link criado por terceiro pode direcionar a pessoa a domínio externo depois do login, facilitando phishing/confusão. A exploração depende de a vítima concluir login; não há evidência de que o redirecionamento sozinho exponha sessão.

**Correção recomendada:** aceitar apenas destinos locais relativos e permitidos; rejeitar esquemas, URLs absolutas, valores `//` e destinos fora da lista; usar destino padrão fixo em caso inválido.

#### M2. Páginas de download não constam do mapa/rotas e os nomes não coincidem — **defeito confirmado no snapshot**

**Evidência:** `MAPA_ARQUIVOS.md:24–91` e `manus-routes.json:1` não incluem `baixar-pobreflix.html`, `tela de download.html` ou `download.html`. Contudo, `baixar-pobreflix.html:22, 42` apontam para `download.html?id=1`, enquanto o arquivo fornecido chama-se `tela de download.html`.

**Impacto:** em implantação guiada pelo manifesto, as páginas podem não ser servidas; o caminho de downloads pode resultar em 404. Não foi testado HTTP.

**Correção recomendada:** escolher um nome/caminho canônico, ajustar links, declarar as páginas necessárias no manifesto e mapa e verificar destinos de retorno.

#### M3. Seleção e gerenciamento de perfil não completam um fluxo real — **defeito confirmado no snapshot**

**Evidência:** `perfis.html:155–159` usa links `#amanda`, `#caio` etc. e apenas mostra status no clique; o gerenciamento em `:161` troca mensagem/rótulo para “Concluir”. Não há navegação para `editar-perfil.html` nem identificação de perfil transmitida.

**Impacto:** a seleção não inicia sessão com perfil e gerenciamento não abre edição, embora a interface sugira essas ações.

**Correção recomendada:** persistir IDs, encaminhar perfil ativo ao catálogo, oferecer edição explícita (`editar-perfil.html?id=...`) ou retirar/implementar modo de gerenciamento.

#### M4. Fila de downloads não baixa mídia no fluxo padrão — **defeito funcional confirmado; limitação é explicitada**

**Evidência:** `tela de download.html:27, 38` informa que não há arquivo de vídeo ligado; `:64–68` persiste fila local com estado “Aguardando mídia”. A tentativa depende de `?media=` (`:67`), mas `baixar-pobreflix.html:22, 42` envia somente `id=1`.

**Impacto:** o usuário prepara registro local, mas não baixa conteúdo no fluxo padrão; não há tarefa real nem sincronização entre dispositivos.

**Correção recomendada:** conectar fonte autorizada e estado real de tarefa, ou rotular como protótipo e não apresentar como download pronto.

#### M5. Formulários de suporte/denúncia e trailer só simulam resultado — **defeito confirmado no snapshot**

**Evidência:** `detalhes.html:195–196` intercepta formulários, mostra “preparada, mas não enviada” e limpa campos; `:203` faz “Trailer” apenas exibir toast.

**Impacto:** pedidos/denúncias não são enviados; o trailer não abre mídia. Mensagens demonstrativas reduzem, mas não eliminam, expectativa de conclusão.

**Correção recomendada:** integrar a serviço real e confirmar recebimento só após sucesso; conectar trailer a recurso ou declarar indisponibilidade sem simular conclusão.

#### M6. Página de plataformas não contém instaladores e o acesso web vai a um título — **defeito confirmado/decisão de produto**

**Evidência:** `baixar-pobreflix.html:29–35` lista botões; `:37` diz que não há binários; `:45` define `APP_LINKS` vazios e `:49` mostra aviso. “Abrir Pobreflix na web” (`:35`) leva a `detalhes.html?id=1`.

**Impacto:** não há instalação nativa utilizável; acesso web começa nos detalhes de título em vez de home/catálogo. O aviso de indisponibilidade já mitiga parte da expectativa.

**Correção recomendada:** enquanto não houver instaladores, mostrar estado indisponível sem aparência de download e apontar web para `index.html` ou `catalago.html`.

#### M7. Atalhos de categoria não aplicam filtros — **defeito confirmado**

**Evidência:** `navegacao.html:187` encaminha todos os atalhos (Mangás, Livros, Música, Terror, Cinema, Lançamentos e outros) a `catalago.html` sem parâmetro. A busca/filtros locais em `:203–210` não são acionados por esses links.

**Impacto:** a escolha não é preservada e a categoria indicada não é aplicada.

**Correção recomendada:** passar filtro/categoria persistido ou retirar atalhos que não correspondem a conteúdo implementado.

#### M8. Dados de catálogo duplicados e classificação divergente — **defeito confirmado no snapshot**

**Evidência:** `detalhes.html:181–186` mantém catálogo local e força lista de IDs a serem séries. `tela de download.html:48–51` duplica dados com outra lista estática de séries e substitui IDs desconhecidos pelo item 1. Isso contrasta com a sincronização descrita em `MAPA_ARQUIVOS.md:5–9`.

**Impacto:** divergência de metadados/tipo entre páginas; IDs inexistentes podem silenciosamente exibir o primeiro título.

**Correção recomendada:** fonte única de dados e estado “não encontrado” para ID inválido, em vez de fallback silencioso.

#### M9. Oferta, preço e modelo de acesso divergem — **inconsistência confirmada**

**Evidência:** `ajuda.html:17` diz que há conteúdo gratuito e alguns itens exclusivos por assinatura. `sobre.html:36–37, 47–58` apresenta serviço por assinatura, planos, pagamento recorrente e downloads offline em certos planos. `acesso-seguro.html:27` afirma “sem custo”. `TODO.md:3–4` fala em seleção de categorias de plano sem preços e etapas de dispositivos.

**Impacto:** visitantes não conseguem entender se é gratuito, freemium ou por assinatura, nem quais cobranças/benefícios existem.

**Correção recomendada:** alinhar oferta, recursos e cobranças ao produto ativo; retirar benefícios não implementados e identificar páginas demonstrativas.

#### M10. Busca e suporte de ajuda não prestam atendimento efetivo — **lacuna confirmada no snapshot**

**Evidência:** `central-ajuda.html:18–19` envia busca à própria página, sem resultados/lógica de consulta no HTML; atalhos em `:25–26` levam a `perfis.html` ou à própria página. Em `contato.html:11–14`, busca só exibe mensagem demonstrativa e não envia/armazenada consulta; a nota em `:13` o diz. Ainda assim, `central-ajuda.html:28` chama `contato.html` de “página oficial de contato”.

**Impacto:** uma pessoa pode acreditar que abriu chamado ou pesquisou artigos sem que isso tenha ocorrido.

**Correção recomendada:** conectar a canais funcionais com confirmação clara sobre envio/armazenamento ou identificar como demonstração e retirar alegação de contato oficial.

#### M11. Carreiras anuncia vagas e recursos sem destinos correspondentes — **lacuna confirmada**

**Evidência:** `carreiras.html:19–31` anuncia vagas, busca por local/equipe, cultura, locais e acomodações. “Ver vagas”, “Buscar vagas” e links de conteúdo em `:14, 20, 24–28` retornam à própria página; Pobreflix House em `:29` leva a `index.html`. `:32` identifica resumo independente.

**Impacto:** candidatos não encontram conteúdo ou destino de candidatura prometido.

**Correção recomendada:** fornecer destinos verificados ou marcar seções como informativas, sem vagas/candidatura disponível; revisar periodicamente afirmações de recrutamento e acomodação.

#### M12. Links de sobre e avisos legais não levam ao recurso descrito — **lacuna confirmada**

**Evidência:** `sobre.html:41–59` oferece recomendações, aparelhos, requisitos, velocidades, planos e pagamentos, mas vários links levam a `central-ajuda.html`, cuja lista em `:20–27` não contém esses artigos. `avisos-legais.html:22` promete formulário de reclamação de copyright e aponta a `index.html`; `:24` promete informações de patentes e aponta para a central de ajuda.

**Impacto:** atalhos não conduzem a artigos, formulário ou informação prometidos.

**Correção recomendada:** criar destinos verificáveis ou retirar promessas e indicar indisponibilidade.

#### M13. Inscrição pública de mensagens sem limites explícitos suficientes no schema — **risco de abuso condicionado**

**Evidência:** `supabase/schema.sql:187–191` permite `INSERT` anônimo quando `user_id` é nulo ou igual a `auth.uid()`, limita somente `message` a 1–5000 caracteres e não define limites/formato para `name` e `email` nem controle de frequência no schema analisado.

**Risco:** volume elevado/campos longos podem aumentar armazenamento e carga de moderação; controles fora dos arquivos não foram verificados.

**Correção recomendada:** limites de tamanho e validação de nome/e-mail/mensagem, quota/rate limit no backend ou Edge Function e avaliar CAPTCHA/mitigação de abuso; não depender apenas de validação no navegador.

#### M14. `README.txt` contradiz instruções de configuração do `.env` — **lacuna documental confirmada**

**Evidência:** `README.txt:3` diz que `.env` já está preenchido. `README.md:5` manda criar a partir de `.env.example`; `README.md:29` diz que `.env` foi removido do pacote. `.dockerignore:3–4` exclui `.env` e `.env.*` do contexto Docker.

**Impacto:** operador pode iniciar sem configurar o serviço ou concluir incorretamente que o ZIP distribui `.env`, criando ambiguidade e incentivo a gestão insegura de segredos.

**Correção recomendada:** remover/atualizar instrução obsoleta e padronizar configuração via `.env.example`, sem credenciais no pacote/imagem.

#### M15. Teste do manifesto verifica presença, não validade/cobertura — **lacuna confirmada**

**Evidência:** `tests/check-site.js:18–19` verifica existência de `manus-routes.json`, sem ler/validar JSON. `TODO.md:5, 13` e `README.md:32` afirmam validação do manifesto e de todas as páginas.

**Impacto:** JSON inválido, rota ausente ou referência a página inexistente pode passar despercebido.

**Correção recomendada:** fazer parse, validar estrutura/unicidade e comparar rotas às páginas reais; ajustar documentação se cobertura continuar limitada.

#### M16. Inicialização adia bindings até respostas de rede — **risco confirmado estaticamente**

**Evidência:** `assets/pobreflix.js:126–129` espera `fetch('/api/runtime-config')`, `getUser` e `applySeo` antes de associar eventos em `bindAuth`, `bindSubscriptionGate`, `bindContactForms` e outros; erros caem no `catch` em `:131` sem executar associações.

**Impacto:** latência/falha de configuração ou rede pode atrasar ou impedir controles que poderiam funcionar independentemente.

**Correção recomendada:** associar interações independentes primeiro; inicializar configuração/autenticação assíncrona com falhas isoladas, estados de erro e recuperação.

#### M17. Alguns controles não têm nome acessível claro — **lacuna confirmada no HTML**

**Evidência:** em `editar-perfil.html`, `#accountType` está ao lado de texto em `div`, sem `<label>` associado (`:117`); `#kidsMode`/`#autoplay` usam labels cujo texto visível é só um `span` de slider (`:118–119`); `#bannerTitle` e `#bannerSubtitle` dependem de placeholder (`:125–129`). Em `catalago.html:503`, `#searchInput` depende de placeholder sem `<label>` ou `aria-label` observado.

**Impacto:** leitores de tela podem anunciar nomes ausentes ou pouco claros; não houve teste com tecnologia assistiva.

**Correção recomendada:** associar cada controle a label explícito (visível ou visualmente oculto), incluindo descrição para switches; manter placeholder apenas como exemplo.

#### M18. Idioma declarado de login está incorreto — **defeito confirmado**

**Evidência:** `login.html:2` declara `<html lang="en">`, enquanto título, instruções, formulário e rodapé estão em português (`:6, 15–20`).

**Impacto:** pronúncia e identificação automática de idioma podem ser inadequadas.

**Correção recomendada:** declarar `pt-BR` ou marcar corretamente trechos em outro idioma.

#### M19. Preferência por movimento reduzido é aplicada parcialmente — **lacuna confirmada por inspeção estática**

**Evidência:** `assets/pobreflix.css:4` define `subscriptionShine` infinito e transições; `index.html` e `catalago.html` têm `scroll-behavior:smooth` e animações/transições sem regra `prefers-reduced-motion` observada nas partes inspecionadas. `detalhes.html` e `painel.admin.html` têm regras, mas não cobrem uniformemente todas as páginas.

**Impacto:** usuários que solicitam movimento reduzido ainda podem receber animações contínuas/rolagem suave em algumas páginas. Não houve teste de dispositivo/navegador.

**Correção recomendada:** tratamento consistente em estilos compartilhados e páginas; reduzir/desativar animações não essenciais e trocar rolagem suave por automática conforme preferência.

#### M20. Catálogo cria imagens clonadas que depois são removidas — **padrão confirmado; efeito não medido**

**Evidência:** em `catalago.html`, `category-top10-script` clona até dez imagens por categoria e as insere no DOM; `thumbnail-cleanup-script` remove imagens de `.catalog .rail img`, `.catalog .top10-rail img`, `.catalog .recent-rail img` e `.catalog .launch-rail img` (`:656`).

**Impacto:** pode ampliar trabalho DOM/carregamento e desperdiçar trabalho já iniciado; os trilhos podem ficar sem imagens. Sem execução não se confirmou efeito visual nem custo.

**Correção recomendada:** não criar clones sem dados próprios nem inserir itens removidos em seguida; preservar miniaturas necessárias, aplicar lazy loading/decoding assíncronos e validar estados vazios.

#### M21. Login informa que não transmite dados, embora envie credenciais ao Supabase — **inconsistência confirmada**

**Evidência:** `login.html:17` diz que demonstração não coleta/transmite informações; `:21–22` carrega Supabase e `assets/pobreflix.js:60–62` usa `signInWithPassword`, enquanto `:64–66` submete `signUp`.

**Impacto:** usuário pode inserir credenciais sob aviso incompatível com o comportamento do código. O destino observado é o Supabase configurado; não há evidência de envio a terceiro não autorizado.

**Correção recomendada:** atualizar aviso para explicar com precisão o envio ao provedor, ou desativar formulários se for maquete; alinhar menção a telefone à implementação por e-mail.

#### M22. Recuperação de conta não é funcional — **lacuna confirmada no snapshot**

**Evidência:** `resgate.html:18–20` descreve página informativa e botão aponta para a própria página. Em `assets/pobreflix.js:54–67` há login/cadastro, sem chamada de recuperação observada.

**Impacto:** usuário não consegue recuperar conta por esse fluxo e pode esperar que o botão abra mecanismo oficial; é falha funcional, não bypass de autenticação.

**Correção recomendada:** implementar fluxo real Supabase Auth com retorno restrito ao domínio autorizado e respostas que reduzam enumeração; alternativamente, corrigir rótulo/destino para deixar claro que é informativo.

#### M23. Oferta de mensagens sem envio e outros conteúdos demonstrativos — **lacunas de produto**

**Evidência complementar:** além dos formulários de detalhes (A5/M5), `contato.html:11–14` apenas mostra mensagem local, sem enviar ou armazenar consulta. `detalhes.html:195–203` confirma demonstração explícita.

**Impacto:** não há atendimento/denúncia real no fluxo mostrado. O achado é consolidado com M5 e M10; não se trata de incidente de segurança confirmado.

### Prioridade 3 — recomendações complementares

#### B1. Formulário público de contato sem limites de `name`/`email` nem mitigação de volume no schema — **lacuna confirmada no schema; abuso não testado**

O contexto e as linhas estão em M13 (`supabase/schema.sql:187–191`). O achado foi consolidado com M13 para evitar duplicar o mesmo risco: tratar como controle de abuso insuficiente no esquema avaliado, sem afirmar ausência de controles externos.

#### B2. Busca sobreposta em três interfaces — **recomendação de produto**

**Evidência:** `navegacao.html:128–185` define seletor UI 1/2/3, folhas próprias, teclado de busca, tela cheia e busca cinematográfica. O catálogo também é superfície de descoberta (`:187` aponta para ele).

**Avaliação:** não é defeito funcional comprovado; é redundância potencial que pode fragmentar orientação/manutenção.

**Recomendação:** escolher experiência padrão ou explicar claramente quando cada modo serve a necessidade distinta; consolidar filtros e acessibilidade.

#### B3. Resumo de termos destaca cláusulas dos EUA sem fonte integral navegável/aplicabilidade local — **recomendação editorial**

**Evidência:** `termos.html:19, 29` menciona versão em inglês, Delaware, arbitragem, renúncia a ações coletivas e júri; `:33–38` recomenda confirmar versão/região/legislação, mas fonte retorna ao resumo (também descrito em A5).

**Avaliação:** não inferir aplicabilidade ao Brasil; a auditoria não interpretou juridicamente essas cláusulas.

**Recomendação:** obter fonte integral verificável, distinguir fatos observados de cláusulas não confirmadas e obter revisão profissional antes de apresentar condições contratuais como vigentes.

#### B4. A tag Docker base é mutável — **melhoria recomendada**

**Evidência:** `Dockerfile:1` usa `FROM node:20-alpine` sem digest ou versão específica da distribuição.

**Risco:** reconstrução futura pode receber outra imagem sob mesma tag, reduzindo reprodutibilidade; nenhum problema de build foi testado.

**Recomendação:** fixar patch/digest adequado e estabelecer atualização periódica explícita.

### Prioridade 3 — documentação, cobertura de testes e validações complementares

#### T1. Testes não verificam streaming HTTP Range, embora a documentação afirme cobertura — **lacuna confirmada**

**Evidência:** `tests/check-private.js:3–12` contém verificações de status para dez caminhos, mas nenhuma solicitação `Range` nem asserção `Content-Range`/`Accept-Ranges`. `tests/check-site.js:18–19` tampouco testa HTTP. Em contraste, `TODO.md:11–12` afirma que o pacote testa streaming Range/MP4 e `README.md:34` relata resposta 206 com Range.

**Correção recomendada:** criar teste HTTP que solicite intervalo e valide status 206, cabeçalhos e tamanho do corpo; alinhar cobertura documentada à realidade.

#### T2. Cobertura automatizada de páginas é menor que a descrição — **lacuna confirmada**

**Evidência:** `package.json:1` executa `node --check` apenas para `server.js` e `assets/pobreflix.js` antes dos testes. `tests/check-site.js:6–16` usa regex para doctype e referências `href/src`; `:18–33` confere existência/presença de strings. `tests/check-private.js:3–12` testa status de `index.html`, `assets/pobreflix.js`, `/health` e alguns caminhos, sem cobrir todos os HTMLs. `README.md:32–34` reporta 26 páginas verificadas e respostas 200.

**Impacto:** HTML inválido além das verificações superficiais, erros de outros scripts e falhas em páginas não listadas podem passar. Não se afirma que o relatório documentado seja falso; apenas que os scripts inspecionados não sustentam toda a amplitude aparente.

**Correção recomendada:** adicionar validador HTML, checagens sintáticas relevantes e testes HTTP para todas as páginas se isso for requisito; descrever separadamente testes estáticos e execução.

#### T3. Estilos repetidos e imagens data URI — **observação informativa, custo não medido**

**Evidência:** `catalago.html`, `detalhes.html`, `painel.admin.html`, `login.html` e `editar-perfil.html` têm blocos `<style>` inline; rodapés/ícones são repetidos. `index.html` incorpora imagem base64 no CSS (`:10`, com outra URI data em `:15`).

**Recomendação:** consolidar estilos comuns e otimizar assets externos quando apropriado; medir transferência/renderização antes e depois. Nenhum custo quantitativo foi medido.

## 4. O que está bem coberto

- **Proteção de arquivos no servidor e build:** `server.js:36–41, 95–98` bloqueia caminhos de arquivos ocultos; `.dockerignore:3–4` exclui `.env` do contexto de build Docker. São medidas positivas, mas não impedem que o `.env` seja incluído no ZIP.
- **Separação entre chave pública e credencial privilegiada:** a revisão não encontrou nome de variável `SERVICE_ROLE` no `.env` inspecionado e não afirmou presença de chave privilegiada. Isso não substitui verificação do projeto/configuração remota.
- **RLS para conteúdo publicado:** `supabase/schema.sql:147–148` limita leitura pública de títulos a `published=true`. A política de `title_sources` precisa ser alinhada a essa regra (A2).
- **Autorização administrativa:** a revisão relata verificação de sessão/identidade no painel e políticas RLS correspondentes no banco, sem bypass confirmado nos arquivos analisados. A conclusão é estática; não valida grants/configuração ou execução remota.
- **Transparência parcial sobre recursos demonstrativos:** algumas páginas avisam explicitamente que são estáticas ou que mídia não está conectada (`detalhes.html:179`; `tela de download.html:27, 38`; `contato.html:13`; `carreiras.html:32`). Esses avisos ajudam, mas não substituem a correção de rótulos e links contraditórios.
- **Limitação de uploads nativos já indicada:** `baixar-pobreflix.html:37, 45, 49` informa ausência de binários e mostra aviso para links vazios; a lacuna principal é a apresentação/rota web e a ausência de instaladores prontos.
- **Algum suporte a movimento reduzido e padrões de execução verificáveis:** regras `prefers-reduced-motion` existem em `detalhes.html` e `painel.admin.html`; `package.json` define comandos start/check/test e há scripts de teste. A cobertura é incompleta e os comandos não foram executados nesta auditoria.

## 5. Lacunas funcionais e páginas recomendadas

Priorizar páginas e jornadas com intenção clara de uso, evitando que conteúdo demonstrativo pareça transação concluída:

1. **Player (`playervideo.html`) e detalhes (`detalhes.html`):** conectar “Assistir” e episódios ao player com mídia autorizada, IDs/contexto e estado de indisponibilidade. Conectar trailer, pausa e suporte somente quando houver integração real.
2. **Central de mídia (`media-center.html`):** eliminar iframe autorreferente e corrigir destinos.
3. **Downloads e plataformas (`baixar-pobreflix.html`, `tela de download.html`):** definir nome/caminho canônico, declarar rotas, corrigir `download.html?id=1`, conectar mídia/estado real ou identificar sem ambiguidade como protótipo. O acesso web deve ir à home/catálogo.
4. **Perfis e edição (`perfis.html`, `editar-perfil.html`):** implementar seleção persistente, perfil ativo, rota de edição e rótulos acessíveis; remover affordances não funcionais.
5. **Autenticação (`login.html`, `cadastro.html`, `resgate.html`):** validar `next`, oferecer recuperação real ou remover promessa, alinhar aviso de transmissão de dados e corrigir idioma `lang`.
6. **Catálogo e navegação (`catalago.html`, `navegacao.html`, `detalhes.html`, `tela de download.html`):** fazer atalhos aplicarem filtros; usar fonte única para dados/classificação e tratar ID inválido como não encontrado.
7. **Ajuda, contato e suporte (`central-ajuda.html`, `contato.html`, `detalhes.html`):** busca com resultados reais, canal de atendimento efetivo e confirmação somente após envio bem-sucedido; explicitar se páginas ainda são demonstrações.
8. **Documentação de produto e páginas legais (`sobre.html`, `ajuda.html`, `acesso-seguro.html`, `termos.html`, `privacidade.html`, `avisos-legais.html`):** alinhar gratuidade/assinaturas, login, dispositivos, recursos, cobrança e canais. Fontes integrais legais e de privacidade precisam ser verificáveis; revisão profissional antes de apresentação como documento aplicável.
9. **Carreiras (`carreiras.html`):** links para vagas/candidatura devem chegar a conteúdo verificável ou declarar indisponibilidade.
10. **Acessibilidade e mídia de introdução (`NetflixIntro_P_atualizada.html`, `kawE_intro_desenvolvedor.html`, `editar-perfil.html`, `catalago.html`):** oferecer controles/alternativas ao vídeo, nomes acessíveis e suporte uniforme a movimento reduzido; validar em navegador/tecnologias assistivas.

## 6. Plano de correção priorizado

### Agora — antes de qualquer nova distribuição

1. **Retirar `.env` do ZIP** e de quaisquer outros artefatos de distribuição; manter apenas `.env.example` com placeholders. Adicionar checagem automatizada que falhe caso `.env` esteja no pacote. Revisar o ZIP final. Não copiar valores secretos para logs, tickets ou relatório.
2. **Corrigir a política RLS de `title_sources`** para exigir título publicado e preservar acesso administrativo apropriado. Verificar também dados existentes de fontes ativas ligadas a títulos não publicados e configuração remota/grants antes de considerar a correção concluída.
3. **Validar o redirecionamento `next`** no login, limitando-o a caminhos locais aprovados e definindo fallback seguro.
4. **Remover a auto-incorporação** de `media-center.html` para evitar recursão imediata.
5. **Evitar afirmar que ações foram concluídas quando são apenas simuladas:** desabilitar/rotular claramente reprodução, download, contato, denúncia, busca, recuperação e instalação enquanto integrações reais não existirem.

### Antes de publicar

1. **Concluir e testar os fluxos essenciais:** login/cadastro/recuperação, seleção/edição de perfis, catálogo → detalhes → player, suporte/contato e download. Confirmar envio/sucesso/erro e estados vazios; não declarar comportamento que não tenha sido verificado.
2. **Corrigir rotas e links:** canonicalizar download, atualizar `manus-routes.json` e `MAPA_ARQUIVOS.md`, garantir destinos existentes e testar todos os links internos relevantes.
3. **Reconciliar textos do produto:** login e recuperação; acesso gratuito/assinatura/preço; TV, QR/SMS/dispositivos; downloads; contato e carreira. Remover instruções não implementadas e contraditórias.
4. **Reparar páginas legais e privacidade:** trocar links circulares por fontes integrais verificadas, implementar canal de privacidade funcional e validar texto contra tratamento real e jurisdições. Solicitar revisão jurídica/privacidade antes de apresentá-los como aplicáveis; não inferir suficiência legal a partir desta auditoria.
5. **Executar verificação em ambiente controlado:** `npm test`, build e servidor; testar páginas/manifesto, fluxos, RLS e HTTP Range com evidências registradas. Nenhuma dessas execuções foi realizada pelos revisores desta auditoria.
6. **Fechar acessibilidade essencial:** `lang="pt-BR"`, labels/nome acessível, preferência de movimento reduzido uniforme, controles e alternativas de vídeo; testar teclado, leitor de tela, zoom e viewports reais.
7. **Reduzir risco de mídia:** separar vídeos base64, definir preload adequado, corrigir criação/remoção de miniaturas e medir impacto de transferência/renderização.
8. **Corrigir documentação/configuração:** resolver contradição `README.txt`/`README.md`; testar e documentar apenas a cobertura real dos testes, incluindo validade/cobertura de manifesto e requisição `Range` se essas garantias forem anunciadas.

### Depois — melhorias contínuas

1. Consolidar interfaces de busca e categorias, reduzindo duplicidade sem remover funções necessárias.
2. Fixar digest/versão de patch da imagem Docker e manter rotina explícita de atualização de segurança.
3. Expandir testes automatizados de HTML/JavaScript/rotas/HTTP e monitoramento de regressões; registrar claramente o que é estático versus execução integrada.
4. Medir desempenho real (transferência, renderização, mídia e DOM) e reavaliar acessibilidade em múltiplos navegadores/dispositivos.
5. Implementar controles contínuos de abuso para mensagens de contato (validação, limites, quotas/rate limiting e mitigação adequada) e revisar periodicamente as políticas RLS e configurações do Supabase.
6. Revisar periodicamente destinos de fontes legais, privacidade, ajuda, suporte e carreiras para evitar links circulares ou recursos desatualizados.

## 7. Registro de falhas e pendências de cobertura

O resultado consolidado informa **`failures: []` — nenhuma área reportada como falha do agente**. Isso não significa que todas as áreas foram testadas. As pendências relevantes são: ausência de execução e validação dinâmica; falta de acesso a configurações/dados remotos do Supabase; ausência de verificação de publicação externa do `.env`; sem pesquisa/verificação de URLs externas; sem validação jurídica; sem execução de leitor de tela/dispositivos; sem medição de performance; e diferenças de escopo entre revisões, inclusive uma revisão funcional que explicitamente não inspecionou `assets/pobreflix.js`, CSS compartilhado, schema/servidor e conteúdo completo do ZIP. Não foram inventados testes nem resultados de execução.
