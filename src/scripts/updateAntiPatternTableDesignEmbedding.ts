import 'dotenv/config'
import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import { PgVector } from '@mastra/pg'
import { MDocument } from '@mastra/rag'

async function main() {
const doc = MDocument.fromText(`
SQLアンチパターン（SQL Anti-patterns）とは、一見正しく動作するように見えても、長期的に見ると保守性・拡張性・パフォーマンス・データ整合性に悪影響を及ぼすようなデータベース設計やクエリの書き方を指します。

以下に代表的なアンチパターンとその問題点、代替策をまとめます。

---

1. EAV（Entity-Attribute-Value）モデル

例:
product_properties テーブルで属性を縦持ち

product_id | attribute_name | value
-----------|----------------|-------
1          | color          | red
1          | weight         | 3.2kg

問題点:
- 型の整合性が保てない
- JOIN や集計が複雑
- インデックスが効きにくい

代替案:
- 属性ごとにカラムを持つ正規化された設計

---

2. NULLの過剰使用

例:
CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT,
  address TEXT NULL,
  phone TEXT NULL,
  fax TEXT NULL
);

問題点:
- ロジックが複雑になる
- 集計・比較時に注意が必要

代替案:
- contact_info などの別テーブルに切り出す

---

3. メタデータをデータとして扱う

例:
SELECT * FROM ?; など動的にテーブル名やカラム名を指定

問題点:
- 可読性が悪く、保守性が低い
- SQLインジェクションのリスク

代替案:
- 設計時に柔軟なスキーマを用意し、アプリ側で処理

---

4. 冗長なデータの繰り返し（非正規化しすぎ）

例:
orders テーブルに user_name も格納

問題点:
- 更新漏れによる不整合
- ストレージの無駄

代替案:
- user_id のみ保持し、JOINでユーザー情報を取得

---

5. なんでも TEXT に保存

例:
address TEXT で "Tokyo,Shibuya,150-0001" のような複合値を保存

問題点:
- 部分検索や正確な抽出が困難
- データの意味が不明瞭

代替案:
- 都道府県、市区町村、郵便番号に分けて保存

---

6. N+1 クエリ問題

例:
for (user of users) {
  const orders = await db.query('SELECT * FROM orders WHERE user_id = ?', [user.id]);
}

問題点:
- 大量のクエリが発行され、パフォーマンスが著しく低下

代替案:
- JOINや WHERE user_id IN (...) でまとめて取得

---

参考書籍:
『SQLアンチパターン』（ビル・カロウィン 著、オライリー・ジャパン）

SQLアンチパターンを避けるには、スキーマ設計時に正規化や型の一貫性、実運用時のクエリパフォーマンスを意識し、ORMや自動生成されるSQLにも目を配ることが重要です。
`)

  const chunks = await doc.chunk()

  const { embeddings } = await embedMany({
    values: chunks.map(chunk => chunk.text),
    model: openai.embedding('text-embedding-3-small')
  })

  const pgVector = new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING as string
  })

  console.log('✅ embeddings:', embeddings)
  console.log('✅ connectionString:', process.env.POSTGRES_CONNECTION_STRING || 'not set')

  try {
    await pgVector.createIndex({
      indexName: 'db_design_antipattern_embeddings',
      dimension: 1536
    })

    await pgVector.upsert({
      indexName: 'db_design_antipattern_embeddings',
      vectors: embeddings,
      metadata: chunks.map(chunk => ({
        text: chunk.text
      }))
    })

    console.log('✅ Embeddings inserted successfully')
  } finally {
    process.exit(0)
  }
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})