import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useCallback, useState } from 'react'
import { toolRegistry } from '../tools/registry'
import type { ToolResult } from '../tools/types'

export function useExecuteTool() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [busyToolCallId, setBusyToolCallId] = useState<string | null>(null)

  const execute = useCallback(
    async (toolCallId: string, toolName: string, args: unknown): Promise<ToolResult> => {
      const handler = toolRegistry[toolName]
      if (!handler) return { error: `Unknown tool: ${toolName}` }
      setBusyToolCallId(toolCallId)
      try {
        return await handler.execute(args as never, { queryClient, t })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to execute'
        return { error: msg }
      } finally {
        setBusyToolCallId(null)
      }
    },
    [queryClient, t],
  )

  return { execute, busyToolCallId }
}
