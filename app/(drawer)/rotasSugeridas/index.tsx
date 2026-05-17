/**
 * pontosTuristicos/index.tsx
 *
 * Exibe todos os pontos turísticos.
 * Cards bloqueados (cadeado) até o usuário concluir a corrida daquele ponto.
 * Ao concluir, corridaConcluida chama desbloquearPonto(uid, pontoId) e
 * o id entra em pontosVisitados[] no Firestore — o card vira desbloqueado.
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

import CardTuristicos from "@/components/CardTuristicos";
import styles from "./styles"; // seu styles original

// ── Tipo do ponto turístico — ajuste conforme seu usePontosTuristicos ─────────
interface Ponto {
  id: string;
  nome: string;         // ou "title" se for assim no seu hook
  descricao: string;
  imageUrl: string;
}

// Cole aqui seus pontos ou importe do seu hook/array existente:
// import { usePontosTuristicos } from "@/hooks/usePontosTuristicos";
// const pontos = usePontosTuristicos();
//
// Por enquanto, exemplo com array fixo — substitua pelo seu:
const PONTOS_FIXOS: Ponto[] = [
  {
    id: "teatro_amazonas",
    nome: "Teatro Amazonas",
    descricao: "Inaugurado em 1896 no auge do Ciclo da Borracha, o Teatro Amazonas é um marco da Belle Époque no coração da Amazônia.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Teatro_Amazonas_wide.jpg/1280px-Teatro_Amazonas_wide.jpg",
  },
  // Adicione seus outros pontos aqui
];

export default function PontosTuristicos() {
  const uid = getAuth().currentUser?.uid ?? "";
  const [pontosVisitados, setPontosVisitados] = useState<string[]>([]);
  const [carregando, setCarregando]           = useState(true);

  useEffect(() => {
    if (!uid) return;
    fetchVisitados();
  }, [uid]);

  async function fetchVisitados() {
    try {
      const snap = await getDoc(doc(db, "usuarios", uid));
      const ids: string[] = snap.data()?.pontosVisitados ?? [];
      setPontosVisitados(ids);
    } catch (e) {
      console.error("Erro ao buscar pontos visitados:", e);
    } finally {
      setCarregando(false);
    }
  }

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

        {PONTOS_FIXOS.map((ponto) => (
          <CardTuristicos
            key={ponto.id}
            title={ponto.nome}
            description={ponto.descricao}
            imageUrl={ponto.imageUrl}
            desbloqueado={pontosVisitados.includes(ponto.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
