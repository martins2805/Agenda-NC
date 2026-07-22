# Plano de Sprints — Sistema Gestão Júlia

Derivado da especificação `GESTÃO_JÚLIA_(IA).md` (Cap. 1 Visão Geral, Cap. 2 Arquitetura, Cap. 3 UX/UI, Cap. 4 Dashboard, Cap. 5 Atividades, Guia 5 e Prompt 1).

**Regra de operação:** uma sprint por vez. Nenhuma sprint começa com critério de aceite pendente na anterior.

---

## 1. Como executar cada sprint

| Etapa | O que fazer |
|---|---|
| 1 | Abrir branch `sprint-XX-<nome>` |
| 2 | Colar o *Prompt de Execução* (seção 8) preenchido com o escopo da sprint |
| 3 | Executar |
| 4 | Rodar o **checklist de aceite** da sprint (esta é a trava) |
| 5 | Rodar o **checklist de regressão**: abrir `/design-system` + todas as telas já entregues e confirmar que nada mudou |
| 6 | Merge, tag `vX.Y`, atualizar `STATUS.md` |

Três arquivos vivem no repositório desde a Sprint 0 e são atualizados a cada sprint:

- `DECISOES.md` — log numerado de decisões (D1, D2, …). Nada é decidido no chat e esquecido.
- `STATUS.md` — o que está pronto, o que está em execução, o que ficou pendente.
- `ERRATA-SPEC.md` — pontos em que o código diverge do documento original **por decisão consciente**, com o motivo.

---

## 2. Decisões bloqueadoras (resolver ANTES de codar)

A especificação tem 16 pontos de conflito ou lacuna (D16 acrescentado pelo PROMPT 1; D15 já existia — usuário único × multiusuário). Cada um custa retrabalho se for descoberto no meio da implementação. Recomendação minha em cada linha — responder "ok" ou corrigir.

