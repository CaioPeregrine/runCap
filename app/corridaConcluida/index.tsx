import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity,
  ScrollView, Share, Animated, Dimensions, Linking,
  Modal, StyleSheet,
} from "react-native";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import styles from "./styles";

import {
  adicionarXP,
  ResultadoXP,
  NIVEL_MAXIMO,
  xpInicioDoNivel,
  xpFimDoNivel,
  XP_MAXIMO,
} from "@/app/hooks/useXP";
import { conquistaDoNivel, Conquista } from "@/app/(drawer)/conquistas/conquistasData";
import XPProgressBar from "@/components/XPProgressBar";

const { width } = Dimensions.get("window");
const GREEN = "#1db954";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Coord = { latitude: number; longitude: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcularRegiao(coords: Coord[]) {
  if (coords.length < 2) return null;
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  return {
    latitude:       (minLat + maxLat) / 2,
    longitude:      (minLon + maxLon) / 2,
    latitudeDelta:  Math.max((maxLat - minLat) * 1.5, 0.002),
    longitudeDelta: Math.max((maxLon - minLon) * 1.5, 0.002),
  };
}

function estimarCalorias(distKm: number) { return Math.round(distKm * 60); }
function estimarPassos(distKm: number)   { return Math.round(distKm * 1300); }

// ─── Modal de subida de nível ─────────────────────────────────────────────────
function ModalNivel({
  visivel,
  onFechar,
  nivelNovo,
  conquistas,
  nivelMaximo,
}: {
  visivel: boolean;
  onFechar: () => void;
  nivelNovo: number;
  conquistas: Conquista[];
  nivelMaximo: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.75);
      fadeAnim.setValue(0);
    }
  }, [visivel]);

  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={onFechar}>
      <Animated.View style={[estilosModal.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[estilosModal.box, { transform: [{ scale: scaleAnim }] }]}>

          <Text style={estilosModal.emoji}>{nivelMaximo ? "🏆" : "🎉"}</Text>
          <Text style={estilosModal.titulo}>
            {nivelMaximo ? "Nível Máximo!" : `Nível ${nivelNovo}!`}
          </Text>
          <Text style={estilosModal.sub}>
            {nivelMaximo
              ? "Você chegou ao topo. Lenda de Manaus!"
              : "Você subiu de nível! Continue correndo!"}
          </Text>

          {/* Conquistas desbloqueadas */}
          {conquistas.length > 0 && (
            <View style={estilosModal.secaoCQ}>
              <Text style={estilosModal.labelCQ}>
                {conquistas.length === 1 ? "Conquista desbloqueada!" : "Conquistas desbloqueadas!"}
              </Text>
              {conquistas.map((cq) => (
                <View key={cq.id} style={estilosModal.cqRow}>
                  <Text style={estilosModal.cqIcone}>{cq.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={estilosModal.cqNome}>{cq.titulo}</Text>
                    <Text style={estilosModal.cqDesc} numberOfLines={2}>{cq.descricao}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bolinhas de nível */}
          <View style={estilosModal.bolinhasWrap}>
            {Array.from({ length: NIVEL_MAXIMO }, (_, i) => i + 1).map((n) => (
              <View
                key={n}
                style={[
                  estilosModal.bolinha,
                  { backgroundColor: n <= nivelNovo ? "#22C3A3" : "#E5E7EB" },
                  n === nivelNovo && estilosModal.bolinhaAtual,
                ]}
              >
                {n === nivelNovo && <Text style={estilosModal.bolinhaNum}>{n}</Text>}
              </View>
            ))}
          </View>

          <TouchableOpacity style={estilosModal.btnOk} onPress={onFechar} activeOpacity={0.85}>
            <Text style={estilosModal.btnOkText}>
              {nivelMaximo ? "Sou uma lenda! 🏆" : "Incrível! 🚀"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CorridaConcluida() {
  const uid = getAuth().currentUser?.uid ?? "";

  const params = useLocalSearchParams<{
    distancia_km:    string;
    tempo_formatado: string;
    pace:            string;
    rota:            string;
    origem:          string; // "rota_sugerida" = conta XP | qualquer outro = não conta
  }>();

  const distKm = parseFloat(params.distancia_km    ?? "0");
  const tempo  = params.tempo_formatado             ?? "00:00";
  const pace   = params.pace                        ?? "--:-- /km";
  const origem = params.origem                      ?? "";

  const rota: Coord[] = (() => {
    try { return params.rota ? JSON.parse(params.rota) : []; }
    catch { return []; }
  })();

  const regiao   = calcularRegiao(rota);
  const calorias = estimarCalorias(distKm);
  const passos   = estimarPassos(distKm);

  // ── Estado de XP ────────────────────────────────────────────────────────────
  const [resultadoXP, setResultadoXP]   = useState<ResultadoXP | null>(null);
  const [modalNivel,  setModalNivel]    = useState(false);
  const xpExecutado = useRef(false);

  // ── Animações da tela ────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8,  useNativeDriver: true }),
    ]).start();

    // XP — só processa se veio de uma Rota Sugerida e ainda não foi processado
    if (origem !== "rota_sugerida" || !uid || xpExecutado.current) return;
    xpExecutado.current = true;

    adicionarXP(uid)
      .then((res) => {
        setResultadoXP(res);
        if (res.subiuNivel) {
          // Aguarda a animação da barra encher antes de abrir o modal
          setTimeout(() => setModalNivel(true), 1800);
        }
      })
      .catch(console.error);
  }, []);

  // ── Conquistas desbloqueadas nessa corrida ───────────────────────────────────
  const conquistasGanhas: Conquista[] = (resultadoXP?.conquistasDesbloqueadas ?? [])
    .map((id) => {
      for (let n = 1; n <= NIVEL_MAXIMO; n++) {
        const cq = conquistaDoNivel(n);
        if (cq?.id === id) return cq;
      }
      return null;
    })
    .filter(Boolean) as Conquista[];

  // ── Props da barra de XP ─────────────────────────────────────────────────────
  const xpBarraProps = resultadoXP
    ? {
        xpTotal:          resultadoXP.xpTotalDepois,
        xpInicioNivel:    resultadoXP.xpInicioNivel,
        xpFimNivel:       resultadoXP.xpFimNivel,
        nivel:            resultadoXP.nivelDepois,
        xpNaBarraAnterior: resultadoXP.xpNaBarraAntes,
        mostrarGanho:     resultadoXP.xpGanho > 0,
        xpGanho:          resultadoXP.xpGanho,
        nivelMaximo:      resultadoXP.nivelMaximo,
      }
    : null;

  // ── Compartilhar ─────────────────────────────────────────────────────────────
  const textoCompartilhar =
    `🏃 Corrida concluída no RunCap!\n` +
    `📏 ${distKm.toFixed(2)} km  |  ⏱ ${tempo}  |  ⚡ ${pace}\n` +
    `🔥 ${calorias} kcal  |  👟 ~${passos.toLocaleString()} passos\n\n` +
    `#RunCap #Corrida #Manaus`;

  async function compartilharWhatsApp() {
    const url = `whatsapp://send?text=${encodeURIComponent(textoCompartilhar)}`;
    const ok  = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Share.share({ message: textoCompartilhar });
  }
  async function compartilharInstagram() {
    Share.share({ message: textoCompartilhar, title: "Minha corrida no RunCap" });
  }
  async function compartilharGeral() {
    Share.share({ message: textoCompartilhar, title: "Minha corrida no RunCap" });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Animated.View style={[styles.medalWrap, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.medalIcon}>🏅</Text>
          </Animated.View>
          <Animated.Text style={[styles.headerTitle, { opacity: fadeAnim }]}>
            Corrida Concluída!
          </Animated.Text>
          <Animated.Text style={[styles.headerSub, { opacity: fadeAnim }]}>
            Parabéns pelo seu treino
          </Animated.Text>
        </View>

        {/* ── Card principal ── */}
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          {/* Métricas principais */}
          <View style={styles.metricsRow}>
            <View style={[styles.metric, styles.metricBorder]}>
              <Text style={styles.metricIcon}>📍</Text>
              <Text style={styles.metricValue}>{distKm.toFixed(2)}</Text>
              <Text style={styles.metricUnit}>km</Text>
            </View>
            <View style={[styles.metric, styles.metricBorder]}>
              <Text style={styles.metricIcon}>⏱</Text>
              <Text style={styles.metricValue}>{tempo}</Text>
              <Text style={styles.metricUnit}>tempo</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>⚡</Text>
              <Text style={[styles.metricValue, { fontSize: 18 }]}>
                {pace.replace(" /km", "")}
              </Text>
              <Text style={styles.metricUnit}>/km pace</Text>
            </View>
          </View>

          {/* Mapa com trajeto */}
          <View style={styles.mapContainer}>
            <Text style={styles.mapLabel}>Trajeto percorrido</Text>
            {regiao && rota.length > 1 ? (
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={regiao}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                pointerEvents="none"
              >
                <Polyline coordinates={rota} strokeColor={GREEN} strokeWidth={4} />
                <Marker coordinate={rota[0]} anchor={{ x: 0.5, y: 0.5 }} pinColor="green" title="Início" />
                <Marker coordinate={rota[rota.length - 1]} anchor={{ x: 0.5, y: 0.5 }} pinColor="red" title="Fim" />
              </MapView>
            ) : (
              <View style={[styles.map, styles.mapEmpty]}>
                <Text style={styles.mapEmptyText}>Trajeto não disponível</Text>
              </View>
            )}
          </View>

          {/* Stats secundários */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>🔥 Calorias</Text>
              <Text style={styles.statValue}>{calorias} kcal</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>👟 Passos est.</Text>
              <Text style={styles.statValue}>~{passos.toLocaleString()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Barra de XP (só aparece se veio de Rota Sugerida) ── */}
        {xpBarraProps && (
          <Animated.View style={{ opacity: fadeAnim, marginTop: 16 }}>
            <XPProgressBar {...xpBarraProps} duracao={1200} />
          </Animated.View>
        )}

        {/* ── Compartilhar ── */}
        <Animated.View style={[styles.shareSection, { opacity: fadeAnim }]}>
          <Text style={styles.shareTitle}>Compartilhar treino</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={[styles.shareBtn, styles.btnWhatsApp]} onPress={compartilharWhatsApp} activeOpacity={0.8}>
              <Text style={styles.shareIcon}>💬</Text>
              <Text style={[styles.shareBtnText, { color: "#25D366" }]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, styles.btnInstagram]} onPress={compartilharInstagram} activeOpacity={0.8}>
              <Text style={styles.shareIcon}>📸</Text>
              <Text style={[styles.shareBtnText, { color: "#E1306C" }]}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, styles.btnGeral]} onPress={compartilharGeral} activeOpacity={0.8}>
              <Text style={styles.shareIcon}>↗️</Text>
              <Text style={[styles.shareBtnText, { color: "#555" }]}>Mais</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Botão concluir ── */}
        <TouchableOpacity
          style={styles.btnConcluir}
          onPress={() => router.replace("/(drawer)/(tabs)/home")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnConcluirText}>Concluir</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal de subida de nível (fora do ScrollView para cobrir tudo) ── */}
      {resultadoXP?.subiuNivel && (
        <ModalNivel
          visivel={modalNivel}
          onFechar={() => setModalNivel(false)}
          nivelNovo={resultadoXP.nivelDepois}
          conquistas={conquistasGanhas}
          nivelMaximo={resultadoXP.nivelMaximo}
        />
      )}
    </>
  );
}

