import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { PontoTuristico } from "../app/hooks/usePontosTuristicos";
import { XP_POR_CORRIDA } from "../app/hooks/useXP";

type Props = { ponto: PontoTuristico };

export default function CardSugeridos({ ponto }: Props) {
  function handleIniciar() {
    router.push({
      pathname: "/correndoPontoT",
      params: {
        id:        ponto.id,
        nome:      ponto.nome,
        descricao: ponto.descricao,
        latitude:  ponto.latitude.toString(),
        longitude: ponto.longitude.toString(),
        origem:    "rota_sugerida", // ← flag que autoriza o XP na conclusão
        pontoId:   ponto.id,         // ← id para desbloquear o card turístico
      },
    });
  }

  return (
    <View style={styles.card}>
      {ponto.imageUrl ? (
        <Image source={{ uri: ponto.imageUrl }} style={styles.img} />
      ) : (
        <View style={styles.img} />
      )}

      {/* Título sobre a imagem */}
      <View style={styles.overlay}>
        <Text style={styles.title}>{ponto.nome}</Text>
      </View>

      {/* Badge de XP — abaixo do nome */}
      <View style={styles.xpBadge}>
        <Text style={styles.xpTexto}>⚡ +{XP_POR_CORRIDA} XP</Text>
      </View>

      <TouchableOpacity style={styles.botao} onPress={handleIniciar}>
        <Text style={styles.txt}>Iniciar Corrida</Text>
      </TouchableOpacity>
    </View>
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
    borderRadius: 20,
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

  // Badge XP — posicionado abaixo do título
  xpBadge: {
    position: "absolute",
    top: 170,
    left: 8,
    backgroundColor: "rgba(34, 195, 163, 0.90)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  botao: {
    backgroundColor: "#22C3A3",
    width: "95%",
    height: 50,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
  },
  txt: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "bold",
  },
});
