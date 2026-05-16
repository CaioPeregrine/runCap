import { db } from "../../../firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  Text,
  View,
} from "react-native";
import ConquistaCard from "./ConquistaCard";
import { conquistasData } from "./conquistasData";
import styles from "./styles";
import XPProgressBar from "@/components/XPProgressBar";
import { xpInicioDoNivel, xpFimDoNivel, XP_MAXIMO } from "@/app/hooks/useXP";

interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  nivelRequerido: number;
  desbloqueada: boolean;
}

interface EstadoXP {
  xpTotal: number;
  nivel: number;
}

export default function Conquistas() {
  const auth = getAuth();
  const uid = auth.currentUser?.uid ?? "";

  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [estadoXP, setEstadoXP]     = useState<EstadoXP>({ xpTotal: 0, nivel: 1 });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (uid) fetchConquistas();
  }, [uid]);

  async function fetchConquistas() {
    try {
      const uDoc = await getDoc(doc(db, "usuarios", uid));
      const data = uDoc.data() ?? {};

      const idsDesbloqueadas: string[] = data.conquistas ?? [];
      const conquistasComStatus = conquistasData.map((c) => ({
        ...c,
        desbloqueada: idsDesbloqueadas.includes(c.id),
      }));

      setConquistas(conquistasComStatus);
      setEstadoXP({
        xpTotal: data.xpTotal ?? data.xp ?? 0,
        nivel:   data.nivel   ?? 1,
      });
    } catch (e) {
      console.error("Erro ao buscar conquistas:", e);
      Alert.alert("Erro", "Não foi possível carregar as conquistas.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#22C3A3" />
      </View>
    );
  }

  const desbloqueadas = conquistas.filter((c) => c.desbloqueada).length;
  const { xpTotal, nivel } = estadoXP;
  const ehMaximo  = xpTotal >= XP_MAXIMO;
  const xpInicio  = xpInicioDoNivel(nivel);
  const xpFim     = ehMaximo ? XP_MAXIMO : xpFimDoNivel(nivel);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F4F8" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Conquistas</Text>
          <Text style={styles.subtitle}>
            {desbloqueadas} de {conquistasData.length} desafios desbloqueados.
          </Text>
        </View>
      </View>

      {/* ── Barra de XP ── */}
      <View style={{ marginBottom: 12 }}>
        <XPProgressBar
          xpTotal={xpTotal}
          xpInicioNivel={xpInicio}
          xpFimNivel={xpFim}
          nivel={nivel}
          nivelMaximo={ehMaximo}
        />
      </View>

      <FlatList
        data={conquistas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ConquistaCard
            id={item.id}
            titulo={item.titulo}
            descricao={item.descricao}
            icone={item.icone}
            desbloqueada={item.desbloqueada}
          />
        )}
      />
    </View>
  );
}
