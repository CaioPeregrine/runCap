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
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { db } from "@/firebase/firebaseConfig"
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

// ─── Tipos ────────────────────────────────────────────────────────────────────
type RankingUser = {
  id: string;
  nome: string;
  totalKm: number;
  nivel: number;
  status: "online" | "offline" | "correndo";
  avatarUrl?: string;
};

// ─── Cores de status ──────────────────────────────────────────────────────────
const STATUS_COLOR = {
  online: "#30D158",
  offline: "#8E8E93",
  correndo: "#FF9F0A",
};

// ─── Ícone de avatar padrão (iniciais) ───────────────────────────────────────
function Avatar({
  nome,
  size = 44,
  avatarUrl,
  status,
}: {
  nome: string;
  size?: number;
  avatarUrl?: string;
  status?: "online" | "offline" | "correndo";
}) {
  const initials = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = ["#5E5CE6", "#30D158", "#FF9F0A", "#FF375F", "#64D2FF"];
  const colorIndex =
    nome.charCodeAt(0) % colors.length;

  return (
    <View style={{ position: "relative" }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors[colorIndex],
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "#2C2C2E",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontWeight: "700",
            fontSize: size * 0.35,
          }}
        >
          {initials}
        </Text>
      </View>
      {status && (
        <View
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: STATUS_COLOR[status],
            borderWidth: 2,
            borderColor: "#1C1C1E",
          }}
        />
      )}
    </View>
  );
}

// ─── Pódio (top 3) ────────────────────────────────────────────────────────────
function Podium({ users }: { users: RankingUser[] }) {
  const [first, second, third] = users;

  const PodiumItem = ({
    user,
    position,
    height,
  }: {
    user?: RankingUser;
    position: number;
    height: number;
  }) => {
    if (!user)
      return <View style={{ flex: 1, alignItems: "center" }} />;

    const medals = ["🥇", "🥈", "🥉"];
    const isFirst = position === 1;

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Avatar nome={user.nome} size={isFirst ? 60 : 48} status={user.status} />
        <Text
          style={{
            color: "#FFF",
            fontWeight: "700",
            fontSize: isFirst ? 14 : 12,
            marginTop: 6,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {user.nome.split(" ")[0]}
        </Text>
        <Text style={{ fontSize: 10, color: "#8E8E93", marginBottom: 6 }}>
          {user.totalKm.toFixed(1)} km
        </Text>
        <View
          style={{
            width: "80%",
            height,
            backgroundColor: isFirst ? "#5E5CE6" : "#3A3A3C",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 8,
          }}
        >
          <Text style={{ fontSize: isFirst ? 22 : 18 }}>{medals[position - 1]}</Text>
          <Text
            style={{
              color: "#FFF",
              fontWeight: "900",
              fontSize: isFirst ? 18 : 14,
              marginTop: 2,
            }}
          >
            {position}°
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        height: 200,
        marginBottom: 8,
      }}
    >
      <PodiumItem user={second} position={2} height={90} />
      <PodiumItem user={first} position={1} height={130} />
      <PodiumItem user={third} position={3} height={70} />
    </View>
  );
}

