import { tool } from 'ai'
import { z } from 'zod'
import { prisma } from '../prisma'

export function goalReadTools(userId: string) {
  return {
    listGoals: tool({
      description: "List the user's goals across all hierarchy levels (3-year, annual, quarterly)",
      inputSchema: z.object({
        limit: z.number().optional(),
        level: z.enum(['three-year', 'annual', 'quarterly', 'all']).optional().describe('Hierarchy level'),
      }),
      execute: async ({ limit, level }) => {
        const max = limit ?? 20
        const lv = level ?? 'all'
        const out: Array<{ id: string; title: string; level: string; progress?: number; parentId?: string }> = []

        const horizonMap = { 'three-year': 'THREE_YEAR', annual: 'ONE_YEAR', quarterly: 'QUARTER' } as const
        const wantHorizons = lv === 'all'
          ? (['THREE_YEAR', 'ONE_YEAR', 'QUARTER'] as const)
          : ([horizonMap[lv]] as const)
        const goals = await prisma.goal.findMany({
          where: { userId, horizon: { in: wantHorizons as any }, status: 'ACTIVE' },
          take: max,
          orderBy: { createdAt: 'desc' },
        })
        for (const g of goals) {
          const levelLabel =
            g.horizon === 'THREE_YEAR' ? 'three-year' : g.horizon === 'ONE_YEAR' ? 'annual' : 'quarterly'
          out.push({ id: g.id, title: g.title, level: levelLabel, parentId: g.parentGoalId ?? undefined })
        }
        return { goals: out.slice(0, max) }
      },
    }),
  }
}

export function goalClientTools() {
  return {
    createGoal: tool({
      description:
        'Propose creating a new goal at a hierarchy level (three-year, annual, or quarterly). Requires user approval.',
      inputSchema: z.object({
        level: z.enum(['three-year', 'annual', 'quarterly']).describe('Hierarchy level'),
        title: z.string(),
        description: z.string().optional(),
        visionId: z.string().optional().describe('Required when level is three-year'),
        area: z
          .enum(['finances', 'career', 'health', 'relationships', 'mindset', 'lifestyle'])
          .optional()
          .describe('Required when level is three-year'),
        threeYearGoalId: z.string().optional().describe('Required when level is annual'),
        targetDate: z.string().optional().describe('YYYY-MM-DD, used for annual'),
        annualGoalId: z.string().optional().describe('Required when level is quarterly'),
        year: z.number().optional().describe('Required when level is quarterly'),
        quarter: z.number().min(1).max(4).optional().describe('Required when level is quarterly'),
      }),
    }),

    updateGoalProgress: tool({
      description:
        'Propose updating a goal progress percentage. Applies to annual or quarterly goals. Requires user approval.',
      inputSchema: z.object({
        level: z.enum(['annual', 'quarterly']),
        goalId: z.string(),
        goalTitle: z.string().describe('For display'),
        progress: z.number().min(0).max(100),
      }),
    }),

    deleteGoal: tool({
      description:
        'Propose deleting a goal. Requires user approval. Specify level: three_year, annual, quarterly, or weekly.',
      inputSchema: z.object({
        goalId: z.string(),
        goalTitle: z.string().describe('For display'),
        level: z.enum(['three_year', 'annual', 'quarterly', 'weekly']),
      }),
    }),
  }
}
