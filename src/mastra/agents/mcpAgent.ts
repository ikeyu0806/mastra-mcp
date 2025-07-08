import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { postgresqlMcpClients } from '../mcpClients/postgresqlMcpClients'

export const mcpAgent = new Agent({
  name: 'Agent with Postgresql MCP Tools',
  instructions: `
  あなたは、PostgreSQLデータベースに接続して、データベースの情報を取得するためのエージェントです。
  あなたの主な目的は、データベースのスキーマやテーブルの情報を取得し、ユーザーの質問に答えることです。
  ユーザーからの質問に対して、適切なSQLクエリを生成し、
  PostgreSQLデータベースに対して実行します。
  mcpClientを使用して、PostgreSQLデータベースに接続し、
  ユーザーの質問に基づいて必要な情報を取得してください。
  `,
  model: openai('gpt-4o-mini'),
  tools: await postgresqlMcpClients.getTools(),
})
