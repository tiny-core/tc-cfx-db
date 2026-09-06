# tc_db

> **Instalação:** use o zip da última release, não `git clone`. O repositório chama-se
> `tc-cfx-db`, mas a pasta do recurso tem de se chamar **`tc_db`** — o zip já vem correto.

Camada MySQL para FXServer. Substitui o `oxmysql`, que está arquivado desde abril de 2026.

## Configuração (server.cfg)
```cfg
set tc_db_connection_string "mysql://user:password@localhost/database"
set tc_db_connection_limit 10
set tc_db_slow_query_warning 150
ensure tc_db
```

## Notas
- Requer `node_version '22'` — já declarado no manifesto. Artifacts recentes obrigatórios.
- Todas as consultas usam prepared statements. Não existe API que aceite SQL concatenado.
- Usar `tc.db.transaction` sempre que a operação mova dinheiro ou itens.

## Licença
`tc_db` é **LGPL-3.0-or-later** (ver `docs/licenca.md`, `LICENSE`, `licenses/GPL-3.0.txt`).
O bundle distribuído inclui o `mysql2`, que é MIT e compatível; os avisos de copyright
exigidos estão em `THIRD-PARTY-NOTICES.md` e têm de acompanhar a release.
