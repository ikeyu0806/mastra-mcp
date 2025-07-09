## エージェント一覧

```
http://localhost:4111/agents
```

## スクリプト

```
d exec -it mastra-mcp bash

# プログラミングアンチパターンベクトルDB更新
docker compose run --rm mastra npx ts-node src/scripts/updateAntiPatternCodingEmbedding.ts

# データベース設計アンチパターンDB更新
docker compose run --rm mastra npx ts-node src/scripts/updateAntiPatternTableDesignEmbedding.ts

# プログラミングアンチパターンベクトルDBへのクエリ
docker compose run --rm  mastranpx ts-node src/scripts/antiPatternCodingQuery.ts

# データベース設計アンチパターンベクトルDBへのクエリ
docker compose run --rm mastra npx ts-node src/scripts/antiPatternTableDesignQuery.ts
```

## Postgresql

ベクトルデータベース接続
```
psql "postgresql://user:password@localhost:5432/vectordb"
```

データベース一覧表示

```
\l
```

データベース選択

```
\c vectordb
```

テーブル一覧

```
\dt
```

テーブル定義

```
\d coding_antipattern_embeddings
\d db_design_antipattern_embeddings
```
