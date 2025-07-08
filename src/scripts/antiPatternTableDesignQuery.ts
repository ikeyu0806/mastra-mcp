import { PgVector } from '@mastra/pg'
import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'

async function main() {
  process.stdin.setEncoding('utf-8')

  // console.log('質問を入力してください:')
  let input = '命名に関するアンチパターンについて教えて' // デフォルトの入力値を設定

  const pgVector = new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING as string,
  })
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: input,
  })

  const results = await pgVector.query({
    indexName: 'db_design_antipattern_embeddings',
    queryVector: embedding,
    topK: 3,
  })
  console.log('検索結果:', results)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
