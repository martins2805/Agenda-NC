# Dashboard

# MÓDULO DASHBOARD

# **Objetivo**

O Dashboard será a tela inicial do sistema.

Seu objetivo é fornecer uma visão geral das informações mais importantes, permitindo que o usuário compreenda rapidamente sua situação atual sem necessidade de navegar pelos demais módulos.

O Dashboard deverá funcionar como um centro de acompanhamento, consulta e tomada de decisão.

Ele não deverá substituir os módulos de cadastro e edição, mas sim consolidar informações provenientes deles.

---

# **Princípios**

O Dashboard deverá obedecer aos seguintes princípios:

* leitura rápida;  
* poucas ações necessárias;  
* atualização automática;  
* informações sempre relevantes;  
* personalização futura;  
* baixa poluição visual;  
* dados apresentados devem ser direcionáveis para as telas relacionadas e com o mesmo filtro que se trata o dado, aplicado na tela a ser direcionada

O Dashboard nunca deverá parecer uma tela composta apenas por diversos cards empilhados.

---

# **Comportamento esperado**

* Adotar a lógica de "Widgets": Em vez de um Dashboard totalmente fixo, cada bloco (Calendário, Indicadores, Prioridades, Atualizações Recentes etc.) será um widget independente. Assim, deve ser possível reorganizar a ordem, incluir, ocultar, editar widgets sem alterar a arquitetura do sistema  
* Responsividade: os dados exibidos no dashboard devem ser direcionáveis para a página e os dados a que se referem. Ou seja, quando selecionado um dado no dash, deve ser direcionado para a página com a mesma aplicação de filtragem que foi aplicada para geração de tal dado

---

# **Cores fixas**

Os ícones, elementos, gráficos, campos, etiquetas, cards, que fizerem relação às informações abaixo e que não houver indicação explícita da cor a ser utilizada, devem possuir a cor indicada ao lado:

