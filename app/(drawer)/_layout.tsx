
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="ranking" />
        <Stack.Screen name="(drawer)/adicionarAmigos" />
        <Stack.Screen name="historico" />
        <Stack.Screen name="conquistas" />
        <Stack.Screen name="rotasSugeridas" />
        <Stack.Screen name="pontosTuristicos" />
        <Stack.Screen name="eventos" />
        <Stack.Screen name="smartwatch" />
      </Stack>
    </GestureHandlerRootView>
  );
}