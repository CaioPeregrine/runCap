import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { PontoTuristico } from "../app/hooks/usePontosTuristicos";

type Props = { ponto: PontoTuristico };

export default function CardSugeridos({ ponto }: Props) {
  function handleIniciar() {
    router.push({
      pathname: "/mapaPonto",   // ← crie esta tela (passo 6)
      params: {
        id:        ponto.id,
        nome:      ponto.nome,
        descricao: ponto.descricao,
        latitude:  ponto.latitude.toString(),
        longitude: ponto.longitude.toString(),
      },
    });
  }

  return (
    <TouchableOpacity style={styles.card}>
      {ponto.imageUrl ? (
        <Image source={{ uri: ponto.imageUrl }} style={styles.img} />
      ) : (
        <View style={styles.img} />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title}>{ponto.nome}</Text>
      </View>
      <View style={styles.botao}>
        <TouchableOpacity onPress={handleIniciar}>
          <Text style={styles.txt}>Iniciar Corrida</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF9F2',
        height: 280,
        width: '100%',
        marginTop: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    img: {
        backgroundColor: "#ffffff",
        width: '100%',
        height: 200,
        borderRadius:20
    
    },
    overlay: {
        position: 'absolute',
        top: 140,
        left: 5,
        right: 0,
        bottom: 0,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 2 },
        textShadowRadius: 10,
    },
    botao:{
        backgroundColor: "#22C3A3",
        width: "90%",
        height: 50,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 10,
        },
    txt:{
        color: "#fff",
        fontSize: 23,
        fontWeight: "bold",
    }    
})  