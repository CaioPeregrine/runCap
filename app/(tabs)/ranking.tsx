import { db } from "@/firebase/firebaseConfig";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type RankingUser = {
  id: string;
  nome: string;
  totalKm: number;
  nivel: number;
  status: "online" | "offline" | "correndo";
  avatarUrl: string | null;
};

const STATUS_COLOR = {
  online: "#30D158",
  offline: "#8E8E93",
  correndo: "#FF9F0A",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  nome,
  size = 44,
  status,
  avatarUrl,
}: {
  nome: string;
  size?: number;
  status?: "online" | "offline" | "correndo";
  avatarUrl?: string | null;
}) {
  const initials = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#5E5CE6", "#30D158", "#FF9F0A", "#FF375F", "#64D2FF"];
  const colorIndex = nome.charCodeAt(0) % colors.length;

  return (
    <View style={{ position: "relative" }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: colors[colorIndex],
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "#fff",
        overflow: "hidden",
      }}>
        {avatarUrl ? (
          // Foto do Storage — atualiza automaticamente quando o usuário troca
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          // Fallback: iniciais coloridas
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: size * 0.35 }}>
            {initials}
          </Text>
        )}
      </View>
      {status && (
        <View style={{
          position: "absolute", bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: 5,
          backgroundColor: STATUS_COLOR[status],
          borderWidth: 2, borderColor: "#1C1C1E",
        }} />
      )}
    </View>
  );
}

// ─── Pódio ────────────────────────────────────────────────────────────────────
function Podium({ users }: { users: RankingUser[] }) {
  const [first, second, third] = users;

  const PodiumItem = ({
    user, position, podiumHeight,
  }: {
    user?: RankingUser; position: number; podiumHeight: number;
  }) => {
    if (!user) return <View style={{ flex: 1 }} />;
    const medals = ["🥇", "🥈", "🥉"];
    const isFirst = position === 1;

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
        <Avatar nome={user.nome} size={isFirst ? 62 : 50} status={user.status} avatarUrl={user.avatarUrl} />
        <Text style={{
          color: "#1B2B5E", fontWeight: "700",
          fontSize: isFirst ? 14 : 12, marginTop: 1, textAlign: "center",
        }} numberOfLines={1}>
          {user.nome.split(" ")[0]}
        </Text>
        <Text style={{ fontSize: 15, color: "#000000", marginBottom: 6 }}>
          {user.totalKm.toFixed(1)} km
        </Text>
        <View style={{
          width: "80%", height: podiumHeight,
          backgroundColor: isFirst ? "#ffffff" : "#c1c1c1",
          borderTopLeftRadius: 10, borderTopRightRadius: 8,
          alignItems: "center", justifyContent: "flex-start", paddingTop: 2,
          elevation: isFirst ? 4 : 2,
        }}>
          <Text style={{ fontSize: isFirst ? 22 : 18 }}>{medals[position - 1]}</Text>
          <Text style={{ color: "#1B2B5E", fontWeight: "900", fontSize: isFirst ? 18 : 14, marginTop: 2 }}>
            {position}°
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{
      flexDirection: "row", alignItems: "flex-end",
      paddingHorizontal: 10,height: 210, marginBottom: 5,marginTop:45
    }}>
      <PodiumItem user={second} position={2} podiumHeight={100} />
      <PodiumItem user={first}  position={1} podiumHeight={140} />
      <PodiumItem user={third}  position={3} podiumHeight={70} />
    </View>
  );
}

