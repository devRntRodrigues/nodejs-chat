# Node.js Chat API

> Real-time chat application with WebSocket support built with Express, Socket.IO, and Next.js

## 🚀 Stack Tecnológica

### Backend (API)

- **Node.js** + **TypeScript**
- **Express** - REST API
- **Socket.IO** - Real-time messaging
- **Mongoose** - MongoDB ODM
- **Passport.js** - Authentication
- **Vitest** - E2E Testing

### Frontend (Web)

- **Next.js** + **React**
- **TypeScript**
- **Tailwind CSS**
- **Socket.IO Client**
- **React Hook Form** + **Zod**

### Infrastructure

- **MongoDB** - Database
- **Docker** + **Docker Compose** - Containerization
- **pnpm workspaces** - Monorepo management

---

## 📋 Pré-requisitos

- **Node.js** 24+ (LTS) - Recomendado usar [nvm](https://github.com/nvm-sh/nvm)
- **pnpm** 10+ - `npm install -g pnpm` ou `corepack enable`
- **Docker** & **Docker Compose** (opcional, mas recomendado)

---

## 🛠️ Instalação

```bash
git clone <repository-url>
cd nodejs-chat-api

pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

---

## 🏃 Desenvolvimento Local

### 1️⃣ Subir apenas o MongoDB

```bash
pnpm docker:up
```

Isso iniciará:

- 🗄️ **MongoDB** em `localhost:27017`
- 🔍 **Mongo Express** em `http://localhost:8081`

### 2️⃣ Iniciar a API (em outro terminal)

```bash
pnpm --filter api dev
```

A API estará disponível em `http://localhost:3001`

### 3️⃣ Iniciar o Frontend (em outro terminal)

```bash
pnpm --filter web dev
```

O frontend estará disponível em `http://localhost:3000`

### 🌐 URLs de Desenvolvimento Local

| Serviço              | URL                       | Descrição                  |
| -------------------- | ------------------------- | -------------------------- |
| 🌐 **Frontend**      | http://localhost:3000     | Next.js application        |
| 🚀 **API**           | http://localhost:3001     | Express + Socket.IO server |
| 🗄️ **Mongo Express** | http://localhost:8081     | MongoDB admin interface    |
| 📊 **MongoDB**       | mongodb://localhost:27017 | Database connection        |

---

## 🐳 Via Docker

Se você preferir rodar tudo via Docker:

### Opção 1: Foreground

```bash
pnpm docker:dev:all
```

### Opção 2: Background

```bash
pnpm docker:up:all
```

Para ver os logs depois:

```bash
pnpm docker:logs
```

### 🌐 URLs no Docker

As URLs são as mesmas, pois os containers expõem as portas para o host:

| Serviço       | URL                   |
| ------------- | --------------------- |
| Frontend      | http://localhost:3000 |
| API           | http://localhost:3001 |
| Mongo Express | http://localhost:8081 |

---

## 🔐 Variáveis de Ambiente

### Backend (`apps/api/.env`)

```env
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://admin:password@localhost:27017/chat?authSource=admin
JWT_SECRET=your_secret_key_min_32_characters_long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

**⚠️ Importante:**

- O `JWT_SECRET` deve ter no mínimo 32 caracteres
- Gere um secret seguro com: `openssl rand -base64 32`
- Em Docker, `localhost` é substituído por `mongo` automaticamente

### Frontend (`apps/web/.env`)

```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🧪 Testes

O projeto inclui testes E2E completos para a API:

```bash
# Rodar todos os testes E2E
pnpm --filter api test:e2e

# Modo watch (desenvolvimento)
pnpm --filter api test:watch
```

Os testes usam **MongoDB Memory Server** (não precisa de Docker).

---

## 🐳 Comandos Docker

```bash
# Subir apenas MongoDB + Mongo Express
pnpm docker:up

# Subir tudo (mongo + api + web) em background
pnpm docker:up:all

# Subir tudo com logs visíveis
pnpm docker:dev:all

# Ver logs de todos os serviços
pnpm docker:logs

# Reiniciar apenas API e Web
pnpm docker:restart

# Parar tudo e remover volumes
pnpm docker:down
```

## 👥 Autores

Desenvolvido com ❤️ por [DevRnT]
