import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";

export default function PontosTuristicos() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Pontos Turísticos</Text>
      <Text style={styles.sub}>Em breve...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1C1C1E", paddingTop: 60, paddingHorizontal: 20 },
  menuBtn: { marginBottom: 24 },
  menuIcon: { color: "#FFF", fontSize: 24 },
  title: { color: "#FFF", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  sub: { color: "#8E8E93", fontSize: 15 },
});
