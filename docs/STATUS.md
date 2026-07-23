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
| 5 | Calendário não é uma rota própria com filtros independentes — está embutido no Dashboard, e posicionado **à esquerda** (comentário `page.tsx:101`), o que já contraria a recomendação D2 (direita). Continua assim de propósito nesta sprint: o rewire do Calendário/Dashboard para consumir `prazo_unificado`/o motor de filtros novo é escopo de S7/S8, não de S1 | S7 | S7 |
| ~~6~~ | ~~Motor de filtros único~~ — **criado na S1** em `src/lib/filters/` (`engine.ts`, `prazo.ts`, `types.ts`, `querystring.ts`); `activity-filters.ts`/`execucao-filters.ts` viraram wrappers finos sobre ele, sem quebrar nenhum dos 8 consumidores existentes | S1, Regra 03 | S1 |

## Pendências encontradas

Coisas notadas durante uma sprint que estavam fora do escopo dela. Não corrigir na hora — registrar aqui e tratar na sprint certa.

| # | O que | Onde | Sprint que deve resolver |
|---|---|---|---|
| 1 | Não existem scripts `test`, `typecheck`, `db:migrate` no `package.json` — a "Definition of done" do `CLAUDE.md` não é totalmente verificável hoje. `db:seed` foi adicionado na S1 | `package.json` | Antes de fechar qualquer sprint pelo ritual formal |
| 2 | Migration da S1 aplicada em produção (2026-07-22, deploy `11e20216`), mas o `npm run db:seed` nunca rodou contra produção (de propósito — evitar poluir dados reais) — os critérios de aceite que dependem de dados seedados continuam sem verificação executada | `prisma/seed.ts` | Fechamento da S1, via ambiente separado ou seed local contra um banco de teste |
| 3 | `Registro.atividadeId`/`Planilha.atividadeId` continuam no schema, marcados `@deprecated`, não mais escritos pelo app — `DROP COLUMN` fica para uma sprint futura de limpeza, depois de confirmar em produção que não sobrou leitura órfã | `prisma/schema.prisma` | Sprint de limpeza técnica, pós-S1 |
| 4 | Soft-delete de `Atividade` é código morto (`deletedAt` existe no schema, mas `DELETE /api/atividades/[id]` sempre faz hard delete) — não corrigido na S1, só documentado | `src/app/api/atividades/[id]/route.ts` | A decidir — registrado em `ERRATA-SPEC.md` |
| 5 | Telas autenticadas (Dashboard, Atividades, Registros, Planilhas) não foram verificadas visualmente após a S14 — banco fora do ar impediu login. Re-testar no browser quando o banco voltar | Todas as telas de `(app)` | Junto com o fechamento da S1 |

## Dívidas assumidas

Simplificações conscientes, com o motivo e quando serão pagas.

| # | O que foi simplificado | Motivo | Quando resolver |
|---|---|---|---|
| 1 | Produto evoluiu por commits diretos em vez do ritual de sprints do `PLANO-DE-SPRINTS.md` | Plano de sprints foi escrito depois que boa parte do código já existia | Não retroagir — sprints futuras (S14+) passam a seguir o ritual formal |
| 2 | "Execuções" da spec foi implementado como `AtividadeGeral`, não como `Execucao`/`ExecucaoItem` | Decisão de nomenclatura tomada fora do processo de sprint, sem registro em `DECISOES.md` | Confirmar se é o mesmo conceito antes de abrir S10 |
