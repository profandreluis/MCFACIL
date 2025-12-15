## Gestão Escolar

This app was created using https://getmocha.com.
Need help or want to join the community? Join our [Discord](https://discord.gg/shDEGBSe2d).

To run the devserver:
```
npm install
npm run dev
```

## Migrações internas (endpoints)

O worker expõe dois endpoints internos para gerenciar a migração da tabela `teachers`:

- `POST /internal/migrate` (modo destrutivo):
	- Requer header `x-migration-secret` com o valor da binding `MIGRATION_SECRET`.
	- Ação: executa `DROP TABLE IF EXISTS teachers` e recria a tabela e índice. Use com cuidado — remove dados existentes.
	- Exemplo:
		```bash
		curl -X POST http://localhost:8787/internal/migrate -H "x-migration-secret: $MIGRATION_SECRET"
		```

- `POST /internal/migrate-safe` (modo seguro, não destrutivo):
	- Requer header `x-migration-secret` com o valor da binding `MIGRATION_SECRET`.
	- Ação: inspeciona o banco e retorna um relatório JSON com `tableExists`, `columns`, `missingColumns` e `suggestedSql` com as alterações necessárias (não altera dados).
	- Use para revisar o que precisa ser aplicado manualmente ou com cuidado.
	- Exemplo:
		```bash
		curl -X POST http://localhost:8787/internal/migrate-safe -H "x-migration-secret: $MIGRATION_SECRET"
		```

Configuração recomendada:

- Defina a variável/binding `MIGRATION_SECRET` no seu `wrangler.toml` (ou nas bindings do ambiente) com um segredo forte.
- Execute `POST /internal/migrate-safe` primeiro para checar diferenças.
- Se tudo estiver correto e você estiver ciente dos riscos, use `POST /internal/migrate` para aplicar (modo destrutivo).

Observação: o worker também possui um middleware que cria a tabela `teachers` automaticamente na primeira requisição, caso ela não exista. O endpoint seguro é útil para validar colunas/adaptações sem tocar nos dados.

## Tornar o script executável (opcional)

Se você quer marcar o script `scripts/set-secret.sh` como executável no repositório (modo Unix-like), execute localmente no seu ambiente com `git` instalado:

```bash
git update-index --chmod=+x scripts/set-secret.sh
```

No Windows você pode manter o script e executá-lo via WSL/Git Bash, ou usar o PowerShell equivalente `scripts/set-secret.ps1`.
