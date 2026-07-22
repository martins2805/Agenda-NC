# Arquitetura

# **CAPÍTULO 02 – ARQUITETURA GERAL DO SISTEMA**

## **2.1 Objetivo da Arquitetura**

A arquitetura do sistema tem como objetivo garantir que todos os módulos funcionem de forma integrada, permitindo que informações relacionadas sejam facilmente conectadas entre si, evitando duplicidade de dados, retrabalho e perda de informações.

O sistema deverá ser construído seguindo uma arquitetura modular, permitindo que novos módulos sejam adicionados futuramente sem necessidade de alterar a estrutura já existente.

Cada módulo deverá possuir responsabilidade própria, porém deverá ser capaz de compartilhar informações com os demais quando necessário.

---

# **2.2 Conceito Geral**

O sistema foi concebido como um **Workspace Pessoal Inteligente**, onde todos os módulos trabalham em conjunto.

Nenhum módulo deve ser visto como um sistema isolado.

Cada informação cadastrada poderá possuir relacionamento com outras informações existentes no sistema.

Exemplos:

Uma atividade poderá possuir:

* diversos registros;  
* diversas planilhas;  
* documentos;  
* observações;  
* histórico;  
* lembretes.

Um registro poderá estar relacionado:

* a uma atividade;  
* a diversas atividades;  
* ou existir de forma independente.

Uma planilha poderá:

* pertencer a uma atividade;  
* pertencer a um registro;  
* existir de forma independente.

Todos os relacionamentos deverão ocorrer naturalmente, sem obrigar o usuário a criar informações duplicadas.

---

# **2.3 Estrutura Geral**

A arquitetura inicial será composta pelos seguintes módulos.

## **Dashboard**

Centro de visualização do sistema.

Apresentará indicadores, calendário, gráficos e resumos.

Não será responsável pelo cadastro de informações.

---

## **Calendário**

Responsável pela visualização cronológica das atividades.

Permitirá acompanhar prazos, vencimentos e agenda operacional.

---

## **Atividades**

Principal módulo do sistema.

Toda atividade representa uma demanda que necessita de acompanhamento.

As atividades poderão possuir relacionamento com praticamente todos os demais módulos.

---

## **Execuções**

Representam processos compostos por diversos itens de execução.

Foram criadas para substituir checklists extensos que exigiriam a criação de dezenas de atividades individuais.

Seu foco será controlar processos e acompanhar sua execução.

---

## **Registros**

Responsáveis pelo armazenamento estruturado de informações.

Funcionam como documentos internos do sistema.

Poderão conter textos, levantamentos, atas, estudos, anotações e qualquer outro tipo de informação.

---

## **Planilhas**

Representam documentos estruturados em formato de tabela.

Poderão existir sozinhas ou vinculadas a atividades e registros.

---

## **Configurações**

Responsável pelas parametrizações do sistema.

Sempre que possível, qualquer alteração de comportamento deverá ocorrer neste módulo, evitando necessidade de programação.

---

# **2.4 Hierarquia do Sistema**

O sistema deverá seguir a seguinte hierarquia lógica.

```
Workspace

│

├── Dashboard

├── Calendário

├── Atividades
│       │
│       ├── Registros
│       ├── Planilhas
│       ├── Documentos
│       └── Histórico

├── Execuções
│       │
│       ├── Itens
│       ├── Subitens
│       ├── Registros
│       └── Planilhas

├── Registros

├── Planilhas

└── Configurações
```

Essa hierarquia representa apenas a organização lógica do sistema.

Ela não determina a forma como as telas serão exibidas.

---

# **2.5 Fluxo Geral de Utilização**

O fluxo natural esperado de utilização do sistema será:

Dashboard

↓

Visualizar indicadores

↓

Identificar uma atividade

↓

Abrir a atividade

↓

Consultar registros

↓

Consultar planilhas

↓

Executar ações

↓

Concluir atividade

↓

Atualização automática do Dashboard

Entretanto, o sistema deverá permitir que qualquer módulo seja utilizado independentemente.

O usuário nunca será obrigado a seguir um fluxo único.

---

