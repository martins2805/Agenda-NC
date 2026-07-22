# Decisões

Precedência máxima. Quando este arquivo contradisser `docs/spec/`, este arquivo vence.

Formato: cada decisão fica com status `PROPOSTA` até eu escrever `FECHADA`. Nenhuma sprint pode ser executada com uma decisão `PROPOSTA` que a bloqueie.

---

## D1 — Cor de fundo do sistema
**Conflito:** `docs/spec/03` define fundo `#EEF4ED` (claro e quente). `docs/spec/06` define fundo `#1F2C43` (escuro).
**Proposta:** fundo do app `#EEF4ED`; `#1F2C43` aplicado à barra lateral e ao header.
**Bloqueia:** S2
**Status:** FECHADA (2026-07-20)

## D2 — Posição do calendário no dashboard
**Conflito:** `docs/spec/04` diz lado direito. `docs/spec/06` diz lado esquerdo.
**Proposta:** coluna fixa à direita; indicadores e gráficos ocupam esquerda e centro.
**Bloqueia:** S8
**Status:** FECHADA (2026-07-20)

## D3 — Numeração das áreas do dashboard
**Conflito:** a lista de "Estrutura Geral" e os títulos das seções seguintes invertem Área 2 e Área 3.
**Proposta:** Área 1 = cabeçalho, Área 2 = indicadores e gráficos, Área 3 = calendário.
**Bloqueia:** S8
**Status:** FECHADA (2026-07-20)

## D4 — Campos obrigatórios no cadastro de atividade
**Conflito:** "Nenhum campo será de preenchimento obrigatório" contra quatro campos marcados como "Obrigatório".
**Proposta:** nenhum campo obrigatório. Defaults automáticos: Status = Pendente, Prioridade = Médio, título derivado de Empresa + Tipo quando vazio.
**Bloqueia:** S1, S4
**Status:** FECHADA (2026-07-20)

## D5 — Tipo de atividade é multi-seleção
**Lacuna:** a spec diz "selecionar cada uma ou mais de uma delas", mas trata tipo como campo único no restante.
**Proposta:** multi-seleção, relação N:N. Blocos condicionais somam: Proposta + E-mail abre os dois blocos.
**Bloqueia:** S1 — **altera o schema**
**Status:** FECHADA (2026-07-20)

## D6 — Lista canônica de campos da atividade
**Conflito:** duas listas divergentes de campos.
**Proposta:** lista única. Categoria, Área, Projeto e Processo entram como catálogos opcionais, recolhidos por padrão.
**Bloqueia:** S1, S4
**Status:** FECHADA (2026-07-20)

## D7 — Opções de status de conclusão
**Conflito:** cadastro lista 4 opções, os cards listam 5 (inclui "Em andamento").
**Proposta:** 5 opções — Pendente, Em andamento, Aguardando retorno interno, Aguardando retorno cliente, Concluído.
**Bloqueia:** S1
**Status:** FECHADA (2026-07-20)

## D8 — Mapa de cores semânticas
**Conflito:** "Pendente = #BF512C" na paleta secundária contra "Status = pendente: #780001" nas cores fixas.
**Proposta:** dois eixos independentes.
- **Prazo:** vencido `#780001`, a vencer `#BF512C`, em dia `#2E5749`
- **Status:** Pendente `#780001`, Em andamento `#8BAAAD`, Aguardando (interno e cliente) `#3E4C59`, Concluído `#2E5749`
- **Prioridade:** Urgente `#780001`, Importante `#BF512C`, Médio `#DA9B2B`, Baixo `#2E5749`
**Bloqueia:** S2
**Status:** FECHADA (2026-07-20)

## D9 — Escala de cores dos gráficos
**Lacuna:** `#FBF9E4` é usado nos gráficos mas não consta da paleta base; e não há regra para mais de 5 empresas.
**Proposta:** escala de 5 tons — `#1F2C43`, `#3E4C59`, `#8BAAAD`, `#D8D8D8`, `#FBF9E4` — ordenada por volume, do mais escuro ao mais claro. Da sexta categoria em diante, agrupar em "Outros".
**Bloqueia:** S2, S9
**Status:** FECHADA (2026-07-20)

## D10 — Opções de status de negociação
**Lacuna:** usado como filtro e como indicador ("Propostas Ganhas = Aceite"), mas as opções nunca foram definidas.
**Proposta:** catálogo configurável, seed com Em negociação, Aguardando aceite, Aceite, Recusada, Sem retorno.
**Bloqueia:** S1
**Status:** FECHADA (2026-07-20)

