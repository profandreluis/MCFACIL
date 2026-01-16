# Gestão Escolar (MCFACIL)

Sistema de gestão escolar completo com suporte a turmas, alunos, professores, atividades e notas.

## Arquitetura

- **Frontend:** React 19 + Vite (nova app em `src/new-app`, app legada em `src/react-app`)
- **Backend/Worker:** Hono.js + Cloudflare Workers
- **Database:** D1 (SQLite-like via Cloudflare)
- **Storage:** R2 Bucket (Cloudflare)
- **TypeScript:** Compilação strict com ESLint

## Pré-requisitos

- Node.js 20+
- npm 10+
- Git

## Instalação Rápida

```bash
npm install --legacy-peer-deps
npm run dev
```

Acesse http://localhost:5174

## Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev              # Dev server (app legada)
npm run dev:new-app      # Dev server (nova app)
npm run check            # Verificar tipos
npm run lint             # ESLint
npm run test             # Rodar testes (Vitest)
npm run test:ui          # Rodar testes com UI
```

### Build & Deploy

```bash
npm run build            # Build app legada
npm run build:new-app    # Build nova app
npm run build:worker     # Build worker
npx wrangler deploy      # Deploy (requer wrangler.json)
```

## Endpoints da API

| Recurso | Método | Endpoint | Descrição |
|---------|--------|----------|-----------|
| Turmas | GET | `/api/classes` | Listar turmas |
| Turmas | POST | `/api/classes` | Criar turma |
| Turmas | PUT | `/api/classes/:id` | Atualizar turma |
| Turmas | DELETE | `/api/classes/:id` | Deletar turma |
| Alunos | GET | `/api/students` | Listar alunos |
| Alunos | POST | `/api/students` | Criar aluno |
| Alunos | POST | `/api/students/:id/photo` | Upload foto |
| Professores | GET | `/api/teachers` | Listar professores |
| Professores | POST | `/api/teachers` | Criar professor |
| Atividades | GET | `/api/activities` | Listar atividades |
| Atividades | POST | `/api/activities` | Criar atividade |
| Notas | GET | `/api/grades` | Listar notas |
| Notas | POST | `/api/grades` | Salvar nota |

## Endpoints Internos

Requerem header `x-migration-secret`:

- `POST /internal/migrate` — Force re-run migrations (destructive)
- `POST /internal/migrate-safe` — Check migrations without applying

## Estrutura de Pastas

```
src/
├── new-app/              # Nova app (Vite/React)
├── react-app/            # App legada
├── shared/types.ts       # Tipos compartilhados
└── worker/index.ts       # Hono worker (API)
```

## Desenvolvimento Local

1. Instalar: `npm install --legacy-peer-deps`
2. Verificar tipos: `npm run check`
3. Lint: `npm run lint`
4. Testes: `npm run test`
5. Dev: `npm run dev`

## Testes

O projeto usa **Vitest** para testes:

```bash
npm run test             # Rodar testes uma vez
npm run test:ui          # Abrir UI dos testes
```

Testes estão em `src/__tests__/`.

## Contribuindo

```bash
git checkout -b feature/sua-feature
git commit -m "feat: descrição"
npm run check && npm run lint
git push -u origin feature/sua-feature
```

Abra um Pull Request para review.

## Endpoints Internos de Migração

O worker expõe dois endpoints para gerenciar a migração da tabela `teachers`:

- `POST /internal/migrate` (modo destrutivo):
  - Requer header `x-migration-secret`
  - Executa `DROP TABLE IF EXISTS teachers` e recria a tabela
  - Use com cuidado — remove dados existentes

- `POST /internal/migrate-safe` (modo seguro):
  - Requer header `x-migration-secret`
  - Inspeciona o banco e retorna relatório sem aplicar mudanças
  - Útil para validar mudanças antes de aplicar

## Licença

Proprietary - MCFACIL 2025-2026
