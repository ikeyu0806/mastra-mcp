import { MCPClient } from '@mastra/mcp'

// MCPClientを設定してサーバーに接続
export const mcpClient = new MCPClient({
  servers: {
    'desktop-commander': {
      command: 'npx',
      args: ['-y', '@wonderwhy-er/desktop-commander'],
    },
  },
})
