import '@expo/metro-runtime';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function Index() {
    useEffect(() => {
        const auth = getAuth();
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Já logado → vai direto pra home
                router.replace('/(drawer)/(tabs)/home');
            } else {
                // Não logado → vai pro login
                router.replace('/auth/login');
            }
        });
        return () => unsub();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#2C3F69', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#22C3A3" />
        </View>
    );
}