| # | Conflito / lacuna | Onde aparece | Recomendação | Bloqueia |
|---|---|---|---|---|
| **D1** | Fundo do sistema: `#EEF4ED` (claro) **vs** `#1F2C43` (escuro) | Cap. 3 "Fundo do Sistema" vs Guia 5 "GERAL" | Fundo do app `#EEF4ED`; `#1F2C43` só na barra lateral e no header. Concilia os dois e mantém "baixo contraste / conforto visual" do Cap. 3 | S2 |
| **D2** | Calendário à **direita** vs à **esquerda** | Cap. 4 "Layout e posicionamento" vs Guia 5 | Direita, coluna fixa. Os campos de dados ocupam esquerda e centro em todo o Cap. 4 | S8 |
| **D3** | Numeração das áreas do dashboard invertida | Cap. 4 "Estrutura Geral" vs títulos seguintes | Área 1 = cabeçalho; Área 2 = indicadores e gráficos; Área 3 = calendário | S8 |
| **D4** | "Nenhum campo será obrigatório" **vs** 4 campos marcados "Obrigatório" | Cap. 5 "Cadastro" vs 5.9/5.10 | Nada obrigatório. Defaults automáticos: Status = Pendente, Prioridade = Médio, título derivado de Empresa + Tipo quando vazio | S1, S4 |
| **D5** | Tipo de atividade é **multi-seleção**? ("selecionar cada uma ou mais de uma delas") | Cap. 5, campo 4 | Sim → relação N:N. Selecionar Proposta + E-mail abre os dois blocos condicionais. **Muda o schema** | S1 |
| **D6** | Duas listas de campos divergentes para Atividade | Cap. 5 "Campos do Cadastro" (1–11) vs 5.9–5.12 | Lista única canônica. Categoria, Área, Projeto e Processo entram como catálogos opcionais recolhidos | S1, S4 |
| **D7** | Status de conclusão: 4 opções no cadastro, 5 nos cards ("Em andamento") | Cap. 5, campo 8 vs card item 7 | 5 opções: Pendente, Em andamento, Aguardando retorno interno, Aguardando retorno cliente, Concluído | S1 |
| **D8** | Cores semânticas conflitantes: Pendente = `#BF512C` (paleta secundária) **vs** `#780001` (cores fixas) | Cap. 3 vs Cap. 4 | Dois eixos separados. **Prazo:** vencido `#780001`, a vencer `#BF512C`, em dia `#2E5749`. **Status/Prioridade:** usar os mapas explícitos dos cards (Cap. 5, itens 7 e 8) como fonte da verdade | S2 |
| **D9** | `#FBF9E4` usado nos gráficos mas fora da paleta base; e o que fazer com mais de 5 empresas | Cap. 4, Campo 5 | Escala de gráfico com 5 tons (`#1F2C43`, `#3E4C59`, `#8BAAAD`, `#D8D8D8`, `#FBF9E4`), ordenada por volume; da 6ª em diante agrupa em "Outros" | S2, S9 |
| **D10** | "Status de negociação" é filtro e vira indicador ("Propostas Ganhas = Aceite"), mas as opções nunca foram definidas | Cap. 4 e 5 | Catálogo configurável. Seed: Em negociação, Aguardando aceite, Aceite, Recusada, Sem retorno | S1 |
| **D11** | A seção "Campos proposta" é citada mas não existe no documento | Cap. 5, campo 4.3 | Fechar agora: Produto/Serviço (múltiplos), Detalhe, Escopo, Amostragem, Tipo (MRR \| PS), Valor por item + total calculado | S1, S4 |
| **D12** | Excluir um item de catálogo "será excluído de tudo também" — destrutivo, e conflita com "arquivar sem exclusão definitiva" | Cap. 5, campo 4 vs 5.21 | Soft delete: item some das listas de seleção mas continua nos registros antigos. Exclusão dura só com confirmação e sem uso | S1, S3 |
| **D13** | "Contador de dias em pendência" **vs** "Dias em atraso" | Cap. 5, campo 11 e cards | Dois contadores distintos: **dias em aberto** (criação → hoje, se não concluída) e **dias em atraso** (prazo → hoje, se vencida) | S1, S5 |
| **D14** | Execuções, Registros, Planilhas e Configurações têm só um parágrafo de especificação | Cap. 2.3 | Cada uma abre com uma mini-spec de 30 min antes do código (sprints S10–S12). Configurações é antecipada para S3 | S10+ |
| **D16** | Código atual está em **tema escuro de vidro fosco** (commits `30b208b`, `e92a3e8`) **vs** PROMPT 1 pede fundo **claro e quente `#EEF4ED`** ("reduzir fadiga", "baixo contraste") | PROMPT 1 "Fundo do Sistema" vs código em `main` | **FECHADA (2026-07-22): claro.** D1 confirmada como estava (app `#EEF4ED`; `#1F2C43` só em sidebar/header). S14 reverte o tema escuro global e remove o botão temporário de alternância (`6ab9996`) | S14 |

---

## 3. Stack recomendada

| Camada | Escolha | Por quê |
|---|---|---|
| Front | Next.js 15 (App Router) + TypeScript | Filtros na URL, drawer sem reload, deep-link entre módulos |
| Estilo | Tailwind + shadcn/ui | Componentes reutilizáveis e tokens centralizados = Regra 03 e 05 do Cap. 1 |
| Dados | PostgreSQL (Supabase) + Prisma | Vínculos N:N, busca full-text, filtros combinados |
| Cache | TanStack Query | "Atualização automática, sem botão Atualizar" (Cap. 4.8) sai de graça com invalidação |
| Gráficos | Recharts | Cobre todos os gráficos do Cap. 4 |
| Widgets | dnd-kit | Reordenar e ocultar widgets do dashboard |
| Anexos | Supabase Storage | Sem infra extra |
| Deploy | Railway ou Vercel | Railway se quiser tudo no mesmo lugar |
| Auth | Usuário único (e-mail + senha) | Mas **com `user_id` em todas as tabelas desde o dia 1** — Regra 07: nenhuma decisão pode limitar expansão |

**Por que não Streamlit:** a especificação exige drawer lateral, drag-and-drop de widgets, estados de hover, animações curtas e memória de preferência de visualização. Streamlit rerenderiza a página inteira a cada interação — entregaria exatamente a "cara de ERP" que o Cap. 3 proíbe.

---

## 4. Mapa das sprints

