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

interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  categoria: string;
  desbloqueada: boolean;
}

export default function Conquistas() {
  const auth = getAuth();
  const uid = auth.currentUser?.uid ?? "";

  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (uid) {
      fetchConquistas();
    }
  }, [uid]);

  /**
   * fetchConquistas
   * Lê array de ids desbloqueados do Firestore e mescla com conquistasData
   */
  async function fetchConquistas() {
    try {
      const uDoc = await getDoc(doc(db, "usuarios", uid));
      const idsDesbloqueadas: string[] = uDoc.data()?.conquistas ?? [];
      const conquistasComStatus = conquistasData.map((c) => ({
        ...c,
        desbloqueada: idsDesbloqueadas.includes(c.id),
      }));
      setConquistas(conquistasComStatus);
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
