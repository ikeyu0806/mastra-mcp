import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { LibSQLStore } from '@mastra/libsql'
import { weatherWorkflow } from './workflows/weather-workflow'
import { weatherAgent } from './agents/weather-agent'
import { codingAntiPatternRagAgent } from './agents/codingAntiPatternRagAgent'
import { tableDesignAntiPatternRagAgent } from './agents/tableDesignAntiPatternRagAgent'
import { mcpAgent } from './agents/mcpAgent'
import { myMcpServer } from './mcpServers/myMcpServer'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: {
    weatherAgent,
    codingAntiPatternRagAgent,
    tableDesignAntiPatternRagAgent,
    mcpAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  mcpServers: { myMcpServer },
})
