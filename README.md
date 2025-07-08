## エージェント一覧

```
http://localhost:4111/agents
```

## スクリプト

```
d exec -it mastra-mcp bash

# プログラミングアンチパターンベクトルDB更新
docker compose run --rm npx ts-node src/scripts/updateAntiPatternCodingEmbedding.ts

# プログラミングアンチパターンベクトルDBへのクエリ
docker compose run --rm npx ts-node src/scripts/antiPatternCodingQuery.ts

# データベース設計アンチパターンDB更新
docker compose run --rm mastra npx ts-node src/scripts/updateAntiPatternTableDesignEmbedding.ts

# データベース設計アンチパターンベクトルDBへのクエリ
docker compose run --rm npx ts-node src/scripts/antiPatternTableDesignQuery.ts
```

## Postgresql

データベース一覧表示

```
\l
```
