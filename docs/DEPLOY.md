# Deploy & Configuração Cloudflare Workers

## Pré-requisitos

- Conta Cloudflare
- Wrangler CLI instalado (`npm install -g wrangler`)
- D1 Database criado no Cloudflare
- R2 Bucket criado no Cloudflare

## Setup Inicial

### 1. Autenticar com Cloudflare

```bash
wrangler login
```

Isso abrirá seu navegador para autorizar o Wrangler.

### 2. Configurar `wrangler.toml`

Edite o arquivo `wrangler.toml` na raiz do projeto:

```toml
name = "mcfacil-worker"
type = "service"
main = "src/worker/index.ts"
compatibility_date = "2024-12-01"

[build]
command = "npm run build:worker"

[env.production]
routes = [
  { pattern = "*.mcfacil.com", zone_name = "mcfacil.com" }
]
vars = { ENVIRONMENT = "production" }

[[d1_databases]]
binding = "DB"
database_name = "gestao-escolar"
database_id = "YOUR_D1_DATABASE_ID"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "mcfacil-files"

[vars]
MIGRATION_SECRET = "seu-segredo-super-seguro-aqui"
```

### 3. Definir Variáveis de Ambiente

```bash
# Produção
wrangler secret put MIGRATION_SECRET --env production

# Desenvolvimento
wrangler secret put MIGRATION_SECRET
```

## Build & Deploy

### Dry Run (Simular Deploy)

```bash
wrangler deploy --dry-run
```

Isso mostra exatamente o que seria deployado sem fazer alterações.

### Deploy para Produção

```bash
wrangler deploy --env production
```

### Deploy para Staging/Preview

```bash
wrangler deploy
```

(sem flag `--env` usa o ambiente padrão)

## Verificar Logs

```bash
# Últimos logs
wrangler tail

# Logs com filtro
wrangler tail --format json

# Logs de um endpoint específico
wrangler tail --service mcfacil-worker
```

## Migrations no Banco

### Executar Migrations Automáticas

Na primeira requisição ao endpoint `/api/students`, `/api/teachers` ou `/api/classes`, as migrations são executadas automaticamente via middleware.

### Force Migration (Destrutivo)

```bash
curl -X POST https://seu-worker.workers.dev/internal/migrate \
  -H "x-migration-secret: seu-segredo"
```

⚠️ **Cuidado:** Isso dropa a tabela `teachers` e recria do zero. Dados serão perdidos.

### Safe Migration Check (Não-Destrutivo)

```bash
curl -X POST https://seu-worker.workers.dev/internal/migrate-safe \
  -H "x-migration-secret: seu-segredo"
```

Retorna relatório JSON com:
- `tableExists`: boolean
- `columns`: lista de colunas atuais
- `missingColumns`: colunas que faltam
- `suggestedSql`: SQL sugerido para aplicar manualmente

## Database (D1)

### Acessar D1 Shell

```bash
wrangler d1 shell gestao-escolar
```

### Executar Query

```bash
wrangler d1 execute gestao-escolar --remote --command "SELECT * FROM students LIMIT 10;"
```

### Backup do Banco

```bash
wrangler d1 backup create gestao-escolar
```

## R2 Bucket

### Listar Arquivos

```bash
wrangler r2 objects list mcfacil-files
```

### Sincronizar Pastas Locais

```bash
wrangler r2 sync ./uploads r2://mcfacil-files/uploads
```

## Monitoramento

### Verificar Status do Worker

```bash
wrangler deployments list
```

### Rollback para Versão Anterior

```bash
wrangler rollback
```

## Troubleshooting

### Erro: "D1_BINDING não encontrado"

Certifique-se de que `[[d1_databases]]` está correto em `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "gestao-escolar"
database_id = "seu-id-real"
```

### Erro: "R2_BUCKET undefined"

Verifique se a binding está declarada:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "mcfacil-files"
```

### Timeout em Migrations

Se a migration travar:

1. Acesse o D1 shell
2. Execute `DROP TABLE IF EXISTS teachers;`
3. Re-execute `POST /internal/migrate`

## CI/CD Automático

Para fazer deploy automático no merge para `main`, adicione GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm install --legacy-peer-deps
      - run: npm run build:worker
      - name: Deploy to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler deploy --env production
```

## Referências

- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
