// hooks/useConquistas.ts  ← crie na pasta hooks/
import { useCallback } from "react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig"; // ajuste se necessário

function parsePace(pace: string): number {
  const match = pace.match(/(\d+):(\d+)/);
  if (!match) return 99;
  return parseInt(match[1]) + parseInt(match[2]) / 60;
}

export type DadosCorrida = {
  distancia_km: number;
  pace: string;
  rotaFechada?: boolean;
  pontosVisitados?: string[];
};

// Garante campos que usuários antigos podem não ter
async function garantirCampos(uid: string, uData: Record<string, any>) {
  const faltando: Record<string, any> = {};
  if (!Array.isArray(uData.conquistas))             faltando.conquistas = [];
  if (typeof uData.areasFechardasTotal !== "number") faltando.areasFechardasTotal = 0;
  if (!Array.isArray(uData.pontosVisitadosTotal))    faltando.pontosVisitadosTotal = [];
  // totalKm já existe no seu Firestore — não precisa criar

  if (Object.keys(faltando).length > 0) {
    await updateDoc(doc(db, "usuarios", uid), faltando);
    Object.assign(uData, faltando);
  }
}

function calcularNovas(
  corrida: DadosCorrida,
  totalKm: number,           // campo que já existe no seu Firestore
  sequenciaAtual: number,
  areasFechardasTotal: number,
  pontosVisitadosTotal: string[],
  desbloqueadas: Set<string>
): string[] {
  const novas: string[] = [];
  const tentar = (id: string) => { if (!desbloqueadas.has(id)) novas.push(id); };

  const totalComEsta = totalKm + corrida.distancia_km;
  const paceNum = parsePace(corrida.pace);
  const pontosUnicos = new Set([...pontosVisitadosTotal, ...(corrida.pontosVisitados ?? [])]);

  // Distância por corrida
  if (corrida.distancia_km >= 1) { tentar("primeiro_km"); tentar("primeira_corrida"); }

  // Distância acumulada (usa totalKm que já existe)
  if (totalComEsta >= 5)   tentar("cinco_km");
  if (totalComEsta >= 10)  tentar("dez_km");
  if (totalComEsta >= 21)  tentar("meia_maratona");
  if (totalComEsta >= 25)  tentar("vinte_cinco_km");
  if (totalComEsta >= 42)  tentar("maratona");
  if (totalComEsta >= 50)  tentar("cinquenta_km");
  if (totalComEsta >= 100) tentar("cem_km");
  if (totalComEsta >= 200) tentar("duzentos_km");

  // Sequência
  if (sequenciaAtual >= 3)  tentar("sequencia_3");
  if (sequenciaAtual >= 7)  tentar("sequencia_7");
  if (sequenciaAtual >= 15) tentar("sequencia_15");
  if (sequenciaAtual >= 30) tentar("sequencia_30");
  if (sequenciaAtual >= 60) tentar("sequencia_60");

  // Áreas fechadas
  const totalAreas = areasFechardasTotal + (corrida.rotaFechada ? 1 : 0);
  if (totalAreas >= 1)  tentar("primeira_area_fechada");
  if (totalAreas >= 5)  tentar("cinco_areas_fechadas");
  if (totalAreas >= 10) tentar("dez_areas_fechadas");

  // Pontos turísticos
  const mapapontos: Record<string, string> = {
    teatro_amazonas:    "teatro_visitado",
    museu_seringal:     "museu_visitado",
    bosque_ciencias:    "parque_visitado",
    praia_ponta_negra:  "praia_visitada",
    encontro_das_aguas: "encontro_aguas",
  };
  (corrida.pontosVisitados ?? []).forEach((idPonto) => {
    const idConquista = mapapontos[idPonto];
    if (idConquista) tentar(idConquista);
  });
  if (pontosUnicos.size >= 3) tentar("tres_pontos_turisticos");
  if (pontosUnicos.size >= 5) tentar("cinco_pontos_turisticos");
  if (Object.keys(mapapontos).every((p) => pontosUnicos.has(p))) tentar("todos_pontos");

  // Velocidade
  if (paceNum < 7 && corrida.distancia_km >= 1) tentar("pace_7");
  if (paceNum < 5 && corrida.distancia_km >= 1) tentar("veloz");
  if (paceNum < 4 && corrida.distancia_km >= 1) tentar("extremamente_veloz");

  return novas;
}

export function useConquistas() {
  const verificarConquistas = useCallback(async (
    uid: string,
    corrida: DadosCorrida
  ): Promise<string[]> => {
    try {
      const uRef  = doc(db, "usuarios", uid);
      const uSnap = await getDoc(uRef);
      if (!uSnap.exists()) return [];

      const uData = uSnap.data() as Record<string, any>;
      await garantirCampos(uid, uData);

      const desbloqueadas   = new Set<string>(uData.conquistas ?? []);
      const totalKm         = (uData.totalKm as number) ?? 0;        // ← seu campo existente
      const sequencia       = (uData.sequenciaAtual as number) ?? 0;
      const areasTotal      = (uData.areasFechardasTotal as number) ?? 0;
      const pontosTotal     = (uData.pontosVisitadosTotal as string[]) ?? [];

      const novas = calcularNovas(
        corrida, totalKm, sequencia, areasTotal, pontosTotal, desbloqueadas
      );

      // Monta o update
      const updateData: Record<string, any> = {
        // Atualiza totalKm somando a corrida atual
        totalKm: totalKm + corrida.distancia_km,
      };
      if (novas.length > 0) {
        updateData.conquistas = arrayUnion(...novas);
      }
      if (corrida.rotaFechada) {
        updateData.areasFechardasTotal = areasTotal + 1;
      }
      const novosUnicos = (corrida.pontosVisitados ?? []).filter(
        (p) => !pontosTotal.includes(p)
      );
      if (novosUnicos.length > 0) {
        updateData.pontosVisitadosTotal = arrayUnion(...novosUnicos);
      }

      await updateDoc(uRef, updateData);
      return novas;

    } catch (e) {
      console.error("Erro ao verificar conquistas:", e);
      return [];
    }
  }, []);

  return { verificarConquistas };
}
