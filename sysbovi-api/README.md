# Sysbovi API

API REST do Sysbovi, construída com [NestJS](https://nestjs.com), TypeORM e PostgreSQL.

## Tecnologias

- **NestJS 10** com arquitetura modular
- **TypeORM** para mapeamento e migrações do banco
- **PostgreSQL 15**
- **JWT** para autenticação
- **Passport** para estratégias de autenticação
- **bcrypt** para hash de senhas
- **class-validator** para validação de DTOs

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+ (ou Docker)

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host do banco de dados |
| `DB_PORT` | Porta do PostgreSQL (padrão: `5432`) |
| `DB_USER` | Usuário do banco |
| `DB_PASS` | Senha do banco |
| `DB_NAME` | Nome do banco de dados |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `JWT_EXPIRES_IN` | Tempo de expiração do token (ex: `7d`) |
| `NODE_ENV` | Ambiente (`development`, `production`, `test`) |
| `PORT` | Porta da API (padrão: `3001`) |

## Rodando com Docker

Na raiz do monorepo, copie e preencha o `.env`:

```bash
cp .env.example .env
docker-compose up -d
```

## Rodando em desenvolvimento

```bash
npm install
npm run start:dev
```

A API estará disponível em [http://localhost:3001](http://localhost:3001).

## Migrações

| Comando | Descrição |
|---|---|
| `npm run migration:generate -- src/database/migrations/NomeDaMigration` | Gera uma nova migration |
| `npm run migration:run` | Executa as migrations pendentes |
| `npm run migration:revert` | Reverte a última migration |
| `npm run migration:show` | Lista o status das migrations |

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Inicia em modo watch (desenvolvimento) |
| `npm run build` | Gera build de produção |
| `npm run start:prod` | Inicia o build de produção |
| `npm run lint` | Verifica e corrige erros de lint |
| `npm run test` | Executa os testes unitários |
| `npm run test:cov` | Executa testes com relatório de cobertura |
| `npm run seed` | Popula o banco com dados iniciais |
