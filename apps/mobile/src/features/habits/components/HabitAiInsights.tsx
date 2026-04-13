import { View, Text, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { habitsService } from '../services/habitsService'
import { useQuery } from '@tanstack/react-query'

interface HabitAiInsightsProps {
  habitId: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CONSISTENCY_COLOR: Record<string, string> = {
  excellent: 'bg-green-100',
  good: 'bg-blue-100',
  fair: 'bg-yellow-100',
  poor: 'bg-red-100',
}

const CONSISTENCY_TEXT: Record<string, string> = {
  excellent: 'text-green-900',
  good: 'text-blue-900',
  fair: 'text-yellow-900',
  poor: 'text-red-900',
}

export function HabitAiInsights({ habitId }: HabitAiInsightsProps) {
  const { t } = useTranslation('habits')

  const { data, isLoading, error } = useQuery({
    queryKey: ['habit', habitId, 'analysis'],
    queryFn: () => habitsService.analyzeHabit(habitId),
  })

  if (isLoading) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4">
        <ActivityIndicator size="small" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4">
        <Text className="text-xs text-slate-500">{t('failedToLoadInsights', 'Failed to load insights')}</Text>
      </View>
    )
  }

  const consistencyBg = CONSISTENCY_COLOR[data.patterns.consistencyLevel] || 'bg-gray-100'
  const consistencyText = CONSISTENCY_TEXT[data.patterns.consistencyLevel] || 'text-gray-900'

  return (
    <View className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4 space-y-4">
      {/* Title */}
      <Text className="text-sm font-semibold text-slate-900 dark:text-white">⚡ {t('aiInsights', 'AI Insights')}</Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400">Based on your last 90 days</Text>

      {/* Metrics Grid */}
      <View className="grid grid-cols-2 gap-3">
        <View className="space-y-1">
          <Text className="text-xs text-slate-500">Completion Rate</Text>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">{data.metrics.completionRate}%</Text>
        </View>
        <View className="space-y-1">
          <Text className="text-xs text-slate-500">Current Streak</Text>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">{data.metrics.currentStreak}d</Text>
        </View>
        <View className="space-y-1">
          <Text className="text-xs text-slate-500">Best Streak</Text>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">{data.metrics.longestStreak}d</Text>
        </View>
        <View className="space-y-1">
          <Text className="text-xs text-slate-500">Completions</Text>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">{data.metrics.totalCompletions}</Text>
        </View>
      </View>

      {/* Consistency Badge */}
      <View className="flex-row items-center gap-2">
        <Text className="text-xs text-slate-500">Consistency:</Text>
        <View className={`px-2 py-1 rounded ${consistencyBg}`}>
          <Text className={`text-xs font-medium capitalize ${consistencyText}`}>
            {data.patterns.consistencyLevel}
          </Text>
        </View>
      </View>

      {/* Best Days */}
      {data.patterns.bestDaysOfWeek.length > 0 && (
        <View className="space-y-2">
          <Text className="text-xs font-semibold text-slate-500">Best Days</Text>
          <View className="flex-row gap-1">
            {data.patterns.bestDaysOfWeek.map((day: number) => (
              <View key={day} className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <Text className="text-xs text-slate-700 dark:text-slate-300">{DAYS[day]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <View className="space-y-2">
          <Text className="text-xs font-semibold text-yellow-600">💡 Suggestions</Text>
          {data.insights.map((insight: string, idx: number) => (
            <View key={idx} className="flex-row gap-2">
              <Text className="text-yellow-600">•</Text>
              <Text className="text-xs text-slate-600 dark:text-slate-400 flex-1">{insight}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
