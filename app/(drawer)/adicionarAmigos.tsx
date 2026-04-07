import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as Clipboard from "expo-clipboard";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Amigo = {
  id: string;
  nome: string;
  nivel: number;
  status: "online" | "offline" | "correndo";
};

type Convite = {
  id: string;
  deNome: string;
  deUid: string;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ nome, size = 44 }: { nome: string; size?: number }) {
  const initials = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = ["#5E5CE6", "#30D158", "#FF9F0A", "#FF375F", "#64D2FF"];
  const colorIndex = nome.charCodeAt(0) % colors.length;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors[colorIndex],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#FFF", fontWeight: "700", fontSize: size * 0.35 }}>
        {initials}
      </Text>
    </View>
  );
}

const STATUS_COLOR = {
  online: "#30D158",
  offline: "#8E8E93",
  correndo: "#FF9F0A",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdicionarAmigos() {
  
  const auth = getAuth();
  const currentUser = auth.currentUser!;

  const [meuId, setMeuId] = useState("");
  const [busca, setBusca] = useState("");
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [resultadoBusca, setResultadoBusca] = useState<Amigo | null>(null);
  const [semResultado, setSemResultado] = useState(false);

  // ── Carrega dados do usuário atual ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "usuarios", currentUser.uid),
      async (snap) => {
        const data = snap.data();
        if (!data) return;
        setMeuId(data.codigoId || "");

        const amigosIds: string[] = data.amigos || [];
        const amigosData = await Promise.all(
          amigosIds.map(async (uid) => {
            const aDoc = await getDoc(doc(db, "usuarios", uid));
            const aData = aDoc.data();
            return {
              id: uid,
              nome: aData?.nome || "Corredor",
              nivel: aData?.nivel || 1,
              status: aData?.status || "offline",
            } as Amigo;
          })
        );
        setAmigos(amigosData);

        // Convites recebidos
        const convitesSnap = await getDocs(
          query(
            collection(db, "convites"),
            where("paraUid", "==", currentUser.uid),
            where("status", "==", "pendente")
          )
        );
        const convitesData: Convite[] = convitesSnap.docs.map((d) => ({
          id: d.id,
          deNome: d.data().deNome,
          deUid: d.data().deUid,
        }));
        setConvites(convitesData);
      }
    );
    return unsubscribe;
  }, []);

  // ── Copiar ID ──────────────────────────────────────────────────────────────
  async function copiarId() {
    await Clipboard.setStringAsync(meuId);
    Alert.alert("✅ Copiado!", "Seu ID foi copiado para a área de transferência.");
  }

  // ── Buscar amigo por ID ────────────────────────────────────────────────────
  async function buscarAmigo() {
    if (!busca.trim()) return;
    setBuscando(true);
    setResultadoBusca(null);
    setSemResultado(false);

    try {
      const q = query(
        collection(db, "usuarios"),
        where("codigoId", "==", busca.trim().toUpperCase())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setSemResultado(true);
      } else {
        const d = snap.docs[0];
        const data = d.data();
        setResultadoBusca({
          id: d.id,
          nome: data.nome || "Corredor",
          nivel: data.nivel || 1,
          status: data.status || "offline",
        });
      }
    } catch (e) {
      Alert.alert("Erro", String(e));
    } finally {
      setBuscando(false);
    }
  }

  // ── Enviar convite ─────────────────────────────────────────────────────────
  async function enviarConvite(paraUid: string, paraNome: string) {
    if (amigos.find((a) => a.id === paraUid)) {
      Alert.alert("Já são amigos!", "Vocês já estão na lista de amigos.");
      return;
    }
    try {
      const meuDoc = await getDoc(doc(db, "usuarios", currentUser.uid));
      const meuNome = meuDoc.data()?.nome || "Corredor";

      // Verifica se já enviou convite
      const existente = await getDocs(
        query(
          collection(db, "convites"),
          where("deUid", "==", currentUser.uid),
          where("paraUid", "==", paraUid),
          where("status", "==", "pendente")
        )
      );
      if (!existente.empty) {
        Alert.alert("Convite já enviado!", "Aguarde a resposta.");
        return;
      }

      await import("firebase/firestore").then(({ addDoc }) =>
        addDoc(collection(db, "convites"), {
          deUid: currentUser.uid,
          deNome: meuNome,
          paraUid,
          paraNome,
          status: "pendente",
          criadoEm: new Date(),
        })
      );
      Alert.alert("✅ Convite enviado!", `Convite enviado para ${paraNome}.`);
      setResultadoBusca(null);
      setBusca("");
    } catch (e) {
      Alert.alert("Erro", String(e));
    }
  }

  // ── Aceitar convite ────────────────────────────────────────────────────────
  async function aceitarConvite(convite: Convite) {
    try {
      // Adiciona mutuamente
      await updateDoc(doc(db, "usuarios", currentUser.uid), {
        amigos: arrayUnion(convite.deUid),
      });
      await updateDoc(doc(db, "usuarios", convite.deUid), {
        amigos: arrayUnion(currentUser.uid),
      });
      // Atualiza status do convite
      await updateDoc(doc(db, "convites", convite.id), { status: "aceito" });
      Alert.alert("🎉 Amizade confirmada!", `Você e ${convite.deNome} agora são amigos.`);
    } catch (e) {
      Alert.alert("Erro", String(e));
    }
  }

  // ── Recusar convite ────────────────────────────────────────────────────────
  async function recusarConvite(conviteId: string) {
    await updateDoc(doc(db, "convites", conviteId), { status: "recusado" });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

    
      <FlatList
        data={amigos}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            
            <View style={styles.headerazul}></View>

            {/* Seu ID */}
            <View style={styles.idCard}>
              <View>
                <Text style={styles.idLabel}>Seu ID</Text>
                <Text style={styles.idValue}>ID:{meuId}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copiarId}>
                <Text style={styles.copyBtnText}><MaterialCommunityIcons name="content-copy" size={20} color="white" /> copiar</Text>
              </TouchableOpacity>
            </View>

            {/* Convites pendentes */}
            {convites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Convites 📩 ({convites.length})
                </Text>
                {convites.map((c) => (
                  <View key={c.id} style={styles.conviteItem}>
                    <Avatar nome={c.deNome} size={40} />
                    <Text style={styles.conviteNome}>{c.deNome}</Text>
                    <TouchableOpacity
                      style={styles.btnAceitar}
                      onPress={() => aceitarConvite(c)}
                    >
                      <Text style={styles.btnAceitarText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnRecusar}
                      onPress={() => recusarConvite(c.id)}
                    >
                      <Text style={styles.btnRecusarText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Busca */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar amigos por ID..."
                placeholderTextColor="#636366"
                value={busca}
                onChangeText={setBusca}
                autoCapitalize="characters"
                onSubmitEditing={buscarAmigo}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={buscarAmigo}>
                {buscando ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.searchBtnText}>🔍</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Resultado da busca */}
            {semResultado && (
              <Text style={styles.semResultado}>Nenhum usuário encontrado.</Text>
            )}
            {resultadoBusca && (
              <View style={styles.resultadoItem}>
                <Avatar nome={resultadoBusca.nome} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rankName}>{resultadoBusca.nome}</Text>
                  <Text style={styles.rankSub}>Nível {resultadoBusca.nivel}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() =>
                    enviarConvite(resultadoBusca.id, resultadoBusca.nome)
                  }
                >
                  <Text style={styles.addBtnText}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Seus amigos ({amigos.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.amigoItem}>
            <Avatar nome={item.nome} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rankName}>{item.nome}</Text>
              <Text
                style={[
                  styles.rankSub,
                  { color: STATUS_COLOR[item.status] },
                ]}
              >
                {item.status === "correndo" ? "🏃 correndo" : item.status}
                {" · "}Nível {item.nivel}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.semResultado}>
            Você ainda não tem amigos. Busque pelo ID!
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  backBtn: { marginRight: 12 },
  backIcon: { color: "#FFF", fontSize: 22, fontWeight: "300" },
  title: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  headerazul: {
    backgroundColor: "#2C3F69",
    height: 280,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 10,
  },
  idCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  idLabel: { color: "#c1c1c1", fontSize: 12, marginBottom: 4, },
  idValue: { color: "#000000", fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  copyBtn: {
    backgroundColor: "#22C3A3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  section: { marginBottom: 16 },
  sectionTitle: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  conviteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2C2C2E",
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  conviteNome: { flex: 1, color: "#FFF", fontWeight: "600" },
  btnAceitar: {
    backgroundColor: "#30D158",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAceitarText: { color: "#FFF", fontWeight: "800" },
  btnRecusar: {
    backgroundColor: "#FF3B30",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRecusarText: { color: "#FFF", fontWeight: "800" },
  searchRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#6b6bff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: "#5E5CE6",
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { fontSize: 18 },
  semResultado: {
    color: "#636366",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    paddingHorizontal: 20,
  },
  resultadoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  amigoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  rankName: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  rankSub: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
  addBtn: {
    backgroundColor: "#5E5CE6",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  chevron: { color: "#636366", fontSize: 22 },
});
