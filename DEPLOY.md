# Guia de Deploy — SysBovi

## Pré-requisitos

- Docker ≥ 24 e Docker Compose ≥ 2.20
- Git
- Acesso ao servidor de produção (SSH)
- Domínio configurado com DNS apontando para o servidor

---

## 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` com valores reais de produção:

| Variável            | Descrição                                      |
|---------------------|------------------------------------------------|
| `POSTGRES_USER`     | Usuário do banco de dados                      |
| `POSTGRES_PASSWORD` | Senha forte do banco (min. 16 caracteres)      |
| `POSTGRES_DB`       | Nome do banco (`sysbovi_db`)                   |
| `REDIS_PASSWORD`    | Senha forte do Redis                           |
| `JWT_SECRET`        | Chave secreta JWT (min. 64 caracteres)         |
| `JWT_EXPIRES_IN`    | Expiração do token (`7d` recomendado)          |
| `FRONTEND_URL`      | URL pública do admin web (ex: `https://admin.seudominio.com`) |
| `NEXT_PUBLIC_API_URL` | URL pública da API (ex: `https://api.seudominio.com/api`) |

> **Nunca comitar o arquivo `.env`** — ele já está no `.gitignore`.

---

## 2. Primeira execução (banco novo)

```bash
# Subir apenas os serviços de infraestrutura
docker compose up -d postgres redis

# Aguardar o postgres ficar pronto (healthcheck)
docker compose ps

# Rodar as migrações
docker compose run --rm api npm run migration:run

# Criar o super admin com credenciais seguras
ADMIN_EMAIL=admin@seudominio.com \
ADMIN_PASSWORD=senha_forte_aqui \
ADMIN_NOME="Super Admin" \
docker compose run --rm api npx ts-node src/database/seed-prod.ts

# Subir todos os serviços
docker compose up -d
```

---

## 3. Deploy de nova versão

```bash
# Atualizar código
git pull origin main

# Rebuild das imagens
docker compose build --no-cache

# Rodar migrações antes de subir
docker compose run --rm api npm run migration:run

# Restart sem downtime (rolling)
docker compose up -d --no-deps api admin-web
```

---

## 4. Verificar saúde dos serviços

```bash
# Status dos containers
docker compose ps

# Logs em tempo real
docker compose logs -f api
docker compose logs -f admin-web

# Teste rápido da API
curl https://api.seudominio.com/api/auth/me
```

---

## 5. Nginx como reverse proxy (recomendado)

Instalar o nginx no servidor e configurar os virtual hosts:

```nginx
# /etc/nginx/sites-available/sysbovi-api
server {
    listen 80;
    server_name api.seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```nginx
# /etc/nginx/sites-available/sysbovi-admin
server {
    listen 80;
    server_name admin.seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/admin.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.seudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar e obter certificado SSL:

```bash
ln -s /etc/nginx/sites-available/sysbovi-api   /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/sysbovi-admin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Certificado Let's Encrypt
certbot --nginx -d api.seudominio.com -d admin.seudominio.com
```

---

## 6. GitHub Actions — Secrets necessários

Configurar em **Settings → Secrets and variables → Actions**:

| Secret                | Descrição                              |
|-----------------------|----------------------------------------|
| `POSTGRES_USER`       | Usuário do banco (CI e produção)       |
| `POSTGRES_PASSWORD`   | Senha do banco                         |
| `JWT_SECRET`          | Chave JWT                              |
| `NEXT_PUBLIC_API_URL` | URL da API (usada no build do Next.js) |

O `GITHUB_TOKEN` é gerado automaticamente pelo GitHub Actions para push no GHCR.

---

## 7. Backup do banco de dados

Adicionar ao cron do servidor:

```bash
# Backup diário às 2h
0 2 * * * docker exec sysbovi_postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > /backups/sysbovi_$(date +\%Y\%m\%d).sql.gz

# Manter apenas os últimos 30 dias
0 3 * * * find /backups -name "sysbovi_*.sql.gz" -mtime +30 -delete
```

---

## 8. Rollback

```bash
# Voltar para a imagem anterior
docker compose stop api admin-web
docker tag ghcr.io/sysboviorg/sysbovi/api:<SHA_ANTERIOR> ghcr.io/sysboviorg/sysbovi/api:latest
docker compose up -d api admin-web

# Se necessário, reverter migração
docker compose run --rm api npm run migration:revert
```
