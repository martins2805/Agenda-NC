# Status

Atualizado ao final de cada sprint. Fonte da verdade sobre o que existe de fato.

> **Nota (2026-07-23, resolvida):** este arquivo tinha ficado desatualizado por uma sessão em que o histórico de trabalho (sprints S6–S11, já commitadas em `git log`) não teve seu detalhe de aceite registrado aqui. Reconciliação concluída — todas as sprints de S2 a S14 (mais S13, fechada nesta sessão) têm seção própria de "detalhe do aceite" abaixo, e a tabela "Entregue" já reflete isso.

## Incidente 2026-07-23 — deploy quebrado pela migration da S7 (resolvido)

Segundo incidente do mesmo tipo do da S1: a migration `20260723120000_prazo_unificado_origem_tipo` (S7, adiciona `origem_id`/`tipo_atividade_ids` à view `prazo_unificado`) inseriu a coluna nova **no meio** da lista de colunas do `CREATE OR REPLACE VIEW`, empurrando as 7 colunas seguintes uma posição — Postgres proíbe isso (só aceita colunas novas ao final). Deploy em crash loop (`P3009`) até o usuário colar o log e eu corrigir.

Correção: reordenadas as colunas (novas ao final) em `20260723120000_prazo_unificado_origem_tipo` **e** em `20260723140000_registro_prazo` (que redefine a mesma view ao adicionar `Registro.prazo` — herdaria o mesmo bug se não fosse corrigida junto). Como o `CREATE OR REPLACE VIEW` falha atomicamente (não fica parcial), a migration seguinte (`20260723130000_widget_preferencia`) nunca tinha rodado — aplicou limpo assim que a S7 foi destravada via `prisma migrate resolve --rolled-back` (mesmo playbook da S1, passo temporário revertido após confirmação).

**Lição:** `CREATE OR REPLACE VIEW` em Postgres não aceita inserir/reordenar colunas existentes, só apêndice ao final. Checar isso em toda migration futura que redefina uma view já existente.

> **Nota (2026-07-22, histórica):** o histórico de commits mostra que o produto foi construído **antes** de `docs/PLANO-DE-SPRINTS.md` existir, por uma linha de desenvolvimento própria ("Parte 6", "Parte 7", "sprints de ajustes do documento" etc.), não pelo ritual S0→S13 descrito no plano. A partir da S1 (2026-07-22), o ritual formal passou a valer para toda sprint nova, incluindo revisão do que já existia — por isso a tabela "Entregue" abaixo cobre hoje S2 a S14 (com S13 fechando a lista). O estado técnico bruto, por fora do ritual, continua em **"Inventário técnico atual"**.

## Sprint em execução

**S1 — Modelo de dados e motor de filtros.** Código completo e no repositório (schema, migration, `src/lib/vinculos.ts`, `src/lib/filters/`, rotas de API, UI de vínculo multi-select, seed). `typecheck`, `lint` e `build` passam.

**Migration aplicada em produção em 2026-07-22** (deploy `11e20216`, confirmado por `railway logs`: "No pending migrations to apply."), mas por um caminho acidentado que vale registrar:

1. Nem este agente nem a máquina do usuário conseguiram alcançar o Postgres pela porta pública (`hayabusa.proxy.rlwy.net:29829` — `P1001`, depois confirmado por `Test-NetConnection`: `ping` funciona, TCP na porta recusa; painel do Railway mostrou o TCP Proxy corretamente configurado). Causa mais provável: bloqueio de rede/firewall corporativo (Kaspersky Endpoint gerenciado por TI), não o serviço em si — ele sempre esteve "Online".
2. Sem acesso direto, o primeiro `git push` (commit `9fd5786`) só foi testado por `tsc`/`build`, nunca contra um banco real. **Isso causou uma falha real em produção**: o deploy tentou aplicar a migration e quebrou com `42804 UNION types text and "StatusConclusao" cannot be matched` — `ChecklistGeralItem.status` é fisicamente uma coluna enum `StatusConclusao` no banco (resquício de uma migration anterior), embora `schema.prisma` a declare como `String`. Faltava um `::text` na view `prazo_unificado`.
3. Pior: a migration **não roda em transação única** — tudo antes do ponto de falha (tipo `VinculoTipo`, tabela `Vinculo`, índices, FK, CHECK, backfill, índices novos em Atividade/AtividadeGeral/Registro/Planilha) ficou gravado. O app entrou em **crash loop** (container reiniciando e falhando repetidamente, ~18 tentativas), porque toda reaplicação do arquivo do zero esbarrava em "`VinculoTipo` já existe".
4. Recuperação, via commits `9b1fc41` → `0355f9d` → `8da6f95`: corrigido o cast `::text`; migration reescrita para ser **idempotente** (`CREATE TABLE/INDEX IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object`, `CREATE OR REPLACE VIEW`); usado um passo temporário `prisma migrate resolve --rolled-back` no `start` do `package.json` (único caminho com acesso real ao banco — a rede privada do Railway, usada nos deploys) para destravar o estado "failed" e reaplicar; removido o passo temporário assim que confirmado o sucesso.

**Lição registrada:** só descobri esse bug porque o usuário colou o log de deploy do Railway no chat depois do push. Da próxima vez que eu não conseguir testar uma migration contra um banco real antes de subir, isso deveria ser dito explicitamente como risco, não silenciado atrás de "typecheck e build passam".

**O que ainda falta para fechar a S1 de fato:**
- **Não rodei `npm run db:seed` contra produção** — de propósito, para não poluir dados reais de trabalho do usuário com 45+ atividades fictícias. O seed continua só testado por `tsc`, nunca executado.
- Os critérios de aceite que dependem do seed (atividade com 2 tipos + 3 propostas, filtro combinado <100ms com 5.000 linhas) seguem **não verificados**.
- Os critérios que dependem só do backfill de dados reais já existentes (vínculo de registro/planilha com atividade, `prazo_unificado` retornando dados de verdade) **podem** ser verificados agora contra produção, mas ainda não foram — precisa de uma consulta ao banco (via alguém com acesso, ou uma rota de diagnóstico temporária).

## Entregue (via ritual de sprint, com checklist de aceite verificado)

| Sprint | Nome | Fechada em | Tag |
|---|---|---|---|
| P3.1 | Lista de atividades sem supressão de dados (PROMPT 3, item 5.1/5.2) | 2026-08-18 (verificado no navegador autenticado, em 3 larguras) | — |
| P3.2 | Modalidades de prazo da atividade — entrega, janela e recorrente (PROMPT 3, item 4.x) | 2026-08-18 (migrations aplicadas; janela/recorrência ainda sem uso real) | — |
| P3.3 | Configuração visual centralizada (PROMPT 3, itens 3.1/3.2/6) | 2026-08-18 (migration aplicada; API verificada no navegador) | — |
| P3.4 | Dashboard — Campos 4-6 dentro do motor de widgets e restaurar padrão (PROMPT 3, item 1.x) | 2026-08-18 (verificado no navegador: 6 widgets, nenhum indicador perdido) | — |
| P3.5 | Exibição configurável de Lista e Cards (PROMPT 3, itens 3.3/5.3) | 2026-08-18 (verificado de ponta a ponta: ocultar coluna reflete na lista) | — |
| P3.6 | Restauração de Registros, Execuções e Planilhas (PROMPT 3, item 2.1 / D20) | **NÃO fechada** — telas e APIs de volta e verificadas; integrações verificadas só por código | — |
| D19 | Unidade multi-valor em Atividade e AtividadeGeral (fora do ritual de sprint) | 2026-08-18 (migration aplicada e backfill verificado em produção; UI ainda não vista no navegador) | — |
| S17 | Liquid glass (D18) + hotfix busca global — iterado até 2026-08-18 (harness visual, receita v6) | 2026-08-16→18 | — |
| S16 | Correções do PROMPT 2 | 2026-08-14 — aceite pendente **fechado em produção em 2026-08-16** | — |
| S15 | Remoção dos módulos Execuções, Registros e Planilhas (D17) | 2026-08-14 | — |
| S14 | Conformação visual — reverter tema escuro para claro (D16) | 2026-07-22 | — |
| S2 | Design system | 2026-07-22 | — |
| S3 | Shell + Configurações v1 | 2026-07-23 | — |
| S4 | Atividades — cadastro | 2026-07-23 | — |
| S5 | Atividades — listagem | 2026-07-23 | — |
| S6 | Atividades — detalhe, vínculos e histórico | 2026-07-23 | — |
| S7 | Calendário | 2026-07-23 | — |
| S8 | Dashboard — motor de widgets, filtros globais e Campos 1-3 | 2026-07-23 | — |
| S9 | Dashboard — Propostas, Empresas e Visão Geral | 2026-07-23 | — |
| S10 | Execuções | 2026-07-23 | — |
| S11 | Registros | 2026-07-23 | — |
| S12 | Planilhas | 2026-07-23 | — |
| S13 | Fechamento | 2026-07-23 | — |

**P3.6 — detalhe (restauração dos módulos) — ACEITE PENDENTE:**

*D20 (registrada em `docs/DECISOES.md`) revoga a D17, com confirmação do usuário no chat.*

- [x] Os 23 arquivos apagados pela S15 foram restaurados de `git show 95c1e8f^:<caminho>` — páginas, rotas de API e componentes de Registros, Planilhas e Execuções. Nenhuma migration foi necessária: a D17 não tinha derrubado nada no banco
- [x] **Defasagem de schema corrigida:** o código restaurado é anterior à D19 e usava `unidadeId` escalar em `AtividadeGeral`. Ajustado para `unidadeIds` (com `ManagedMultiSelect`, como na atividade). `Registro`, `Planilha` e `ChecklistGeralItem` continuam escalares, conforme a própria D19 — ao criar um Registro a partir de uma Execução, passa a primeira unidade
- [x] `app-data-context` reganhou estado, escrita otimista e fábricas de id dos três módulos (~316 linhas)
- [x] Navegação com os 6 itens; `KIND_ORDER` de volta com `categoriaRegistro`, `categoriaPlanilha`, `tipoAtividadeGeral` e `setorInterno`; lixeira, chat-tools e calendário reintegrados
- [x] **Bug que a restauração expôs:** o container largo da tela de Atividades (P3.1) usava `pathname.startsWith("/atividades")`, que passou a casar também com `/atividades-gerais`. Trocado por comparação exata
- [x] **Decisão de mérito na busca global:** o patch reverso conflitava com a correção de performance da S16 (a versão antiga reprocessava HTML pesado a cada tecla e derrubava a aba do navegador em produção). Mantida a versão rápida e estendida à mão para Registros e Planilhas, em vez de aceitar o código antigo
- [x] `typecheck`, `lint` e `build` passam limpos, com todas as rotas dos três módulos no output do build
- [x] **Verificado no navegador com dados reais:** `/registros`, `/planilhas` e `/atividades-gerais` renderizam; as APIs devolvem 200 com 5 registros, 1 planilha e 2 execuções; navegação com os 7 itens; `/api/prazos` passou a devolver linhas de `atividadeGeral` (2), que a S15 descartava
- [ ] **Não verificado no navegador:** busca global cobrindo os três tipos (só verificado por código — a sessão do preview caiu no login antes do teste), abertura/edição de um registro e de uma planilha, o editor Univer, e o calendário exibindo prazo de Execução
- [ ] **Contagem a conferir:** a auditoria de 2026-08-16 registrou 8 registros e 4 planilhas em produção; a API devolve 5 e 1. A diferença provavelmente é filtro por usuário e/ou `deletedAt`, mas **não foi confirmada**

