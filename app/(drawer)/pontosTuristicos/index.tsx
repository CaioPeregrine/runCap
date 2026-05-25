





import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

import CardTuristicos from "@/components/CardTuristicos";
import { usePontosTuristicos } from "@/app/hooks/usePontosTuristicos";
import styles from "./styles";

export default function PontosTuristicos() {
  const uid = getAuth().currentUser?.uid ?? "";
  const pontos = usePontosTuristicos(); // busca coleção "pontosTuristicos" do Firestore

  const [pontosVisitados, setPontosVisitados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!uid) return;

    // Lê o array pontosVisitados do documento do usuário
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
          <CardTuristicos
            key={ponto.id}
            title={ponto.nome}
            description={ponto.descricao}
            imageUrl={ponto.imageUrl}
            /**
             * ponto.id = id do documento no Firestore (coleção pontosTuristicos)
             * Esse mesmo id é passado como pontoId no CardSugeridos →
             * correndoPontoT → corridaConcluida → desbloquearPonto(uid, pontoId)
             * e salvo em pontosVisitados[].
             * Quando pontosVisitados inclui esse id, o card é desbloqueado.
             */
            desbloqueado={pontosVisitados.includes(ponto.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

