import { View, Text, StyleSheet } from "react-native";

export default function Recup() {
    return (
        <View style={styles.background}>
            <View style={styles.segundaCamada}>

            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#2C3F69"
    },

    segundaCamada: {
        width: "100%",
        height: '88%',
        backgroundColor: '#EDE8DF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom:0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 30,
        borderTopRightRadius:120,
        

    }
})