import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";


export default function Perfil() {

        return (
            <View style={styles.inicial}>
                <View style={styles.perfil}>
                    <View style={styles.nome}>
                        <Text
                            style={{ fontSize: 18, color: "#000000" }}>Nome do Usuário
                        </Text></View>
                </View>

                <View>
                    <TouchableOpacity>
                        <View style={styles.circle}></View>
                    </TouchableOpacity>
                </View>

                <View style={styles.Brxp}>
                    <View style={styles.Cirxp}></View>

                </View>
                <ScrollView horizontal={true} style={styles.scrollview}>
                    <Text>nbdhcbuibcbobuobeuobcebvkvbjkbevjkbvejkbvkjbvkjbvjkbvjkbevjkbjkebvjkbebbfbeibhbvrho wv u hu vuh h vh h whov ho orh hehbrbbhiebhbhfbeedhbjkdbkbfbekhbfbfebmfbmnebfmnbenfbnfbmbebf n fnm n nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN NN</Text>

                </ScrollView>



            </View>
        )
    }

    const styles = StyleSheet.create({

        inicial: {
            backgroundColor: "#2C3F69",
            height: "100%",
            width: "100%",
        },
        // Estilo para o fundo do perfil
        perfil: {
            position: "absolute",
            width: "100%",
            height: 230,
            backgroundColor: "#EDE8DF",
            overflow: "hidden"
        },
        // Estilo para o círculo do perfil  
        circle: {
            position: "absolute",
            width: 150,
            height: 150,
            top: 120,
            left: 20,
            borderRadius: 200,
            backgroundColor: '#b1832d',
        },

        Brxp: {
            position: "absolute",
            width: "90%",
            height: 25,
            top: 300,
            left: 20,
            borderRadius: 20,
            backgroundColor: '#ffffff',
            justifyContent: "center",
        },

        Cirxp: {
            backgroundColor: "#1ffc48",
            height: "130%",
            width: 30,
            borderRadius: 30,
        },

        nome: {
            position: "absolute",
            top: 205,
            left: 175,
            color: "#000000",
        },

        scrollview: {

            position: 'absolute',
            width: "90%",
            height: "20%",
            top: 350,
            left: 20,
            backgroundColor: "#ffffff",
            borderRadius: 10,

        }

    }
    )}