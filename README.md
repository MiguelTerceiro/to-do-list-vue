# To Do List Vue

Projeto com frontend em Vue 3 e backend em Node.js/Express com Prisma e MySQL.

## O que ja esta automatico

Quando o backend arranca, ele tenta:

1. Criar a base de dados MySQL se ela ainda nao existir.
2. Aplicar as migrations pendentes do Prisma.
3. Ligar o servidor na porta configurada.

Isto significa que o teu colega nao precisa de criar as tabelas manualmente.

## Pre-requisitos

- Node.js 18 ou superior
- MySQL a correr localmente
- Um utilizador MySQL com permissao para criar bases de dados na primeira execucao

## Passos para deixar o projeto a funcionar

### 1. Clonar ou descompactar o projeto

Colocar a pasta do projeto na maquina.

### 2. Configurar o backend

Entrar na pasta `backend` e criar o ficheiro `.env` a partir de `.env.example`.

Valores minimos:

- `PORT=3000`
- `JWT_SECRET=uma-chave-tua`
- `DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/todo_app"`

Em alternativa, pode usar:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Se quiser login Google, preencher tambem:

- `GOOGLE_CLIENT_ID`

Se quiser envio de email, preencher tambem:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### 3. Configurar o frontend

Entrar na pasta `frontend` e criar o ficheiro `.env` a partir de `.env.example`.

Valores recomendados:

- `VITE_API_BASE_URL=/api`
- `VITE_GOOGLE_CLIENT_ID=` opcional

Se este valor ficar vazio, o frontend tenta ler o `GOOGLE_CLIENT_ID` publico do backend.

### 4. Instalar dependencias

No backend:

```powershell
cd backend
npm.cmd install
```

No frontend:

```powershell
cd frontend
npm.cmd install
```

### 5. Preparar a base de dados

Podes correr manualmente este comando uma vez:

```powershell
cd backend
npm.cmd run db:setup
```

Este comando:

1. Cria a base `todo_app` se nao existir.
2. Aplica as migrations do Prisma.

Mesmo que nao corras este comando, o backend tenta fazer isto automaticamente ao arrancar.

### 6. Arrancar o backend

```powershell
cd backend
npm.cmd run dev
```

### 7. Arrancar o frontend

Noutro terminal:

```powershell
cd frontend
npm.cmd run dev
```

### 8. Abrir no browser

Abrir:

- `http://localhost:5173`

## Comandos uteis

Backend:

```powershell
npm.cmd run db:setup
npm.cmd run prisma:generate
npm.cmd run prisma:migrate:deploy
npm.cmd run prisma:studio
```

Frontend:

```powershell
npm.cmd run dev
npm.cmd run build
```

## Se alguma coisa falhar

- Confirmar que o MySQL esta ligado.
- Confirmar que o utilizador do MySQL tem permissao para criar bases de dados.
- Confirmar que a porta `3000` nao esta ocupada por outra app.
- Confirmar que a porta `5173` nao esta ocupada.
- Se o PowerShell bloquear `npm`, usar `npm.cmd`.
