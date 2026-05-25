import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function CardAmigos() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/(drawer)/adicionarAmigos")}
    >
      <Feather name="user-plus" size={20} color="#fff" />
      <Text style={styles.texto}>+ Amigo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 9999,
    backgroundColor: "#22C3A3",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  texto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});