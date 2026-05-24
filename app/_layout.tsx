import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Layout racine minimal — la logique de redirection est dans chaque groupe
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}
