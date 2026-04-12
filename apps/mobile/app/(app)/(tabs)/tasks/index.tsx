import { Redirect } from 'expo-router';

export default function TasksIndex() {
  return <Redirect href="/(app)/(tabs)/tasks/today" />;
}