## D11 — Campos do bloco Proposta
**Lacuna:** a seção "Campos proposta" é citada na spec mas não existe.
**Proposta:** Produto/Serviço (múltiplos), Detalhe, Escopo, Amostragem, Tipo (MRR ou PS), Valor por item, total calculado automaticamente.
**Bloqueia:** S1, S4
**Status:** FECHADA (2026-07-20)

## D12 — Exclusão de item de catálogo
**Conflito:** "será excluída de tudo também" contra "arquivar sem exclusão definitiva".
**Proposta:** soft delete. O item some das listas de seleção e permanece nos registros que já o usam. Exclusão definitiva só com confirmação e apenas quando não houver uso.
**Bloqueia:** S1, S3 — **altera o schema**
**Status:** FECHADA (2026-07-20)

## D13 — Contadores de dias
**Conflito:** "contador de dias em pendência" e "dias em atraso" aparecem como se fossem a mesma coisa.
**Proposta:** dois contadores independentes — **dias em aberto** (criação até hoje, enquanto não concluída) e **dias em atraso** (prazo até hoje, quando vencida).
**Bloqueia:** S1, S5
**Status:** FECHADA (2026-07-20)

## D14 — Módulos sem especificação
**Lacuna:** Execuções, Registros, Planilhas e Configurações têm apenas um parágrafo cada.
**Proposta:** cada sprint desses módulos abre com uma mini-spec aprovada antes do código. Configurações é antecipada para a S3 em versão mínima (CRUD de catálogos).
**Bloqueia:** S10, S11, S12
**Status:** FECHADA (2026-07-20)

---

## Decisões de stack (fechar na S0)

Preenchida a partir do código já existente no repositório (não é uma escolha nova — é o registro do que já está em produção).

| Item | Escolha | Status |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript + React 19 | FECHADA (2026-07-20) |
| Banco | PostgreSQL (driver `pg`) | FECHADA (2026-07-20) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) | FECHADA (2026-07-20) |
| Estilo / componentes | Tailwind CSS 4 + shadcn/ui + Base UI (`@base-ui/react`) | FECHADA (2026-07-20) |
| Cache e estado | Server Actions + `app-data-context.tsx` (React Context), sem TanStack Query | FECHADA (2026-07-20) |
| Gráficos | Componentes internos (`src/components/charts`: bar-list, donut-chart, trend-line), sem Recharts | FECHADA (2026-07-20) |
| Armazenamento de anexos | Não implementado — **PROPOSTA em aberto**, decidir na S6 | PROPOSTA |
| Deploy | Não há config no repo (sem vercel.json/railway.json/Dockerfile) — **PROPOSTA em aberto**, perguntar ao usuário | PROPOSTA |
| Autenticação | NextAuth v5 + bcryptjs, multiusuário (Role ADMIN/USER, `userId` em todas as tabelas) — ver **D15** | FECHADA (2026-07-20) |

---

## D15 — Usuário único (spec) vs. multiusuário (código)
**Conflito:** a descrição do projeto ("Usuário único, desktop first") e o `CLAUDE.md` original partem de um usuário único. O código já implementado tem autenticação NextAuth completa, `Role` (ADMIN/USER) e `userId` em todas as tabelas de negócio — ou seja, já é multiusuário de fato.
**Decisão:** manter multiusuário. É o que está em produção e funcionando; a spec original é que fica desatualizada.
**Bloqueia:** afeta a redação de toda a spec que assume usuário único (isolamento de dados, permissões, telas de Configurações/Usuários) — atualizar `docs/spec/` e `ERRATA-SPEC.md` para refletir
**Status:** FECHADA (2026-07-22)

## D16 — Fundo claro (spec/D1/PROMPT 1) vs. tema escuro de vidro fosco (código)
**Conflito:** `docs/spec/03` e a decisão **D1** definem fundo `#EEF4ED` (claro e quente), com `#1F2C43` restrito à barra lateral e ao header. O preâmbulo `LAYOUT` do PROMPT 1 reforça essa mesma leitura ("reduzir fadiga visual", "baixo contraste"). Os commits `30b208b` e `e92a3e8` aplicaram um tema escuro de vidro fosco em todas as telas, contrariando D1; o commit `6ab9996` adicionou um botão temporário para alternar entre os dois layouts.
**Decisão:** reverter para o tema claro. D1 permanece como estava: fundo do app `#EEF4ED`; `#1F2C43` só em sidebar/header.
**Bloqueia:** S14 (conformação visual retroativa) — reverter o tema escuro global e remover o botão temporário de alternância (`6ab9996`)
**Status:** FECHADA (2026-07-22)
