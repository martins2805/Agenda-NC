# Atividades

# **MÓDULO ATIVIDADES**

# **Objetivo**

O módulo **Atividades** representa o núcleo central do sistema.

Seu objetivo é permitir o gerenciamento completo das demandas do usuário, acompanhando todas as etapas do seu ciclo de vida, desde o planejamento até a conclusão.

Além do acompanhamento operacional, o módulo deverá funcionar como o ponto central de relacionamento das demais informações do sistema, permitindo que registros, planilhas, documentos, observações e demais conteúdos permaneçam vinculados à atividade correspondente.

Toda atividade deverá possuir contexto suficiente para que o usuário consiga retomá-la a qualquer momento sem necessidade de consultar fontes externas.

---

# **Estrutura do Módulo**

O módulo será composto pelas seguintes áreas:

* Barra superior \+ botão de criar nova atividade;  
* Barra de pesquisa \+ Área de filtros;  
* Visualização de atividades, que pode ser em formato de Lista e de cards;  
* Possibilidade de definição da priorização das informações a serem exibidas (Opção de “ordenar por” com as opções: data de criação, prazo, prioridade)  
* Paginação (caso necessária);

---

# **5.4 Barra Superior**

A barra superior deverá conter:

* título do módulo;  
* quantidade total de atividades;  
* botão "Nova Atividade";  
* botão de importar/exportar (futuro);  
* botão de configurações do módulo (futuro).

---

# **Pesquisa e Filtros**

Regras e comportamento:

* Possibilidade de combinar os filtros  
* Os filtros deverão ser cumulativos  
* Será possível utilizar diversos filtros simultaneamente  
* Possibilidade de selecionar mais de uma opção em todos os campos  
* A pesquisa deverá localizar atividades utilizando qualquer informação cadastrada.  
* Possibilidade de iniciar a digitação no campo do filtros e já serem reportadas as opções compatíveis  
* Os dados exibidos deverão possuir atualização automática  
* A pesquisa deverá atualizar os resultados em tempo real  
* Todos os filtros deverão poder ser limpos individualmente

Os filtros são:

1. Busca por palavras chave em todos os campos  
2. Empresa  
3. Unidade  
4. Tipo  
5. Status  
6. Prioridade  
7. Prazo  
8. Tipo de produto/serviço (opções referentes à MRR ou PS)  
9. Produto/Serviço  
10. Status de negociação  
11. Data de criação  
12. Data limite (prazo indicado)

As opções de ordenação são:

1. data de criação  
2. prazo  
3. prioridade

# **Modos de Visualização**

O módulo deverá possuir dois modos principais, ocupando toda a largura da página:

## **Cards**

* Visualização voltada para gerenciamento.  
* Mais rica visualmente.  
* Maior quantidade de informações.  
* Ideal para trabalho diário.

Para apresentação das informações nos cards e na visão em lista, haverá um padrão e hierarquização das informações. A ordem  e as informações a serem apresentadas no modo de exibição em cards será: 

1. Empresa \+ Unidade  
2. Tipo de atividade (em etiqueta)  
* se o tipo da atividade for \= proposta:   
  * Incluir a informação de todos os Serviço/Produto em destaque, em substituição ao campo assunto  
  * Ao lado da informação referente ao Serviço/Produto, incluir o detalhe desse serviço/produto, se cadastrado. quando preenchido o campo “detalhe” sobre o Serviço/Produto, a informação deve ser indicada ao lado da informação sobre Serviço/Produto no card, com a mesma formatação  
  * Escopo e Amostragem (em menor destaque)  
  * Tipo do produto/serviço (MRR/PS) em etiqueta de menor destaque visual  
  * Valor da(s) proposta(s)  
