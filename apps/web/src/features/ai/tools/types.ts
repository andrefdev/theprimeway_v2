import type { QueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'

export interface ToolContext {
  queryClient: QueryClient
  t: TFunction
}

export type ToolResult = Record<string, unknown>

export interface ToolHandler<TArgs = unknown> {
  name: string
  execute: (args: TArgs, ctx: ToolContext) => Promise<ToolResult>
}
