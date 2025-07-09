import 'dotenv/config'
import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import { PgVector } from '@mastra/pg'
import { MDocument } from '@mastra/rag'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  const filePath = join(__dirname, '../texts/codingAntipattern.txt')
  const text = await readFile(filePath, 'utf-8')
  const doc = MDocument.fromText(text)

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
      indexName: 'coding_antipattern_embeddings',
      dimension: 1536,
    })

    await pgVector.upsert({
      indexName: 'coding_antipattern_embeddings',
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
