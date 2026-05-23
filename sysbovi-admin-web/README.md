# Sysbovi Admin Web

Painel administrativo do Sysbovi, construído com [Next.js](https://nextjs.org), React 19 e Tailwind CSS 4.

## Tecnologias

- **Next.js 16** com App Router e Turbopack
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**
- **Lucide React** para ícones
- **Sonner** para notificações

## Pré-requisitos

- Node.js 20+
- API do Sysbovi rodando (ver `sysbovi-api`)

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.local.example .env.local
```

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API (ex: `http://localhost:3001/api`) |

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build para produção

```bash
npm run build
npm run start
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento com Turbopack |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Verifica erros de lint |