**P3.4 — detalhe (Dashboard: Campos 4-6 no motor de widgets):**

- [x] `PropostasWidget`, `EmpresasWidget` e `VisaoGeralWidget` viraram widgets registrados. **Nenhum indicador foi removido** — verificado no navegador com dados reais: Total Propostas 24, Propostas Ganhas 5, Atividade x Empresa, Tipo de Produto/Serviço, Produtos/Serviços vinculados, Distribuição por status e por prioridade, todos presentes
- [x] O despacho `id -> componente` saiu do encadeamento de `if` dentro do motor para um registro (`widget-registry.tsx`). Antes, incluir um widget exigia editar o próprio motor — o oposto do que o comentário dele prometia. Fica separado de `src/lib/dashboard-widgets.ts` porque aquele arquivo é importado pela rota de API (servidor) e não pode arrastar componentes de client
- [x] `WidgetDefinition` ganhou `descricao` (mostrada como dica no painel) e `tamanhoPadrao`
- [x] **"Restaurar Dashboard padrão"** (item 1.4) no painel de configuração: volta à composição inicial sem apagar nada, porque a preferência é sobrescrita e o registro continua sendo a fonte de quais widgets existem
- [x] Verificado no navegador: os 6 widgets renderizam, todos persistidos e visíveis
- [ ] **Não implementado do item 1.x:** criar widget novo pelo usuário, duplicar o mesmo widget com filtros diferentes e trocar o tipo de gráfico de um dado. Isso exige instância com `config` própria — hoje `WidgetPreferencia` tem `@@unique([userId, widgetId])`, que impede duas instâncias do mesmo widget. A "biblioteca de modelos vazios" (item 1.5) também não existe: o painel lista os widgets que já existem, com descrição, mas não oferece esqueletos para preencher

**P3.5 — detalhe (exibição configurável de Lista e Cards):**

- [x] `src/lib/exibicao-config.ts` descreve os campos de cada modo; a tabela de atividades passou a montar `<thead>`/`<td>` a partir dessa configuração, em vez de JSX fixo
- [x] Reaproveita a tabela `ConfiguracaoVisual` com chaves namespaced (`lista:` / `card:`) — só precisou de uma coluna `ordem` (migration `20260818200000`, adição pura)
- [x] Lista: visibilidade **e ordem** configuráveis. Cards: **só visibilidade** — a composição do card é aninhada (não é uma linha plana de células), então reordenar exigiria reescrevê-lo como renderizador de lista de campos. Fica registrado como não feito
- [x] Colunas estruturais (marcador de conclusão e ações) não se ocultam: sem elas a linha perde a interação, não só a informação. Aparecem com cadeado na tela de configuração
- [x] Ocultar um campo **não** o remove do cadastro (exigência explícita do item 3.3)
- [x] **Verificado de ponta a ponta no navegador:** ocultar "Unidade" em Configurações persistiu (`lista:unidade` com `visivel:false`) e a coluna sumiu da lista; ao reativar, voltou. Estado final deixado limpo, sem nada oculto
- [x] **Bug encontrado e corrigido na verificação:** o primeiro clique devolvia 500. A tela mandava a lista inteira e a rota abria ~34 upserts numa transação só, estourando o timeout de 5s do Prisma contra o banco remoto (`P2028`). Agora o contexto envia **só as chaves que mudaram**, e a transação tem folga de 20s para o caso de reordenação em massa

**P3.2 e P3.3 — detalhe (prazos e configuração visual):**

> As três migrations foram aplicadas em produção em 2026-08-18, com autorização do usuário no chat: `20260818170000_atividade_modalidade_prazo`, `20260818180000_configuracao_visual` e `20260818200000_configuracao_visual_ordem`.

*P3.2 — modalidades de prazo (item 4.1/4.2/4.3):*

- [x] `ModalidadePrazo` (Entrega/Janela/Recorrente) e `RecorrenciaFrequencia` (Diaria/Semanal/Mensal/Anual) no schema; `Atividade` ganha `modalidadePrazo`, `recorrenciaFreq`, `recorrenciaCada` e `recorrenciaAte`. O intervalo ("a cada N") cobre quinzenal/bimestral/semestral sem multiplicar valores de enum
- [x] **A janela deixou de depender do nome do tipo de atividade.** Antes, `prazoFim` só aparecia quando o tipo se chamava literalmente "Agendamento" (match por string em `activity-form.tsx`); agora é uma escolha explícita do usuário, independente do tipo
- [x] **Bug corrigido de tabela: `Atividade.prazoFim` nunca entrava em `prazo_unificado`** — a data final da janela era invisível no calendário (só `Proposta.prazoFim` entrava). A janela agora produz duas linhas na view, `janelaInicio` e `janelaFim`
- [x] Recorrência gerada na própria view por `generate_series`, com horizonte máximo de 2 anos quando não há data de término, e `origem_id` carregando a data da ocorrência para cada uma ter chave própria
- [x] Migration `20260818170000_atividade_modalidade_prazo`, idempotente, com `DROP VIEW` + `CREATE VIEW` (o bloco de Atividade passa a produzir 1, 2 ou N linhas — `CREATE OR REPLACE` não serve, lição da S1/S7). Backfill converte em `Janela` quem já tinha `prazoFim` preenchido, preservando o dado
- [x] `prazoFieldsToDb` normaliza os campos conforme a modalidade, para POST e PUT gravarem a mesma coisa e não sobrar resíduo de outra modalidade
- [x] Prazo dos itens de checklist **intocado** (item 4.3): continua com a lógica existente, independente do prazo da atividade
- [x] `typecheck`, `lint` e `build` passam limpos
- [x] **Migration aplicada em produção**; `/api/atividades` e `/api/prazos` respondem 200 com as colunas novas. As 48 atividades reais ficaram todas em `Entrega` (nenhuma tinha `prazoFim`), e a view devolve `atividade`, `checklist` e `proposta` como antes
- [x] **Defeito encontrado e corrigido antes de qualquer uso**: a primeira versão gerava as ocorrências com `generate_series(timestamp, timestamp, interval)`, que soma sobre o **resultado anterior** — "todo mês" a partir do dia 31 dava 31/01, 28/02 e depois ficava **preso no dia 28 para sempre**. Verificado por consulta ao banco. A migration `20260818190000_prazo_recorrente_sem_deriva` passou a somar N períodos à data original; reverificado: 31/01, 28/02, **31/03**, 30/04, 31/05, 30/06
- [ ] **Janela e recorrência ainda não exercitadas com dado real** — nenhuma atividade usa essas modalidades, então os ramos `janelaInicio`/`janelaFim`/`recorrente` da view produzem zero linhas até alguém cadastrar uma. Falta cadastrar uma atividade de cada tipo e conferir card, lista e calendário

*P3.3 — configuração visual centralizada (itens 3.1/3.2/6):*

- [x] `src/lib/visual-config.ts` é a fonte única de quais elementos são configuráveis (status, prioridade, prazo, negociação), cada um apontando para o token que **todas as telas já consomem** por `var(--token)`
- [x] **A aplicação global sai por construção:** configurar redefine o token no `:root` (`VisualConfigStyle`, montado uma vez no shell), então cards, lista, detalhe, dashboard e calendário mudam juntos. Nenhuma tela ganha configuração própria — que é exatamente o que o item 3.2 proíbe
- [x] Modelo `ConfiguracaoVisual` (por usuário) + rota `/api/configuracao-visual` com GET/PUT/DELETE; o DELETE é o "restaurar padrão" (sem linha, vale o padrão do sistema)
- [x] Cor escolhida sempre entre tokens existentes, nunca hex livre (Regra 2; mesmo princípio já usado em `LookupCor`)
- [x] Tamanho das etiquetas por `--badge-escala` + classe `.semantic-badge`, também num ponto só
- [x] Migration `20260818180000_configuracao_visual` — **só adição de tabela**, nenhuma tabela/coluna/view existente é tocada
- [x] `typecheck`, `lint` e `build` passam limpos
- [x] **Migration aplicada**; `/api/configuracao-visual` responde 200 com os 14 elementos resolvidos, e a seção "Aparência dos campos" renderiza na tela de Configurações com os seletores de cor e o botão "Restaurar padrão"
- [ ] **Troca de cor não foi exercitada de ponta a ponta** — o mecanismo de escrita é o mesmo já validado pela configuração de exibição (mesma rota, mesmo contexto, e o bug de timeout que aparecia nele foi corrigido), mas mudar uma cor e conferir a propagação em card/lista/dashboard/calendário ainda não foi feito
- [ ] Do item 3.1, ficaram de fora: formato de exibição (etiqueta × texto) e configuração de cor de cards/gráficos/indicadores. O tamanho das etiquetas é global (uma escala só), não por elemento

**P3.1 — detalhe (lista sem supressão de dados):**

*Primeiro passo do PROMPT 3 (PDF de 2026-08-18), itens 5.1 e 5.2: "na visão lista, os dados estão sendo suprimidos na parte direita da página". Plano completo do PROMPT 3 acordado no chat em 6 passos; este é o passo 1.*

