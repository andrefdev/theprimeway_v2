import { Redirect } from 'expo-router';

// Task creation is now handled via TaskFormSheet inline.
export default function NewTaskRedirect() {
  return <Redirect href="/(app)/(tabs)/tasks/today" />;
}