* Se o tipo da atividade for \= Email, incluir no card/na lista a informação indicada no campo de conteúdo do e-mail (com menor destaque)  
* Se o tipo de atividade for \= Oportunidade, incluir  no card/na lista a informação indicada no campo de Oportunidade (com menor destaque)  
3. índice de conclusão do checklist vinculado em dois formatos (1 em barra de avanço e outro em quantidade)  
4. Se houver vínculo a outra atividade, registro ou planilhas, manter informação em menor destaque mas que mencione o registro/planilha vinculada e que permita o direcionamento direto.  
5. Assunto  
6. Contato (se houver e em menor destaque)  
7. Status de conclusão (em que a etiqueta deverá ser exibida com as seguintes cores e letras em branco:  
   1. Concluído (aparecer com o fundo da cor (\#2E5749)),   
   2. Pendente (aparecer com o fundo da cor (\#780001)  
   3. Em andamento (aparecer com o fundo \#8BAAAD)  
   4. Aguardando Retorno Interno (aparecer com o fundo \#3E4C59)  
   5. Aguardando Retorno Cliente (aparecer com o fundo\#3E4C59  
8. Prioridade: Em etiqueta, neste campo, as opções devem aparecer com as seguintes cores de fundo: Urgente (\#780001), Importante (\#BF512C), Médio (\#DA9B2B), Baixo (\#2E5749)  
9. Status de negociação (quando aplicável)  
10. Prazo (quando vinculado)  
11. Prazos de checklist (quando houver)  
12. índice de conclusão do checklist (quando houver) em formato de barra de avanço e quantidades  
13. Dias em atraso  
14. vínculo a atividade (no caso de registros e planilhas)

## **Lista**

* Visualização compacta.  
* Voltada para consulta rápida.  
* Maior densidade de informações.  
* Ideal para localizar atividades.  
* O sistema deverá memorizar automaticamente qual foi o último modo utilizado.

Neste caso, nos cards, devem ser exibidas as seguintes informações: 

15. Empresa  
16. Unidade  
17. Tipo de atividade  
18. Assunto  
19. Status de conclusão  
20. Status de negociação (quando aplicável)  
21. Prazo (quando vinculado)  
22. Prioridade  
23. Prazos de checklist (quando houver)  
24. índice de conclusão do checklist (quando houver)  
25. Dias em atraso

Regras comuns aos dois formatos

1. Possibilitar a conclusão de toda a atividade na tela de atividades no formato card e lista

---

# **Cadastro de Atividades**

O cadastro deverá ocorrer em um formulário organizado por seções, reduzindo a sensação de burocracia.

A disposição dos campos deverá seguir uma hierarquia lógica.

Informações principais primeiro.

Informações complementares depois.

Campos opcionais deverão permanecer recolhidos até serem utilizados.

Nenhum campo será de preenchimento obrigatório

---

# **Campos do Cadastro**

## **Identificação**

1\. Empresa: texto livre, porém, quando eu cadastrar uma empresa, ela já deverá aparecer em uma lista de opções para esta e todas as outras atividades existentes e futuras. Além disso, eu tenho que ter a possibilidade de editar, excluir e incluir cada um. 

2\. Unidade: texto livre, porém, quando eu cadastrar uma empresa, ela já deverá aparecer em uma lista de opções para esta e todas as outras atividades existentes e futuras. Além disso, eu tenho que ter a possibilidade de editar, excluir e incluir cada um

3\. Assunto 

4\. Tipo de atividade: já deve existir uma lista pré criada de tipos de atividade, a possibilidade de eu selecionar cada uma ou mais de uma delas, criar um novo tipo de atividade para a lista e excluir a que eu quiser. depois que eu criar uma atividade ela aparecerá em todas as novas atividades e quando excluir, ela será excluída de tudo também. A lista pré criada deve conter (Proposta, Faturamento, Suporte, Interno, Aceite, Levantamento, Email, Agendamento, Oportunidade)

Sobre as atividades: quando eu selecionar as opções:

4.1. E-mail: abrir campo de texto livre

4.2. Oportunidade \- deve abrir campo para eu inserir texto curto

4.3. Proposta: deve abrir vários campos específicos que serão descritos no campo abaixo, chamado “Campos proposta” 

5\. Contato

6\. Prazo

7\. Campo para descrição da atividade (texto livre)

8\. Status de conclusão

8.1. Concluído

8.2. Pendente

8.3. Aguardando retorno interno

8.4. Aguardando retorno cliente

9\. Checklist: de próximos passos, em que eu vou criar itens e que vou poder dar check neles. Posso criar, editar e excluir cada item.

10\. prioridade (urgente, importante, médio, baixo) 

11\. contador de dias em pendência.

Descrição resumida da atividade.

Obrigatório.

---

Descrição

Texto livre.

Aceita múltiplos parágrafos.

Permite formatação simples.

Opcional.

---

Tipo

Selecionável.

Editável pelo usuário.

Obrigatório.

---

Categoria

Selecionável.

Configurável.

Opcional.

---

Empresa

Selecionável.

Permite pesquisa.

Opcional.

---

Unidade

Relacionada à empresa.

Opcional.

---

# **5.10 Controle**

Status

Configurável.

Usuário poderá criar novos.

Obrigatório.

---

Prioridade

Configurável.

Usuário poderá criar novos níveis.

Obrigatório.

---

Data de criação

Automática.

---

Prazo

Opcional.

---

Data de conclusão

Preenchimento automático.

---

# **5.11 Organização**

Etiquetas

Quantidade ilimitada.

Editáveis.

Coloridas.

---

Área

Configurável.

---

Projeto

Configurável futuramente.

---

Processo

Configurável futuramente.

---

# **5.12 Informações Complementares**

Observações

Texto livre.

---

Links

Quantidade ilimitada.

---

Anexos

Quantidade ilimitada.

---

Registros vinculados

Selecionáveis.

---

Planilhas vinculadas

Selecionáveis.

---

Execuções vinculadas

Selecionáveis.

---

# **5.13 Salvamento**

Ao salvar:

A atividade deverá ser criada imediatamente.

Sem recarregar toda a página.

Após criada:

Poderá receber vínculos.

Registros.

Planilhas.

Execuções.

Anexos.

---

# **5.14 Cards**

Cada card deverá apresentar apenas informações relevantes.

Exemplo:

Título

Empresa

Status

Prioridade

Prazo

Etiquetas

Indicador de anexos

Indicador de registros

Indicador de planilhas

Indicador de checklist

Indicador de comentários (futuro)

Botões rápidos.

Os cards deverão possuir altura variável.

Nunca deverão desperdiçar espaço.

---

# **5.15 Lista**

A lista deverá permitir visualizar grande quantidade de atividades.

Colunas configuráveis futuramente.

Ordenação por qualquer coluna.

Redimensionamento de colunas futuramente.

---

# **5.16 Ordenação**

O usuário poderá ordenar por:

Título

Prazo

Prioridade

Status

Empresa

Categoria

Criação

Atualização

Conclusão

---

# **5.17 Ações Rápidas**

Sem abrir a atividade.

Será possível:

Alterar status.

Alterar prioridade.

Duplicar.

Arquivar.

Excluir.

Concluir.

Mover.

---

# **5.18 Detalhamento da Atividade**

Ao abrir uma atividade, o usuário visualizará todas as informações relacionadas.

O detalhamento deverá apresentar:

Informações principais.

Descrição.

Cronologia.

Registros.

Planilhas.

Execuções.

Anexos.

Links.

Histórico.

Observações.

---

# **5.19 Relacionamentos**

A atividade será o principal objeto do sistema.

Poderá possuir relacionamento com:

Registros.

Planilhas.

Execuções.

Documentos.

Empresas.

Projetos.

Categorias.

Etiquetas.

---

# **5.20 Fluxo de Utilização**

Criar atividade.

↓

Salvar.

↓

Executar.

↓

Criar registros.

↓

Criar planilhas.

↓

Vincular execuções.

↓

Atualizar status.

↓

Concluir.

↓

Arquivar (opcional).

---

# **5.21 Regras Obrigatórias**

* Nenhum campo configurável poderá ser fixo.  
* Todo cadastro deverá ser editável posteriormente.  
* Toda informação poderá ser pesquisada.  
* Toda atividade poderá ser duplicada.  
* Toda atividade poderá ser arquivada sem exclusão definitiva.  
* Nenhum relacionamento poderá gerar duplicidade de dados.  
* O sistema deverá permitir crescimento futuro sem alteração da estrutura principal.

---

## **📌 Minha principal sugestão de evolução (e eu faria isso antes mesmo de escrever código)**

Eu **não faria a tela de cadastro e a tela de detalhes como duas páginas diferentes**.

Eu faria uma abordagem semelhante ao Notion e ao Linear:

* Na lista de atividades, ao clicar em uma atividade, abre-se um **painel lateral (drawer)** ou uma área expandida com todos os detalhes.  
* Nesse mesmo painel é possível editar, vincular registros, anexar planilhas, alterar status, comentar e consultar o histórico.

Com isso, você não perde o contexto da lista, faz menos cliques e o sistema fica muito mais fluido. Para quem trabalha gerenciando muitas atividades ao longo do dia, essa experiência costuma ser significativamente melhor do que abrir uma nova página para cada item. Eu deixaria essa decisão registrada na documentação desde já, mesmo que a implementação venha em uma etapa posterior.

CRIAR ATIVIDADE:

- [x] ~~Popup para cadastro da atividade em tela inteira~~  
- [x] ~~Se a atividade tiver checklist, fora dela, no card, aparecer um nível de conclusão com base no checklist~~  
- [x] ~~Se a tarefa for de proposta, aparecer o valor total das propostas fora dela, no card~~  
- [x] ~~Possibilidade de colocar prazo para o item do checklist (mas também de excluir o campo de prazo do item da lista)~~  
- [ ] possibilidade de ver em kanban e em lista   
- [ ]
