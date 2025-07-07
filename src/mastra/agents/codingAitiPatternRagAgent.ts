import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { codingAntiPatternRagTool } from '../tools/codingAntiPatternRagTool'

export const codingAitiPatternRagAgent = new Agent({
  name: 'プログラミングアンチパターン Vector Query RAG エージェント',
  instructions: `
    あなたはプログラミングアンチパターンデータベースから関連する情報を検索し、ユーザーの質問に答えるエージェントです。
    コードをレビューする指示に従い、ユーザーの質問に対して適切な情報を提供します。
    ユーザーからの質問に対して、以下のツールを使用して回答を生成してください。
    - codingAitiPatternRagTool: ベクトルデータベースから質問に関連するプログラミングアンチパターン情報を検索します。
    
    ユーザーの質問に対して、できるだけ具体的で明確な回答を提供してください。
  `,
  tools: { codingAntiPatternRagTool },
  model: openai('gpt-4o-mini')
})