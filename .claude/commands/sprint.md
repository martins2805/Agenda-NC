---
description: Executa uma sprint do plano seguindo o ritual completo
---

Sprint solicitada: **$ARGUMENTS**

Siga exatamente esta ordem. Não pule etapas.

1. Leia `docs/PLANO-DE-SPRINTS.md` e localize a sprint $ARGUMENTS. Extraia: objetivo, escopo, fora do escopo, entregáveis, critérios de aceite e armadilhas.
2. Leia `docs/DECISOES.md` inteiro.
3. Pela matriz de rastreabilidade do plano, identifique quais arquivos de `docs/spec/` cobrem esta sprint e leia **apenas esses**.
4. Leia `docs/STATUS.md` para saber o que já existe.
5. Entre em plan mode e me apresente:
   - o que será construído, em ordem
   - a lista de arquivos que serão criados e alterados
   - o que **não** será tocado
   - qualquer ponto em que a spec estiver ambígua ou contraditória — pergunte, não decida
6. **Não escreva código antes de eu aprovar o plano.**
7. Aprovado o plano: implemente só o escopo listado.
8. Ao terminar, rode `/aceite`.

Se durante a execução você encontrar algo fora do escopo que precisa ser corrigido, **não corrija**: anote em `docs/STATUS.md` na seção "Pendências encontradas" e siga.
