import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { mcpClient } from '../mcpClients/mcpClients'

export const mcpAgent = new Agent({
  name: 'Agent with MCP Tools',
  instructions: 'You can use tools from connected MCP servers.',
  model: openai('gpt-4o-mini'),
  tools: await mcpClient.getTools(),
})
