import '@expo/metro-runtime'
import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Index() {
    return (
        <View style={styles.background}>
            <View>
                <TouchableOpacity style={styles.botao} onPress={() => router.push('/auth/login')}>
                    <Text style={{ color: "#fff", fontSize: 18 }}>Ir para Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
const styles = StyleSheet.create({

    background: {
        flex: 1,
        backgroundColor: "#2C3F69",
        alignItems: "center",
        justifyContent: "center"
    } ,

  botao: {
        paddingVertical: 40,
        paddingHorizontal: 30,
        borderRadius: 15,
        width: '100%',
        backgroundColor:'#d86b04',
        alignItems: 'center',
        justifyContent: 'center',
    }

})