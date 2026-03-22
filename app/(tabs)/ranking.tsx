import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { db } from "@/firebase/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

type RankingUser = {
  id: string;
  nome: string;
  totalKm: number;
  nivel: number;
  status: "online" | "offline" | "correndo";
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
}: {
  nome: string;
  size?: number;
  status?: "online" | "offline" | "correndo";
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
      }}>
        <Text style={{ color: "#FFF", fontWeight: "700", fontSize: size * 0.35 }}>
          {initials}
        </Text>
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
        <Avatar nome={user.nome} size={isFirst ? 62 : 50} status={user.status} />
        <Text style={{
          color: "#1B2B5E", fontWeight: "700",
          fontSize: isFirst ? 14 : 12, marginTop: 6, textAlign: "center",
        }} numberOfLines={1}>
          {user.nome.split(" ")[0]}
        </Text>
        <Text style={{ fontSize: 10, color: "#8E8E93", marginBottom: 6 }}>
          {user.totalKm.toFixed(1)} km
        </Text>
        <View style={{
          width: "80%", height: podiumHeight,
          backgroundColor: isFirst ? "#ffffff" : "#E0E0E0",
          borderTopLeftRadius: 8, borderTopRightRadius: 8,
          alignItems: "center", justifyContent: "flex-start", paddingTop: 8,
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
      paddingHorizontal: 16, height: 210, marginBottom: 8,
    }}>
      <PodiumItem user={second} position={2} podiumHeight={90} />
      <PodiumItem user={first}  position={1} podiumHeight={130} />
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
      <Avatar nome={user.nome} size={40} status={isAmigos ? user.status : undefined} />
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
export default function RankingScreen({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const [tab, setTab]                     = useState<"regional" | "amigos">("regional");
  const [regionalUsers, setRegionalUsers] = useState<RankingUser[]>([]);
  const [amigosUsers, setAmigosUsers]     = useState<RankingUser[]>([]);
  const [loading, setLoading]             = useState(true);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const currentUser = getAuth().currentUser;

  async function fetchRegional() {
    try {
      const snap = await getDocs(
        query(collection(db, "corridas"), orderBy("distancia_km", "desc"), limit(50))
      );
      const map: Record<string, { totalKm: number; uid: string }> = {};
      snap.forEach((d) => {
        const data = d.data();
        const uid = data.uid || d.id;
        if (!map[uid]) map[uid] = { totalKm: 0, uid };
        map[uid].totalKm += data.distancia_km || 0;
      });
      const users: RankingUser[] = await Promise.all(
        Object.values(map).sort((a, b) => b.totalKm - a.totalKm).slice(0, 10)
          .map(async ({ uid, totalKm }) => {
            const d = await getDoc(doc(db, "usuarios", uid));
            const u = d.data();
            return { id: uid, nome: u?.nome || "Corredor", totalKm, nivel: u?.nivel || 1, status: u?.status || "offline" };
          })
      );
      setRegionalUsers(users);
    } catch (e) { console.error(e); }
  }

  async function fetchAmigos() {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
      const amigosIds: string[] = userDoc.data()?.amigos || [];
      if (!amigosIds.length) { setAmigosUsers([]); return; }
      const ids = [currentUser.uid, ...amigosIds];
      const users: RankingUser[] = await Promise.all(
        ids.map(async (uid) => {
          const uDoc = await getDoc(doc(db, "usuarios", uid));
          const uData = uDoc.data();
          const cSnap = await getDocs(query(collection(db, "corridas"), where("uid", "==", uid)));
          let totalKm = 0;
          cSnap.forEach((d) => { totalKm += d.data().distancia_km || 0; });
          return { id: uid, nome: uData?.nome || "Corredor", totalKm, nivel: uData?.nivel || 1, status: uData?.status || "offline" };
        })
      );
      setAmigosUsers(users.sort((a, b) => b.totalKm - a.totalKm));
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchRegional(), fetchAmigos()]);
      setLoading(false);
    })();
  }, []);

  function switchTab(t: "regional" | "amigos") {
    setTab(t);
    Animated.spring(tabAnim, { toValue: t === "regional" ? 0 : 1, useNativeDriver: false }).start();
  }

  const users = tab === "regional" ? regionalUsers : amigosUsers;
  const top3  = users.slice(0, 3);
  const rest  = users.slice(3);

  const tabLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "52%"] });

  return (
    /*
      ESTRUTURA:
      ┌─────────────────────────┐
      │  blueBlock (zIndex: 10) │  ← azul fica SEMPRE na frente
      │  título + tabs          │
      └─────────────────────────┘
      ┌─────────────────────────┐
      │  ScrollView (zIndex: 1) │  ← conteúdo atrás do azul
      │   Podium                │
      │   RankItem 4°...        │
      └─────────────────────────┘
    */
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2B5E" />

      {/* BLOCO AZUL — zIndex alto garante que fica na frente de tudo */}
      <View style={styles.blueBlock}>
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

      {/* CONTEÚDO — renderizado logo abaixo do blueBlock no DOM */}
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
          {/* Pódio — primeiro item do scroll, aparece direto abaixo do azul */}
          <Podium users={top3} />

          {/* Lista 4+ */}
          {rest.map((u, i) => (
            <RankItem key={u.id} user={u} position={i + 4} isAmigos={tab === "amigos"} />
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/adicionarAmigos")}>
        <Text style={styles.fabIcon}>👥+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
  },

  // ─── CHAVE DO PROBLEMA ───────────────────────────────────────────────────
  // elevation: 10 no Android cria um "contexto de empilhamento" que garante
  // que o bloco azul fique visualmente na frente do ScrollView.
  // zIndex sozinho NÃO funciona no Android sem elevation.
  blueBlock: {
    backgroundColor: "#1B2B5E",
    paddingTop: 16,
    paddingBottom: 60,
    alignItems: "center",
    zIndex: 10,        // ← garante ordem no iOS
    elevation: 10,     // ← obrigatório no Android para zIndex funcionar
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 4,
    position: "relative",
    height: 40,
    width: "65%",
  },
  tabIndicator: {
    position: "absolute",
    width: "46%",
    height: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 9,
    top: 4,
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

  // ScrollView com zIndex menor que o blueBlock
  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#22C3A3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#22C3A3",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  fabIcon: {
    fontSize: 20,
  },
});
