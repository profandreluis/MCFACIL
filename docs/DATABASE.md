# Database Migrations & Schema

## Arquitetura

O projeto usa **D1 (SQLite)** com suporte a migrations automáticas via worker middleware.

## Schema Atual

### Tabela: `classes`

```sql
CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  school_year TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_school_year ON classes(school_year);
```

**Colunas:**
- `id`: Identificador único (auto-incrementado)
- `name`: Nome da turma (ex: "1º Ano A")
- `school_year`: Ano letivo (ex: "2024")
- `created_at`: Timestamp de criação
- `updated_at`: Timestamp de última atualização

---

### Tabela: `students`

```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  number INTEGER,
  phone TEXT,
  profile_photo_url TEXT,
  life_project TEXT,
  youth_club_semester_1 TEXT,
  youth_club_semester_2 TEXT,
  elective_semester_1 TEXT,
  elective_semester_2 TEXT,
  tutor_teacher TEXT,
  guardian_1 TEXT,
  guardian_2 TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_name ON students(name);
```

**Colunas:**
- `id`: Identificador único
- `class_id`: Referência à turma (FK)
- `name`: Nome completo do aluno
- `status`: Status (ex: "Ativo", "Inativo", "Transferido")
- `number`: Número de chamada
- `phone`: Telefone para contato
- `profile_photo_url`: URL da foto de perfil (armazenada em R2)
- `life_project`: Descrição do projeto de vida
- `youth_club_semester_1`: Participação em clube da juventude (1º semestre)
- `youth_club_semester_2`: Participação em clube da juventude (2º semestre)
- `elective_semester_1`: Disciplina eletiva (1º semestre)
- `elective_semester_2`: Disciplina eletiva (2º semestre)
- `tutor_teacher`: Professor orientador
- `guardian_1`: Responsável 1
- `guardian_2`: Responsável 2

---

### Tabela: `teachers`

```sql
CREATE TABLE teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile_photo_url TEXT,
  subjects TEXT,
  yearly_goals TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_name ON teachers(name);
```

**Colunas:**
- `id`: Identificador único
- `name`: Nome do professor
- `email`: Email
- `phone`: Telefone
- `profile_photo_url`: URL da foto de perfil
- `subjects`: JSON array de disciplinas (ex: `["Português", "Redação"]`)
- `yearly_goals`: JSON array de objetivos anuais

---

### Tabela: `activities`

```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  max_score REAL,
  weight REAL,
  order_index INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_activities_class_id ON activities(class_id);
```

**Colunas:**
- `id`: Identificador único
- `class_id`: Referência à turma
- `name`: Nome da atividade/avaliação
- `max_score`: Nota máxima possível (ex: 10)
- `weight`: Peso na nota final (0-1, ex: 0.5 = 50%)
- `order_index`: Ordem de exibição

---

### Tabela: `grades`

```sql
CREATE TABLE grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE(student_id, activity_id)
);

CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_activity_id ON grades(activity_id);
```

**Colunas:**
- `id`: Identificador único
- `student_id`: Referência ao aluno
- `activity_id`: Referência à atividade
- `score`: Nota obtida (NULL = não avaliado)
- Constraint: Cada aluno tem apenas uma nota por atividade

---

## Migrations Automáticas

### Como Funcionam

1. **Primeira Requisição:** Quando a aplicação faz a primeira requisição a um endpoint (ex: `GET /api/students`), o middleware verifica se as tabelas existem.

2. **Criação Automática:** Se uma tabela não existe, ela é criada automaticamente.

3. **Middleware de Inicialização:**

```typescript
// src/worker/index.ts
app.use(async (c, next) => {
  // Verifica/cria tabelas automaticamente
  await initializeTables(c.env.DB);
  await next();
});
```

### Executar Migrations Manualmente

**Check (sem alterar dados):**
```bash
curl -X POST http://localhost:8787/internal/migrate-safe \
  -H "x-migration-secret: seu-segredo"
```

**Forçar (cuidado - destrutivo):**
```bash
curl -X POST http://localhost:8787/internal/migrate \
  -H "x-migration-secret: seu-segredo"
```

## Versionamento de Migrations

As migrations estão em `migrations/` com padrão de versionamento:

```
migrations/
├── 1.sql              # Criar tabelas base
├── 2.sql              # Adicionar índices
├── 3.sql              # Migrations futuras
├── 1/
│   └── down.sql       # Reversão da migration 1
├── 2/
│   └── down.sql       # Reversão da migration 2
└── 3/
    └── down.sql       # Reversão da migration 3
```

## Exemplo: Adicionar Coluna em `students`

### Up Migration (1.sql)

```sql
-- migrations/4.sql
ALTER TABLE students ADD COLUMN attendance_percentage REAL DEFAULT 0;
ALTER TABLE students ADD COLUMN special_needs TEXT;
```

### Down Migration (4/down.sql)

```sql
-- migrations/4/down.sql
ALTER TABLE students DROP COLUMN attendance_percentage;
ALTER TABLE students DROP COLUMN special_needs;
```

## Backup & Restore

### Backup D1

```bash
wrangler d1 backup create gestao-escolar
```

### Listar Backups

```bash
wrangler d1 backup list gestao-escolar
```

### Restore

```bash
wrangler d1 backup restore gestao-escolar <backup-id>
```

## Troubleshooting

### Constraint Foreign Key Falhando

Se tiver erro ao deletar uma classe:

```sql
-- D1 suporta FK, mas pode estar desabilitado
PRAGMA foreign_keys = ON;
DELETE FROM classes WHERE id = 1;
```

### Índices não Criados

Se notar slowness em queries, adicione índices manualmente:

```bash
wrangler d1 execute gestao-escolar --remote \
  --command "CREATE INDEX idx_students_status ON students(status);"
```

### Reset Completo do Banco

⚠️ **Perigoso - apaga tudo:**

```bash
wrangler d1 execute gestao-escolar --remote \
  --command "DROP TABLE IF EXISTS grades; DROP TABLE IF EXISTS activities; DROP TABLE IF EXISTS students; DROP TABLE IF EXISTS teachers; DROP TABLE IF EXISTS classes;"
```

Depois execute `POST /internal/migrate` para recriar.

## Referências

- [D1 SQL Docs](https://developers.cloudflare.com/d1/platform/data-types/)
- [SQLite PRAGMA Reference](https://www.sqlite.org/pragma.html)
- [Foreign Keys in SQLite](https://www.sqlite.org/foreignkeys.html)
