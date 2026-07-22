# Status

Atualizado ao final de cada sprint. Fonte da verdade sobre o que existe de fato.

> **Nota (2026-07-22):** o histórico de commits mostra que o produto foi construído **antes** de `docs/PLANO-DE-SPRINTS.md` existir, por uma linha de desenvolvimento própria ("Parte 6", "Parte 7", "sprints de ajustes do documento" etc.), não pelo ritual S0→S13 descrito no plano. Nenhuma sprint do plano foi formalmente aberta, rodou checklist de aceite ou fechou por este processo. Por isso a tabela "Entregue" abaixo fica vazia — ela mede fechamento por processo, não existência de código — e o estado real do sistema está descrito em **"Inventário técnico atual"**.

## Sprint em execução

**S1 — Modelo de dados e motor de filtros.** Código completo e no repositório (schema, migration, `src/lib/vinculos.ts`, `src/lib/filters/`, rotas de API, UI de vínculo multi-select, seed). `typecheck`, `lint` (exceto o erro pré-existente descrito abaixo) e `build` passam.

**Não fecha ainda** porque nem este agente nem a máquina do usuário alcançam o banco Postgres (Railway, `hayabusa.proxy.rlwy.net:29829`) — `npx prisma migrate dev` falha com `P1001: Can't reach database server` nos dois ambientes. Diagnóstico feito em 2026-07-22: `Test-NetConnection -ComputerName hayabusa.proxy.rlwy.net -Port 29829` na rede do usuário resolve o DNS e o `ping` funciona (`PingSucceeded: True`, 136ms), mas `TcpTestSucceeded: False` — a porta recusa conexão. Como isso falha em duas redes diferentes, a causa mais provável é o **serviço Postgres do Railway parado/dormindo ou com host:porta rotacionados num redeploy**, não firewall local. Requer checar o painel do Railway (não verificado ainda). Por isso:
- A migration foi **escrita manualmente** (não gerada por `prisma migrate dev --create-only`, que exigiria conectividade) e **nunca foi aplicada** a nenhum banco.
- O seed (`npm run db:seed`) **nunca foi executado**.
- Nenhum critério de aceite da S1 foi verificado *executando* — só por leitura de código e `tsc`/`build`. Isso viola a regra "não marque item de aceite sem ter verificado de fato" do `CLAUDE.md`, então a sprint fica formalmente **aberta** até alguém com acesso ao banco rodar:
  1. `npx prisma migrate dev` (aplica `prisma/migrations/20260722120000_add_vinculo_and_prazo_unificado/migration.sql`)
  2. `npm run db:seed`
  3. Os 6 critérios de aceite da S1 (tabela em `PLANO-DE-SPRINTS.md`), com evidência de cada um

## Entregue (via ritual de sprint, com checklist de aceite verificado)

| Sprint | Nome | Fechada em | Tag |
|---|---|---|---|
| S14 | Conformação visual — reverter tema escuro para claro (D16) | 2026-07-22 | — |

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
| ~~1~~ | ~~Vínculo polimórfico único~~ — **código escrito na S1** (`model Vinculo` em `schema.prisma`, `src/lib/vinculos.ts`), mas nunca aplicado a um banco real (ver "Sprint em execução") | S1 | S1 |
| ~~2~~ | ~~View/fonte única `prazo_unificado`~~ — **código escrito na S1** (`CREATE VIEW` na migration, consumível via `GET /api/prazos`), mesma ressalva de aplicação pendente | S1 | S1 |
| 3 | Página `/design-system` não existe | S2 | S2 |
| 4 | Tela "Configurações" com CRUD de catálogos (empresa, unidade, tipo_atividade, status, prioridade etc., com cor/ordem/ativo) não existe — `/usuarios` é gestão de contas, não catálogo | S3 | S3 |
| 5 | Calendário não é uma rota própria com filtros independentes — está embutido no Dashboard, e posicionado **à esquerda** (comentário `page.tsx:101`), o que já contraria a recomendação D2 (direita). Continua assim de propósito nesta sprint: o rewire do Calendário/Dashboard para consumir `prazo_unificado`/o motor de filtros novo é escopo de S7/S8, não de S1 | S7 | S7 |
| ~~6~~ | ~~Motor de filtros único~~ — **criado na S1** em `src/lib/filters/` (`engine.ts`, `prazo.ts`, `types.ts`, `querystring.ts`); `activity-filters.ts`/`execucao-filters.ts` viraram wrappers finos sobre ele, sem quebrar nenhum dos 8 consumidores existentes | S1, Regra 03 | S1 |

## Pendências encontradas

Coisas notadas durante uma sprint que estavam fora do escopo dela. Não corrigir na hora — registrar aqui e tratar na sprint certa.

| # | O que | Onde | Sprint que deve resolver |
|---|---|---|---|
| 1 | Não existem scripts `test`, `typecheck`, `db:migrate` no `package.json` — a "Definition of done" do `CLAUDE.md` não é totalmente verificável hoje. `db:seed` foi adicionado na S1 | `package.json` | Antes de fechar qualquer sprint pelo ritual formal |
| 2 | Migration da S1 nunca foi aplicada a um banco real (sem conectividade neste ambiente — confirmado também da rede do usuário, ver detalhe abaixo) — precisa rodar `npx prisma migrate dev` e confirmar que o backfill de `Vinculo` bateu com os `atividadeId` legados existentes em produção | `prisma/migrations/20260722120000_add_vinculo_and_prazo_unificado/` | Fechamento da S1 |
| 3 | `Registro.atividadeId`/`Planilha.atividadeId` continuam no schema, marcados `@deprecated`, não mais escritos pelo app — `DROP COLUMN` fica para uma sprint futura de limpeza, depois de confirmar em produção que não sobrou leitura órfã | `prisma/schema.prisma` | Sprint de limpeza técnica, pós-S1 |
| 4 | Soft-delete de `Atividade` é código morto (`deletedAt` existe no schema, mas `DELETE /api/atividades/[id]` sempre faz hard delete) — não corrigido na S1, só documentado | `src/app/api/atividades/[id]/route.ts` | A decidir — registrado em `ERRATA-SPEC.md` |
| 5 | Telas autenticadas (Dashboard, Atividades, Registros, Planilhas) não foram verificadas visualmente após a S14 — banco fora do ar impediu login. Re-testar no browser quando o banco voltar | Todas as telas de `(app)` | Junto com o fechamento da S1 |

## Dívidas assumidas

Simplificações conscientes, com o motivo e quando serão pagas.

| # | O que foi simplificado | Motivo | Quando resolver |
|---|---|---|---|
| 1 | Produto evoluiu por commits diretos em vez do ritual de sprints do `PLANO-DE-SPRINTS.md` | Plano de sprints foi escrito depois que boa parte do código já existia | Não retroagir — sprints futuras (S14+) passam a seguir o ritual formal |
| 2 | "Execuções" da spec foi implementado como `AtividadeGeral`, não como `Execucao`/`ExecucaoItem` | Decisão de nomenclatura tomada fora do processo de sprint, sem registro em `DECISOES.md` | Confirmar se é o mesmo conceito antes de abrir S10 |
