import { MCPClient } from '@mastra/mcp'

// MCPClientを設定してサーバーに接続
export const postgresqlMcpClients = new MCPClient({
  servers: {
    postgres: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-postgres',
        process.env.POSTGRES_CONNECTION_STRING ||
          'postgresql://user:password@postgresql:5432/vectordb',
      ],
    },
  },
})