| Sprint | Nome | Entrega | Esforço |
|---|---|---|---|
| **S0** | Fundação e decisões | Decisões D1–D14 fechadas, repo, deploy vazio no ar | 0,5–1 dia |
| **S1** | Modelo de dados e motor de filtros | Schema completo, vínculos, prazos unificados, seed | 2–3 dias |
| **S2** | Design system | Tokens + 18 componentes + página `/design-system` | 1,5–2 dias |
| **S3** | Shell + Configurações v1 | Navegação e catálogos editáveis pelo usuário | 1 dia |
| **S4** | Atividades — cadastro | Formulário completo com blocos condicionais e checklist | 2 dias |
| **S5** | Atividades — listagem | Cards, lista, 12 filtros, ordenação, ações rápidas | 2 dias |
| **S6** | Atividades — detalhe e vínculos | Drawer lateral, vínculos N:N, anexos, histórico | 1,5–2 dias |
| **S7** | Calendário | Grid mensal + painel de prazos vinculados + filtros próprios | 2 dias |
| **S8** | Dashboard — motor + Campos 1–3 | Widgets configuráveis, filtros globais, deep-link | 2 dias |
| **S9** | Dashboard — Campos 4–6 | Propostas, Empresas/Produtos, Visão Geral | 1,5 dias |
| **S10** | Execuções | Mini-spec + itens/subitens + progresso | 2 dias |
| **S11** | Registros | Mini-spec + editor + busca | 2 dias |
| **S12** | Planilhas | Mini-spec + grid + vínculos | 2–3 dias |
| **S13** | Fechamento | Responsivo, busca global, backup, performance | 2 dias |
| **S14** | Conformação visual (PROMPT 1) | Refatoração retroativa do layout de todas as telas já construídas para a identidade "mobile-desktop", **sem tocar em função** | 1,5–2 dias |

**Total: 25,5 a 30 dias úteis de execução assistida.**

> **S14 é fora de ordem.** O preâmbulo `LAYOUT` do PROMPT 1 manda "antes de executar qualquer alteração, faça a refatoração exclusivamente visual". D1 e D16 já estão fechadas (claro), então a S14 está desbloqueada — só falta rodar, e na prática deve rodar antes de S8/S9 refinarem o dashboard. Mantida com número alto só para não renumerar o plano.

Ordem não é negociável em S1 → S2 → S3 → S4 → S5. Da S6 em diante há alguma folga, mas o calendário (S7) depende da fonte única de prazos criada na S1, e o dashboard (S8) depende do motor de filtros da S1 e das telas de destino da S5.

---

## 5. Detalhamento sprint a sprint

### S0 — Fundação e decisões congeladas

**Objetivo:** zerar a ambiguidade antes da primeira linha de código de produto.

**Escopo**
- Responder D1 a D14 e registrar em `DECISOES.md`
- Escrever `ERRATA-SPEC.md` com os pontos em que o código diverge do documento
- Criar repositório, ambiente local, banco vazio, `.env.example`
- Publicar um "hello world" na URL final (deploy funcionando antes de existir produto)
- Criar `STATUS.md` e o template de prompt de execução

**Fora do escopo:** qualquer tela, qualquer tabela de negócio.

**Aceite**
- [ ] D1–D14 respondidas e versionadas
- [ ] URL pública respondendo
- [ ] `.env.example` documentado
- [ ] `STATUS.md` e `ERRATA-SPEC.md` criados

**Armadilha:** começar a interface antes de fechar D5 e D12 — os dois alteram o schema.

---

### S1 — Modelo de dados, camada de acesso e motor de filtros

**Objetivo:** o coração do sistema. Se isso estiver certo, o resto é montagem. Se estiver errado, tudo é reescrito.

**Escopo**

*Objetos principais:* `atividade`, `execucao`, `execucao_item`, `registro`, `planilha`.

*Vínculo único e polimórfico:*
```
vinculo(origem_tipo, origem_id, destino_tipo, destino_id)
```
com unicidade e normalização de par. **Um registro vinculado a três atividades é uma linha por vínculo, nunca uma cópia** (Cap. 2.10 e 5.21).

