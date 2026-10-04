---
description: Verifica o checklist de aceite e a regressão da sprint atual
---

Verificação de fechamento de sprint. Nada aqui pode ser marcado por presunção — cada item precisa ser **executado e observado**.

1. Rode `npm run typecheck`, `npm run lint`, `npm run build` e os testes. Cole o resultado real.
2. Abra `docs/PLANO-DE-SPRINTS.md`, localize o checklist de aceite da sprint em `docs/STATUS.md` como "em execução" e percorra **item por item**, verificando cada um na prática (rodando o app, consultando o banco, executando a query). Para cada item, diga o que você fez para verificar.
3. Regressão:
   - `grep -rniE "#[0-9a-f]{3,8}\b" src/ --include=*.tsx --include=*.ts --include=*.css` fora do arquivo de tokens deve voltar vazio
   - `/design-system` continua idêntico, com os 8 estados de cada componente
   - as telas entregues em sprints anteriores continuam funcionando
4. Produza um relatório em três blocos: **passou**, **falhou**, **ficou pendente (com motivo)**.
5. Atualize `docs/STATUS.md`.

Se qualquer item falhou, a sprint **não** está fechada. Diga isso explicitamente em vez de sugerir seguir para a próxima.
