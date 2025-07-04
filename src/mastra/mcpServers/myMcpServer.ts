import { MCPServer } from '@mastra/mcp'
import { weatherTool } from '../tools/weather-tool'
import { weatherAgent } from '../agents/weather-agent'

export const myMcpServer = new MCPServer({
  name: 'My Custom Server',
  version: '1.0.0',
  tools: { weatherTool },
  agents: { weatherAgent },
})
