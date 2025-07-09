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

## ナイーブツリー（Naive Tree）

概要:
親子関係を parent_id カラム1つで表現するツリー構造。単純だが実運用に不向きな構造。

問題点:
- 子孫や祖先を取得するには再帰的なSQLが必要（パフォーマンス・可読性が悪い）
- ノードの移動・挿入・削除時に再帰的更新が必要
- ツリーが深くなると操作が困難
- DBによって再帰SQLの対応状況が異なる

悪い例:
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  parent_id INT NULL
);

改善案:
- ネストセットモデル（左・右の範囲で木を表現）
- 経路列挙モデル（path列を使って階層を表現）
- 閉包テーブル（親子関係をすべて展開して別テーブルに持つ）

## キーレスエントリ（Keyless Entry）

概要:
外部キー制約を使わず、データ整合性をアプリケーションコード側だけで管理しようとする設計。

問題点:
- 存在しないIDを参照してもエラーにならない（整合性が崩れる）
- 親テーブルの削除・更新が関連テーブルに伝わらない
- 手動で整合性チェックが必要になり、開発・保守のコストが増大
- バグの原因になりやすい

悪い例:
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT
);

良い例:
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

例外的に外部キーを使えないケース:
- 異なるデータベースにまたがる場合（マイクロサービスなど）
- 外部キーの使用により極端なパフォーマンス問題が出るケース（要検証）

推奨:
- 使える場面では外部キーを明示的に定義し、データベースレベルで整合性を守る

## EAV（Entity-Attribute-Value）モデル

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

## NULLの過剰使用

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

## ポリモーフィック関連（Polymorphic Association）

概要:
1つの外部キー列（target_id）で複数の異なるテーブルと関連させる設計。例: comments テーブルが posts や photos に紐づく。

問題点:
- 外部キー制約を貼れず、整合性が保証されない
- target_type と target_id の組み合わせが誤っていてもエラーにならない
- JOIN や検索クエリが複雑・非効率
- データベースレベルでの構造化が崩れる

悪い例:
CREATE TABLE comments (
  id INT PRIMARY KEY,
  comment_text TEXT,
  target_type VARCHAR(50),
  target_id INT
);

改善案:
1. 関連先ごとに別テーブル（例: post_comments, photo_comments）
2. コメント本体と関連情報を分けた中間テーブル設計
3. ORMで使う場合も、DBレベルのリスクを理解して使うこと

推奨:
明示的な外部キー制約とスキーマで整合性を担保する設計にする。

## メタデータをデータとして扱う

例:
SELECT * FROM ?; など動的にテーブル名やカラム名を指定

問題点:
- 可読性が悪く、保守性が低い
- SQLインジェクションのリスク

代替案:
- 設計時に柔軟なスキーマを用意し、アプリ側で処理

---

## 冗長なデータの繰り返し（非正規化しすぎ）

例:
orders テーブルに user_name も格納

問題点:
- 更新漏れによる不整合
- ストレージの無駄

代替案:
- user_id のみ保持し、JOINでユーザー情報を取得

---

## なんでも TEXT に保存

例:
address TEXT で "Tokyo,Shibuya,150-0001" のような複合値を保存

問題点:
- 部分検索や正確な抽出が困難
- データの意味が不明瞭

代替案:
- 都道府県、市区町村、郵便番号に分けて保存

---

## N+1 クエリ問題

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
    values: chunks.map((chunk) => chunk.text),
    model: openai.embedding('text-embedding-3-small'),
  })

  const pgVector = new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING as string,
  })

  console.log('✅ embeddings:', embeddings)
  console.log(
    '✅ connectionString:',
    process.env.POSTGRES_CONNECTION_STRING || 'not set',
  )

  try {
    await pgVector.createIndex({
      indexName: 'db_design_antipattern_embeddings',
      dimension: 1536,
    })

    await pgVector.upsert({
      indexName: 'db_design_antipattern_embeddings',
      vectors: embeddings,
      metadata: chunks.map((chunk) => ({
        text: chunk.text,
      })),
    })

    console.log('✅ Embeddings inserted successfully')
  } finally {
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
