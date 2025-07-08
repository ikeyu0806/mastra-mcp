import { MCPServer } from '@mastra/mcp'
import { codingAntiPatternRagTool } from '../tools/codingAntiPatternRagTool'
import { tableDesignAntiPatternRagTool } from '../tools/tableDesignAntiPatternRagTool'

export const myMcpServer = new MCPServer({
  name: 'My Custom Server',
  version: '1.0.0',
  tools: { codingAntiPatternRagTool, tableDesignAntiPatternRagTool },
})
