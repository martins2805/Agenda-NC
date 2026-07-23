@AGENTS.md

# Gestão Júlia

Workspace de gestão de atividades, prazos, registros e propostas.

> **Nota de auditoria (2026-07-20):** a spec original descreve "usuário único, desktop first", mas o código já implementa autenticação multiusuário (NextAuth + `Role` ADMIN/USER, todas as tabelas com `userId`). Isso não está registrado em nenhuma decisão — ver auditoria em `docs/STATUS.md`.

## Onde está a verdade

| Arquivo | O que é |
|---|---|
| `docs/DECISOES.md` | Decisões fechadas. **Precedência máxima** |
| `docs/spec/` | Especificação oficial, dividida por capítulo |
| `docs/PLANO-DE-SPRINTS.md` | Escopo, critérios de aceite e ordem das sprints |
| `docs/STATUS.md` | O que já foi entregue |
| `docs/ERRATA-SPEC.md` | Onde o código diverge da spec, e por quê |
| `docs/referencias-layout/` | Prints de referência visual |

**Ordem de precedência em caso de conflito:** DECISOES.md → docs/spec/ → código existente → sua sugestão.

Se dois trechos da spec se contradisserem e o caso não estiver em `DECISOES.md`: **pare e pergunte.** Não escolha por conta própria e não invente um meio-termo.

## Stack

<!-- Registrado em docs/DECISOES.md — refletir aqui a mesma stack, não duplicar decisão -->

- Framework: Next.js 16 (App Router) + TypeScript + React 19
- Banco: PostgreSQL (driver `pg`)
- ORM: Prisma 7 (`@prisma/adapter-pg`)
- Estilo: Tailwind CSS 4 + shadcn/ui + Base UI (`@base-ui/react`)
- Estado/cache: Server Actions + `app-data-context.tsx` (React Context), sem TanStack Query
- Gráficos: componentes internos (`src/components/charts`) — bar-list, donut-chart, trend-line
- Armazenamento de anexos: volume do Railway (disco persistente) — metadado em `Anexo` (Postgres), binário em disco via `UPLOAD_DIR` (`src/lib/anexos.ts`, S6)
- Deploy: não há config de deploy no repo (sem `vercel.json`/`railway.json`/Dockerfile) — perguntar ao usuário
- Autenticação: NextAuth v5 + bcryptjs, multiusuário (ver nota acima)

## Comandos

<!-- Só o que existe de fato em package.json — typecheck, test, db:migrate e db:seed NÃO existem como scripts hoje -->

```bash
npm run dev
npm run build
npm run lint
npx prisma migrate dev      # não há script npm dedicado
npx tsc --noEmit            # não há script "typecheck"
```

**Lacuna:** não existe script `test`, `typecheck`, `db:migrate` nem `db:seed`, nem seed configurado no Prisma. A "Definition of done" abaixo exige typecheck e testes passando — isso hoje não é verificável até esses scripts existirem.

## Regras invioláveis

1. **Escopo travado.** Só mexa no que a sprint atual pede. Nada de refatorar de passagem, renomear "para ficar melhor" ou reorganizar pastas por conta própria.
2. **Zero valor visual hardcoded.** Nenhuma cor, raio, sombra, espaçamento ou tamanho de fonte fora dos tokens. Se falta um token, proponha adicionar — não escreva o hex.
3. **Um motor de filtros.** Toda filtragem passa por `src/lib/filters`. Nenhuma tela monta query própria. A mesma função gera contagem e listagem.
4. **Uma fonte de prazos.** Todo prazo é lido de `prazo_unificado`. Nenhuma tela consulta datas direto nas tabelas.
5. **Um modelo de vínculo.** Relações entre objetos usam a tabela `vinculo` polimórfica. Nunca crie tabela de vínculo por par de tipos.
6. **Nenhum campo obrigatório** no cadastro de atividade. Use defaults automáticos.
7. **Nenhum campo esconde texto.** Campos crescem com o conteúdo. Sem truncamento silencioso.
8. **Catálogo não se apaga.** Remoção é soft delete: some das listas de seleção, permanece nos registros antigos.
9. **Componente novo só se não existir equivalente** no design system. Reutilizar vem antes de criar.
10. **Sem botão "Atualizar".** A tela reflete a mudança por invalidação de cache.
11. **Sem mock silencioso.** Se faltar dado ou decisão, diga explicitamente. Não preencha com placeholder e siga adiante.

## Definition of done

Uma sprint só fecha quando:

- [ ] `typecheck`, `lint`, `build` e testes passam
- [ ] Todos os itens do checklist de aceite da sprint foram verificados **executando**, não por presunção
- [ ] `/design-system` continua idêntico
- [ ] Telas de sprints anteriores continuam funcionando
- [ ] `docs/STATUS.md` atualizado

## Não faça

- Não rode migration destrutiva sem avisar antes
- Não instale dependência nova sem justificar em uma linha
- Não crie arquivos de documentação novos sem eu pedir
- Não marque item de aceite sem ter verificado de fato
- Não comece a próxima sprint com aceite pendente na anterior