- [x] **Causa raiz identificada e corrigida — não era da tabela, era do shell.** `src/components/app-shell.tsx` declarava `<main className="w-full flex-1">` ao lado de uma sidebar fixa de 208px, sem `min-w-0`. Resultado medido em produção local: numa viewport de 1265px, o `main` ia de 208px a **1466px** — ou seja, ~200px de conteúdo ficavam permanentemente fora da tela, **em todas as telas**, não só na lista. Corrigido para `min-w-0 flex-1` (sem `w-full`); o `main` passa a terminar exatamente na borda da viewport
- [x] **Truncamento silencioso removido** em `src/components/atividades/activity-table.tsx`: a coluna Assunto tinha `max-w-48 truncate` (texto completo só no `title`), violação direta da Regra 7 do CLAUDE.md, apesar de o aceite da S4 estar marcado. Removido `min-w-max` da tabela também — as colunas agora se adaptam ao espaço e o texto quebra linha
- [x] **Corte invisível corrigido:** `.panel-card` define `overflow: hidden` (globals.css:222), que vencia o `overflow-x-auto` da tabela — o excesso era cortado **sem sequer virar scroll**, exatamente o que o item 5.2 do prompt proíbe. A rolagem passou para uma `div` filha dentro do painel
- [x] Container mais largo só na tela de Atividades (`max-w-none`); as demais telas mantêm o `max-w-6xl` original, conforme o item 7 do prompt ("não alterar layout de outras telas")
- [x] `typecheck`, `lint` e `build` passam limpos
- [x] **Verificado em navegador autenticado contra dados reais (48 atividades)**, por medição de DOM em 3 larguras: em 1585px a tabela cabe inteira (1327px), sem scroll em lugar nenhum; em 1265px a tabela (1208px) rola **dentro do próprio painel**, sem scroll horizontal na página; em ambas, **zero células com conteúdo cortado** (`scrollWidth > clientWidth`) e as 10 colunas presentes. O assunto mais longo passou a ocupar 2 linhas (57px de altura) em vez de ser truncado
- [x] Dashboard e Configurações reconferidos: container de 1152px agora inteiramente dentro da viewport, sem scroll horizontal
- [ ] **Print de tela não obtido** — o painel do navegador não estava visível durante a sessão, o que impede a captura; a verificação acima é por medição de DOM, não visual

**D19 — detalhe (Unidade multi-valor em Atividade/AtividadeGeral):**

*Pedido do usuário em 2026-08-18 ("preciso conseguir colocar mais de uma unidade no mesmo card de atividade"). Decisão registrada em D19 após 3 perguntas de escopo respondidas no chat (Empresa continua única; aplica a Atividade e AtividadeGeral; filtro por Unidade casa por OR).*

- [x] `Atividade.unidadeId`/`AtividadeGeral.unidadeId` (escalar) viram `unidadeIds` (`String[]`), mesmo padrão de `tipoAtividadeIds` — schema, mapper, motor de filtros (`filters/engine.ts`), adapters (`activity-filters.ts`/`prazo-filters.ts`), rotas de API, `chat-tools.ts`, `knowledge-sync.ts`, seed e o script de consistência do dashboard atualizados
- [x] Migration `20260818150000_atividade_unidade_multipla` escrita (idempotente, no padrão da S1): dropa e recria `prazo_unificado` (coluna `unidade_id` vira `text[]`, normalizando os lados que continuam escalares — `Registro`, `ChecklistGeralItem`, fora de escopo), com backfill do valor único existente para o primeiro elemento do array
- [x] Formulário de atividade: seletor de Unidade trocado de `ManagedSelect` para `ManagedMultiSelect` (mesmo componente já usado para Tipo de atividade), restrito às unidades da Empresa escolhida; card, tabela e painel do calendário exibem a lista de unidades (`nome1, nome2`)
- [x] `typecheck`, `lint` e `build` passam limpos
- [x] **Migration aplicada em produção** (`npx prisma migrate deploy`, confirmado pelo usuário no chat antes de rodar): `21 migrations found`, `20260818150000_atividade_unidade_multipla` aplicada sem erro
- [x] **Backfill verificado por consulta direta ao banco de produção** (script `tsx` descartável, sem tocar em nada): das 61 atividades reais, 48 tinham `unidadeId` preenchido — todas vieram como array de 1 elemento com o mesmo id de antes; `SELECT unidade_id FROM prazo_unificado` devolve array (`{"id"}`) nas linhas migradas. Nenhuma atividade perdeu a unidade que já tinha
- [ ] **Verificação na UI (navegador) pendente** — dado que passou: cadastro/edição de atividade com 2+ unidades da mesma empresa, exibição em card/lista/calendário, filtro por unidade casando por OR. Mesmo bloqueio histórico de acesso a um navegador autenticado das sprints anteriores; reabrir quando houver

**S17 — detalhe do aceite (D18 + verificação em produção de 2026-08-16):**

*Contexto: nesta data o bloqueio de rede ao Postgres do Railway não estava mais ativo, e a verificação em navegador real (Chrome do usuário, autenticado em produção) finalmente aconteceu — fechando também o aceite pendente da S16.*

- [x] **Verificação em produção da S15** (deploy `95c1e8f`): sidebar só com Dashboard/Atividades/Configurações/Usuários; hero só com "Nova Atividade"; Resumo Geral só "Total de Atividades"; busca "Pesquisar atividades..."; dados dos módulos removidos confirmados intactos no banco por consulta read-only (8 registros, 4 planilhas, 2 execuções — D17)
- [x] **Aceite pendente da S16 FECHADO em produção, clicando**: KPI "Atividades Pendentes" → `/atividades?st=Pendente` com chip "Pendente" aplicado e lista correta; card do calendário → `/atividades?open=<id>` **abrindo a atividade automaticamente**; concluídas ao fim da lista, esmaecidas com hover; toolbar do editor fixa no topo com descrição longa rolando por baixo; painel "Prazos vinculados" com etiqueta correta
- [x] **BUG GRAVE encontrado na verificação ao vivo e corrigido (hotfix)**: digitar UMA tecla na busca global derrubava a aba do navegador ("This page couldn't load"), 100% reproduzível em produção. Causa: o filtro rodava `stripHtml` sobre `descricao` (HTML de editor rico com imagens base64 de megabytes) para todas as atividades **a cada tecla**. Pré-existente desde a S13 — só apareceu agora porque a busca nunca tinha sido testada num navegador real. Correção em duas frentes: (1) `global-search.tsx` pré-processa o corpus uma vez por mudança de dados, nunca por tecla; (2) `activity-filters.ts` usa `htmlToSearchText` (novo, em `utils.ts` — remove tags inteiras, inclusive `<img src="data:...">`) com cache `WeakMap` por objeto. Nada de busca truncada — o texto digitado pelo usuário permanece integralmente pesquisável
- [x] **Liquid glass (D18)**: tokens `--glass-*` (só `color-mix` de tokens existentes, nenhum hex novo); fundo do body com manchas radiais suaves de neutros da paleta base; `.panel-card`/`.hero-surface`/`.glass-dark` (sidebar + barra mobile) translúcidos com `backdrop-blur` e brilho interno; menus/selects/diálogos/sheets/busca via regra central por `data-slot` (`--popover` translúcido); toolbar do editor com `.glass-chrome`; fallbacks sólidos para navegador sem `backdrop-filter` e para `prefers-reduced-transparency`; cores semânticas (D8) intocadas
- [x] **Segundo defeito achado e corrigido na verificação em produção (commit `b7a61c3`)**: o primeiro deploy do vidro saiu SEM blur — escrever `backdrop-filter` + `-webkit-backdrop-filter` manualmente fazia o Lightning CSS (minificador do Next) manter só a variante `-webkit-`, que o Chrome atual não suporta mais como alias (`CSS.supports` = false, verificado ao vivo). Removidos os prefixos manuais (o minificador prefixa sozinho a partir da propriedade padrão). Blur confirmado computado em produção: painel 18px, sidebar 22px, hero 20px. **Lição**: nunca escrever prefixo `-webkit-` à mão neste projeto — o minificador descarta a propriedade padrão
- [x] **Deploy via `railway up`**: o push ao GitHub não disparou o webhook do Railway (deploy automático não criou build novo em ~20 min) — os dois deploys da S17 foram forçados pelo CLI. Se o webhook seguir mudo, checar a conexão GitHub↔Railway no painel

**S17 — iteração visual pós-feedback (2026-08-17/18, receita final v6):**
- [x] Três rodadas de feedback do usuário com print ("não tem glass nenhum", "ficou horrível", "falta o espelhado") resolvidas com um **harness visual autônomo**: mock do dashboard com o CSS real de produção + screenshots via Chrome headless — 6 versões iteradas sem depender de olhar humano
- [x] Bugs de contraste corrigidos: texto branco do FilterBar `dark` sobre vidro claro (raiz: comentário antigo "container escuro" — o modo `dark` saiu junto com a laje); texto da busca global de muted → foreground
- [x] Receita final: rim light nas bordas (não clarão especular — a 1ª tentativa virou névoa e foi revertida); wallpaper com 4 tokens decorativos pastéis (`--wall-1..4`, ver adendo D18 — a paleta base é dessaturada demais para o vidro refratar); painéis 58%/blur 26; KPIs em **vidro tintado** (cor semântica dominante a 84%, D8 intacta); cabeçalho **iOS Large Title** (título text-3xl/4xl direto no wallpaper, sem laje hero — `.hero-surface` removida) replicado em todas as telas; resumo rápido em chips-pílula de vidro
- [x] Verificado em produção com pixels reais (screenshots): wallpaper refratando através dos painéis, títulos grandes, filtros legíveis
- [x] **v7 (2026-08-18, feedback "cards coloridos ainda com aparência ruim")**: o vidro tintado dos KPIs saiu — no iOS a cor nunca pinta o card inteiro. KpiCard/DualKpi agora são vidro claro (`panel-card`) com o VALOR grande na cor semântica (D8 continua carregando o mesmo significado, só mudou de onde mora). Verificado em produção: "33" vermelho-pendente, "15" laranja-prazo, "28%" navy sobre cards refratando o wallpaper
- [x] Webhook GitHub→Railway segue **intermitente** (falhou de novo em 2026-08-18; dois deploys via `railway up`) — verificar a integração no painel do Railway continua pendente

