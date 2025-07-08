import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { tableDesignAntiPatternRagTool } from '../tools/tableDesignAntiPatternRagTool'

export const tableDesignAntiPatternRagAgent = new Agent({
  name: 'テーブル設計アンチパターン Vector Query RAG エージェント',
  instructions: `
    あなたはテーブル設計アンチパターン情報を検索し、ユーザーの質問に答えるエージェントです。
    テーブル設計をレビューする指示に従い、ユーザーの質問に対して適切な情報を提供します。
    テーブル設計レビューの依頼が来たらこのエージェントを使用してください。
    ユーザーからの質問に対して、以下のツールを使用して回答を生成してください。
    - tableDesignAntiPatternRagTool: ベクトルデータベースから質問に関連するテーブル設計アンチパターン情報を検索します。
    
    ユーザーの質問に対して、できるだけ具体的で明確な回答を提供してください。
  `,
  tools: { tableDesignAntiPatternRagTool },
  model: openai('gpt-4o-mini'),
})
