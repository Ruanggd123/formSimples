# 🚌 Lista Diária de Passageiros

Este projeto é um sistema de gerenciamento de lista de embarque/desembarque (caronas ou transporte diário) que permite aos usuários se inscreverem em tempo real. Os dados são armazenados de forma robusta e segura no **Google Sheets**, com a lógica de back-end executada pelo **Google Apps Script**.

A arquitetura foi desenvolvida para ser rápida e eficiente, contornando limitações de acesso e políticas de compartilhamento através de um método de **download direto forçado** (Base64) para a geração de relatórios em PDF.

## ✨ Funcionalidades Principais

- **Inscrição em Tempo Real:** Usuários podem adicionar seu nome, ação (Subir/Descer/Ambas) e local de embarque/desembarque.
- **Contagem Dinâmica:** Exibe o total de passageiros e a contagem separada de quem está Subindo e Descendo.
- **Controle de Limite:** Impede novas inscrições quando o limite de **46 passageiros** por lista é atingido.
- **Horário de Funcionamento:** O formulário de inscrição é ativado apenas durante um horário pré-definido (ajustável no `script.js`).
- **Modo de Privacidade (NOVO):** Botões para **Esconder/Mostrar** as listas de passageiros individualmente, mantendo a contagem visível. O estado de visualização é salvo no navegador (`localStorage`).
- **Painel Administrativo:** Permite aos administradores (usando um `ADMIN_CODE` secreto):
  - **Deletar** entradas individuais.
  - **Gerar Relatórios em PDF** formatados e estilizados para Subida ou Descida.
- **Download Robusto:** O relatório é salvo no seu Google Drive (na pasta configurada) e o download para o navegador é forçado via `data-uri` para evitar erros de permissão (`403 Forbidden`).

## 🌐 Demonstração Online (Live Demo)

A interface de usuário completa e o design aprimorado deste projeto podem ser acessados através do seu GitHub Pages:

[Lista Diária de Passageiros](https://ruanggd123.github.io/formSimples)

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (Design Universitário Limpo), JavaScript (ES6+).
- **Backend & Database:** Google Sheets, Google Apps Script (GAS).
- **Hospedagem:** GitHub Pages (para o Frontend).

## 🚀 Guia de Instalação e Configuração

Siga os passos abaixo para colocar o projeto no ar:

### Passo 1: Configuração do Google Sheets e Apps Script

1.  **Crie sua Planilha:** Configure uma nova planilha no Google Sheets com as seguintes colunas obrigatórias na primeira linha (Header): `ID`, `Timestamp`, `Nome`, `Acao`, `Local`.
2.  **Copie o Código GAS:** No Google Sheets, vá em **Extensões > Apps Script**. Cole o código completo de **`Código.gs`** fornecido.
3.  **Configure as Variáveis:** No topo do arquivo `Código.gs`, atualize:
    - `ADMIN_CODE`: Defina um código secreto para acesso administrativo (ex: `"1234"`).
    - `DOCUMENT_TEMPLATE_ID`: **ATUALIZE** com o ID do seu template de Google Docs (para gerar os PDFs).
    - `REPORT_FOLDER_ID`: **ATUALIZE** com o ID da pasta do seu Google Drive onde os relatórios PDF serão salvos (seu ID fornecido é `1KhoF8I-gQUKoeyygqnMArQe5rRbGLeQ8`).
4.  **Implantação do Web App:**
    - Clique em **Implantar > Nova Implantação**.
    - Escolha o tipo **Aplicativo da Web (Web App)**.
    - Defina **Executar como:** `Minha conta`.
    - Defina **Quem pode acessar:** `Qualquer pessoa`.
    - Clique em **Implantação**.
    - **AUTORIZE** as permissões solicitadas (Drive, Sheets).
    - **COPIE o URL do aplicativo da Web.**

### Passo 2: Configuração do Frontend (GitHub Pages)

1.  **Crie o Repositório:** Crie um novo repositório no GitHub para hospedar seus arquivos HTML/CSS/JS.
2.  **Suba os Arquivos:** Faça o upload dos arquivos **`index.html`**, **`style.css`** e **`script.js`** para a raiz deste repositório.
3.  **Atualize o `script.js`:** Abra o arquivo `script.js` no seu editor e **SUBSTITUA** a linha `const SCRIPT_URL` pelo **URL do Aplicativo da Web** que você copiou no Passo 1.
    ```javascript
    const SCRIPT_URL = "";
    ```
4.  **Ative o GitHub Pages:**
    - Vá em **Settings > Pages** no seu repositório.
    - Em **Source**, selecione a branch **`main`** (ou `master`) e a pasta **`(root)`**.
    - Clique em **Save**.
    - _Seu site será publicado automaticamente no link fornecido pelo GitHub Pages._

## ⚙️ Uso dos Arquivos

| Arquivo          | Função                                                                                                                                             |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Código.gs`**  | Lógica de Back-end (APIs `doGet` e `doPost`). Responsável por ler/escrever no Google Sheets, deletar registros e gerar os relatórios PDF no Drive. |
| **`index.html`** | Estrutura do site (formulário, listas e modais).                                                                                                   |
| **`style.css`**  | Estilização completa do projeto, usando o esquema de cores universitário.                                                                          |
| **`script.js`**  | Lida com o envio de formulários, o carregamento dinâmico da lista, o controle de limites e a função de **esconder/mostrar listas** (privacidade).  |
