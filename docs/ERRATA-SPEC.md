# Errata da especificação

Pontos em que o sistema construído diverge de `docs/spec/`, por decisão consciente.
Toda linha aqui aponta para a decisão que a justifica.

| # | Trecho da spec | O que foi feito no lugar | Decisão |
|---|---|---|---|
| 1 | "Usuário único, desktop first" (visão geral do projeto) | Multiusuário: NextAuth v5 + bcryptjs, `Role` (ADMIN/USER), `userId` em todas as tabelas de negócio | D15 |
| 2 | ~~Regra 08 do `CLAUDE.md` ("remoção é soft delete") — `Atividade` tinha `deletedAt` no schema, mas `DELETE /api/atividades/[id]` sempre fazia hard delete~~ — **corrigido em 2026-07-22**. `Atividade` agora segue o mesmo padrão de `Registro`/`Planilha`: `DELETE` sem parâmetro faz soft-delete (`deletedAt`), `?permanent=1` faz hard delete (limpando vínculos na mesma transação via `deleteVinculosDe`) | Encontrado durante a S1 ao desenhar o cascade de `Vinculo`. Resolvido ao fechar a pendência de aceite da S5 ("Arquivar") | resolvido — ver `STATUS.md` |
| 3 | Regra 05 do `CLAUDE.md` ("um modelo de vínculo... vínculo polimórfico") | `Registro.atividadeId`/`Planilha.atividadeId` (FK direta single-valued) foram o modelo até a S1. Substituídos por `model Vinculo` polimórfico; as colunas antigas ficam no schema como legado `@deprecated`, não escritas pelo app, até uma sprint de limpeza confirmar que não sobra leitura órfã e fazer o `DROP COLUMN` | S1 |

## Remoções feitas na organização da spec

- A seção "PROMPT 1 – Dash" do documento original repetia integralmente os capítulos de UX/UI e Dashboard. Foi removida para evitar duas fontes da verdade sobre o mesmo assunto. O único conteúdo novo que ela trazia — o indicador "Propostas Ganhas" — foi incorporado como adendo em `docs/spec/04-dashboard.md`.
- As 16 imagens em base64 do documento original eram 8 imagens únicas duplicadas. Foram extraídas para `docs/referencias-layout/` e referenciadas por caminho relativo.
