import { View, Text, ActivityIndicator, Pressable } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { tasksService } from '../services/tasksService'
import { useState } from 'react'

interface TaskAiInsightsProps {
  taskId: string
}

export function TaskAiInsights({ taskId }: TaskAiInsightsProps) {
  const [completedSubtasks, setCompletedSubtasks] = useState<Set<number>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['task', taskId, 'insight'],
    queryFn: () => tasksService.getTaskInsight(taskId),
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
        <Text className="text-xs text-slate-500">Failed to load insights</Text>
      </View>
    )
  }

  const toggleSubtask = (index: number) => {
    const newSet = new Set(completedSubtasks)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setCompletedSubtasks(newSet)
  }

  return (
    <View className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4 space-y-4">
      {/* Title */}
      <Text className="text-sm font-semibold text-slate-900 dark:text-white">💡 AI Insights</Text>

      {/* Context Brief */}
      {data.contextBrief && (
        <View className="space-y-2">
          <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">Context</Text>
          <Text className="text-xs text-slate-700 dark:text-slate-300">{data.contextBrief}</Text>
        </View>
      )}

      {/* Suggested Subtasks */}
      {data.suggestedSubtasks && data.suggestedSubtasks.length > 0 && (
        <View className="space-y-2">
          <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">Suggested Subtasks</Text>
          {data.suggestedSubtasks.map((subtask: string, idx: number) => (
            <Pressable
              key={idx}
              onPress={() => toggleSubtask(idx)}
              className="flex-row items-start gap-2 p-2 rounded-lg active:bg-slate-100 dark:active:bg-slate-800"
            >
              <View
                className={`w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center ${
                  completedSubtasks.has(idx)
                    ? 'bg-green-500 border-green-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {completedSubtasks.has(idx) && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className={`text-xs flex-1 ${
                completedSubtasks.has(idx) ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {subtask}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Tips */}
      {data.tips && data.tips.length > 0 && (
        <View className="space-y-2">
          <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">Tips for Success</Text>
          {data.tips.map((tip: string, idx: number) => (
            <View key={idx} className="flex-row gap-2">
              <Text className="text-slate-600 dark:text-slate-400">•</Text>
              <Text className="text-xs text-slate-700 dark:text-slate-300 flex-1">{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
