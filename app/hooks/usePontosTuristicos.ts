import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export type PontoTuristico = {
  id: string;
  nome: string;
  descricao: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
};

export function usePontosTuristicos() {
  const [pontos, setPontos] = useState<PontoTuristico[]>([]);

  useEffect(() => {
    getDocs(collection(db, "pontosTuristicos")).then((snap) => {
      setPontos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PontoTuristico)));
    });
  }, []);

  return pontos;
}