**S16 — detalhe do aceite (PROMPT 2):**
- [x] **Calendário não exibe concluídos** — `activity-calendar.tsx` filtra prazos cujo objeto está concluído. A conclusão é lida do estado compartilhado (`atividades` do `AppDataProvider`), **não** do snapshot vindo de `prazo_unificado` — é isso que faz "desmarcar volta a aparecer" valer sem refetch e sem botão "Atualizar" (Regra 10). Cobre os 3 tipos de linha: prazo da atividade, item de checklist concluído (`checklist[].concluido`) e `prazoFim` de proposta (segue o status da atividade). Se a atividade ainda não estiver no estado (carregando), cai de volta no status da própria view em vez de sumir com o prazo por engano
- [x] **Concluídas ao fim da lista** — partição estável aplicada dentro de `sortActivities` (`activity-filters.ts`), então vale em cards, tabela e "Atividades recentes" do dashboard de uma vez, sem duplicar regra por tela. A ordenação escolhida (criação/prazo/prioridade) continua valendo **dentro** de cada grupo — é uma partição por cima, não uma segunda regra de ordenação
- [x] **Tratamento visual das concluídas** — `opacity-60` com retorno a `opacity-100` no hover (mantém legível quando o usuário for ler) no card e na linha da tabela; o card ainda troca a borda esquerda para `var(--status-concluido)`. Só tokens, nenhum hex novo
- [x] **Toolbar fixa no editor de descrição** — `sticky top-0 z-10` na barra de formatação (`rich-text-editor.tsx`), com fundo trocado de `bg-muted/40` (translúcido, deixaria o texto aparecer por baixo ao rolar) para `bg-card` (opaco). Encadeamento de rolagem conferido por leitura: o contêiner que rola é o `SheetContent` (`overflow-y-auto`), o `SheetHeader` não é fixo e nenhum ancestral tem `overflow: hidden`
- [x] **Direcionamento do dashboard — 2 defeitos concretos encontrados e corrigidos** (por leitura de código; ver ressalva de verificação abaixo):
  - **Filtros do link ignorados quando já se está em `/atividades`**: os filtros vinham de `window.location.search` lido **apenas no inicializador do `useState`**, ou seja, só na montagem. Trocar apenas a query string da mesma rota não remonta o componente no App Router, então o filtro do KPI clicado era silenciosamente descartado. Passou a usar `useSearchParams()` (fonte do router) com sincronização quando a URL muda por navegação de fora — um `useRef` guarda a última query string escrita pela própria tela para não entrar em laço com o `history.replaceState` que ela mesma faz
  - **`?open=` apagado antes de ser lido**: o efeito que reescreve a URL a partir dos filtros roda na montagem e não preservava `open`, enquanto `useAutoOpenFromQuery` só lê esse parâmetro **depois** que os dados carregam (`loading` vira false). O parâmetro já tinha sido removido da URL a essa altura — ou seja, clicar num card do calendário ou num resultado da busca global levava para `/atividades` mas nunca abria a atividade. O efeito agora preserva `open` ao reescrever
- [x] **Sobra da S15 removida** (fechamento, não escopo novo): `execucoesHref` e `simpleHref` em `activity-filters.ts` ficaram sem nenhum consumidor depois que a S15 reescreveu o `ResumoGeralWidget` — eram código morto gerando links para `/atividades-gerais`, `/registros` e `/planilhas`, rotas que não existem mais
- [x] `typecheck`, `lint` e `build` passam limpos; `/atividades` continua dinâmica no build (o `useSearchParams()` não exigiu limite de Suspense) e `/design-system` continua estática/idêntica
- [ ] **ACEITE PENDENTE — "clicar em cada KPI/gráfico do dashboard e ver o filtro correto aplicado, verificado no navegador"**: não foi possível. O critério desta sprint exigia explicitamente verificação clicando, e o mesmo bloqueio de acesso ao banco/login de todas as sprints anteriores continua (rede corporativa bloqueia a porta pública do Postgres do Railway). Os dois defeitos acima são demonstráveis por leitura de código, mas **não confirmei que eram a causa do que o usuário relatou** — pode haver um terceiro problema que só aparece ao vivo. Reabrir este item assim que houver um navegador autenticado
- [~] Os demais itens (calendário sem concluídos, ordem/esmaecimento das concluídas, toolbar fixa) também não foram vistos renderizados — mesma causa. Confiança vem de `build`/`typecheck`/`lint` limpos e revisão de código

**S15 — detalhe do aceite (D17):**
- [x] Sidebar mostra só Dashboard, Atividades, Configurações (+ Usuários/Lixeira para admin) — `app-shell.tsx` sem os itens Execuções/Registros/Planilhas
- [x] Rotas `/registros`, `/planilhas`, `/atividades-gerais` removidas (páginas, componentes exclusivos e rotas de API `src/app/api/{registros,planilhas,atividades-gerais}`); `build` confirma que não aparecem mais na lista de rotas geradas
- [x] Dashboard sem os KPIs "Total Execuções/Registros/Planilhas" (Campo 1 — `resumo-geral-widget.tsx` — restrito a "Total de atividades") nem os botões de criação rápida desses módulos no herói do dashboard; contagens de Atividades intactas
- [x] Calendário mostra apenas prazos de Atividade (e checklist/proposta de Atividade) — `activity-calendar.tsx` filtra `objetoTipo === "atividade"` antes de exibir; a view `prazo_unificado` continua devolvendo as linhas de Execução/Registro sem uso, sem migration
- [x] Formulário de atividade sem os blocos de vínculo com Registro/Planilha/Execução (`activity-form.tsx`); salvar/editar atividade continua funcionando
- [x] Busca global (Ctrl+K) restrita a Atividades (`global-search.tsx` reescrito)
- [x] Backup exporta só o que restou (atividades, lookups, modelos de checklist — `backup-export.tsx`, versão do JSON bump para 2)
- [x] Lixeira restrita a Atividades (`lixeira/page.tsx` reescrito, sem as seções de Registros/Planilhas)
- [x] **Achado fora do inventário original, tratado no mesmo escopo**: o assistente de chat (Aya) tinha ferramentas (`criar_registro`, `atualizar_registro`, `excluir_registro`, `criar_planilha`, `atualizar_planilha`, `excluir_planilha` em `src/lib/chat-tools.ts`) que criavam/editavam/excluíam Registro e Planilha direto via Prisma, por fora das rotas de API removidas — deixaria esses objetos "reviver" sem nenhuma tela para vê-los. Removidas as 6 ferramentas e suas declarações; `chat-index.ts` (índice de entidades do prompt) e o preâmbulo do sistema (`api/chat/route.ts`) e a mensagem de boas-vindas (`chat-widget.tsx`) atualizados para não mencionar mais Registros/Planilhas
- [x] **Armadilha do plano evitada**: `rich-text-editor.tsx` morava em `src/components/registros/` mas também é usado pelos campos "Descrição"/"Alinhamentos" de Atividade — movido para `src/components/rich-text-editor.tsx` (não apagado) antes de remover o resto da pasta
- [x] Catálogos exclusivos dos módulos removidos (`categoriaRegistro`, `categoriaPlanilha`, `tipoAtividadeGeral`, `setorInterno`) saíram da lista visível em `/configuracoes` (`KIND_ORDER`), sem remover o `LookupKind` do schema/tipos — reversível, sem migration
- [x] Nenhuma migration no diff; `prisma/schema.prisma` sem remoção de model — dados de Execuções/Registros/Planilhas continuam intactos no banco (D17)
- [x] `typecheck`, `lint` e `build` passam limpos; `build` lista as 21 rotas restantes sem erro, incluindo `/design-system` ainda estático
- [~] **Verificação funcional/visual real não foi possível** — mesmo bloqueio de acesso ao banco/login de todas as sprints anteriores (rede corporativa bloqueia a porta pública do Postgres do Railway). Confiança vem de `typecheck`/`lint`/`build` limpos e revisão de código; re-verificar visualmente quando o banco voltar a responder

**S13 — detalhe do aceite:**
- [x] **Busca global de verdade, em todos os objetos** — `src/components/global-search.tsx` (novo), disparada por Ctrl/Cmd+K, cobre Atividades/Execuções/Registros/Planilhas de uma vez (título, empresa, contato, descrição/conteúdo de abas — tudo já carregado no `AppDataProvider`, sem chamada de rede extra), agrupado por tipo, navega via o mesmo padrão `?open=<id>` já usado em todo o app. Montada no cabeçalho de `app-shell.tsx`, visível em todas as telas
- [x] **Performance/consistência — paginação retroativa**: Atividades já tinha paginação (S5); Execuções, Registros e Planilhas não tinham (renderizavam a lista inteira de uma vez). Adicionado `Pagination` (60/página) + memória de modo de visualização (`useViewMode`) + sincronização de filtros com a URL (`history.replaceState`) nas 3 telas que faltavam, replicando exatamente o padrão já usado em Atividades. **Bug real corrigido nesse meio-tempo**: `execucaoFiltersFromParams` só lia `kw/emp/uni/prio/prazo` da URL — filtros de `tipo`, `status` e `setor` vindos de um link do Dashboard eram descartados silenciosamente. Reescrito sobre o helper genérico (`paramsToFiltersGeneric`/`filtersToParamsGeneric`), com um `LIST_KEYS` completo; ganhou também `execucaoFiltersToParams` (faltava, usado agora pela própria tela de Execuções para escrever de volta na URL)
- [x] **Responsividade tablet e celular ("reorganizar, nunca esconder")** — auditoria dedicada (dashboard, calendário, formulários, listas) não encontrou violação em dashboard/calendário/grids de card (já usavam breakpoints corretos desde as sprints anteriores). Encontrados e corrigidos 4 problemas reais:
  - `link-editor.tsx` e `checklist-editor.tsx`: linha de item usava `field-sizing-content` (campo cresce para caber todo o conteúdo, Regra 07) sem limite — em telas estreitas isso empurrava a linha inteira para fora do viewport em vez de reorganizar. Corrigido para `flex-wrap` + `min-w-0 flex-1` abaixo de `sm:`, mantendo o comportamento de crescer-com-o-conteúdo em telas largas
  - `atividades-gerais/page.tsx` (linha compacta do item de checklist): os badges de status e de prazo estavam `hidden sm:inline-block`/`hidden md:inline-block` — informação real (status, urgência do prazo) ficava **invisível** em vez de reorganizada em celular/tablet, violando a regra diretamente. Trocado por `flex-wrap` no container — os badges sempre aparecem, quebrando para a linha seguinte quando não cabem
  - `planilha-editor.tsx`: barra de ações (Importar/Exportar XLSX, Expandir) em `flex items-center justify-between` sem `flex-wrap` — em 375px os 3 botões ultrapassavam a largura da tela. Corrigido para empilhar (rótulo acima, botões abaixo com `flex-wrap`) abaixo de `sm:`
