import type * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

type NotificationData = {
  type?: string;
  taskId?: string;
  habitId?: string;
  goalId?: string;
  quarterlyGoalId?: string;
  annualGoalId?: string;
  threeYearGoalId?: string;
  screen?: string;
  url?: string;
};

export function routeFromNotification(response: Notifications.NotificationResponse) {
  const data = (response.notification.request.content.data ?? {}) as NotificationData;

  if (data.url) {
    router.push(data.url as any);
    return;
  }

  switch (data.type) {
    case 'task':
      router.push('/(app)/(tabs)/manual' as any);
      return;
    case 'habit':
      router.push('/(app)/(tabs)/manual' as any);
      return;
    case 'goal':
      router.push('/(app)/(tabs)' as any);
      return;
    case 'weekly_review':
      router.push('/(app)/weekly-review' as any);
      return;
    case 'morning_briefing':
      router.push('/(app)/(tabs)' as any);
      return;
    case 'pomodoro':
      router.push('/(app)/pomodoro' as any);
      return;
    case 'ai':
      router.push('/(app)/(tabs)/ai' as any);
      return;
    case 'calendar':
      router.push('/(app)/calendar' as any);
      return;
    default:
      break;
  }

  if (data.screen) router.push(data.screen as any);
}
