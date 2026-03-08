import { Stack } from "expo-router";

export default function EsqueciSenhaLayout() {
    return(
        <Stack>
            <Stack.Screen name="recup" options={{ headerShown: false }} />
        </Stack>
    )
}