- [x] **Backup e exportação** — não existia nenhuma forma de tirar os dados do sistema. Adicionado `src/components/backup-export.tsx`, montado no topo de `/configuracoes`: exporta um JSON com tudo que o `AppDataProvider` carrega (lookups, atividades, execuções, registros, planilhas, modelos de checklist) via `Blob`/download no navegador, sem rota de API nova (o dado já está no cliente). Não inclui o binário dos anexos (só metadado, se vier embutido em Atividade) — é um backup de dados estruturados, não um backup de arquivo bruto; registrado como corte de escopo, não escondido
- [x] **Revisão de consistência visual (Regra 02, zero hex fora dos tokens)** — `grep` por hex de 6 dígitos fora de `globals.css` encontrou 2 ocorrências reais (fora de comentários): `rich-text-editor.tsx` tinha uma paleta de 7 cores hardcoded para o seletor de cor de texto do editor rico. Trocada por referências a `var(--token)` (mesmos tons: base-1/2/3, status-concluido, prioridade-importante/medio, status-pendente) — funciona igual dentro do HTML persistido, porque `style="color: var(--token)"` resolve normalmente onde quer que o conteúdo seja renderizado, e passa a acompanhar o token se ele mudar no futuro
- [x] **Achado fora do grep de hex, mas do mesmo tema (vestígio do tema escuro da S14)**: `globals.css` ainda tinha um bloco `.dark { ... }` inteiro (39 variáveis, hex próprios) sobrevivendo da implementação do tema escuro que a S14 reverteu. Nada em `src/` aplica a classe `.dark` (sem `next-themes`, sem toggle, confirmado por busca) — o bloco é 100% morto, mas é exatamente o tipo de "vestígio do tema escuro" que o critério de aceite da S14 dizia que não deveria sobrar. Removido. (`@custom-variant dark` e as classes `dark:` dos componentes shadcn/ui de base foram deixados como estão — são infraestrutura genérica do template, não o tema específico deste app, e mexer nos 10 arquivos de componente-base por um efeito puramente inerte seria escopo fora do que esta sprint pediu)
- [x] **Gap real fechado, pendência #11 registrada desde a S12**: `Planilha` já tinha `atividadeGeralIds`/`registroIds` no schema e na API desde a S10/S11, mas o editor (`planilha-editor.tsx`) só expunha o vínculo com Atividade — Execução e Registro não tinham nenhuma UI do lado da Planilha. Adicionados os dois blocos "Execução vinculada"/"Registro vinculado", mesmo componente (`FilterMultiSelect`) e mesmo padrão visual dos blocos já existentes em `registro-editor.tsx`
- [x] `typecheck`, `lint`, `build` passam limpos em cada etapa (busca global, retrofit de paginação, correções de responsividade, backup, limpeza de tema escuro, vínculos de Planilha)
- [x] `/design-system` continua idêntico (nenhum arquivo da página ou de seus componentes foi tocado nesta sprint); confirmado que a rota segue prerenderizada como estática pelo build
- [~] **Verificação funcional/visual real não foi possível** — mesmo bloqueio de acesso ao banco/login de todas as sprints anteriores (rede corporativa bloqueia a porta pública do Postgres do Railway). Nenhuma das telas desta sprint (busca global, paginação nova, badges reorganizados, exportação de backup, seletor de cor do editor rico, vínculos novos da Planilha) foi aberta num navegador autenticado. Confiança vem de `build`/`typecheck`/`lint` limpos, revisão de código linha a linha e replicação exata de padrões já usados (e presumivelmente já visualmente corretos) em outras telas — não de uma captura de tela real. Re-verificar visualmente quando o banco voltar a responder
- [ ] **Checklist final de regressão módulo a módulo**: não pôde ser um teste executado de fato (mesmo bloqueio acima). O que foi feito em vez disso: `build` completo lista as 26 rotas sem erro (incluindo todas as telas de sprints anteriores), e cada mudança desta sprint foi checada por leitura de código para confirmar que não altera nenhum caminho de dados/filtros/API — só markup/estilo/uma tela nova de configuração. Regressão real fica pendente do mesmo desbloqueio de rede que todas as sprints anteriores aguardam

**S12 — mini-spec (D14) e detalhe do aceite:**
- Mini-spec: Planilha é documento estruturado em formato de tabela (grid), existindo sozinha ou vinculada a atividades/registros. Biblioteca de grid já decidida em sessão anterior (Univer, `@univerjs/preset-sheets-core`) — decisão de infraestrutura já tomada, não revisitada.
- [x] Grid, vínculos (multi-atividade), CRUD — já estavam completos (`univer-sheet.tsx`, `planilha-editor.tsx`)
- [x] **Gap real fechado**: "importação e exportação de XLSX" (escopo explícito da S12, "resolve a maior parte do uso real" sem virar um clone de Excel) não existia. Adicionado:
  - `UniverSheet` ganhou um handle imperativo (`forwardRef`/`useImperativeHandle`) expondo `exportGrid()`/`importGrid()` sobre a API pública do Univer (`getDataRange().getValues()` / `getRange(...).setValues(...)`, confirmadas contra os `.d.ts` reais instalados, não chutadas)
  - `exceljs` (MIT, `^4.4.0`) para ler/escrever `.xlsx` — dependência nova justificada: é o que a própria S12 pede, sem alternativa mais simples já presente no projeto
  - Botões "Importar XLSX"/"Exportar XLSX" em `planilha-editor.tsx`, com normalização de célula (`normalizeXlsxCell`) para o escopo mínimo (valores, não fórmulas/estilos) — evita a "armadilha" que o próprio plano avisa
- [x] `typecheck`, `lint`, `build` passam limpos; zero hex fora dos tokens; sem migration nesta sprint
- [~] Verificação visual real **não foi possível** — mesmo bloqueio de banco/login de todas as sprints anteriores. Import/export XLSX também não testado contra um arquivo real (sem browser autenticado disponível) — risco residual documentado, não escondido.

**S11 — mini-spec (D14) e detalhe do aceite:**
- Mini-spec: Registro é documento estruturado (editor de texto rico por aba), existindo sozinho ou vinculado a qualquer outro objeto (Atividade, Execução, Planilha).
- [x] Editor de texto rico — já estava completo e maduro (TipTap: formatação, cores, tabelas redimensionáveis, imagem colada como data URI), nenhuma mudança necessária
- [x] **Gap real fechado**: `Registro` não tinha campo de prazo — adicionado `prazo DateTime?` opcional (migration aditiva); UI no editor (`registro-editor.tsx`)
- [x] **Gap real fechado**: aparição no calendário — `prazo_unificado` ganhou um 6º bloco para `Registro`. Como Registro não tem prioridade/status de negócio, esses campos ficam `NULL` na view (em vez de inventar um valor) — `activity-calendar.tsx` e `src/lib/prazo-filters.ts` ajustados para tratar prioridade/status ausentes sem quebrar (badge de prioridade só aparece quando existe; filtro de status/prioridade exclui essas entradas quando o filtro está ativo, em vez de casar por acidente)
- [x] **Gap real fechado**: vínculo Registro↔Execução existia no banco/API desde a S10, mas sem UI no editor — adicionado bloco "Execução vinculada"
- [x] **Gap real fechado**: vínculo Registro↔Planilha não existia em lugar nenhum — `planilhaIds`/`registroIds` novos (mesmo padrão polimórfico via `Vinculo`), UI só do lado do Registro (bloco "Planilha vinculada"); do lado da Planilha fica para a S12
- [x] **Busca "full-text"**: em vez de conectar a coluna `busca` (tsvector, órfã desde a S1) a uma rota nova — o que introduziria um round-trip assíncrono, inconsistente com o resto do app (tudo filtra em memória, decisão já fechada) — o `searchText` em memória passou a cobrir o conteúdo das abas (texto rico, sem tags), mesmo sentido de "busca em todas as palavras-chave" que `activity-filters.ts` já usa para Atividades. A coluna `busca` **continua sem uso** — não escondido, registrado como pendência
- [x] **Bug pequeno corrigido**: o filtro "Vínculo" (vinculado/sem vínculo) só olhava `atividadeIds` — agora considera `atividadeIds`, `atividadeGeralIds` e `planilhaIds`
- [x] Resumo Geral — já cumprido desde a S8 (KPI "Total de registros")
- [x] `typecheck`, `lint` e `build` passam limpos; `scripts/check-dashboard-consistency.ts` confirma que os buckets de Atividade não foram afetados
- [~] Verificação funcional real (prazo de Registro aparecendo no calendário, vínculo com Planilha nos dois lados) **não foi possível** — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores

