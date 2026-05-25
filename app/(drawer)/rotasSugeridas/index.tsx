import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

import CardSugeridos from "@/components/CardSugeridos";
import { usePontosTuristicos } from "@/app/hooks/usePontosTuristicos";
import styles from "./styles";
import CardAmigos from "@/components/cardAmigos";

export default function PontosTuristicos() {
  const uid = getAuth().currentUser?.uid ?? "";
  const pontos = usePontosTuristicos();

  const [pontosVisitados, setPontosVisitados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!uid) return;

    getDoc(doc(db, "usuarios", uid))
      .then((snap) => {
        const ids: string[] = snap.data()?.pontosVisitados ?? [];
        setPontosVisitados(ids);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [uid]);

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#22C3A3" />
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.blocoazul} />

        {pontos.map((ponto) => (
          <CardSugeridos
            key={ponto.id}
            ponto={ponto}
          />
        ))}
       
      </View>
    </ScrollView>
  );
}