*Catálogos configuráveis* — todos com `cor`, `ordem`, `ativo`: empresa, unidade (filha de empresa), tipo_atividade, status_conclusao, prioridade, produto_servico, tipo_produto (MRR/PS), status_negociacao, etiqueta, categoria, area.

*Tabelas de apoio:*
- `atividade_tipo` (N:N — decisão D5)
- `proposta_item` (produto_servico, detalhe, escopo, amostragem, tipo, valor)
- `checklist_item(objeto_tipo, objeto_id, titulo, concluido, prazo)` — checklist serve qualquer objeto, não só atividade
- `historico` (audit log) e coluna `arquivado_em` em todos os objetos
- `widget_preferencia`, `ui_preferencia`

*Fonte única de prazos* — a peça mais importante da sprint:
```
view prazo_unificado(
  objeto_tipo, objeto_id, origem_tipo, titulo, empresa, unidade,
  data, prioridade, status, tipo_prazo  -- 'atividade' | 'checklist'
)
```
Todo prazo do sistema — de atividade, de item de checklist, de execução, de registro, de planilha — sai daqui. É o que faz o calendário (S7) e os indicadores (S8) baterem sem duplicar lógica.

*Motor de filtros:* um único tipo TypeScript + parser de query string (`?empresa=1,2&status=3&prazo=vencido`) usado por Dashboard, Atividades e Calendário. **A mesma função gera a contagem e a lista** — é o que garante que o número do dashboard seja idêntico à tela de destino.

*Índices e busca:* índices para os 12 filtros + `tsvector`/`pg_trgm` para "busca por palavras-chave em todos os campos".

*Seed:* 40 a 50 atividades realistas, com propostas, checklists e prazos variados. Sem isso não dá para validar os gráficos da S9.

**Aceite**
- [ ] Criar atividade com 2 tipos e 3 itens de proposta via seed
- [ ] Vincular o mesmo registro a 2 atividades: aparece nas duas, existe uma vez só
- [ ] `prazo_unificado` retorna, na mesma consulta, prazo de atividade e prazo de item de checklist, corretamente etiquetados
- [ ] Arquivar um catálogo: some das listas de seleção, permanece nos registros antigos
- [ ] Filtro combinado de 4 campos responde em menos de 100 ms com 5.000 linhas
- [ ] Contagem e listagem do mesmo filtro batem exatamente

**Armadilha:** criar uma tabela de vínculo por par de tipos (`atividade_registro`, `atividade_planilha`, `execucao_registro`…). Vira uma explosão combinatória na primeira expansão de módulo. Um único `vinculo` polimórfico.

---

### S2 — Design system

**Objetivo:** nenhuma cor, raio ou sombra escrita à mão depois desta sprint.

**Escopo**
- Tokens: paleta base, semânticas (prazo, status, prioridade — decisão D8), escala de 5 tons para gráficos (D9), tipografia com hierarquia por tamanho/peso/espaçamento (não por cor), raio, sombra suave, escala de espaçamento
- Componentes: Botão (todas as variantes), Input, **Textarea auto-expansível**, Select e MultiSelect com typeahead, Etiqueta/Badge semântica, Card, Drawer, Modal, Tooltip, Tabs, Skeleton, EmptyState, Toast, ProgressBar, DatePicker, Sidebar, Header, Paginação
- Os 8 estados obrigatórios em todos: normal, hover, selecionado, focado, desabilitado, erro, sucesso, carregando
- Página `/design-system` exibindo tudo — passa a ser o teste de regressão visual de todas as sprints seguintes

**Regra obrigatória da spec que costuma ser esquecida:** todo campo cresce com o texto. Nenhum caractere pode ficar oculto por transbordo (Cap. 3, "Regras Obrigatórias").

**Precisões do PROMPT 1 (dobradas aqui):**
- Estética alvo: "aplicação moderna para desktop inspirada em mobile" — profundidade sutil, cantos arredondados, transparência **discreta** (nunca "vidro exagerado"), sombras suaves, degradês muito sutis, bastante respiro, poucos divisores, baixo contraste. Evitar cara de ERP/planilha/Windows Forms e sensação de "caixas empilhadas".
- Ícones e botões em **um único padrão** (arredondados, foscos, minimalistas, espessura uniforme) — proibido misturar bibliotecas.
- Mapa de **cores fixas** do PROMPT 1 (pág. 11–12), a ancorar nos tokens semânticos (resolve com D8): Prazo vencido `#780001`, Prazo pendente `#BF512C`; Prioridade urgente `#780001`, importante `#BF512C`, Médio `#DA9B2B`, Baixo `#2E5749`; Status pendente `#780001`. **Cor só carrega significado, nunca decora.**

