エージェント一覧
```
http://localhost:4111/agents
```

スクリプト
```
d exec -it mastra-mcp bash

# プログラミングアンチパターンベクトルDB更新
npx ts-node src/scripts/updateAntiPatternCodingEmbedding.ts

# プログラミングアンチパターンベクトルDBへのクエリ
npx ts-node src/scripts/antiPatternCodingQuery.ts
```