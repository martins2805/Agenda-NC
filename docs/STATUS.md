# Status

Atualizado ao final de cada sprint. Fonte da verdade sobre o que existe de fato.

> **Nota (2026-07-22):** o histórico de commits mostra que o produto foi construído **antes** de `docs/PLANO-DE-SPRINTS.md` existir, por uma linha de desenvolvimento própria ("Parte 6", "Parte 7", "sprints de ajustes do documento" etc.), não pelo ritual S0→S13 descrito no plano. Nenhuma sprint do plano foi formalmente aberta, rodou checklist de aceite ou fechou por este processo. Por isso a tabela "Entregue" abaixo fica vazia — ela mede fechamento por processo, não existência de código — e o estado real do sistema está descrito em **"Inventário técnico atual"**.

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
| S14 | Conformação visual — reverter tema escuro para claro (D16) | 2026-07-22 | — |
| S2 | Design system | 2026-07-22 | — |
| S3 | Shell + Configurações v1 | 2026-07-23 | — |
| S4 | Atividades — cadastro | 2026-07-23 | — |
| S5 | Atividades — listagem | 2026-07-23 | — |
| S6 | Atividades — detalhe, vínculos e histórico | 2026-07-23 | — |
| S7 | Calendário | 2026-07-23 | — |
| S8 | Dashboard — motor de widgets, filtros globais e Campos 1-3 | 2026-07-23 | — |
| S9 | Dashboard — Propostas, Empresas e Visão Geral | 2026-07-23 | — |

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
- [x] `grep` por hex fora dos tokens = 0 — corrigidos hex hardcoded pré-existentes em `dashboard-analytics.tsx`, `dashboard/page.tsx` e `status-colors.ts` (mapas mortos `STATUS_HEX`/`PRIORIDADE_HEX`/`STATUS_NEGOCIACAO_HEX`, sem consumidor, removidos). Único hex fora de `globals.css` que sobrevive de propósito: `rich-text-editor.tsx` — paleta de cores do editor de texto rico, gravada como `style="color:#..."` dentro do HTML persistido do usuário, não é chrome de UI
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
| Atividades gerais | Rota `/atividades-gerais` — parece cobrir o papel de "Execuções" do plano, mas sob outro nome/modelo (`AtividadeGeral`, não `Execucao`/`ExecucaoItem`) | `prisma/schema.prisma`, `src/lib/execucao-filters.ts` |
| Registros | Rota `/registros`, modelos `Registro` + `RegistroTab` | `src/app/(app)/registros` |
| Planilhas | Rota `/planilhas`, modelo `Planilha` | `src/app/(app)/planilhas` |
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

## Dívidas assumidas

Simplificações conscientes, com o motivo e quando serão pagas.

| # | O que foi simplificado | Motivo | Quando resolver |
|---|---|---|---|
| 1 | Produto evoluiu por commits diretos em vez do ritual de sprints do `PLANO-DE-SPRINTS.md` | Plano de sprints foi escrito depois que boa parte do código já existia | Não retroagir — sprints futuras (S14+) passam a seguir o ritual formal |
| 2 | "Execuções" da spec foi implementado como `AtividadeGeral`, não como `Execucao`/`ExecucaoItem` | Decisão de nomenclatura tomada fora do processo de sprint, sem registro em `DECISOES.md` | Confirmar se é o mesmo conceito antes de abrir S10 |