* Prazo \= vencido: \#780001  
* Prazo \= Pendente: \#BF512C  
* Prioridade \= urgente: \#780001  
* Prioridade \= importante: \#BF512C   
* Status \= pendente: \#780001  
* Prioridade \= Médio (\#DA9B2B)  
* Prioridade \= Baixo (\#2E5749)  
* 

## Filtros disponíveis:

1. Busca por palavras chave em todos os campos  
2. Empresa  
3. Unidade  
4. Tipo  
5. Status  
6. Prioridade  
7. Prazo  
8. Tipo de produto/serviço  (opções referentes à MRR ou PS)  
9. Produto/Serviço  
10. Status de negociação

## Comportamento:

* Possibilidade de combinar os filtros  
* Possibilidade de selecionar mais de uma opção em todos os campos  
* Possibilidade de iniciar a digitação no campo do filtros e já serem reportadas as opções compatíveis  
* Os indicadores deverão possuir atualização automática.

---

# **Estrutura Geral**

O Dashboard será dividido em 3 áreas principais.

* Área 1: cabeçalho (topo de página): filtros e botões de criação  
* Área 2: dados, indicadores e gráficos (subdividido em campos)  
* Área 3: Calendário

## **Área 1 — Cabeçalho**

Contém:

* saudação;  
* pesquisa global \- com todos os filtros mapeados/solicitados disponíveis;  
* botão de configurações criação de atividade, execução, registro e planilha  
* botão de configurações que será utilizado para edição de widgets  
* Para a construção do layout deve ser utilizado o print abaixo como referência

  ![Referência de layout](../referencias-layout/ref-01-cabecalho-botoes-sidebar.png)

---

## **Área 2 — Calendário**

O calendário será um elemento permanente do Dashboard. Sua função será permitir a visualização rápida da agenda e os prazos vinculados nas atividades, checklists, execuções, planilhas e registros. 

O calendário deverá:

* ocupar posição de destaque;  
* permitir mudança de mês;  
* destacar atividades;  
* destacar atrasos;  
* destacar vencimentos.

O calendário deve parecer integrado ao dashboard. Não parecer um componente separado.

Deve possuir aparência semelhante a aplicativos modernos de agenda.

Será dividido em dois módulos: o módulo do calendário e o módulo de exposição das atividades, prazos, checklists, registros e etc, que foram vinculados às atividades. 

Ao clicar em qualquer atividade deverá abrir imediatamente seus detalhes.

### Exposição dos dados

* Indicar todos os dias e meses  
* Possibilidade de navegação entre todos os meses, dentro do próprio calendário, através de setas de navegação  
* Indicação prévia nas datas:  
  * Destaque 1: data atual  
  * Destaque 2: indicação nas datas que possuem prazos vinculados

### Comportamento

Calendário expansível: ao selecionar um dia, caso existam prazos relacionados a ele, as atividades, registros, planilhas, checklists vinculados a essa data serão exibidas no campo de “Prazos vinculados”, que deve ser disponibilizado abaixo do próprio calendário.

As informações a serem exibidas sobre cada prazo devem ocupar todo o campo destinado a esses dados, e elas devem ser ajustadas para ocuparem esse espaço, sem a necessidade de rolar a tela para exibir mais dados.

Os dados devem ser automaticamente atualizados, sem a necessidade edições manuais

### Campo prazos vinculados

As informações que devem aparecer sobre cada prazo vinculado são:

1. Empresa  
2. Unidade  
3. Assunto  
4. Tipo de prazo: em formato de etiqueta, indicar se aquela prazo trata-se de Atividade (prazo vinculado em uma atividade), Checklist \+ Atividade/Execução/Planilha/Registro (prazo vinculado a um checklist \+ se ele foi vinculado em atividade/execução/planilha/registro)   
5. Prioridade

Comportamento

Comportamento dos cards de cada atividade com prazo vinculado:

* Direcionáveis para o dado em que o prazo foi relacionado  
* Possibilidade de alterar o prazo neste campo

### Filtros

Apesar de estar no dashboard, o calendário não refletirá os filtros aplicados ao dashboard, devendo ter o seu próprio campo de filtros, que serão aplicáveis somente ao calendário.

**Os filtros serão:**

1. Busca por palavras chave em todos os campos  
2. Empresa  
3. Unidade  
4. Tipo  
5. Status  
6. Prioridade  
7. Prazo  
8. Tipo de produto/serviço  (opções referentes à MRR ou PS)  
9. Produto/Serviço

E o comportamento dos filtros será

* Possibilidade de combinar os filtros  
* Possibilidade de selecionar mais de uma opção em todos os campos  
* Possibilidade de iniciar a digitação no campo do filtros e já serem reportadas as opções compatíveis

### Layout e posicionamento

O calendário será uma seção própria, mas dentro do dashboard, por isso, ele deverá se adaptado aos mesmos moldes do dashboard e caber esteticamente no dashboard. Não devendo competir com os gráficos.

Deverá ocupar o lado direito do dashboard, sendo que o calendário será o topo do campo, os filtros estarão disponíveis logo abaixo e mais abaixo, está o campo de prazos vinculados.

Deverá seguir o mesmo modelo do layout de referência abaixo

![Referência de layout](../referencias-layout/ref-02-calendario.png)

 

---

## **Área 3 — Dados, Indicadores e Gráficos**

### 

### **Campo 1: Resumo Geral**

#### **Campos/Dados**

Exibe os principais indicadores do sistema, que são:

1. Total atividades  
   1. Dado: Número total de atividades cadastradas  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, não aplicar nenhum filtro na tela de atividades. Se aplicado filtro no dashboard, aplicar o mesmo filtro no direcionamento na tela de atividades)  
2. Total Execuções  
   1. Dado: Número total de execuções cadastradas  
   2. Direcionamento: tela de atividades geral (se não aplicado nenhum filtro no dashboard, não aplicar nenhum filtro na tela de atividades geral. Se aplicado filtro no dashboard, aplicar o mesmo filtro no direcionamento na tela de atividades geral)  
3. Total Registros  
   1. Dado: Número total de registros criados  
   2. Direcionamento: tela de registros (se não aplicado nenhum filtro no dashboard, não aplicar nenhum filtro na tela de registros. Se aplicado filtro no dashboard, aplicar o mesmo filtro no direcionamento na tela de registros)  
4. Total Planilhas  
   1. Dado: Número total de planilhas criadas  
   2. Direcionamento: tela de planilhas (se não aplicado nenhum filtro no dashboard, não aplicar nenhum filtro na tela de planilhas. Se aplicado filtro no dashboard

#### **Posição**

Lado esquerdo do dashboard

#### **Referência Layout**

![Referência de layout](../referencias-layout/ref-03-dados-gerais.png)

### **Campo 2 \- Status atividades**

#### **Campos/Dados**

1. **índice de Conclusão atividades**  
   1. Dado: índice de conclusão das atividades cadastradas  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades sem nenhuma aplicação de filtro. Se aplicado filtro no dashboard, aplicar o mesmo filtro no direcionamento na tela de atividades)  
2. **Atividades pendentes**  
   1. Dado: quantidade de atividades com o status de conclusão \= pendente  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Status \= pendente aplicado. Se aplicado algum filtro no dashboard, aplicar o filtro de status \= a pendente e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
      Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
3. **Atividades vencidas**  
   1. Dado: quantidade de atividades com o prazo \= vencido  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Prazo \= atrasadas aplicado. Se aplicado algum filtro no dashboard, aplicar o filtro de prazo \= atrasadas e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
      Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

**Gráfico 1 \- Status de conclusão**

* Nome: Status de Conclusão  
* Dado: dado referente ao status de conclusão das atividades cadastradas  
* Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

#### **Posição**

Ao centro da página do dashboard e ao lado do campo dos dados gerais (deve ocupar o mesmo campo que o gráfico 2 abaixo)

#### **Referência Layout**

![Referência de layout](../referencias-layout/ref-04-status-atividades.png)

**Gráfico 2 \- Status de vencimento**

* Nome: Status de Vencimento  
* Dado: dado referente ao status de vencimento das atividades cadastradas  
* Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
* Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

#### **Posição**

Ao centro da página do dashboard e ao lado do campo dos dados gerais (deve ocupar o mesmo campo que o gráfico 1 acima)

#### **Referência Layout**

![Referência de layout](../referencias-layout/ref-04-status-atividades.png)

### **Campo 3 \- Prioridade**

#### **Campos/Dados**

1. **Atividades Urgentes**  
   1. Dado: total de atividades cadastradas com a prioridade \= urgente  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Prioridade \= urgente. Se aplicado algum filtro no dashboard, aplicar o filtro de Prioridade \= urgente e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
2. **Atividades Importantes**  
   1. Dados: total de atividades cadastradas com a prioridade \= importante  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Prioridade \= importante. Se aplicado algum filtro no dashboard, aplicar o filtro de Prioridade \=importante e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

**Gráfico:** 

* Nome: Ativdades X Prioridade  
* Dado: Gráfico referente aos dados de atividades por tipo de prioridade cadastrada a cada uma delas   
* Comportamento esperado: refletir o número de atividades para cada tipo de prioridade. o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

#### **Posição**

Ao lado esquerdo da página do dashboard

#### **Referência Layout**

![Referência de layout](../referencias-layout/ref-05-prioridade.png)

### **Campo 4 \- Propostas**

#### **Campos/Dados**

1. **Total Propostas (atividades)**  
   1. Dado: total de atividades que foram cadastradas com o tipo “Proposta”  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Tipo \= proposta. Se aplicado algum filtro no dashboard, aplicar o filtro de tipo \= proposta e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
2. **Propostas Urgentes**  
   1. Dado: Total de atividades que possuem o tipo “Proposta” e a prioridade “Urgente”  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Tipo \= proposta \+ filtro de Prioridade \= urgente. Se aplicado algum filtro no dashboard, aplicar o filtro de tipo \= proposta \+ prioridade \= urgente e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
3. **Propostas Importantes**  
   1. Dado: total de atividades que possuem o tipo “Proposta” e a prioridade “Importante”  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Tipo \= proposta \+ filtro de Prioridade \= importante. Se aplicado algum filtro no dashboard, aplicar o filtro de tipo \= proposta \+ prioridade \= importante e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
4. **Propostas Pendentes**  
   1. Dado: total de atividades que possuem o tipo “Proposta” e o status é “pendente”  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Tipo \= proposta \+ filtro de status \= pendente. Se aplicado algum filtro no dashboard, aplicar o filtro de tipo \= proposta \+status \= pendente e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
5. **Propostas Vencidas**  
   1. Dado: Total de atividades que possuem o tipo “Proposta” e o estado com o prazo vencido  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Tipo \= proposta \+ prazo \= vencido. Se aplicado algum filtro no dashboard, aplicar o filtro de tipo \= proposta \+  prazo \= vencido e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

**Gráfico 1:** 

* Nome: Propostas X Status  
* Dado: Gráfico referente às atividades que foram cadastradas com o tipo \= propostas e divididas por status de conclusão

* Comportamento esperado: refletir o número de atividades para cada tipo de prioridade. o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

#### **Posição**

Todo o campo relacionado aos dados de propostas devem ocupar o centro da página, em que os dados numéricos são exibidos acima dos gráficos, os gráficos ocupam a parte de baixo do campo propostas e estão um ao lado do outros.

#### **Referência Layout**

![Referência de layout](../referencias-layout/ref-06-propostas.png)

**Gráfico 1:** 

* Nome: Propostas X Vencimento  
* Dado: Gráfico referente às atividades que foram cadastradas com o tipo \= propostas e divididas por prazo de vencimento

* Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido

#### **Posição**

Todo o campo relacionado aos dados de propostas devem ocupar o centro da página, em que os dados numéricos são exibidos acima dos gráficos, os gráficos ocupam a parte de baixo do campo propostas e estão um ao lado do outros.

#### **Referência Layout**

![Referência de layout](../referencias-layout/ref-06-propostas.png)

### **Campo 5 \- Empresas**

#### **Gráfico 1**

1. Nome: Atividade X Empresa  
2. Dado: quantidade total de atividades por empresa cadastrada   
3. Comportamento layout: Cada empresa deve ter uma cor dentre a paleta base \#FBF9E4, \#1F2C43, \#3E4C59, \#8BAAAD, \#D8D8D8. Sendo que as empresas que tem mais atividades cadastradas aparecem primeiro no gráfico e ficam com as cores mais escuras e vice e versa.  
4. Comportamento esperado: apresentar gráfico com a quantidade de atividades que foram cadastradas para cada empresa

#### **Campos/Dados**

1. Tipo de Produto/Serviço  
   1. Dado: no mesmo campo, exibir dois dados em formato comparativo entre eles e os números de cada um é que serão direcionáveis. Os dados serão Total de atividades que foram cadastradas com o tipo \= proposta e que possuem o tipo do produto/serviço \= MRR X total de atividades que foram cadastradas com o tipo \= Propostas e que possuem o tipo de produto/serviço \= PS  
   2. Direcionamento: tela de atividades (se não aplicado nenhum filtro no dashboard, direcionar para tela de atividades apenas com o filtro de Tipo \= proposta \+ filtro de tipo de produto/serviço \= PS (quando clicado no número referente à PS) / \= MRR (quando clicado no número referente à MRR. Se aplicado algum filtro no dashboard, aplicar o filtro de filtro de Tipo \= proposta \+ filtro de tipo de produto/serviço \= PS/MRR e os mesmos filtros que foram aplicados no dashboard, agora no direcionamento na tela de atividades)  
   3. Comportamento esperado: o número de atividades vai variar conforme o filtro aplicado também, não vai reportar somente o número total completo, mas o número total conforme filtro definido  
2. Produtos/Serviços vinculados  
   1. Dado: Gráfico Em colunas verticais com a quantidade total de atividades cadastradas com o tipo de proposta e vinculada a algum produto/serviço, por tipo de produto/serviço.  
   2. Cada produto/serviço deve ter uma cor dentre a paleta base \#FBF9E4, \#1F2C43, \#3E4C59, \#8BAAAD, \#D8D8D8. Sendo que as empresas que tem mais atividades cadastradas aparecem primeiro no gráfico e ficam com as cores mais escuras e vice e versa.

**Posição e referência de Layout**

O gráfico 1, os dados referentes à quantidade de atividades em que os tipos de produtos foram cadastrados e os dados relacionados às quantidades de atividades X tipo de produtos/serviços vinculados, deverão ocupar um mesmo campo. Todos eles devem obedecer a referencia de layout abaixo. 

![Referência de layout](../referencias-layout/ref-07-empresas-produtos.png)

**Campo 6 \- Visão Geral**

* Dado: Gráfico geral para retrato de qualquer que seja o filtro que tenha sido aplicado no dashboard.  
* Direcionamento: assim como todos os campos, os dados exibidos devem ser direcionáveis e serão direcionados às telas correspondentes, com a mesma filtragem aplicada do dashboard.


**Posição e referência de Layout**

visao geral será o último dado a ser exibido na tela de dashboard, sendo que este gráfico, esses dados, serão exibidos no formato do layout abaixo

![Referência de layout](../referencias-layout/ref-08-visao-geral.png)

---

# **4.8 Atualização Automática**

Sempre que qualquer módulo sofrer alteração, o Dashboard deverá refletir essa mudança automaticamente.

Não deverá existir botão "Atualizar".

---

# **4.9 Personalização**

Futuramente o usuário poderá escolher:

* quais indicadores deseja visualizar;  
* ordem dos blocos;  
* tamanho dos cards;  
* componentes visíveis.

A arquitetura deverá ser preparada para suportar essa funcionalidade desde a primeira versão.

---

# **4.10 Layout**

O Dashboard deverá possuir sensação de fluidez.

As informações deverão parecer distribuídas naturalmente.

Evitar:

* excesso de cards;  
* grandes espaços vazios;  
* muitos blocos retangulares;  
* excesso de linhas divisórias.  
* Cards muito grandes

A organização deverá lembrar aplicativos modernos de produtividade e o layout do iphone

---

# **4.11 Hierarquia Visual**

A informação mais importante deverá ser percebida imediatamente.

A ordem visual será:

1. Cabeçalho;  
2. Calendário;  
3. Indicadores;

Nenhum elemento secundário deverá competir visualmente com essas áreas.

---

# **4.12 Comportamentos Obrigatórios**

O Dashboard deverá:

* carregar rapidamente;  
* atualizar automaticamente;  
* manter responsividade;  
* preservar filtros ativos;  
* permitir navegação por clique em qualquer informação.

Sempre que o usuário clicar em um item, deverá ser direcionado diretamente para o módulo correspondente.

---


---

## Adendo — indicador "Propostas Ganhas" (Campo 4)

> Origem: seção "PROMPT 1 – Dash" do documento original, que repetia os capítulos de UX/UI e
> Dashboard. A repetição foi removida para manter uma única fonte da verdade; este é o único
> conteúdo novo que ela trazia.

O Campo 4 — Propostas recebe um sexto indicador:

6. **Propostas Ganhas**
   1. Dado: total de atividades que possuem o tipo "Proposta" + o status de negociação = "Aceite"
   2. Direcionamento: tela de atividades, com filtro Tipo = proposta + status de negociação = "Aceite",
      somado aos filtros já aplicados no dashboard
   3. Comportamento esperado: o número varia conforme o filtro aplicado

O indicador "Total Propostas (atividades)" é referido apenas como **"Total Propostas"**.
