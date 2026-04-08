import '@expo/metro-runtime'
import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{backgroundColor: "#2C3F69"}}>
      <Stack>
          <Stack.Screen name="index"/>
          <Stack.Screen name="login"/>
      </Stack>
    </SafeAreaProvider>
  );
}