// ─── Item da lista (posição 4+) ───────────────────────────────────────────────
function RankItem({
  user,
  position,
  isAmigos,
}: {
  user: RankingUser;
  position: number;
  isAmigos: boolean;
}) {
  return (
    <View style={styles.rankItem}>
      <Text style={styles.rankPosition}>{position}°</Text>
      <Avatar nome={user.nome} size={40} status={isAmigos ? user.status : undefined} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rankName} numberOfLines={1}>
          {user.nome}
        </Text>
        {isAmigos && (
          <Text
            style={[
              styles.rankStatus,
              { color: STATUS_COLOR[user.status] },
            ]}
          >
            {user.status === "correndo" ? "🏃 correndo" : user.status}
            {" · "}Nível {user.nivel}
          </Text>
        )}
      </View>
      <Text style={styles.rankKm}>{user.totalKm.toFixed(1)} km</Text>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RankingScreen({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<"regional" | "amigos">("regional");
  const [regionalUsers, setRegionalUsers] = useState<RankingUser[]>([]);
  const [amigosUsers, setAmigosUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const tabAnim = useRef(new Animated.Value(0)).current;

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // ── Busca ranking regional ─────────────────────────────────────────────────
  async function fetchRegional() {
    try {
      // Agrupa corridas por usuário e soma km
      const corridasSnap = await getDocs(
        query(collection(db, "corridas"), orderBy("distancia_km", "desc"), limit(50))
      );

      const map: Record<string, { totalKm: number; uid: string }> = {};
      corridasSnap.forEach((d) => {
        const data = d.data();
        const uid = data.uid || d.id;
        if (!map[uid]) map[uid] = { totalKm: 0, uid };
        map[uid].totalKm += data.distancia_km || 0;
      });

      // Busca nomes dos usuários
      const users: RankingUser[] = await Promise.all(
        Object.values(map)
          .sort((a, b) => b.totalKm - a.totalKm)
          .slice(0, 10)
          .map(async ({ uid, totalKm }) => {
            const userDoc = await getDoc(doc(db, "usuarios", uid));
            const userData = userDoc.data();
            return {
              id: uid,
              nome: userData?.nome || "Corredor",
              totalKm,
              nivel: userData?.nivel || 1,
              status: userData?.status || "offline",
            };
          })
      );

      setRegionalUsers(users);
    } catch (e) {
      console.error("Erro ranking regional:", e);
    }
  }

  // ── Busca ranking de amigos ────────────────────────────────────────────────
  async function fetchAmigos() {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
      const amigosIds: string[] = userDoc.data()?.amigos || [];

      if (amigosIds.length === 0) {
        setAmigosUsers([]);
        return;
      }

      // Inclui o próprio usuário
      const ids = [currentUser.uid, ...amigosIds];

      const users: RankingUser[] = await Promise.all(
        ids.map(async (uid) => {
          const uDoc = await getDoc(doc(db, "usuarios", uid));
          const uData = uDoc.data();

          // Soma total de km das corridas
          const corridasSnap = await getDocs(
            query(collection(db, "corridas"), where("uid", "==", uid))
          );
          let totalKm = 0;
          corridasSnap.forEach((d) => {
            totalKm += d.data().distancia_km || 0;
          });

          return {
            id: uid,
            nome: uData?.nome || "Corredor",
            totalKm,
            nivel: uData?.nivel || 1,
            status: uData?.status || "offline",
          };
        })
      );

      users.sort((a, b) => b.totalKm - a.totalKm);
      setAmigosUsers(users);
    } catch (e) {
      console.error("Erro ranking amigos:", e);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchRegional(), fetchAmigos()]);
      setLoading(false);
    }
    load();
  }, []);

  function switchTab(t: "regional" | "amigos") {
    setTab(t);
    Animated.spring(tabAnim, {
      toValue: t === "regional" ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }

  const users = tab === "regional" ? regionalUsers : amigosUsers;
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "52%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenDrawer} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ranking</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => switchTab("regional")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "regional" && styles.tabTextActive,
            ]}
          >
            regional
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => switchTab("amigos")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "amigos" && styles.tabTextActive,
            ]}
          >
            amigos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {tab === "amigos"
              ? "Adicione amigos para ver o ranking!"
              : "Nenhum dado encontrado."}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Podium users={top3} />
          {rest.map((u, i) => (
            <RankItem
              key={u.id}
              user={u}
              position={i + 4}
              isAmigos={tab === "amigos"}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Botão flutuante — adicionar amigos */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/adicionarAmigos")}
      >
        <Text style={styles.fabIcon}>👥+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "#2C2C2E",
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    color: "#FFF",
    fontSize: 22,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#3A3A3C",
    margin: 16,
    borderRadius: 12,
    padding: 4,
    position: "relative",
    height: 44,
  },
  tabIndicator: {
    position: "absolute",
    width: "46%",
    height: 36,
    backgroundColor: "#5E5CE6",
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
    color: "#8E8E93",
    fontWeight: "600",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  rankPosition: {
    color: "#8E8E93",
    fontWeight: "700",
    fontSize: 14,
    width: 28,
  },
  rankName: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  rankStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  rankKm: {
    color: "#5E5CE6",
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
    backgroundColor: "#30D158",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#30D158",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  fabIcon: {
    fontSize: 20,
  },
});
