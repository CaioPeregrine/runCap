import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import styles from "./styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CardSugeridos from "@/components/CardSugeridos";
import { usePontosTuristicos } from "../../hooks/usePontosTuristicos";

export default function RotasSugeridas() {
  const pontos = usePontosTuristicos();

  return (
    <ScrollView>
      <View style={styles.background}>
        <View style={styles.blocoazul}>
          <View style={{ position: "absolute", top: 40, left: 10 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={35} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.txt}>Rotas Sugeridas</Text>
        </View>

        {pontos.map((ponto) => (
          <CardSugeridos key={ponto.id} ponto={ponto} />
        ))}
      </View>
    </ScrollView>
  );
}