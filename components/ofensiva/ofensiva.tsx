/**
 * SequenciaStreak.tsx
 *
 * Componente reutilizável de sequência de dias (estilo Duolingo).
 * Mostra os últimos 7 dias, destaca dias completados e a sequência atual.
 *
 * USO:
 *   import SequenciaStreak from "@/components/SequenciaStreak";
 *
 *   // Básico — busca dados do Firestore automaticamente
 *   <SequenciaStreak uid={uid} />
 *
 *   // Passando dados manualmente
 *   <SequenciaStreak
 *     uid={uid}
 *     sequenciaAtual={7}
 *     diasCompletos={["2026-04-01", "2026-04-02", "2026-04-05"]}
 *   />
 *
 * FIRESTORE:
 *   Lê e atualiza "usuarios/{uid}":
 *     maiorSequencia: number
 *     sequenciaAtual: number
 *     ultimaCorrida: timestamp
 *     diasCorridos: string[]  ← array de datas "YYYY-MM-DD"
 */

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  uid: string;
  /** Sobrescreve os dados do Firestore se passado manualmente */
  sequenciaAtual?: number;
  maiorSequencia?: number;
  diasCompletos?: string[]; // formato "YYYY-MM-DD"
  /** Cor principal do tema (padrão: laranja estilo Duolingo) */
  corPrimaria?: string;
  /** Se true, mostra o card completo. Se false, só o ícone de fogo compacto */
  modoCompacto?: boolean;
};