# **2.6 Relacionamento entre Módulos**

Todos os módulos deverão ser capazes de compartilhar informações.

Exemplo:

Atividade

↓

Registros

↓

Planilhas

↓

Execuções

↓

Calendário

↓

Dashboard

Sempre que uma informação for alterada, todos os módulos relacionados deverão refletir essa alteração automaticamente.

O sistema deverá evitar a duplicação de dados.

---

# **2.7 Independência dos Módulos**

Apesar da integração entre eles, cada módulo deverá funcionar de forma independente.

Exemplo:

Será possível criar um Registro sem criar uma Atividade.

Será possível criar uma Planilha sem criar um Registro.

Será possível criar uma Execução sem criar uma Atividade.

Posteriormente, caso desejado, essas informações poderão ser vinculadas.

Essa independência garante maior flexibilidade ao usuário.

---

# **2.8 Princípios de Navegação**

A navegação deverá seguir os seguintes princípios.

* Poucos cliques.  
* Informações sempre visíveis.  
* Hierarquia clara.  
* Baixa carga cognitiva.  
* Ações previsíveis.  
* Layout consistente.  
* Resposta rápida às interações.

Sempre que possível, o usuário deverá permanecer na mesma tela.

Mudanças de página completas deverão ocorrer apenas quando realmente necessárias.

---

# **2.9 Estrutura de Componentes**

Todo o sistema deverá ser construído utilizando componentes reutilizáveis.

Exemplos:

* Botões;  
* Campos de texto;  
* Campos de seleção;  
* Calendário;  
* Cards;  
* Gráficos;  
* Tabelas;  
* Modais;  
* Menus;  
* Sidebar;  
* Header;  
* Indicadores;  
* Etiquetas (Badges);  
* Chips;  
* Alertas;  
* Tooltips.

Qualquer alteração em um componente deverá refletir automaticamente em todas as telas que o utilizam.

---

# **2.10 Estrutura de Dados**

Nenhuma informação deverá existir isoladamente.

Sempre que possível, cada informação deverá permitir relacionamentos.

Exemplo:

Uma atividade poderá possuir:

* registros;  
* planilhas;  
* anexos;  
* observações;  
* responsáveis (caso futuramente exista mais de um usuário);  
* etiquetas;  
* empresa;  
* unidade;  
* categoria;  
* prioridade;  
* status.

Da mesma forma, um registro poderá ser relacionado a diversas atividades e uma planilha poderá atender diferentes registros, evitando duplicidade de informações.

---

# **2.11 Escalabilidade**

A arquitetura deverá permitir a inclusão de novos módulos sem necessidade de reconstrução do sistema.

Exemplos futuros:

* CRM;  
* Financeiro;  
* Vendas;  
* Comissão;  
* Projetos;  
* Biblioteca de documentos;  
* Inteligência Artificial;  
* Painéis personalizados.

Todo novo módulo deverá seguir os mesmos padrões definidos nesta documentação.

---

# **2.12 Princípios Arquiteturais Obrigatórios**

Durante toda a evolução do sistema, deverão ser respeitados os seguintes princípios:

* Modularidade;  
* Reutilização de componentes;  
* Baixo acoplamento entre módulos;  
* Alta coesão das funcionalidades;  
* Escalabilidade;  
* Responsividade;  
* Performance;  
* Simplicidade;  
* Consistência visual;  
* Flexibilidade para configuração pelo usuário.

Nenhuma implementação futura poderá violar estes princípios sem revisão da documentação oficial.

### **Objetos vinculáveis**

Em vez de pensar apenas em "Atividades", o sistema será composto por **objetos** (Atividades, Execuções, Registros e Planilhas). Cada objeto pode existir sozinho ou ser vinculado a qualquer outro objeto, preservando sua identidade.

Exemplo:

* Uma **Atividade** pode ter vários **Registros** e **Planilhas**.  
* Uma **Execução** pode gerar vários **Registros**.  
* Um **Registro** pode ser reutilizado em diferentes **Atividades**, sem ser duplicado.  
* Uma **Planilha** pode ser compartilhada entre uma **Atividade** e um **Registro**.
