import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { PgVector } from '@mastra/pg'
import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'

export const codingAntiPatternRagTool = createTool({
  id: 'Get Faq Information',
  inputSchema: z.object({
    query: z.string()
  }),
  description: `Fetches the Anti Coding Pattern information from the vector database based on the user's query.`,
  execute: async ({ context }) => {
    const pgVector = new PgVector({
      connectionString: process.env.POSTGRES_CONNECTION_STRING as string
    })
    console.log('✅ connectionString:', process.env.POSTGRES_CONNECTION_STRING)
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: context.query
    })

    const results = await pgVector.query({
      indexName: 'embeddings',
      queryVector: embedding,
      topK: 3
    })

    return {
      contents: results ? results : 'No faq found.'
    }
  }
})