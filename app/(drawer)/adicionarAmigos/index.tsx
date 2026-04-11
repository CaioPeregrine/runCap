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
import { db } from "../../../firebase/firebaseConfig";
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import styles from "./styles";

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

            <View style={styles.headerazul}>

              <View style={{ paddingHorizontal: 10, paddingTop: 15 }}>
                <TouchableOpacity onPress={() => router.push("/ranking")}>
                  <Ionicons name="arrow-back-outline" size={35} color="white" /></TouchableOpacity>

              </View>

              <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                <Text style={{ color: "white", fontSize: 40, fontWeight: "bold" }}>amigos</Text>
              </View>

              <View>
                <Text style={{ color: "#B3B3B3", fontSize: 16, paddingHorizontal: 20 }}>
                  convide amigos para correr juntos
                </Text>
              </View>


            </View>

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