type DiaInfo = {
  data: string;       // "YYYY-MM-DD"
  diaSemana: string;  // "Seg", "Ter", etc.
  completado: boolean;
  hoje: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatarData(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Gera os últimos 7 dias a partir de hoje */
function gerarUltimosDias(diasCompletos: string[]): DiaInfo[] {
  const hoje = new Date();
  const dias: DiaInfo[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const dataStr = formatarData(d);
    dias.push({
      data: dataStr,
      diaSemana: DIAS_SEMANA[d.getDay()],
      completado: diasCompletos.includes(dataStr),
      hoje: i === 0,
    });
  }

  return dias;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: DiaCirculo
// Círculo animado para cada dia da semana
// ─────────────────────────────────────────────────────────────────────────────

function DiaCirculo({
  dia,
  corPrimaria,
  index,
}: {
  dia: DiaInfo;
  corPrimaria: string;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada escalonada por índice
    Animated.sequence([
      Animated.delay(index * 60),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const bgColor = dia.completado
    ? corPrimaria
    : dia.hoje
    ? "rgba(255,255,255,0.15)"
    : "rgba(255,255,255,0.06)";

  const borderColor = dia.hoje && !dia.completado
    ? corPrimaria
    : "transparent";

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: "center",
        gap: 6,
      }}
    >
      {/* Rótulo do dia */}
      <Text style={[
        styles.diaLabel,
        dia.hoje && { color: corPrimaria, fontWeight: "800" },
      ]}>
        {dia.diaSemana}
      </Text>

      {/* Círculo do dia */}
      <View style={[
        styles.diaCirculo,
        { backgroundColor: bgColor, borderColor, borderWidth: dia.hoje && !dia.completado ? 2 : 0 },
      ]}>
        {dia.completado ? (
          <Text style={styles.diaCheck}>✓</Text>
        ) : dia.hoje ? (
          <Text style={styles.diaHoje}>●</Text>
        ) : (
          <View style={styles.diaVazio} />
        )}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: ModalStreak
// Modal de celebração quando o usuário bate recorde
// ─────────────────────────────────────────────────────────────────────────────

function ModalStreak({
  visivel,
  sequencia,
  onFechar,
  corPrimaria,
}: {
  visivel: boolean;
  sequencia: number;
  onFechar: () => void;
  corPrimaria: string;
}) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fogoAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visivel) {
      // Animação de entrada do modal
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Pulsação do fogo
      Animated.loop(
        Animated.sequence([
          Animated.timing(fogoAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(fogoAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.5);
    }
  }, [visivel]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
          {/* Fogo pulsante */}
          <Animated.Text style={[styles.modalFogo, { transform: [{ scale: fogoAnim }] }]}>
            🔥
          </Animated.Text>

          <Text style={styles.modalTitulo}>Sequência!</Text>
          <Text style={[styles.modalNumero, { color: corPrimaria }]}>{sequencia}</Text>
          <Text style={styles.modalSubtitulo}>dias seguidos</Text>
          <Text style={styles.modalDesc}>
            Incrível! Continue correndo para manter sua sequência.
          </Text>

          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: corPrimaria }]}
            onPress={onFechar}
          >
            <Text style={styles.modalBtnText}>Continuar 💪</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: SequenciaStreak
// ─────────────────────────────────────────────────────────────────────────────

export default function ofensiva({
  uid,
  sequenciaAtual: sequenciaProp,
  maiorSequencia: maiorProp,
  diasCompletos: diasProp,
  corPrimaria = "#FF9600",
  modoCompacto = false,
}: Props) {
  const [sequenciaAtual, setSequenciaAtual] = useState(sequenciaProp ?? 0);
  const [maiorSequencia, setMaiorSequencia] = useState(maiorProp ?? 0);
  const [diasCompletos, setDiasCompletos]   = useState<string[]>(diasProp ?? []);
  const [modalAberto, setModalAberto]       = useState(false);
  const [carregando, setCarregando]         = useState(!sequenciaProp);

  // Animação do número principal de sequência
  const numeroAnim = useRef(new Animated.Value(0.8)).current;
  const fogoAnim   = useRef(new Animated.Value(1)).current;

  // ── Busca dados do Firestore em tempo real ──────────────────────────────
  useEffect(() => {
    if (sequenciaProp !== undefined) return; // usa prop manual se passado

    const unsub = onSnapshot(doc(db, "usuarios", uid), (snap) => {
      const data = snap.data();
      if (!data) return;

      setSequenciaAtual(data.sequenciaAtual ?? 0);
      setMaiorSequencia(data.maiorSequencia ?? 0);
      setDiasCompletos(data.diasCorridos ?? []);
      setCarregando(false);
    });

    return unsub;
  }, [uid]);

  // ── Animação ao carregar ────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(numeroAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();

    // Pulsação sutil do fogo principal
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fogoAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(fogoAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sequenciaAtual]);

  const dias = gerarUltimosDias(diasCompletos);

  // ── Modo compacto: só ícone de fogo + número ────────────────────────────
  if (modoCompacto) {
    return (
      <TouchableOpacity
        style={[styles.compacto, { borderColor: corPrimaria }]}
        onPress={() => setModalAberto(true)}
        activeOpacity={0.8}
      >
        <Animated.Text style={[styles.compactoFogo, { transform: [{ scale: fogoAnim }] }]}>
          🔥
        </Animated.Text>
        <Text style={[styles.compactoNum, { color: corPrimaria }]}>{sequenciaAtual}</Text>

        <ModalStreak
          visivel={modalAberto}
          sequencia={sequenciaAtual}
          onFechar={() => setModalAberto(false)}
          corPrimaria={corPrimaria}
        />
      </TouchableOpacity>
    );
  }

  // ── Card completo ───────────────────────────────────────────────────────
  return (
    <View style={styles.card}>

      {/* Cabeçalho: fogo + número + recorde */}
      <View style={styles.cabecalho}>
        <View style={styles.cabecalhoEsquerda}>
          <Animated.Text style={[styles.fogoIcone, { transform: [{ scale: fogoAnim }] }]}>
            🔥
          </Animated.Text>
          <View>
            <Animated.Text style={[
              styles.sequenciaNumero,
              { color: corPrimaria, transform: [{ scale: numeroAnim }] },
            ]}>
              {sequenciaAtual}
            </Animated.Text>
            <Text style={styles.sequenciaLabel}>dias seguidos</Text>
          </View>
        </View>

        {/* Recorde */}
        <View style={[styles.recordeBadge, { borderColor: corPrimaria }]}>
          <Text style={styles.recordeIcone}>🏆</Text>
          <View>
            <Text style={[styles.recordeNum, { color: corPrimaria }]}>{maiorSequencia}</Text>
            <Text style={styles.recordeLabel}>recorde</Text>
          </View>
        </View>
      </View>

      {/* Barra de progresso semanal */}
      <View style={styles.barraSemana}>
        {dias.map((dia, i) => (
          <DiaCirculo
            key={dia.data}
            dia={dia}
            corPrimaria={corPrimaria}
            index={i}
          />
        ))}
      </View>

      {/* Rodapé motivacional */}
      <View style={styles.rodape}>
        {sequenciaAtual === 0 ? (
          <Text style={styles.rodapeTexto}>🏃 Corra hoje para começar sua sequência!</Text>
        ) : sequenciaAtual === maiorSequencia && sequenciaAtual > 0 ? (
          <Text style={[styles.rodapeTexto, { color: corPrimaria }]}>
            🎯 Você está no seu recorde!
          </Text>
        ) : (
          <Text style={styles.rodapeTexto}>
            🔥 Faltam {maiorSequencia - sequenciaAtual} dias para bater o recorde!
          </Text>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Card completo ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#1C2A4A",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
   
  },
  cabecalhoEsquerda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  fogoIcone:       { fontSize: 44 },
  sequenciaNumero: { fontSize: 42, fontWeight: "900", lineHeight: 46 },
  sequenciaLabel:  { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },

  recordeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  recordeIcone: { fontSize: 20 },
  recordeNum:   { fontSize: 20, fontWeight: "900", lineHeight: 22 },
  recordeLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11 },

  // ── Barra de dias da semana ────────────────────────────────────────────────
  barraSemana: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  diaLabel:  { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "600" },
  diaCirculo:{
    width: 50, height: 50, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  diaCheck:  { color: "#fff", fontSize: 20, fontWeight: "900" },
  diaHoje:   { color: "#fff", fontSize: 12 },
  diaVazio:  { width: 10, height: 10, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" },

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  rodape: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 12,
    alignItems: "center",
  },
  rodapeTexto: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "500" },

  // ── Modo compacto ──────────────────────────────────────────────────────────
  compacto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,150,0,0.12)",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compactoFogo: { fontSize: 18},
  compactoNum:  { fontSize: 16, fontWeight: "900" },

  // ── Modal de celebração ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#1C2A4A",
    borderRadius: 24,
    padding: 32,
    width: width * 0.82,
    alignItems: "center",
    elevation: 20,
  },
  modalFogo:     { fontSize: 72, marginBottom: 8 },
  modalTitulo:   { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 4 },
  modalNumero:   { fontSize: 72, fontWeight: "900", lineHeight: 80 },
  modalSubtitulo:{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 12 },
  modalDesc:     { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginBottom: 24 },
  modalBtn:      { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, width: "100%" },
  modalBtnText:  { color: "#fff", fontWeight: "800", fontSize: 16, textAlign: "center" },
});
