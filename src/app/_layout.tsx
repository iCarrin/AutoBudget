import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Home' }} />
    </Stack>
  );
}