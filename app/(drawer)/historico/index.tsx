import React, { useEffect, useState, useRef } from "react"; // 1. Adicionado useRef
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import MapView, { Polyline, Polygon } from "react-native-maps";
import { db } from "@/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import HistoricoCard from "@/components/HistoricoCard";

// ─── Tipos ──────────────────────────────────────────────────────────────────
type Coord = { latitude: number; longitude: number };

type Corrida = {
  id: string;
  distancia_km: number;
  duracao_min: number;
  criadoEm: any;
  rota: Coord[];
};

// ─── Detecta se a rota forma um polígono fechado ─────────────────────────────
const LIMIAR_METROS = 80;

function haversine(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function ePoligono(rota: Coord[]): boolean {
  if (rota.length < 4) return false;
  return haversine(rota[0], rota[rota.length - 1]) < LIMIAR_METROS;
}

// ─── Ponto central inicial (Apenas para o mapa carregar antes do encaixe) ───
function obterCentroInicial(rota: Coord[]) {
  if (rota.length === 0) return { latitude: 0, longitude: 0 };
  return {
    latitude: rota[0].latitude,
    longitude: rota[0].longitude,
  };
}

export default function Historico() {
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [loading, setLoading] = useState(true);
  const [corridaSelecionada, setCorridaSelecionada] = useState<Corrida | null>(null);

  // 2. Criação da referência do mapa
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchCorridas();
  }, []);

  const rota = corridaSelecionada?.rota ?? [];
  const temRota = rota.length > 1;
  const fechado = temRota && ePoligono(rota);

  // 3. useEffect para monitorar quando o modal abre e a rota fica disponível
  useEffect(() => {
    if (corridaSelecionada && temRota) {
      // Pequeno timeout para garantir que o layout do MapView já renderizou na tela
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(rota, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, // Margem em pixels nas bordas
          animated: true, // Efeito suave de transição/zoom
        });
      }, 300);
    }
  }, [corridaSelecionada, temRota]);

  async function fetchCorridas() {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }

      const q = query(collection(db, "corridas"), where("uid", "==", uid));
      const snap = await getDocs(q);

      const lista: Corrida[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          distancia_km: data.distancia_km || 0,
          duracao_min: data.duracao_min || 0,
          criadoEm: data.criadoEm,
          rota: Array.isArray(data.rota) ? data.rota : [],
        };
      });

      lista.sort((a, b) => {
        const dA = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : 0;
        const dB = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : 0;
        return dB - dA;
      });

      setCorridas(lista);
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
    } finally {
      setLoading(false);
    }
  }

  const totalCorridas = corridas.length;
  const totalKm = corridas.reduce((s, c) => s + c.distancia_km, 0);
  const totalMin = corridas.reduce((s, c) => s + c.duracao_min, 0);

  return (
    <View style={styles.container}>
      {/* ── Cabeçalho azul ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/home")} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.title}>Histórico</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValor}>{totalCorridas}</Text>
            <Text style={styles.statLabel}>CORRIDAS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValor}>{totalKm.toFixed(0)}</Text>
            <Text style={styles.statLabel}>KM TOTAL</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxLargo]}>
            <Text style={styles.statValor}>{totalMin}min</Text>
            <Text style={styles.statLabel}>TEMPO</Text>
          </View>
        </View>
      </View>

      {/* ── Lista ───────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C3A3" />
        </View>
      ) : totalCorridas === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.semDados}>Nenhuma corrida encontrada.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grupo}>
            {corridas.map((c) => {
              const data = c.criadoEm?.toDate ? c.criadoEm.toDate() : new Date();
              return (
                <HistoricoCard
                  key={c.id}
                  data={data}
                  distanciaKm={c.distancia_km}
                  duracaoMin={c.duracao_min}
                  onPress={() => setCorridaSelecionada(c)}
                />
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── Modal de trajeto ────────────────────────────────────────── */}
      <Modal
        visible={!!corridaSelecionada}
        animationType="slide"
        onRequestClose={() => setCorridaSelecionada(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCorridaSelecionada(null)}>
              <Feather name="arrow-left" size={24} color="#2C3F69" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Trajeto da corrida</Text>
            <View style={{ width: 24 }} />
          </View>

          {temRota ? (
            <MapView
              ref={mapRef} // 4. Vinculando a referência ao MapView
              style={styles.map}
              initialRegion={{
                ...obterCentroInicial(rota),
                latitudeDelta: 0.02, // Valor genérico inicial, o fitToCoordinates vai ajustar depois
                longitudeDelta: 0.02,
              }}
            >
              {fechado ? (
                <Polygon
                  coordinates={rota}
                  strokeColor="#1a58e9"
                  strokeWidth={4}
                  fillColor="rgba(26,88,233,0.15)"
                />
              ) : (
                <Polyline
                  coordinates={rota}
                  strokeColor="#1a58e9"
                  strokeWidth={5}
                />
              )}
            </MapView>
          ) : (
            <View style={styles.semRotaContainer}>
              <Feather name="map" size={40} color="#C1C1C1" />
              <Text style={styles.semRotaTexto}>
                Essa corrida não tem trajeto registrado.
              </Text>
            </View>
          )}

          {corridaSelecionada && (
            <View style={styles.modalRodape}>
              <View style={styles.modalMetrica}>
                <Text style={styles.modalMetricaValor}>
                  {corridaSelecionada.distancia_km.toFixed(2)} km
                </Text>
                <Text style={styles.modalMetricaLabel}>distância</Text>
              </View>
              <View style={styles.modalDivisor} />
              <View style={styles.modalMetrica}>
                <Text style={styles.modalMetricaValor}>
                  {corridaSelecionada.duracao_min}min
                </Text>
                <Text style={styles.modalMetricaLabel}>tempo</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8" },
  header: {
    backgroundColor: "#2C3F69",
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: 10 },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statBoxLargo: { flexBasis: "100%" },
  statValor: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  statLabel: { color: "#A9B3CC", fontSize: 11, marginTop: 4, letterSpacing: 0.5 },

  scroll: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  semDados: { color: "#8E8E93", fontSize: 14 },
  grupo: { marginTop: 20, paddingHorizontal: 20 },

  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  modalTitulo: { color: "#2C3F69", fontSize: 17, fontWeight: "800" },
  map: { flex: 1, width: "100%" },
  semRotaContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 30,
  },
  semRotaTexto: { color: "#8E8E93", fontSize: 14, textAlign: "center" },
  modalRodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F5",
    backgroundColor: "#FFFFFF",
  },
  modalDivisor: {
    width: 1,
    height: 36,
    backgroundColor: "#F0F0F5",
  },
  modalMetrica: { alignItems: "center" },
  modalMetricaValor: { color: "#2C3F69", fontSize: 18, fontWeight: "800" },
  modalMetricaLabel: { color: "#8E8E93", fontSize: 12, marginTop: 2 },
});