**Aceite**
- [ ] `grep` por hex fora do arquivo de tokens retorna zero
- [ ] Os 8 estados presentes e visíveis em `/design-system`
- [ ] Teste com string de 500 caracteres em todo campo: nada é cortado
- [ ] Foco visível por teclado
- [ ] `prefers-reduced-motion` respeitado

**Referência:** `ref-01-cabecalho-botoes-sidebar.png`

---

### S3 — Shell, navegação e Configurações v1

**Objetivo:** esqueleto navegável e catálogos editáveis pelo usuário. Antecipar Configurações é o que torna a Regra 06 real desde o começo, em vez de virar dívida.

**Escopo**
- Barra lateral mínima, idêntica em todas as telas; header; rotas dos 7 módulos (ainda vazios)
- Navegação sem recarregar página, com filtros preservados na URL
- Tela Configurações: CRUD de todos os catálogos, com cor, ordem e arquivamento

**Aceite**
- [ ] Criar um tipo de atividade em Configurações e ele aparecer no formulário sem redeploy
- [ ] Arquivar um catálogo não quebra nenhum registro antigo
- [ ] Trocar de módulo e voltar preserva o estado

---

### S4 — Atividades: cadastro

**Escopo**
- Formulário por seções, popup em tela cheia, campos opcionais recolhidos, nenhum obrigatório (D4)
- Blocos condicionais: E-mail → texto livre; Oportunidade → texto curto; Proposta → bloco completo com itens (D11). Dois tipos selecionados abrem os dois blocos
- Checklist de próximos passos, com prazo opcional por item e possibilidade de remover o prazo
- Criação inline de catálogo: digitou uma empresa nova, ela entra no catálogo e passa a aparecer nas próximas atividades
- Salvamento sem recarregar a página
- Contadores automáticos (D13), data de criação e data de conclusão automáticas

**Aceite**
- [ ] Salvar uma atividade completamente vazia funciona (defaults aplicados)
- [ ] Selecionar 2 tipos abre os 2 blocos condicionais
- [ ] Item de checklist com e sem prazo
- [ ] Catálogo criado no formulário aparece na atividade seguinte
- [ ] Texto longo em qualquer campo aparece inteiro

---

### S5 — Atividades: listagem, filtros, ordenação e ações rápidas

**Escopo**
- Modo **Cards** com a hierarquia exata dos 14 itens do Cap. 5 (incluindo: substituição do assunto pelo Produto/Serviço quando o tipo for Proposta, detalhe ao lado, escopo e amostragem em menor destaque, etiqueta MRR/PS, valor total das propostas)
- Modo **Lista** compacto com os campos do Cap. 5
- Memória automática do último modo utilizado
- 12 filtros cumulativos, multi-seleção, com typeahead e limpeza individual, sincronizados na URL
- Ordenação por data de criação, prazo e prioridade
- Ações rápidas sem abrir a atividade: alterar status e prioridade, duplicar, arquivar, excluir, concluir
- Índice de conclusão do checklist em dois formatos (barra e quantidade)
- Paginação ou virtualização

**Aceite**
- [ ] A URL reproduz exatamente o estado de filtros ao ser colada em outra aba
- [ ] Concluir a atividade direto do card e direto da lista
- [ ] Filtro combinado de 4 campos retorna o mesmo total que o dashboard exibirá
- [ ] 1.000 atividades sem travamento perceptível

---

### S6 — Atividades: detalhe, vínculos e histórico

**Escopo**
- **Drawer lateral** em vez de página separada — a própria especificação já registrou essa decisão ("Minha principal sugestão de evolução")
- Edição inline sem sair da lista
- Seções: geral, registros, planilhas, execuções, anexos, histórico
- Vincular objeto existente (com busca) ou criar um já vinculado
- Navegação entre objetos vinculados
- Upload de anexos e lista de links
- Timeline de histórico

