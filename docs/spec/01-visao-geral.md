# Visao geral

# **01\. VISÃO GERAL DO SISTEMA**

## **1.1 Objetivo do Sistema**

O sistema tem como objetivo centralizar, organizar e gerenciar todas as informações relacionadas às atividades do usuário em um único ambiente, permitindo controlar desde a execução das tarefas até toda a documentação, registros, levantamentos, planilhas e demais informações produzidas ao longo do processo.

O sistema não deve ser apenas um gerenciador de tarefas. Seu propósito é funcionar como um ambiente completo de trabalho (Workspace), onde cada informação gerada possa ser organizada, localizada e vinculada ao contexto ao qual pertence.

A proposta é substituir a utilização de diversos aplicativos isolados (agenda, bloco de notas, planilhas, documentos, checklist, controle de tarefas etc.) por um único sistema integrado.

---

## **1.2 Objetivos Principais**

O sistema deverá atender aos seguintes objetivos:

### **Gestão de Atividades**

Permitir o gerenciamento completo das atividades do usuário, acompanhando todo o ciclo de vida da atividade, desde sua criação até sua conclusão.

---

### **Organização das Informações**

Permitir que todas as informações relacionadas às atividades permaneçam organizadas e vinculadas entre si.

Exemplos:

* registros;  
* documentos;  
* planilhas;  
* observações;  
* levantamentos;  
* históricos;  
* arquivos.

---

### **Centralização**

Eliminar a necessidade de utilizar diversos programas para controlar o trabalho.

Todo o gerenciamento deverá ocorrer dentro do próprio sistema.

---

### **Produtividade**

Reduzir tempo gasto procurando informações.

Reduzir retrabalho.

Evitar esquecimentos.

Melhorar o acompanhamento das atividades.

---

### **Evolução Contínua**

O sistema deverá ser desenvolvido de forma modular, permitindo a inclusão de novos módulos futuramente sem necessidade de reconstrução da arquitetura.

Exemplos de futuras expansões:

* vendas;  
* comissão;  
* financeiro;  
* CRM;  
* gestão de clientes.

---

## **1.3 Público-alvo**

O sistema será utilizado exclusivamente pelo próprio usuário.

Não será desenvolvido inicialmente para múltiplos usuários.

Todas as funcionalidades deverão considerar que existe apenas um usuário administrador, com acesso total ao sistema.

---

## **1.4 Plataformas**

O sistema deverá funcionar integralmente em:

* computador;  
* notebook;  
* tablet;  
* celular.

Deverá ser compatível com os principais navegadores modernos.

O layout deverá ser totalmente responsivo.

---

## **1.5 Filosofia do Sistema**

O sistema deverá seguir os seguintes princípios:

* simplicidade;  
* rapidez;  
* organização;  
* clareza;  
* flexibilidade;  
* fluidez.

O usuário nunca deverá sentir que está utilizando um ERP tradicional.

O sistema deverá transmitir a sensação de um aplicativo moderno de produtividade.

---

## **1.6 Princípios de Desenvolvimento**

Durante todo o desenvolvimento do sistema deverão ser respeitadas obrigatoriamente as seguintes regras:

### **Regra 01**

Nenhuma alteração poderá modificar funcionalidades existentes sem solicitação explícita.

---

### **Regra 02**

Sempre que possível, novas funcionalidades deverão ser adicionadas sem alterar a lógica existente.

---

### **Regra 03**

Todo componente deverá ser reutilizável.

---

### **Regra 04**

Todo módulo deverá ser independente.

---

### **Regra 05**

Todo comportamento deverá ser padronizado em todo o sistema.

---

### **Regra 06**

Sempre que possível, o usuário deverá conseguir personalizar o sistema sem necessidade de programação.

Exemplos:

* criar novos status;  
* alterar cores;  
* criar prioridades;  
* editar categorias;  
* alterar opções de seleção.

---

### **Regra 07**

O sistema deverá ser preparado para crescer continuamente.

Nenhuma decisão de desenvolvimento poderá limitar futuras expansões.

---

### **Regra 08**

O sistema deverá priorizar poucos cliques para executar qualquer ação.

Fluxos longos deverão ser evitados.

---

### **Regra 09**

Sempre que possível, as telas deverão privilegiar a visualização das informações em vez do preenchimento de formulários.

O usuário deverá passar mais tempo visualizando e gerenciando informações do que preenchendo campos.

---

### **Regra 10**

Toda informação cadastrada deverá poder ser localizada posteriormente por meio de pesquisa ou filtros.

---

## **1.7 Estrutura Inicial do Sistema**

A primeira versão do sistema será composta pelos seguintes módulos:

* Dashboard;  
* Calendário;  
* Atividades;  
* Execuções;  
* Registros;  
* Planilhas;  
* Configurações.

Após a estabilização da primeira versão, poderão ser adicionados novos módulos, como:

* Vendas;  
* Comissão;  
* Financeiro;  
* CRM;  
* Clientes;  
* Indicadores personalizados.
