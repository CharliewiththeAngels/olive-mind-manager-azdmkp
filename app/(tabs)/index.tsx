
import { Redirect } from 'expo-router';

// Redirect to the calendar tab by default
export default function TabsIndex() {
  return <Redirect href="/(tabs)/calendar" />;
}
