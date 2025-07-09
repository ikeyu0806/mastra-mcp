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

## メタデータトリブル（Metadata Tribbles）

概要:
柔軟性を求めるあまり、属性を全てメタデータ（属性名と値のペア）として1つのテーブルに記録する設計。EAV（Entity-Attribute-Value）モデルとも呼ばれる。

問題点:
- スキーマが消失し、型の保証がなくなる
- クエリが煩雑になり、JOIN や検索が困難
- インデックスが使えず、パフォーマンス劣化
- データが増えると爆発的に複雑化（トリブルのように増える）

悪い例:
CREATE TABLE entity_attributes (
  entity_id INT,
  attribute_name VARCHAR(255),
  attribute_value VARCHAR(255)
);

改善案:
- 属性が決まっているなら正規のカラムとして定義
- JSON型で柔軟性と構造を両立（PostgreSQL/ MySQL 5.7+）
- 柔軟性が本当に必要ならNoSQLも選択肢に

例外的にOKなケース:
- ユーザーが自由にフィールドを追加できるCMSなど
- 属性数が膨大で、ほとんどがNULLになる場合（慎重に）

## 冗長なデータの繰り返し（非正規化しすぎ）

例:
orders テーブルに user_name も格納

問題点:
- 更新漏れによる不整合
- ストレージの無駄

代替案:
- user_id のみ保持し、JOINでユーザー情報を取得

---

## テーブルのタイムスタンプ分割（Bugs_2008, Bugs_2009 など）

概要:
年や月などのタイムスタンプでテーブルを複製し、それぞれ独立したテーブルで管理するアンチパターン。

問題点:
- 同じ構造のテーブルが多数生まれ、保守性が著しく低下
- クエリが複雑（UNION が必要、年を指定するたびにテーブル名が変わる）
- アプリケーションロジックに年次処理が混入する
- インデックスや制約をすべてのテーブルに再定義する必要あり

悪い例:
Bugs_2008
Bugs_2009
Bugs_2010

改善案:
1. 正規化: 年や月をカラムとして持つ1つの統合テーブルにする
2. パーティショニング:
   - 水平パーティショニング（年や月ごとに自動分割、管理は1テーブル）
   - 垂直パーティショニング（頻度や機能に応じて列を分ける）
3. 従属テーブルの導入: 属性別の詳細情報を別テーブルで管理

推奨:
1つの正規化されたテーブル + RDBMS のパーティション機能で柔軟性と性能を両立。

## ラウンディングエラー（Rounding Error）

概要:
浮動小数点数（FLOAT、DOUBLE）を使用すると、数値の内部表現に誤差が生じることがある。これは、コンピュータが2進数で数値を処理するため、有限の桁数では正確な表現ができない値が存在するため。

例:
0.1 + 0.2 === 0.3 // false
→ 結果は 0.30000000000000004 になることがある。

原因:
- 浮動小数点（FLOAT, DOUBLE）は近似値でしか数値を保持できない
- 1/3 や 0.1 のような値は 2 進数では正確に表現できず、循環小数として誤差が出る
- 誤差が累積して大きなズレになることもある

悪い例:
CREATE TABLE payments (
  amount FLOAT
);

-- 金額を扱うには不適切。誤差により計算ミスが発生する可能性。

改善案:
1. 金額や精度が重要な数値は、FLOAT / DOUBLE を使わず、NUMERIC や DECIMAL を使う。

良い例:
CREATE TABLE payments (
  amount NUMERIC(10, 2)  -- 小数点以下2桁まで、正確に表現
);

2. アプリケーション側でも high-precision な型やライブラリを使う。
  - JavaScript: decimal.js / Big.js
  - Python: decimal.Decimal
  - Java: BigDecimal
  - C#: decimal

3. 計算結果を比較する場合は、誤差を考慮した比較関数を使う。
  - 例: Math.abs(a - b) < ε

推奨:
金額や割合、統計など**誤差が致命的になる場面**では、必ず固定精度（NUMERIC / DECIMAL）型を使い、浮動小数点（FLOAT / DOUBLE）は避ける。

## サーティワンフレーバー（ENUM 過多）

概要:
固定値（ステータスや種類など）をすべて列定義（ENUM）で定義しようとするアンチパターン。
アイスクリームの「31のフレーバー」のように、選択肢が多すぎて柔軟性を失う。

問題点:
- ステータス追加や変更にスキーマ変更（ALTER TABLE）が必要
- 表示順・説明・多言語対応が困難
- アプリロジックとの密結合でメンテが煩雑化

悪い例:
CREATE TABLE Bugs (
  id INT,
  status ENUM('New', 'In Progress', 'Resolved', ..., 'Custom31')
);

改善案:
1. BugStatus などの参照テーブルを作り、外部キーで管理する
2. 表示順、カテゴリ、多言語対応などの情報をテーブルで管理可能にする
3. ENUM は選択肢が明確・固定（例: 左/右, オン/オフ）なときに限定して使用

良い例:
CREATE TABLE BugStatus (
  id INT PRIMARY KEY,
  name TEXT,
  display_order INT
);

CREATE TABLE Bugs (
  id INT,
  status_id INT REFERENCES BugStatus(id)
);

推奨:
選択肢が業務に応じて変化する可能性がある場合は、ENUM ではなく参照テーブルでの管理を基本とする。

## なんでも TEXT に保存

例:
address TEXT で "Tokyo,Shibuya,150-0001" のような複合値を保存

問題点:
- 部分検索や正確な抽出が困難
- データの意味が不明瞭

