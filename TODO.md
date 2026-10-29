# Pobreflix — estado de implementação

## Concluído nesta cópia local

- [x] Corrigir o redirecionamento pós-login para aceitar somente destino na mesma origem.
- [x] Evitar que falha de configuração de serviço impeça a inicialização local das páginas.
- [x] Remover o vídeo demonstrativo como fallback do player; exibir mensagem de fonte ausente.
- [x] Separar contexto de filme/série no player e não preencher dados de episódio quando não existem.
- [x] Impedir que ID inválido caia silenciosamente em outro título.
- [x] Integrar páginas independentes de downloads e denúncias à navegação, com avisos claros sobre seus limites atuais.
- [x] Marcar metadados estáticos como demonstrativos, extrair imagens base64 grandes para arquivos locais e aplicar preferências de movimento reduzido.
- [x] Atualizar sitemap, README e instruções de hospedagem.
- [x] Passar `npm test`, verificações de sintaxe e testes de navegador/local descritos no relatório de implementação.

## Pendências antes de produção

- [ ] Validar o projeto Supabase correto e aplicar `supabase/schema.sql` manualmente; testar login, leitura e gravação com credenciais autorizadas.
- [ ] Cadastrar títulos, metadados, classificações e fontes de mídia reais com autorização documentada.
- [ ] Definir e implementar o modelo de temporadas/episódios para séries; não usar exemplos como dados reais.
- [ ] Construir armazenamento e fluxo de download offline seguro, com expiração, autorização, limites e gestão de erros.
- [ ] Ligar denúncias ao backend/equipe e proteger contra spam (limites, validação e mecanismo antiabuso adequado).
- [ ] Validar textos legais, privacidade, contato, classificação etária, preços e alegações públicas com o proprietário.
- [ ] Criar e assinar instaladores reais ou publicar apps nas lojas correspondentes; a tela de plataformas não disponibiliza binários.
- [ ] Confirmar domínio, HTTPS, origem pública, backup, logs, monitoramento e plano de resposta antes de expor o servidor.

## Escopo administrativo

O painel foi deixado de lado conforme solicitado. O arquivo original permaneceu sem alteração e o anexo separado não foi incorporado.