// ─── RankItem ─────────────────────────────────────────────────────────────────
function RankItem({ user, position, isAmigos }: {
  user: RankingUser; position: number; isAmigos: boolean;
}) {
  return (
    <View style={styles.rankItem}>
      <Text style={styles.rankPosition}>{position}°</Text>
      <Avatar nome={user.nome} size={40} status={isAmigos ? user.status : undefined} avatarUrl={user.avatarUrl} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rankName} numberOfLines={1}>{user.nome}</Text>
        {isAmigos && (
          <Text style={[styles.rankStatus, { color: STATUS_COLOR[user.status] }]}>
            {user.status === "correndo" ? "🏃 correndo" : user.status}{" · "}Nível {user.nivel}
          </Text>
        )}
      </View>
      <Text style={styles.rankKm}>{user.totalKm.toFixed(1)} km</Text>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function RankingScreen() {
  const navigation = useNavigation();
  const [tab, setTab]                     = useState<"regional" | "amigos">("regional");
  const [regionalUsers, setRegionalUsers] = useState<RankingUser[]>([]);
  const [amigosUsers, setAmigosUsers]     = useState<RankingUser[]>([]);
  const [loading, setLoading]             = useState(true);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const currentUser = getAuth().currentUser;

  const [userData, setUserData] = useState<{
    nome: string;
    nivel: number;
    codigoId: string;
    avatarUrl?: string | null;
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
            avatarUrl: d.avatarUrl || null,
          });
        }
      });
    }
  }, [currentUser]);

  // ── Ranking Regional — tempo real ─────────────────────────────────────────
  useEffect(() => {
    // Escuta TODAS as corridas sem filtro de uid
    // para poder agrupar por corredor e somar o total de km de cada um
    const q = query(collection(db, "corridas"));

    const unsub = onSnapshot(q, async (snap) => {
      try {
        // Agrupa corridas por uid somando km total de cada corredor
        const map: Record<string, { totalKm: number; uid: string }> = {};
        // Debug: mostra quantas corridas foram encontradas
        console.log("Total de corridas encontradas:", snap.size);

        snap.forEach((d) => {
          const data = d.data();
          const uid = data.uid;

          if (!uid) {
            console.warn("Corrida sem uid — id do doc:", d.id, "| campos:", Object.keys(data));
            return;
          }

          if (!map[uid]) map[uid] = { totalKm: 0, uid };
          map[uid].totalKm += data.distancia_km || 0;
        });

        console.log("Corredores únicos encontrados:", Object.keys(map).length);

        // Ordena por totalKm e pega top 10
        const sorted = Object.values(map)
          .sort((a, b) => b.totalKm - a.totalKm)
          .slice(0, 10);

        // Busca dados de cada corredor no Firestore
        const users: RankingUser[] = await Promise.all(
          sorted.map(async ({ uid, totalKm }) => {
            try {
              const d = await getDoc(doc(db, "usuarios", uid));
              const u = d.data();
              return {
                id: uid,
                nome: u?.nome || "Corredor",
                totalKm,
                nivel: u?.nivel || 1,
                status: u?.status || "offline",
                avatarUrl: u?.avatarUrl || null,
              };
            } catch {
              // Se não encontrar o usuário, retorna placeholder
              return {
                id: uid,
                nome: "Corredor",
                totalKm,
                nivel: 1,
                status: "offline" as const,
                avatarUrl: null,
              };
            }
          })
        );

        setRegionalUsers(users);
      } catch (e) { console.error("Erro regional:", e); }
      finally { setLoading(false); }
    });

    return unsub;
  }, []);

  // ── Ranking Amigos — tempo real
  // Escuta o documento do usuário para detectar mudanças na lista de amigos,
  // e escuta a coleção "corridas" de cada amigo para atualizar km em tempo real.
  useEffect(() => {
    if (!currentUser) return;

    // Primeiro escuta o documento do usuário para pegar a lista de amigos
    const unsubUser = onSnapshot(doc(db, "usuarios", currentUser.uid), async (userSnap) => {
      try {
        const amigosIds: string[] = userSnap.data()?.amigos || [];
        const ids = [currentUser.uid, ...amigosIds];

        // Para cada id, busca dados do usuário + soma corridas
        const users: RankingUser[] = await Promise.all(
          ids.map(async (uid) => {
            const uDoc = await getDoc(doc(db, "usuarios", uid));
            const uData = uDoc.data();

            const cSnap = await getDocs(
              query(collection(db, "corridas"), where("uid", "==", uid))
            );
            let totalKm = 0;
            cSnap.forEach((d) => { totalKm += d.data().distancia_km || 0; });

            return {
              id: uid,
              nome: uData?.nome || "Corredor",
              totalKm,
              nivel: uData?.nivel || 1,
              status: uData?.status || "offline",
              avatarUrl: uData?.avatarUrl || null,
            };
          })
        );

        setAmigosUsers(users.sort((a, b) => b.totalKm - a.totalKm));
      } catch (e) { console.error(e); }
    });

    return unsubUser;
  }, [currentUser?.uid]);

  // ── Escuta mudanças de avatar/status dos usuários em tempo real ────────────
  // Sempre que um usuário atualiza o avatar ou status no Firestore,
  // o ranking reflete a mudança sem precisar reabrir a tela.
  useEffect(() => {
    if (regionalUsers.length === 0) return;

    const unsubs = regionalUsers.map((u) =>
      onSnapshot(doc(db, "usuarios", u.id), (snap) => {
        const data = snap.data();
        if (!data) return;
        setRegionalUsers((prev) =>
          prev.map((user) =>
            user.id === u.id
              ? { ...user, avatarUrl: data.avatarUrl || null, status: data.status || "offline", nome: data.nome || user.nome }
              : user
          )
        );
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [regionalUsers.length]);

  useEffect(() => {
    if (amigosUsers.length === 0) return;

    const unsubs = amigosUsers.map((u) =>
      onSnapshot(doc(db, "usuarios", u.id), (snap) => {
        const data = snap.data();
        if (!data) return;
        setAmigosUsers((prev) =>
          prev.map((user) =>
            user.id === u.id
              ? { ...user, avatarUrl: data.avatarUrl || null, status: data.status || "offline", nome: data.nome || user.nome }
              : user
          )
        );
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [amigosUsers.length]);

  function switchTab(t: "regional" | "amigos") {
    setTab(t);
    Animated.spring(tabAnim, { toValue: t === "regional" ? 0 : 1, useNativeDriver: false }).start();
  }

  function openDrawer() {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: false }).start();
  }

  function closeDrawer() {
    Animated.spring(drawerAnim, { toValue: -width * 0.8, useNativeDriver: false }).start(() => {
      setDrawerOpen(false);
    });
  }

  const users = tab === "regional" ? regionalUsers : amigosUsers;
  const top3  = users.slice(0, 3);
  const rest  = users.slice(3);

  const tabLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "52%"] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3F69" />

      {/* BLOCO AZUL */}
      <View style={styles.blueBlock}>
        
        <TouchableOpacity style={styles.drawer} onPress={openDrawer}>
          <Feather name="menu" size={30} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Ranking</Text>

        <View style={styles.tabContainer}>
          <Animated.View style={[styles.tabIndicator, { left: tabLeft }]} />
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab("regional")}>
            <Text style={[styles.tabText, tab === "regional" && styles.tabTextActive]}>regional</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab("amigos")}>
            <Text style={[styles.tabText, tab === "amigos" && styles.tabTextActive]}>amigos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTEÚDO */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {tab === "amigos" ? "Adicione amigos para ver o ranking!" : "Nenhum dado encontrado."}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Podium users={top3} />

          {rest.map((u, i) => (
            <RankItem key={u.id} user={u} position={i + 4} isAmigos={tab === "amigos"} />
          ))}
        </ScrollView>
      )}

      {drawerOpen && (
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={closeDrawer} />
      )}
      <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
        {/* Cabeçalho do usuário */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            {userData?.avatarUrl ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {userData?.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "??"}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{userData?.nome || "Carregando..."}</Text>
          <Text style={styles.userId}>ID: {userData?.codigoId || "..."}</Text>
          <View style={styles.nivelBadge}>
            <Text style={styles.nivelText}>⭐ nível {userData?.nivel || 1}</Text>
          </View>
        </View>

        {/* Itens do menu */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeDrawer(); router.push("/(drawer)/rotasSugeridas"); }}>
            <View style={styles.menuIconWrapper}>
              <FontAwesome6 name="route" size={24} color="#22C3A3" />
            </View>
            <Text style={styles.menuText}>Rotas Sugeridas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { closeDrawer(); router.push("/(drawer)/conquistas"); }}>
            <View style={styles.menuIconWrapper}>
              <Entypo name="medal" size={24} color="#22C3A3" />
            </View>
            <Text style={styles.menuText}>Conquistas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeDrawer(); router.push("/(drawer)/pontosTuristicos"); }}>
            <View style={styles.menuIconWrapper}>
              <Ionicons name="location-outline" size={24} color="#22C3A3" />
            </View>
            <Text style={styles.menuText}>Pontos Turísticos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeDrawer(); router.push("/(drawer)/historico"); }}>
            <View style={styles.menuIconWrapper}>
              <AntDesign name="field-time" size={24} color="#22C3A3" />
            </View>
            <Text style={styles.menuText}>Histórico de Corridas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeDrawer(); router.push("/(drawer)/adicionarAmigos"); }}>
            <View style={styles.menuIconWrapper}>
              <Feather name="user-plus" size={24} color="#22C3A3" />
            </View>
            <Text style={styles.menuText}>Adicionar Amigos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeDrawer(); router.push("/(tabs)/ranking"); }}>
            <View style={styles.menuIconWrapper}>
              <Octicons name="trophy" size={24} color="#22C3A3" />
            </View>
            <Text style={styles.menuText}>Ranking</Text>
          </TouchableOpacity>
        </View>
        <View style= {{width:400,marginRight:100}}>
          <TouchableOpacity style={styles.back} onPress={() => { closeDrawer(); router.push("/auth/login"); }}>
            <Text style={{fontWeight: "900",fontSize: 20,color: "white"}}>sair</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/(drawer)/adicionarAmigos" as const)}>
        <Feather name="user-plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
  },

  blueBlock: {
    width:"100%",
    height:"25%",
    backgroundColor: "#2C3F69",
    paddingTop: 90,
    paddingBottom:50, // ✅ era 90 — reduziu para valor normal
    alignItems: "center",
    borderBottomLeftRadius:25,
    borderBottomRightRadius:25
   
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 6,
    position: "relative",
    height: 40,
    width: "70%",
  },
  tabIndicator: {
    position: "absolute",
    width: "50%",
    height: 40,
    backgroundColor: "#22c3a3c1",
    borderRadius: 12,
  
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  scrollView: {
    flex: 1,
  },

  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF9F2",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rankPosition: {
    color: "#2C3F69",
    fontWeight: "700",
    fontSize: 14,
    width: 28,
  },
  rankName: {
    color: "#2C3F69",
    fontWeight: "600",
    fontSize: 15,
  },
  rankStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  rankKm: {
    color: "#1B2B5E",
    fontWeight: "700",
    fontSize: 13,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#8E8E93",
    fontSize: 15,
  },

  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#22C3A3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#22C3A3",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  drawer: {
    position: "absolute",
    top: 25,
    backgroundColor:"transparent",
    height: 50,
    width: 50,
    left:5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
  },
  drawerPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.70,
    height: "100%",
    backgroundColor: "#ffffff",
    zIndex: 11,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  userHeader: {
    backgroundColor: "#2C3F69",
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: "#07070e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
    overflow: "hidden",
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
  },
  avatarText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  userName: { color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 2 },
  userId: { color: "#8E8E93", fontSize: 12, marginBottom: 10 },
  nivelBadge: {
    backgroundColor: "rgba(34, 195, 163, 0.17)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  nivelText: { color: "#22C3A3", fontSize: 13, fontWeight: "600" },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff",
    gap: 12,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(34, 195, 163, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  back: {
    backgroundColor: "#ff0000",
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 90,
    width: 120,
    
    
  }
  
});
