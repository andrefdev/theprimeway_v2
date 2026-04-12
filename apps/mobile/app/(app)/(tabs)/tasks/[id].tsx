import { Redirect, useLocalSearchParams } from 'expo-router';

// Task detail is now handled via TaskEditSheet inline.
// This route just redirects back to today view.
export default function TaskDetailRedirect() {
  return <Redirect href="/(app)/(tabs)/tasks/today" />;
}