// ─── Estilos do modal ─────────────────────────────────────────────────────────
const estilosModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  emoji:  { fontSize: 52, marginBottom: 8 },
  titulo: { fontSize: 28, fontWeight: "800", color: "#1F2937", marginBottom: 4 },
  sub:    { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  secaoCQ:  { width: "100%", marginBottom: 20 },
  labelCQ:  {
    fontSize: 11, fontWeight: "700", color: "#0F6E56",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 10, textAlign: "center",
  },
  cqRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#E6FBF6", borderRadius: 14,
    padding: 12, gap: 10, marginBottom: 8,
    borderWidth: 1, borderColor: "#22C3A3",
  },
  cqIcone: { fontSize: 28 },
  cqNome:  { fontSize: 14, fontWeight: "700", color: "#1F2937", marginBottom: 2 },
  cqDesc:  { fontSize: 12, color: "#6B7280", lineHeight: 16 },
  bolinhasWrap: {
    flexDirection: "row", gap: 5,
    alignItems: "center", marginBottom: 24,
  },
  bolinha:      { width: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  bolinhaAtual: { width: 24, height: 24, borderRadius: 12 },
  bolinhaNum:   { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
  btnOk:        { backgroundColor: "#22C3A3", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 44 },
  btnOkText:    { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
