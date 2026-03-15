import { Stack } from "expo-router";

export default function LayoutCadastro() {
    return (
        <Stack>
            <Stack.Screen name="cadastro" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="recup" options={{ headerShown: false }} />
        </Stack>
    )
}