**S10 — mini-spec (D14) e detalhe do aceite:**
- Mini-spec: Execução é um processo com itens/subitens (árvore), cada um com status/prazo próprio, para substituir checklists longos demais para uma única Atividade. Confirmado com o usuário: é o mesmo conceito de `AtividadeGeral`/`ChecklistGeralItem` já em produção (rota `/atividades-gerais`) — **sem renomear para `Execucao`/`ExecucaoItem`** (ver `ERRATA-SPEC.md` #4, resolve a "Dívida assumida" #2)
- [x] CRUD, itens/subitens com check e prazo, indicador de progresso, aparição no calendário e no Resumo Geral — **já estavam todos prontos antes desta sprint**, só verificados por leitura de código (árvore recursiva de verdade com indentação, barra de progresso em cards/tabela/cabeçalho)
- [x] **Gap real fechado**: vínculo era assimétrico — só dava pra vincular Execução a partir do drawer de Atividade. Adicionado bloco "Objetos vinculados" na própria tela de edição da Execução (`atividades-gerais/page.tsx`), com Atividades, Registros e Planilhas (vincular existente, criar já vinculado, desvincular)
- [x] **Gap real fechado**: vínculo com Registro/Planilha não existia (só existia com Atividade, da S6). `Registro`/`Planilha` ganham `atividadeGeralIds`, mesmo padrão de `atividadeIds` (`listarVinculadosEmLote`/`syncVinculos`/`listarVinculados` com o alvo `"atividadeGeral"`)
- [x] **Gap real fechado**: filtro "Setor interno" não existia em Execuções, apesar do campo existir e ser editável — adicionado em `execucao-filters.ts`/`execucao-filter-bar.tsx`
- [x] `typecheck`, `lint` e `build` passam limpos
- [~] Verificação funcional real (vincular Atividade a partir da Execução e ver refletido dos dois lados, filtrar por setor) **não foi possível** — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores

**S9 — detalhe do aceite:**
- [x] "Teste automatizado de consistência: soma dos gráficos = total do Campo 1" — `scripts/check-dashboard-consistency.ts` (roda com `npm run check:dashboard-consistency`), sem instalar test runner novo (usa `tsx`, já dependência do projeto, mais `assert` do Node). Verifica que `statusBuckets` e a distribuição por prioridade particionam 100% das atividades (soma == total), para qualquer combinação de status/prioridade — falha se um novo valor for adicionado sem atualizar os buckets. `vencimentoBuckets` fica de fora de propósito (não é partição total: atividade sem prazo não cai em nenhum bucket)
- [x] "Cor por ranking funcionando" — já valia parcialmente antes (top-N coloridos do mais escuro ao mais claro); agora usa a escala de **5 tons** completa da D9 (faltava o 5º token, `--base-5: #FBF9E4`, adicionado em `globals.css`)
- [x] "Mais de 5 empresas agrupa a cauda em 'Outros' (D9)" — não implementado antes (só um `slice(0,8)` sem bucket de cauda); nova função `rankComOutros` em `dashboard-shared.tsx`, aplicada em `empresaData`
- [x] 6º indicador "Propostas Ganhas" (adendo do Cap. 4: status de negociação = Aceite) — não existia, adicionado usando o filtro `statusNegociacao` novo da S8
- [x] "Visão Geral… largura total, ao final da página" — não estava assim (renderizava dentro da mesma coluna estreita dos outros campos, ao lado do calendário); extraído para `VisaoGeralWidget`, renderizado em `dashboard/page.tsx` fora do grid de 2 colunas, em largura total, antes de "Atividades recentes"
- [x] `typecheck`, `lint` e `build` passam limpos
- [ ] **Decisão de escopo, não threshold esquecido**: Campos 4-6 continuam fora do motor de widgets da S8. Motivo: "Visão Geral" tem posição fixa exigida pela spec ("será o último dado... da tela"), o que contradiz a natureza reordenável de um widget — formalizar isso exigiria decidir como um widget pode ser "não reordenável", que não é pedido pelo texto da S9. Registro como pergunta em aberto, não decido sozinho
- [~] Verificação visual real (ranking de empresas com mais de 5, "Outros" aparecendo, Visão Geral em largura total) **não foi possível** — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores

**S8 — detalhe do aceite:**
- [x] "Com Empresa=X aplicado, clicar em 'Atividades pendentes' abre Atividades com Empresa=X E Status=Pendente" — já valia antes desta sprint (`atividadesHref`/`mergeFilters` em `activity-filters.ts`, usados pelos KPIs dos Campos 1-3 desde antes da S8); nada mudou nesse mecanismo, só confirmado
- [x] "Ocultar e reordenar widget persiste após recarregar" — novo model `WidgetPreferencia` (por usuário, `ordem`/`visivel`/`tamanho`), `GET`/`PUT /api/widget-preferencias`, estado no `AppDataProvider` (`widgetPreferencias`/`updateWidgetPreferencias`, carregado no `load()` inicial junto com o resto)
- [x] "Alterar uma atividade atualiza o dashboard sem nenhum clique" — já valia (Context React compartilhado, sem camada de cache formal); confirmado, não é o que esta sprint constrói
- [x] Registry de widgets (Campos 1-3): `src/lib/dashboard-widgets.ts` (definição) + `src/components/dashboard/dashboard-widgets.tsx` (renderiza os visíveis, na ordem/tamanho persistidos)
- [x] Botão de configuração (engrenagem no cabeçalho) com **drag-and-drop** real (`@dnd-kit/core`, mesmo padrão de `kanban-board.tsx` — sem instalar `@dnd-kit/sortable`), alternar visibilidade e tamanho (normal/largo)
- [x] Barra de filtros global: 9→**10 campos** — adicionado "Status de negociação" (`activity-filters.ts`, `filter-bar.tsx`)
- [x] Gráficos dos Campos 1-3 trocados de `VerticalBars` (caseiro) para `BarList` (`src/components/charts`) — decisão já fechada em `DECISOES.md`/`CLAUDE.md`, existia no código mas nunca tinha sido usada; agora clicável (navega para a tela de destino com o filtro certo)
- [x] `typecheck`, `lint` e `build` passam limpos
- [ ] **Corte de escopo explícito**: Campos 4-6 (Propostas/Empresas/Visão Geral) continuam fora do motor de widgets — `dashboard-analytics.tsx` só perdeu os Campos 1-3 (extraídos), o resto ficou como estava. Formalizá-los como widget é escopo da S9
- [ ] **Achado, não corrigido (fora do escopo travado da S8)**: os valores de `StatusNegociacao` no código (`em_andamento`/`fup`/`aceite`/`na`) não batem com o catálogo da **D10** (fechada): "Em negociação, Aguardando aceite, Aceite, Recusada, Sem retorno". O filtro novo foi implementado em cima do que existe hoje
- [~] Verificação funcional real (ocultar/reordenar um widget e recarregar a página, clicar num KPI com filtro combinado) **não foi possível** — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores
- Migration nova (`20260723130000_widget_preferencia`) — só `CREATE TABLE IF NOT EXISTS` aditivo, idempotente

**S7 — detalhe do aceite:**
- [x] "Prazo de atividade e prazo de item de checklist aparecem juntos, com etiquetas corretas" — calendário agora é **consumidor exclusivo de `prazo_unificado`** (`GET /api/prazos`), não recalcula mais nada em memória. Etiquetas: "Atividade", "Execução", "Checklist (Atividade)", "Checklist (Execução)", "Proposta" (`tipoPrazoLabel` em `src/lib/prazo-filters.ts`)
- [x] "Alterar o prazo no painel reflete na atividade e no dashboard sem refresh manual" — a edição despacha para `updateAtividade`/`updateAtividadeGeral` do `AppDataProvider` (mesmas funções usadas em todo o resto do app), então o resto da tela reflete de graça; o próprio painel do calendário faz um novo fetch de `/api/prazos` logo depois (é uma cópia à parte do estado global, não é um botão "Atualizar")
- [x] "Filtros do calendário não afetam o restante do dashboard" — filtros novos e independentes (`calendar-filter-bar.tsx` + `CalendarFilters`), sem nenhuma ligação com o `filters`/`FilterBar` do dashboard
- [x] Painel "Prazos vinculados" movido para **abaixo** do calendário (antes ficava ao lado) — layout vertical: calendário → filtros → prazos vinculados, como pede o Cap. 4
- [x] Cards do painel agora são **direcionáveis** (`Link` para `/atividades?open=` ou `/atividades-gerais?open=`)
- [x] **Bug corrigido** (introduzido por mim na própria S6): `/atividades-gerais?open=` nunca funcionou — a página nunca chamou `useAutoOpenFromQuery`. Corrigido, e é o que torna os cards de Execução do calendário (e o link de vínculo da S6) direcionáveis de verdade
- [x] Posição do calendário no dashboard corrigida: estava na coluna **esquerda** (contrariando D2/D3); agora indicadores/gráficos ficam à esquerda/centro e o calendário fixo à direita
- [x] Migration nova (`20260723120000_prazo_unificado_origem_tipo`) — só `CREATE OR REPLACE VIEW` aditivo (`origem_id` e `tipo_atividade_ids` novos, nenhuma coluna existente muda), idempotente
- [x] `typecheck`, `lint` e `build` passam limpos
- [ ] **Corte de escopo explícito**: os filtros "Tipo de produto/serviço" e "Produto/Serviço" (Cap. 4, lista de filtros do calendário) não entraram — só se aplicam a linhas de origem "proposta" e exigiriam estender a view também com dados de `Proposta`, para um filtro de uso marginal num calendário. Os outros 7 filtros da lista (busca, empresa, unidade, tipo, status, prioridade, prazo) foram implementados
- [~] Verificação funcional real (clicar num dia, editar um prazo, navegar até o objeto, ver refletido no dashboard) **não foi possível** — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores. Confiança vem de build + revisão de código

**S6 — detalhe do aceite:**
- [x] "Editar sem perder o contexto da lista" — já valia antes desta sprint (o Sheet de `activity-form.tsx` já abre sobre a lista, sem navegação); nada mudou aqui
- [x] "Registro vinculado a 2 atividades aparece nas duas e continua sendo um só" — já valia (infraestrutura de `Vinculo` da S1); estendido nesta sprint para o mesmo valer com **Execuções** (`AtividadeGeral`): `GET`/`PATCH`/`DELETE` de `atividades-gerais` passaram a ler/escrever `atividadeIds` via `listarVinculadosEmLote`/`syncVinculos`/`deleteVinculosDe` (mesmo padrão de `Registro`/`Planilha`); novo bloco de vínculo em `activity-form.tsx`
- [x] "Histórico registra alteração de status, prazo e prioridade" — implementado do zero: model `Historico` novo, gravado no `PATCH` da atividade (diff entre o estado salvo e o recebido, só grava o que mudou), exposto via `GET /api/atividades/[id]/historico` (buscado sob demanda ao abrir a atividade, não no `AppDataProvider` global — cresce sem limite) e exibido como timeline somente leitura
- [x] Links (spec 5.12, "quantidade ilimitada") — model `Link` novo, mesmo padrão de `Proposta`/`ChecklistItem` (substituído inteiro a cada save); UI em `link-editor.tsx`
- [x] Anexos (spec 5.12) — decisão do usuário: **volume do Railway** (disco persistente), não Cloudflare R2/Vercel Blob. Model `Anexo` novo (metadado no Postgres, binário em disco via `UPLOAD_DIR`, `src/lib/anexos.ts`); rotas de upload/download/remoção; só habilitado para atividade já salva (FK real, diferente do vínculo polimórfico)
- [x] Drawer lateral — mantido como está (decisão do usuário): o Sheet já existe, hoje forçado a tela cheia; não convertido para painel estreito nesta sprint
- [x] `typecheck`, `lint` e `build` passam limpos
- [ ] **Ação pendente do usuário, fora do meu alcance**: criar um Volume no Railway (sugestão: montado em `/data`) e definir `UPLOAD_DIR=/data/anexos` nas variáveis de ambiente do serviço, **antes do próximo deploy** — sem isso, anexos em produção seriam gravados no filesystem efêmero do container e perdidos a cada deploy. Localmente, sem a variável, cai num fallback `./storage/anexos` (git-ignorado)
- [~] Verificação funcional real (upload → download → remover; histórico populado por uma edição real; vínculo com execução ida e volta) **não foi possível** — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores. Confiança vem de build + revisão de código + espelhamento exato dos padrões já em produção (`Registro`/`Planilha`)
- Migration nova `20260723110000_link_anexo_historico`, só aditiva (`CREATE TABLE IF NOT EXISTS`), idempotente desde o início

**S5 — detalhe do aceite:**
- [x] Modo Cards já existia com a hierarquia do Cap. 5 (Produto/Serviço no lugar do assunto quando Proposta, escopo/amostragem em menor destaque, etiqueta MRR/PS, valor total) — pré-existente
- [x] Modo Lista já existia — pré-existente
- [x] Ações rápidas: **alterar status e prioridade já existiam** (`QuickStatusBadge`/`QuickPrioridadeBadge`, popover inline, sem abrir a atividade) — só faltavam na tabela, agora reutilizados lá também (extraídos e exportados de `activity-card.tsx`)
- [x] Índice de conclusão do checklist em 2 formatos (barra + quantidade) já existia no card; **adicionado na tabela**, que só tinha a quantidade
- [x] **Gaps reais corrigidos**:
  - **URL não refletia os filtros** — só lia da URL no mount, nunca escrevia de volta. Adicionado `history.replaceState` (sem navegação Next, sem refetch) a cada mudança de filtro — colar a URL em outra aba agora reproduz exatamente o estado
  - **Modo (cards/lista) não tinha memória** — resetava para "cards" a cada carregamento. Novo hook `useViewMode` (localStorage) usado em Atividades
  - **"Duplicar" não existia** como ação rápida — adicionado em card e tabela; remapeia ids do checklist preservando a árvore de subitens (parentId)
  - **Sem paginação** — 1.000+ atividades renderizavam tudo de uma vez. Adicionada paginação (60/página) usando o componente `Pagination` da S2
- [x] **"Arquivar" via soft-delete real, resolvido em 2026-07-22** — não havia gap de UI: o botão "Excluir" (`Trash2`) em `activity-card.tsx`/`activity-table.tsx` já tinha o fluxo certo, igual a `Registro`/`Planilha`. Só a API por trás estava incompleta. Corrigido replicando o padrão de `registros/route.ts`/`registros/[id]/route.ts`: `GET /api/atividades` passou a aceitar `?trash=1`; `DELETE /api/atividades/[id]` passou a fazer soft-delete (`deletedAt`) por padrão, hard delete só com `?permanent=1`. Nenhuma migration necessária (`deletedAt` e índice já existiam desde a S1; a view `prazo_unificado` já filtrava `deletedAt IS NULL`; a rota de restore já existia). `typecheck`, `lint` e `build` passam
- [x] `typecheck`, `lint`, `build` passam limpos; sem migration nesta sprint
- [~] Verificação visual real **não foi possível** — mesmo bloqueio de banco/login de todas as sprints anteriores.

**S4 — detalhe do aceite:**
- [x] Formulário já existia (`activity-form.tsx`), quase inteiramente conforme a spec — popup em tela cheia, nenhum campo obrigatório, defaults automáticos (status=Pendente, prioridade=Médio)
- [x] Blocos condicionais (E-mail, Oportunidade, Proposta, Agendamento) já existiam, independentes — selecionar 2 tipos abre os 2 blocos
- [x] Checklist com prazo opcional por item, com botão de remover prazo — já existia (`checklist-editor.tsx`)
- [x] Criação inline de catálogo já existia via `ManagedSelect`/`ManagedMultiSelect`, mesmo estado do `AppDataProvider` usado em Configurações (S3) — aparece na atividade seguinte sem redeploy
- [x] Texto longo não é cortado em nenhum campo (`Textarea` com `field-sizing-content`, `RichTextEditor` sem overflow/truncate)
- [x] **Gap real encontrado e corrigido**: "data de conclusão automática" (escopo explícito da S4 / D13) não existia — `Atividade` não tinha nenhum campo de data de conclusão. Adicionado `concluidoEm` (migration idempotente `20260723100000_atividade_concluido_em`), **calculado no servidor** (não confiado ao cliente): carimba ao entrar em "Concluído", preserva a data original se já estava concluída, limpa ao sair
- [x] `typecheck`, `lint`, `build` passam limpos
- [ ] **Gap conhecido, não fechado nesta sprint**: D6 menciona "Categoria, Área, Projeto e Processo... catálogos opcionais recolhidos" — esses 4 catálogos não existem em nenhum lugar do código (não são `LookupKind`, não são campo de `Atividade`). Não inventei essa estrutura sem mais contexto — nenhum critério de aceite testa isso diretamente, e criar 4 catálogos novos + UI colapsável sem saber exatamente o que cada um representa seria um chute. Registrado como pendência.
- [~] Verificação visual real **não foi possível** — mesmo bloqueio de banco/login de todas as sprints anteriores.

**S3 — detalhe do aceite:**
- [x] Barra lateral já era mínima e idêntica em todas as telas (`app-shell.tsx`, pré-existente) — adicionado item de navegação "Configurações"
- [x] Navegação sem recarregar página — já garantido pelo App Router + `AppDataProvider` acima do layout (arquitetura pré-existente)
- [x] Tela `/configuracoes`: CRUD de todos os 10 catálogos (`LookupKind`), com **cor** (novo campo `LookupItem.cor`, token da paleta base — nunca hex livre), **ordem** (novo campo `LookupItem.ordem`, setas de mover para cima/baixo) e **arquivamento** (já existia via `active`, agora com reativação)
- [x] `unidade` tratada à parte — pertence a uma empresa (`empresaId`), a seção exige selecionar a empresa antes de criar/listar unidades
- [x] Migration nova (`20260723090000_lookup_cor_ordem`) — **idempotente desde o início** (`ADD COLUMN IF NOT EXISTS`), lição da S1 aplicada preventivamente
- [x] "Criar um tipo de atividade em Configurações aparece no formulário sem redeploy" — estruturalmente garantido: `addLookupItem` escreve no mesmo `AppDataProvider` que `ManagedMultiSelect` lê; é o mesmo estado client-side, não uma tela separada
- [x] "Arquivar não quebra registro antigo" — `deactivateLookupItem` só marca `active=false`; a resolução de nome em registros antigos usa a lista completa de `lookups[kind]` (ativos + arquivados), só as opções de seleção filtram por `active`
- [x] `typecheck`, `lint`, `build` passam limpos; zero hex fora dos tokens nos arquivos novos
- [~] Verificação visual real **não foi possível** — mesmo bloqueio de banco/login da S1/S2. Confiança vem de build + revisão de código.

**S2 — detalhe do aceite:**
- [x] `grep` por hex fora dos tokens = 0 — corrigidos hex hardcoded pré-existentes em `dashboard-analytics.tsx`, `dashboard/page.tsx` e `status-colors.ts` (mapas mortos `STATUS_HEX`/`PRIORIDADE_HEX`/`STATUS_NEGOCIACAO_HEX`, sem consumidor, removidos). Exceção aceita nesta sprint: `rich-text-editor.tsx` — paleta de cores do editor de texto rico, gravada como `style="color:#..."` dentro do HTML persistido do usuário, não é chrome de UI. **Atualização S13**: mesmo essa exceção foi trocada para `var(--token)` (ver detalhe do aceite da S13) — hoje não sobra nenhum hex fora de `globals.css`, sem exceção
- [x] **Bug real encontrado e corrigido**: os tokens `--status-pendente` e `--prazo-proximo` em `globals.css` divergiam da **D8** (decisão fechada, precedência máxima) — `dashboard-analytics.tsx` já usava os valores corretos da D8 (`#780001`/`#BF512C`) fora do token; agora os tokens foram corrigidos para bater com D8 e tudo aponta para eles
- [x] Removido `dashboard-stats.tsx` — componente morto (zero imports), duplicava `dashboard-analytics.tsx` com hex hardcoded
- [x] Página `/design-system` criada (`src/app/design-system/page.tsx`), fora do grupo `(app)` — não depende de login nem de `AppDataProvider`/banco, prerenderizada como estática pelo build. Cobre: tipografia, paleta base, cores semânticas, botões, os 8 estados obrigatórios, badges, campos de texto (com teste de 500+ caracteres), select/multi-select com typeahead, checkbox, cards, tabs, drawer, modal, tooltip, toast, progress bar, skeleton, empty state, paginação, calendário, referência de sidebar/header
- [x] Componentes novos criados (faltavam para os 18 do Cap. 3): `tooltip.tsx`, `toast.tsx` (+ `ToastProvider` montado no layout raiz), `progress.tsx`, `skeleton.tsx`, `empty-state.tsx`, `pagination.tsx` — todos wrapping Base UI (`@base-ui/react`) no mesmo padrão dos componentes existentes
- [x] `prefers-reduced-motion: reduce` respeitado globalmente (`globals.css`) — animações/transições somem quase por completo
- [x] Foco visível por teclado — já garantido pelos componentes existentes (`focus-visible:ring-3` em toda a base), com seção dedicada de teste na página
- [x] `typecheck`, `lint`, `build` passam limpos
- [~] Verificação visual real no browser **não foi possível** — `/design-system` exige login (middleware protege tudo exceto `/login`), e o acesso ao banco continua bloqueado (mesmo problema da S1). Confiança vem do build (`/design-system` prerenderizado como estático sem erro) + revisão de código, não de uma captura de tela real. Re-verificar visualmente quando o banco voltar.

**S14 — detalhe do aceite:**
- [x] `grep` por hex fora dos tokens = 0 — todo hex confinado à seção de tokens de `globals.css`
- [x] Diff não toca lógica/dados/filtros — só `globals.css` (tokens + `.panel-card`), `app-shell.tsx` (removida referência ao botão) e exclusão de `theme-preview-toggle.tsx`
- [x] Cores semânticas (status/prioridade/prazo/negociação) idênticas — blocos não tocados
- [x] Tema final é o claro `#EEF4ED` — confirmado via `getComputedStyle` no browser (`rgb(238, 244, 237)`), sidebar `#1F2C43`, card branco
- [x] `typecheck`, `lint`, `build` passam limpos (o lint, inclusive, ficou sem o erro pré-existente que vivia no arquivo agora removido)
- [~] "Telas de sprints anteriores continuam funcionando" — **verificado só parcialmente**: com o banco fora do ar (mesmo bloqueio da S1), só a tela `/login` pôde ser carregada de fato no browser sem sessão. As demais telas (Dashboard, Atividades, Registros, Planilhas) não foram abertas visualmente nesta sprint — o `build` compila todas as rotas sem erro, mas isso não é o mesmo que confirmar a UI renderizada. Re-confirmar visualmente quando o banco voltar a responder.
- [ ] `/design-system` continua idêntico — não aplicável, a página não existe ainda (gap da S2, não desta sprint)

## Inventário técnico atual (fora do ritual de sprints)

O que existe em `main` hoje, levantado por leitura direta do código (não presunção):

| Área | Estado | Evidência |
|---|---|---|
| Auth | NextAuth v5 + bcryptjs, multiusuário (`Role` ADMIN/USER), rota `/login` | `src/lib/auth.ts`, `src/lib/auth.config.ts` — diverge da spec original ("usuário único"); **D15 fechada (2026-07-22): manter multiusuário**, registrado em `ERRATA-SPEC.md` |
| Atividades | Rota `/atividades`, componentes em `src/components/atividades` | `src/app/(app)/atividades` |
| Atividades gerais (Execuções) | **Removido da interface na S15 (D17)** — modelo `AtividadeGeral` continua no banco, sem rota/UI/API | `prisma/schema.prisma` |
| Registros | **Removido da interface na S15 (D17)** — modelos `Registro` + `RegistroTab` continuam no banco, sem rota/UI/API | `prisma/schema.prisma` |
| Planilhas | **Removido da interface na S15 (D17)** — modelo `Planilha` continua no banco, sem rota/UI/API | `prisma/schema.prisma` |
| Usuários | Rota `/usuarios` — gestão de contas, não catálogo (empresa/tipo/status etc.) | `src/app/(app)/usuarios` |
| Lixeira | Rota `/lixeira` + modelo `PendingDeletion` — mecanismo de soft delete existe, mas por fora do padrão "catálogo com `ativo`" descrito no plano (D12) | `src/app/(app)/lixeira` |
| Dashboard | Rota `/dashboard`, com calendário embutido (`ActivityCalendar`) e gráficos (`src/components/charts`) | `src/app/(app)/dashboard/page.tsx` |
| Checklists | `ChecklistItem`, `ChecklistTemplate`, `ChecklistGeralItem` — implementado, mas por objeto (não um checklist genérico por `objeto_tipo/objeto_id` como no plano) | `prisma/schema.prisma` |
| Chat/RAG | `src/lib/chat-tools.ts`, `rag.ts`, `gemini.ts`, `nvidia.ts`, `knowledge-sync.ts` — funcionalidade de assistente/IA não prevista em nenhuma sprint do plano | `src/components/chatbot`, `src/lib` |
| Tema visual | **Claro `#EEF4ED`** (D1/D16), sidebar/header `#1F2C43`, cards sólidos brancos sem blur de vidro. Revertido do tema escuro de vidro fosco (commits `30b208b`, `e92a3e8`) na S14; botão temporário de alternância (`6ab9996`) removido | `src/app/globals.css`, S14 (2026-07-22) |

## Lacunas em relação ao `PLANO-DE-SPRINTS.md` (verificadas por busca no código, não presumidas)

| # | O que falta | Onde deveria estar | Sprint dona |
|---|---|---|---|
| ~~1~~ | ~~Vínculo polimórfico único~~ — **aplicado em produção na S1** (`model Vinculo` em `schema.prisma`, `src/lib/vinculos.ts`, migration aplicada em 2026-07-22) | S1 | S1 |
| ~~2~~ | ~~View/fonte única `prazo_unificado`~~ — **aplicada em produção na S1** (`CREATE OR REPLACE VIEW` na migration, consumível via `GET /api/prazos`) | S1 | S1 |
| ~~3~~ | ~~Página `/design-system` não existe~~ — **criada na S2**, fora do grupo `(app)` (sem depender de login/banco) | S2 | S2 |
| ~~4~~ | ~~Tela "Configurações" com CRUD de catálogos~~ — **criada na S3** (`/configuracoes`), com cor/ordem/arquivamento | S3 | S3 |
| ~~5~~ | ~~Calendário posicionado à esquerda (contrariava D2) e não consumia `prazo_unificado`~~ — **resolvido na S7**: calendário movido para a direita (indicadores à esquerda/centro), consumidor exclusivo de `prazo_unificado` via `/api/prazos`, com filtros próprios (`src/lib/prazo-filters.ts`). Continua embutido no Dashboard (não uma rota `/calendario` própria) — decisão justificada em `STATUS.md`/plano da S7: Cap. 2.4 da spec diz explicitamente que a hierarquia lógica "não determina a forma como as telas serão exibidas", e o Cap. 4 (mais detalhado) descreve o calendário como área do Dashboard | S7 | S7 |
| ~~6~~ | ~~Motor de filtros único~~ — **criado na S1** em `src/lib/filters/` (`engine.ts`, `prazo.ts`, `types.ts`, `querystring.ts`); `activity-filters.ts`/`execucao-filters.ts` viraram wrappers finos sobre ele, sem quebrar nenhum dos 8 consumidores existentes | S1, Regra 03 | S1 |

## Pendências encontradas

Coisas notadas durante uma sprint que estavam fora do escopo dela. Não corrigir na hora — registrar aqui e tratar na sprint certa.

| # | O que | Onde | Sprint que deve resolver |
|---|---|---|---|
| 1 | Não existem scripts `test`, `typecheck`, `db:migrate` no `package.json` — a "Definition of done" do `CLAUDE.md` não é totalmente verificável hoje. `db:seed` foi adicionado na S1 | `package.json` | Antes de fechar qualquer sprint pelo ritual formal |
| 2 | Migration da S1 aplicada em produção (2026-07-22, deploy `11e20216`), mas o `npm run db:seed` nunca rodou contra produção (de propósito — evitar poluir dados reais) — os critérios de aceite que dependem de dados seedados continuam sem verificação executada | `prisma/seed.ts` | Fechamento da S1, via ambiente separado ou seed local contra um banco de teste |
| 3 | `Registro.atividadeId`/`Planilha.atividadeId` continuam no schema, marcados `@deprecated`, não mais escritos pelo app — `DROP COLUMN` fica para uma sprint futura de limpeza, depois de confirmar em produção que não sobrou leitura órfã | `prisma/schema.prisma` | Sprint de limpeza técnica, pós-S1 |
| ~~4~~ | ~~Soft-delete de `Atividade` era código morto~~ — **corrigido em 2026-07-22**, fora do ritual de sprint (fechamento de pendência da S5): `DELETE /api/atividades/[id]` agora faz soft-delete por padrão, `?permanent=1` para hard delete; `GET /api/atividades?trash=1` para listar a lixeira. Verificação funcional real (excluir → lixeira → restaurar → excluir definitivo) não foi possível — mesmo bloqueio de acesso ao banco de produção de todas as sprints anteriores; confiança vem de build + revisão de código + espelhamento exato do padrão já em produção para `Registro`/`Planilha` | `src/app/api/atividades/[id]/route.ts`, `src/app/api/atividades/route.ts` | Resolvido |
| 5 | Telas autenticadas (Dashboard, Atividades, Registros, Planilhas) não foram verificadas visualmente após a S14 — banco fora do ar impediu login. Re-testar no browser quando o banco voltar | Todas as telas de `(app)` | Junto com o fechamento da S1 |
| 6 | D6 menciona Categoria/Área/Projeto/Processo como "catálogos opcionais recolhidos" no cadastro de Atividade — não existem em nenhum lugar do código hoje. Não construí isso na S4 sem saber o que cada catálogo representa de fato (chutar a estrutura seria pior que não ter) | `docs/DECISOES.md` D6, `activity-form.tsx` | Perguntar ao usuário antes de qualquer sprint futura que dependa disso |
| 7 | Filtros "Tipo de produto/serviço" e "Produto/Serviço" do calendário (Cap. 4) não foram implementados na S7 — só se aplicam a linhas de origem "proposta" da `prazo_unificado`, que não carrega dados de `Proposta` hoje. Estender a view para isso é um corte de escopo consciente, não um esquecimento | `src/lib/prazo-filters.ts`, `prazo_unificado` | A decidir se vale a pena para um filtro de uso marginal no calendário |
| 8 | Catálogo de `StatusNegociacao` (`em_andamento`/`fup`/`aceite`/`na`) não bate com o catálogo da **D10** (fechada): "Em negociação, Aguardando aceite, Aceite, Recusada, Sem retorno". Achado ao implementar o 10º filtro do dashboard na S8 — não corrigido, é escopo de proposta/cadastro (S1/S4), não de Dashboard | `docs/DECISOES.md` D10, `src/lib/types.ts` | A decidir — exigiria migrar dados de propostas já cadastradas |
| 9 | Campos 4-6 do Dashboard (Propostas/Empresas/Visão Geral) continuam fora do motor de widgets criado na S8 — reavaliado na S9 e mantido assim de propósito (não é mais "pendência a resolver", é decisão registrada): "Visão Geral" tem posição fixa exigida pela spec, incompatível com um widget livremente reordenável sem inventar um conceito de "widget fixo" que a S9 não pediu | `src/components/atividades/dashboard-analytics.tsx` | Perguntar ao usuário se um "widget não reordenável" faz sentido, antes de tentar encaixar Campos 4-6 no motor |
| 10 | Coluna `busca` (tsvector, GIN index) em Atividade/AtividadeGeral/Registro/Planilha segue **sem nenhum consumidor** desde a S1 — a S11 implementou "busca full-text" como busca em memória (mesmo padrão de Atividades), não como consulta Postgres real. Se um dia o volume de dados tornar o filtro em memória lento, a coluna já existe pronta para uma rota dedicada | `prisma/schema.prisma` (campo `busca`) | Só se o filtro em memória virar gargalo de performance |
| ~~11~~ | ~~UI de "Registro vinculado" no editor de Planilha não existe~~ — **corrigido na S13**: `planilha-editor.tsx` ganhou os blocos "Execução vinculada" e "Registro vinculado" (o vínculo com Execução também estava faltando, não só o de Registro), mesmo padrão de `registro-editor.tsx` | `src/components/planilhas/planilha-editor.tsx` | Resolvido |

## Dívidas assumidas

Simplificações conscientes, com o motivo e quando serão pagas.

| # | O que foi simplificado | Motivo | Quando resolver |
|---|---|---|---|
| 1 | Produto evoluiu por commits diretos em vez do ritual de sprints do `PLANO-DE-SPRINTS.md` | Plano de sprints foi escrito depois que boa parte do código já existia | Não retroagir — sprints futuras (S14+) passam a seguir o ritual formal |
| ~~2~~ | ~~"Execuções" da spec foi implementado como `AtividadeGeral`, não como `Execucao`/`ExecucaoItem`~~ — **confirmado com o usuário em 2026-07-23**: é o mesmo conceito, mantido `AtividadeGeral` (sem renomear, sem migration). Ver `ERRATA-SPEC.md` #4 | Decisão de nomenclatura tomada fora do processo de sprint, sem registro em `DECISOES.md` | Resolvido — S10 completa o que falta em cima do modelo existente |