**Aceite**
- [ ] Editar sem perder o contexto da lista
- [ ] Registro vinculado a 2 atividades aparece nas duas e continua sendo um só
- [ ] Histórico registra alteração de status, prazo e prioridade

---

### S7 — Calendário

**Escopo**
- Consumidor exclusivo de `prazo_unificado` (S1)
- Grid mensal com todos os dias, navegação por setas, destaque da data atual e dos dias com prazo vinculado
- Ao clicar no dia, painel **"Prazos vinculados"** abaixo do calendário com: empresa, unidade, assunto, etiqueta do tipo de prazo (Atividade, ou Checklist + origem) e prioridade
- Cards direcionáveis para o objeto de origem
- Alteração do prazo direto no painel
- **Filtros próprios**, independentes dos filtros do dashboard (Cap. 4, "Filtros")
- Conteúdo ajustado ao campo, sem necessidade de rolagem

**Aceite**
- [ ] Prazo de atividade e prazo de item de checklist aparecem juntos, com etiquetas corretas
- [ ] Alterar o prazo no painel reflete na atividade e no dashboard sem refresh manual
- [ ] Filtros do calendário não afetam o restante do dashboard

**Referência:** `ref-02-calendario.png`

---

### S8 — Dashboard: motor de widgets, filtros globais e Campos 1–3

**Escopo**
- Registry de widgets: cada bloco é independente, com ordem, visibilidade e tamanho persistidos; botão de configuração; drag-and-drop; **incluir, ocultar e editar** widgets sem alterar a arquitetura (PROMPT 1, "Comportamento esperado")
- Barra de filtros global (10 filtros) + busca global no cabeçalho
- **Regra de deep-link:** todo número é clicável e leva à tela destino com os filtros do dashboard **somados** ao filtro do próprio indicador
- Atualização automática por invalidação de cache. Não existe botão "Atualizar"
- Campo 1 — Resumo Geral (atividades, execuções, registros, planilhas)
- Campo 2 — Status (índice de conclusão, pendentes, vencidas + 2 gráficos)
- Campo 3 — Prioridade (urgentes, importantes + gráfico)

**Aceite**
- [ ] Com Empresa = X aplicado no dashboard, clicar em "Atividades pendentes" abre Atividades com Empresa = X **e** Status = Pendente
- [ ] Ocultar e reordenar widget persiste após recarregar
- [ ] Alterar uma atividade atualiza o dashboard sem nenhum clique

**Referências:** `ref-01`, `ref-03-dados-gerais.png`, `ref-04-status-atividades.png`, `ref-05-prioridade.png`

---

### S9 — Dashboard: Propostas, Empresas e Visão Geral

**Escopo**
- Campo 4 — Propostas: total, urgentes, importantes, pendentes, vencidas, **ganhas** (status de negociação = Aceite) + gráficos Propostas x Status e Propostas x Vencimento
- Campo 5 — Empresas: gráfico Atividade x Empresa com cor por ranking (mais atividades = tom mais escuro), comparativo MRR x PS, produtos/serviços vinculados
- Campo 6 — Visão Geral, largura total, ao final da página

**Aceite**
- [ ] Teste automatizado de consistência: a soma dos gráficos é igual ao total do Campo 1 sob o mesmo filtro
- [ ] Cor por ranking funcionando
- [ ] Mais de 5 empresas agrupa a cauda em "Outros" (D9)

**Referências:** `ref-06-propostas.png`, `ref-07-empresas-produtos.png`, `ref-08-visao-geral.png`

---

### S10 — Execuções

Abre com mini-spec (30 min): itens e subitens, progresso, prazos por item, o que a listagem exibe, o que diferencia de um checklist longo.

Depois: CRUD, itens e subitens com check e prazo, indicador de progresso, vínculos, aparição no calendário e no Resumo Geral.

---

### S11 — Registros

Mini-spec, depois: editor de texto rico, vínculo N:N com qualquer objeto, busca full-text, prazo opcional, aparição no Resumo Geral e no calendário.

---

### S12 — Planilhas

