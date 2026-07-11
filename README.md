# Agenda NC

Sistema de controle de atividades, registros de reunião e planilhas, com
isolamento de dados por usuário (multi-tenant) e um assistente de chat com IA
que pode criar/editar/excluir dados via function calling.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- PostgreSQL via [Prisma](https://www.prisma.io) 7
- [NextAuth](https://authjs.dev) 5 (credenciais + JWT) para autenticação
- Tailwind CSS 4 + shadcn/ui
- Chat com fallback entre modelos Gemini e NVIDIA NIM (ver `src/lib/gemini.ts`)

## Pré-requisitos

- Node.js >= 20.9
- Um banco PostgreSQL acessível (local ou remoto)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com:

```bash
# Conexão com o Postgres
DATABASE_URL="postgresql://usuario:senha@host:5432/agenda_nc"

# Segredo usado pelo NextAuth para assinar sessões/JWT (gere com `openssl rand -base64 32`)
AUTH_SECRET="..."

# Credenciais usadas para criar a primeira conta (bootstrap). Após o primeiro
# login bem-sucedido com esse e-mail/senha, a conta é criada no banco com
# role=ADMIN e passa a existir normalmente — essas variáveis podem ser
# removidas depois disso.
ADMIN_EMAIL="voce@empresa.com"
ADMIN_PASSWORD="uma-senha-forte"

# Provedores de IA do chat (pelo menos um é necessário para o chat funcionar)
GEMINI_API_KEY="..."
NVIDIA_API_KEY="..."
```

## Rodando localmente

```bash
npm install
npx prisma migrate deploy   # aplica as migrations no banco configurado em DATABASE_URL
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Faça login com o
`ADMIN_EMAIL`/`ADMIN_PASSWORD` configurados para criar a conta administradora
inicial — só essa conta pode cadastrar novos usuários em `/usuarios`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm start` — aplica migrations pendentes (`prisma migrate deploy`) e sobe o servidor de produção
- `npm run lint` — ESLint

## Estrutura

- `src/app/(app)` — páginas autenticadas (Atividades, Registros, Planilhas, Usuários)
- `src/app/api` — rotas de API (todas escopadas por `userId` da sessão)
- `src/lib/chat-tools.ts` — ferramentas que o chat pode chamar para criar/editar/excluir dados
- `prisma/schema.prisma` — modelo de dados; cada tabela de domínio tem `userId` obrigatório

## Notas de segurança

- Apenas contas com `role = ADMIN` podem listar ou criar usuários (`/api/users`, `/usuarios`).
- Exclusões pedidas via chat exigem confirmação em uma mensagem separada — o
  pedido e a confirmação nunca podem vir da mesma chamada do modelo.
