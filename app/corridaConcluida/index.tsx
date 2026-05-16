import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated, Dimensions, Linking,
    ScrollView, Share,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import styles from "./styles";

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

// ─── Componente ───────────────────────────────────────────────────────────────
export default function CorridaConcluida() {
  const params = useLocalSearchParams<{
    distancia_km:    string;
    tempo_formatado: string;
    pace:            string;
    rota:            string;
  }>();

  const distKm   = parseFloat(params.distancia_km    ?? "0");
  const tempo    = params.tempo_formatado             ?? "00:00";
  const pace     = params.pace                        ?? "--:-- /km";
  const rota: Coord[] = (() => {
    try { return params.rota ? JSON.parse(params.rota) : []; }
    catch { return []; }
  })();
  const regiao   = calcularRegiao(rota);
  const calorias = estimarCalorias(distKm);
  const passos   = estimarPassos(distKm);

  // Animações
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8,  useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Compartilhar ─────────────────────────────────────────────────────────
  const textoCompartilhar =
    `🏃 Corrida concluída no RunCap!\n` +
    `📏 ${distKm.toFixed(2)} km  |  ⏱ ${tempo}  |  ⚡ ${pace}\n` +
    `🔥 ${calorias} kcal  |  👟 ~${passos.toLocaleString()} passos\n\n` +
    `#RunCap #Corrida #Manaus`;

  async function compartilharWhatsApp() {
    const url = `whatsapp://send?text=${encodeURIComponent(textoCompartilhar)}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Share.share({ message: textoCompartilhar });
  }

  async function compartilharInstagram() {
    // Instagram não aceita texto via deep link — usa share nativo
    Share.share({ message: textoCompartilhar, title: "Minha corrida no RunCap" });
  }

  async function compartilharGeral() {
    Share.share({ message: textoCompartilhar, title: "Minha corrida no RunCap" });
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
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
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
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
            {/* Remove o "/km" do valor pra caber, deixa na unit */}
            <Text style={[styles.metricValue, { fontSize: 18 }]}>
              {pace.replace(" /km", "")}
            </Text>
            <Text style={styles.metricUnit}>/km pace</Text>
          </View>
        </View>

        {/* ── Mapa com trajeto ── */}
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
              {/* Linha do percurso */}
              <Polyline
                coordinates={rota}
                strokeColor={GREEN}
                strokeWidth={4}
              />
              {/* Ponto de início — verde */}
              {Number.isFinite(rota[0]?.latitude) && Number.isFinite(rota[0]?.longitude) && (
                <Marker
                  coordinate={rota[0]}
                  anchor={{ x: 0.5, y: 0.5 }}
                  pinColor="green"
                  title="Início"
                />
              )}
              {/* Ponto de fim — vermelho */}
              {Number.isFinite(rota[rota.length - 1]?.latitude) && Number.isFinite(rota[rota.length - 1]?.longitude) && (
                <Marker
                  coordinate={rota[rota.length - 1]}
                  anchor={{ x: 0.5, y: 0.5 }}
                  pinColor="red"
                  title="Fim"
                />
              )}
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

      {/* ── Compartilhar ── */}
      <Animated.View style={[styles.shareSection, { opacity: fadeAnim }]}>
        <Text style={styles.shareTitle}>Compartilhar treino</Text>
        <View style={styles.shareButtons}>

          <TouchableOpacity
            style={[styles.shareBtn, styles.btnWhatsApp]}
            onPress={compartilharWhatsApp}
            activeOpacity={0.8}
          >
            <Text style={styles.shareIcon}>💬</Text>
            <Text style={[styles.shareBtnText, { color: "#25D366" }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, styles.btnInstagram]}
            onPress={compartilharInstagram}
            activeOpacity={0.8}
          >
            <Text style={styles.shareIcon}>📸</Text>
            <Text style={[styles.shareBtnText, { color: "#E1306C" }]}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, styles.btnGeral]}
            onPress={compartilharGeral}
            activeOpacity={0.8}
          >
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
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
