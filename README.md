# To-do List Vue

## Como instalar

```bash
npm install
copy .env.example .env
```

Edita o `.env` e coloca a tua ligacao MySQL em `DATABASE_URL`.

Exemplo:

```env
DATABASE_URL="mysql://root:password@localhost:3306/todo_app"
```

## Criar as tabelas da base de dados

Garante primeiro que a base de dados existe no MySQL. Depois corre:

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
```

As migrations em `prisma/migrations` recriam a estrutura das tabelas:

- `utilizadores`
- `tarefas`
- `tarefas_partilhas`

## Correr o projeto

```bash
npm run build
node backend/server.js
```

Durante desenvolvimento, o frontend tambem pode ser iniciado com:

```bash
npm run dev
```

Nota: o Prisma guarda a estrutura das tabelas nas migrations, mas nao guarda os dados existentes. Para enviar tambem os dados da tua base de dados, faz um export/dump separado no MySQL.
