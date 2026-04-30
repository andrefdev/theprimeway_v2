import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react-native';

export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  budget_analysis: 'Budget Analysis',
  debt_tracking: 'Debt Tracking',
  financial_summary: 'Financial Summary',
  goal_insights: 'Goal Insights',
  savings_goals: 'Savings Goals',
  task_analysis: 'Task Analysis',
};

function formatToolName(toolName: string): string {
  return (
    TOOL_DISPLAY_NAMES[toolName] ??
    toolName
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const hasResult = toolCall.result !== undefined;

  return (
    <View className="mt-2 overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center gap-2 px-3 py-2 active:bg-primary/10"
      >
        <Icon as={Wrench} size={12} className="text-primary" />
        <Text className="flex-1 text-xs font-semibold text-primary">
          {formatToolName(toolCall.toolName)}
        </Text>
        {hasResult && (
          <View className="rounded-full bg-primary/20 px-1.5 py-0.5">
            <Text className="text-2xs font-medium text-primary">Done</Text>
          </View>
        )}
        <Icon
          as={expanded ? ChevronDown : ChevronRight}
          size={12}
          className="text-primary/60"
        />
      </Pressable>

      {expanded && (
        <View className="gap-2 border-t border-primary/10 px-3 pb-3 pt-2">
          {Object.keys(toolCall.args).length > 0 && (
            <View>
              <Text className="mb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Input
              </Text>
              <Text className="font-mono text-xs text-muted-foreground">
                {JSON.stringify(toolCall.args, null, 2)}
              </Text>
            </View>
          )}
          {hasResult && (
            <View>
              <Text className="mb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Result
              </Text>
              <Text className="font-mono text-xs text-foreground">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