代替案:
- 都道府県、市区町村、郵便番号に分けて保存

## ファントムファイル（Phantom Files）

概要:
ファイルのパスだけをDBに保存し、物理ファイルはファイルシステムに置く設計。ファイルとDBの整合性が崩れることで、ファイルが存在しない「幻のファイル」状態が発生する。

問題点:
- リンク切れ（パスはあるがファイルが存在しない）
- DBとファイルのバックアップタイミングがずれて整合性が崩れる
- トランザクション管理が効かず、DB更新とファイル更新が非同期
- セキュリティやアクセス制御が煩雑化

改善案:
1. DB に BLOB / バイナリ型でファイルを直接保存
  - MySQL: MEDIUMBLOB（最大16MB）、LONGBLOB（最大4GB）
  - Oracle: BLOB（最大128TB）、LONG RAW（最大2GB）
2. クラウドストレージ（例: S3）に保存し、DB にはメタ情報と URL のみを持つ

推奨:
- 小さめのファイル（～数MB）や整合性重視 → DB にバイナリ格納（BLOB）
- 大容量ファイルや分散環境 → オブジェクトストレージ + メタ情報をDB管理

---

## フィア・オブ・ジ・アンノウン（恐怖のunknown）

概要:
NULLを「何らかの一般的な値」として扱ったり、逆に一般的な値をNULLとして使う設計の問題。
NULLは「値が存在しない（不明）」ことを示す特別な意味を持つため、一般値と混同すると論理や検索で問題が発生しやすい。

問題点:
- NULLと一般値を混同すると、条件検索で意図しない結果になる（NULLの扱いは特別）
- NULLに対する等価比較（= NULL）が動作しないため、誤ったクエリになることが多い
- データの意味が曖昧になり、バグの温床になる

改善策:
- NULLは「値が存在しない」ことのみに使い、一般値を代用してはいけない
- NULLと一般値は厳密に区別して設計する
- 検索時は「IS NULL」「IS NOT NULL」を使うこと
- 必要に応じて、NULLを許容しないカラム設計やデフォルト値の設定を行う

例:
-- NG（NULLを一般値の代わりに使う）
UPDATE users SET status = NULL WHERE id = 1;

-- OK（NULLは不明の意味として使う）
SELECT * FROM users WHERE status IS NULL;

## アンビギュアスグループ（曖昧なグループ）

概要:
GROUP BY句に適切なカラムを指定せず、曖昧なグループ化を行うことで、
集計結果が不正確になるアンチパターン。SQL標準では、
GROUP BYに含まれない非集約カラムのSELECTは基本的に禁止されているが、
多くのDBで暗黙的に許容されている場合もあり、不定な結果を生む。

問題点:
- 不正確な集計結果
- SQLの可読性・保守性の低下
- DB依存で結果が変わる移植性の問題

改善策:
- GROUP BYには非集約カラムをすべて含める
- 集約関数を使って集計対象を明示する
- 必要ならサブクエリやウィンドウ関数を活用して処理を明確化

例:
-- NG例
SELECT customer_id, name, SUM(amount) FROM orders GROUP BY customer_id;

-- OK例
SELECT customer_id, name, SUM(amount) FROM orders GROUP BY customer_id, name;

## ランダムセレクション

概要:
データをランダムにソートし、その中から1行を取得する方法はパフォーマンスが非常に悪い。
例えば以下のクエリはデータ量が増えるほど遅くなる。

悪い例:
SELECT * FROM Bugs ORDER BY RAND() LIMIT 1;

問題点:
- RAND()で全行にランダム値を生成してソートするため、テーブル全体をスキャンする必要がある。
- 大量データではクエリ実行時間が増大し、DB負荷が高まる。

改善策:
ランダムなキーを利用し、特定の順番に依存しない方法でランダムな行を取得する。

例1: ランダムなIDを生成して直接取得（欠番があるとヒットしない可能性あり）
SELECT b1.*
FROM Bugs AS b1
INNER JOIN (
  SELECT CEIL(RAND() * (SELECT MAX(bug_id) FROM Bugs)) AS rand_id
) AS b2 ON b1.bug_id = b2.rand_id;

例2: 欠番を考慮し、ランダムID以上の最初の行を取得する方法
SELECT b1.* 
FROM Bugs AS b1
INNER JOIN (
  SELECT CEIL(RAND() * (SELECT MAX(bug_id) FROM Bugs)) AS bug_id
) AS b2 ON b1.bug_id >= b2.bug_id
ORDER BY b1.bug_id LIMIT 1;

これにより、テーブル全体のフルスキャンを避けて効率的にランダムなレコードを取得できる。

## プアマンズ・サーチエンジン（貧者のサーチエンジン）

概要:
文字列のパターンマッチングをLIKEのワイルドカード（特に先頭に%がつくもの）で行うと、
インデックスが使えず、テーブル全体をスキャンするためスロークエリになってしまう。

悪い例:
SELECT * FROM Bugs WHERE description LIKE '%crash%';

問題点:
- フルテーブルスキャンになり、大量データでは非常に遅い。
- サーバー負荷が増大し、システム全体のパフォーマンスを悪化させる。

改善策:
- MySQLならフルテキストインデックスを利用する。
  例: MATCH(description) AGAINST('crash')
- Oracleなどではテキストインデックスを使い、CONTAINS演算子を用いる。
  例: SELECT * FROM Bugs WHERE CONTAINS(description, 'crash') > 0;

これにより、インデックスを活用した高速な全文検索が可能になる。

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
