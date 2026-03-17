import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { DrawerContentScrollView, DrawerContentComponentProps } from "@react-navigation/drawer";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useRouter } from "expo-router";

// ─── Conteúdo customizado do Drawer ──────────────────────────────────────────
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const router = useRouter();

  const [userData, setUserData] = useState<{
    nome: string;
    nivel: number;
    codigoId: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, "usuarios", currentUser.uid)).then((snap) => {
        const d = snap.data();
        if (d) {
          setUserData({
            nome: d.nome || "Corredor",
            nivel: d.nivel || 1,
            codigoId: d.codigoId || currentUser.uid.slice(0, 8).toUpperCase(),
          });
        }
      });
    }
  }, [currentUser]);

  const initials = userData?.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??";

  async function handleLogout() {
    await signOut(auth);
    router.replace("/auth/login");
  }

  const menuItems = [
    { icon: "🗺️", label: "Rotas Sugeridas", screen: "rotasSugeridas" },
    { icon: "🏆", label: "Conquistas", screen: "conquistas" },
    { icon: "📍", label: "Pontos Turísticos", screen: "pontosTuristicos" },
    { icon: "📋", label: "Histórico de Corridas", screen: "historico" },
    { icon: "🏅", label: "Ranking", screen: "ranking" },
    { icon: "👥", label: "Adicionar Amigos", screen: "adicionarAmigos" },
    { icon: "📅", label: "Eventos", screen: "eventos" },
    { icon: "⌚", label: "Smartwatch Sync", screen: "smartwatch" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#1C1C1E" }}>
      {/* Cabeçalho do usuário */}
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{userData?.nome || "Carregando..."}</Text>
        <Text style={styles.userId}>ID: {userData?.codigoId || "..."}</Text>
        <View style={styles.nivelBadge}>
          <Text style={styles.nivelText}>⭐ nível {userData?.nivel || 1}</Text>
        </View>
      </View>

      {/* Itens do menu */}
      <DrawerContentScrollView
        {...props}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => {
              props.navigation.closeDrawer();
              props.navigation.navigate(item.screen);
            }}
          >
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>

      {/* Botão sair */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props: any) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#1C1C1E",
            width: 300,
          },
        }}
      >
        <Drawer.Screen name="home" />
        <Drawer.Screen name="ranking" />
        <Drawer.Screen name="(drawer)/adicionarAmigos" />
        <Drawer.Screen name="historico" />
        <Drawer.Screen name="conquistas" />
        <Drawer.Screen name="rotasSugeridas" />
        <Drawer.Screen name="pontosTuristicos" />
        <Drawer.Screen name="eventos" />
        <Drawer.Screen name="smartwatch" />
      </Drawer>
    </GestureHandlerRootView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  userHeader: {
    backgroundColor: "#2C2C2E",
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#5E5CE6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#3A3A3C",
  },
  avatarText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  userName: { color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 2 },
  userId: { color: "#8E8E93", fontSize: 12, marginBottom: 10 },
  nivelBadge: {
    backgroundColor: "#3A3A3C",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  nivelText: { color: "#FFD60A", fontSize: 13, fontWeight: "600" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, color: "#FFF", fontSize: 15, fontWeight: "500" },
  menuChevron: { color: "#3A3A3C", fontSize: 22 },
  logoutBtn: {
    margin: 20,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 36,
  },
  logoutText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