Mini-spec **e decisão de biblioteca de grid** (com ou sem fórmulas; se com, definir o conjunto mínimo — soma, média, referência de célula — e verificar a licença).

**Armadilha:** deixar isso virar um Excel. A especificação diz "documentos estruturados em formato de tabela". Escopo mínimo, importação e exportação de XLSX resolvem a maior parte do uso real.

---

### S13 — Fechamento

- Responsividade tablet e celular: reorganizar, nunca esconder funcionalidade (Cap. 3)
- Busca global de verdade, em todos os objetos
- **Backup e exportação** — o sistema passa a ser fonte única da verdade; sem backup, isso é um risco e não uma feature
- Performance, revisão de consistência visual, checklist final de regressão módulo a módulo

---

### S14 — Conformação visual (PROMPT 1)

**Origem:** preâmbulo `LAYOUT` do PROMPT 1 — a única parte do documento que o plano ainda não cobria, porque o S2 pressupunha construção do zero e as telas já existem.

**Objetivo:** passar toda a interface já construída para a identidade "mobile-desktop" descrita no PROMPT 1, **sem uma única alteração funcional**. Não é reescrever o design system (isso é S2); é aplicar/reforçar o S2 nas telas que ficaram fora do padrão.

**Desbloqueada:** D1 e D16 fechadas — tema claro confirmado.

**Escopo**
- Reverter o tema escuro global (`30b208b`, `e92a3e8`) para o tema claro `#EEF4ED` definido em D1; `#1F2C43` restrito à sidebar e ao header.
- Remover o botão temporário de alternância de layout (`6ab9996`) — deixa de existir mais de um tema.
- Refatorar exclusivamente o layout visual de todas as telas entregues, preservando 100% de estrutura, regras de negócio, banco, filtros, validações, dashboards, calendário, formulários, cards, listas, vínculos e integrações.
- Reduzir a sensação de sistema "blocado": mais respiro, menos divisores, agrupamentos naturais, continuidade; nenhum card/campo excessivamente grande.
- Sidebar mínima e idêntica em todas as telas; transparência só para leveza, nunca comprometendo leitura; animações curtas.

**Fora do escopo:** qualquer campo, filtro, dado, comportamento, rota, cálculo ou schema. Nada que não seja pixel.

**Aceite**
- [ ] `grep` por hex fora dos tokens = 0 (Regra 02)
- [ ] Diff da sprint não toca nenhum arquivo de lógica/dados/filtros — só estilo/markup
- [ ] Todas as cores semânticas (status, prioridade, prazo, chips, gráficos) idênticas às de antes da sprint
- [ ] `/design-system` continua idêntico; todas as telas de sprints anteriores seguem funcionando
- [ ] Tema final é o claro `#EEF4ED` (D1/D16), sem vestígio do tema escuro nem do botão de alternância

**Referência:** `ref-01-cabecalho-botoes-sidebar.png`

---

## 6. Matriz de rastreabilidade

Para garantir que nada da especificação ficou de fora.

| Trecho da spec | Sprint |
|---|---|
| Cap. 1 — Regras 01 a 10 | Transversal (checklist de regressão) |
| Cap. 2.3 Estrutura / 2.4 Hierarquia / 2.10 Estrutura de dados | S1 |
| Cap. 2.6 Relacionamento / 2.7 Independência / "Objetos vinculáveis" | S1, S6 |
| Cap. 2.9 Estrutura de componentes | S2 |
| Cap. 3 inteiro (paleta, tipografia, cards, estados, animação) | S2 |
| Cap. 3 "Responsividade" | S3 (desktop) + S13 (tablet/celular) |
| Cap. 4 "Comportamento esperado" (widgets) | S8 |
| Cap. 4 Área 1 Cabeçalho | S8 |
| Cap. 4 Área 2 Calendário | S7 |
| Cap. 4 Campos 1, 2, 3 | S8 |
| Cap. 4 Campos 4, 5, 6 | S9 |
| Cap. 4.8 Atualização automática | S8 |
| Cap. 4.9 Personalização | S8 (base) + S13 (avançado) |
| Cap. 5.4 a 5.7 Barra, pesquisa, filtros, visualizações | S5 |
| Cap. 5.8 a 5.13 Cadastro e campos | S4 |
| Cap. 5.14 a 5.17 Cards, lista, ordenação, ações rápidas | S5 |
| Cap. 5.18 a 5.19 Detalhamento e relacionamentos | S6 |
| Cap. 5.21 Regras obrigatórias | Transversal |
| Checklist "CRIAR ATIVIDADE" (kanban pendente) | Backlog pós-S13 |
| Guia 5 (posicionamento) | S8, S9 (após D1, D2) |
| PROMPT 1 — preâmbulo `LAYOUT` (refatoração visual retroativa) | **S14** (após D1, D16) |
| PROMPT 1 — Filosofia UX/UI, paleta, tipografia, ícones, botões, cards, estados | S2 (reforçado) |
| PROMPT 1 — cores fixas (Prazo/Prioridade/Status, pág. 11–12) | S2 (via D8) |
| PROMPT 1 — Dashboard (widgets, cabeçalho, calendário, Campos 1–6, deep-link, auto-update) | S7, S8, S9 |
| PROMPT 1 — campo cresce com o texto / sem transbordo | S2, Transversal |

