import { Stack } from "expo-router";

export default function LayoutCadastro() {
    return (
        <Stack>
            <Stack.Screen name="cadastro/index" options={{ headerShown: false }} />
            <Stack.Screen name="login/index" options={{ headerShown: false }} />
            <Stack.Screen name="recuperarSenha/index" options={{ headerShown: false }} />
        </Stack>
    )
}