---

## 7. Backlog fora do escopo das 14 sprints

Registrado para não virar escopo silencioso no meio de uma sprint:

- Visualização em Kanban (item aberto no checklist do documento)
- Colunas configuráveis e redimensionáveis na lista (Cap. 5.15, marcado como "futuramente")
- Módulos Vendas, Comissão, Financeiro, CRM, Clientes (Cap. 1.7)
- Comentários nas atividades (Cap. 5.14, marcado como futuro)
- Importar/exportar no módulo Atividades (Cap. 5.4, marcado como futuro)
- Multiusuário — arquitetura já preparada na S1, ativação depois

---

## 8. Prompt de execução (template)

Preencher e colar no início de cada sprint. O preâmbulo de preservação é o mesmo que você já escreveu no "PROMPT 1" da especificação.

```
CONTEXTO
Sistema Gestão Júlia. Especificação oficial: /docs/spec/. Decisões: /DECISOES.md.
Status atual: /STATUS.md. Referências de layout: /docs/referencias-layout/.

REGRA DE PRESERVAÇÃO
Todas as funcionalidades, regras de negócio, comportamentos, estruturas, banco de dados,
layouts, componentes e implementações existentes permanecem corretos e devem ser preservados.
Este prompt complementa os anteriores, não os substitui. Não altere, remova, simplifique,
reorganize ou reimplemente nada que não esteja explicitamente descrito abaixo. Se algum item
depender de funcionalidade existente, adapte apenas o necessário, preservando o restante.

SPRINT: S{n} — {nome}

ESCOPO (fazer exatamente isto)
- ...

FORA DO ESCOPO (não tocar)
- ...

RESTRIÇÕES
- Usar apenas tokens e componentes do design system. Nenhum hex novo.
- Nenhum campo pode ocultar texto por transbordo.
- Todo filtro passa pelo motor de filtros único.
- Todo prazo passa por prazo_unificado.

CRITÉRIOS DE ACEITE (a sprint só fecha com todos verdes)
- [ ] ...

AO FINAL
Atualizar STATUS.md. Listar o que ficou pendente e o motivo.
```

---

## 9. Referências de layout extraídas

O documento original traz 16 imagens em base64, das quais **8 são únicas** (image9 a image16 são duplicatas de image1 a image8). Já extraídas e renomeadas:

| Arquivo | Referencia | Usada em |
|---|---|---|
| `ref-01-cabecalho-botoes-sidebar.png` | Botões, cabeçalho, barra lateral | S2, S3, S8 |
| `ref-02-calendario.png` | Calendário + prazos vinculados | S7 |
| `ref-03-dados-gerais.png` | Campo 1 — Resumo Geral | S8 |
| `ref-04-status-atividades.png` | Campo 2 — Status | S8 |
| `ref-05-prioridade.png` | Campo 3 — Prioridade | S8 |
| `ref-06-propostas.png` | Campo 4 — Propostas | S9 |
| `ref-07-empresas-produtos.png` | Campo 5 — Empresas e produtos | S9 |
| `ref-08-visao-geral.png` | Campo 6 — Visão Geral | S9 |
