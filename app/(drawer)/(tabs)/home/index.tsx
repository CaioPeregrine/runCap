import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { DrawerActions, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import MapView, { Marker, Polygon, Polyline, Region } from "react-native-maps";
import Ofensiva from "../../../../components/ofensiva/ofensiva";
import { db } from "../../../../firebase/firebaseConfig";
import { useConquistas } from "../../../hooks/useConquistas";
import styles from "./styles";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

type Coord = { latitude: number; longitude: number };

type PontoTuristico = {
  id: string; nome: string; descricao: string;
  latitude: number; longitude: number; imageUrl: string;
};

type Corrida = {
  id: string;
  uid: string;                    // dono original
  rota: Coord[];
  distancia_km: number;
  tempo_formatado: string;
  pace: string;
  criadoEm: any;
  // Dono original
  nomeOriginal: string;
  avatarOriginal?: string;
  corOriginal: string;            // cor do dono original — salva na corrida
  // Captura
  capturadaPor?: string;          // uid do capturador atual
  capturadaPorNome?: string;
  capturadaPorCor?: string;       // cor do capturador
  // Calculados
  centro: Coord;
  fechada: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const COR_FALLBACK   = "#1a58e9";
const ZOOM_THRESHOLD = 0.025; // abaixo = zoom de bairro (mostra rotas)

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS PUROS (sem React)
// ═══════════════════════════════════════════════════════════════════════════════

function formatDate(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isAreaFechada(rota: Coord[]): boolean {
  if (rota.length < 4) return false;
  const ini = rota[0], fim = rota[rota.length - 1];
  const R = 6371000;
  const a =
    Math.sin(((fim.latitude  - ini.latitude)  * Math.PI / 180) / 2) ** 2 +
    Math.cos(ini.latitude  * Math.PI / 180) *
    Math.cos(fim.latitude  * Math.PI / 180) *
    Math.sin(((fim.longitude - ini.longitude) * Math.PI / 180) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) < 100;
}

function centroDaRota(rota: Coord[]): Coord {
  return {
    latitude:  rota.reduce((s, c) => s + c.latitude,  0) / rota.length,
    longitude: rota.reduce((s, c) => s + c.longitude, 0) / rota.length,
  };
}

// Filtro de Kalman simples para suavizar GPS
class KalmanFilter {
  private q = 0.0001;  // ruído do processo
  private r = 0.01;    // ruído da medição
  private p = 1;
  private x = 0;

  filter(measurement: number): number {
    this.p += this.q;
    const k = this.p / (this.p + this.r);
    this.x += k * (measurement - this.x);
    this.p *= (1 - k);
    return this.x;
  }

  init(value: number) { this.x = value; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [location, setLocation]         = useState<any>(null);
  const [smoothLat, setSmoothLat]       = useState(0);
  const [smoothLng, setSmoothLng]       = useState(0);
  const [corridas, setCorridas]         = useState<Corrida[]>([]);
  const [corridaSel, setCorridaSel]     = useState<Corrida | null>(null);
  const [pontos, setPontos]             = useState<PontoTuristico[]>([]);
  const [corRota, setCorRota]           = useState(COR_FALLBACK);
  const [zoomDelta, setZoomDelta]       = useState(0.005);
  const mostrarRotas                    = zoomDelta < ZOOM_THRESHOLD;

  // Animações
  const cardAnim    = useRef(new Animated.Value(300)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  // Filtros Kalman para latitude e longitude
  const kalmanLat   = useRef(new KalmanFilter());
  const kalmanLng   = useRef(new KalmanFilter());
  const iniciouGPS  = useRef(false);

  const mapRef      = useRef<MapView>(null);
  const navigation  = useNavigation();
  const currentUser = getAuth().currentUser;
  const { migrarKmAntigos } = useConquistas();

  // ── Animação pulse no marcador de captura ────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Migração ──────────────────────────────────────────────────────────────
  useEffect(() => { if (currentUser?.uid) migrarKmAntigos(currentUser.uid); }, []);

  // ── Cor do usuário logado ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;
    getDoc(doc(db, "usuarios", currentUser.uid)).then((snap) => {
      const cor = snap.data()?.corRota;
      if (cor) setCorRota(cor);
    });
  }, [currentUser]);

  // ── GPS com filtro Kalman ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(pos);
      kalmanLat.current.init(pos.coords.latitude);
      kalmanLng.current.init(pos.coords.longitude);
      setSmoothLat(pos.coords.latitude);
      setSmoothLng(pos.coords.longitude);
      iniciouGPS.current = true;

      mapRef.current?.animateToRegion({
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        latitudeDelta: 0.005, longitudeDelta: 0.005,
      }, 800);
    })();
  }, []);

  useEffect(() => {
    Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.Balanced,
        timeInterval:     2000,   // a cada 2s
        distanceInterval: 3,      // ou 3m de deslocamento
      },
      (r) => {
        setLocation(r);
        if (!iniciouGPS.current) return;

        // Aplica filtro Kalman para suavizar o marcador
        const lat = kalmanLat.current.filter(r.coords.latitude);
        const lng = kalmanLng.current.filter(r.coords.longitude);
        setSmoothLat(lat);
        setSmoothLng(lng);
      }
    );
  }, []);

  // ── Pontos turísticos ─────────────────────────────────────────────────────
  useEffect(() => {
    getDocs(collection(db, "pontosTuristicos")).then((snap) => {
      setPontos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, []);

  // ── Corridas: busca cores corretas por dono ───────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
        const amigos: string[] = userSnap.data()?.amigos || [];
        const ids = [currentUser.uid, ...amigos];

        // Coleta perfis (nome + avatar + corRota)
        const perfis: Record<string, { nome: string; avatarUrl?: string; corRota: string }> = {};
        await Promise.all(ids.map(async (uid) => {
          const snap = await getDoc(doc(db, "usuarios", uid));
          const d = snap.data();
          perfis[uid] = {
            nome:      d?.nome     || "Corredor",
            avatarUrl: d?.avatarUrl,
            corRota:   d?.corRota  || COR_FALLBACK,
          };
        }));

        // Também busca perfil do capturador se não estiver na lista
        const buscarPerfilExtra = async (uid: string) => {
          if (perfis[uid]) return;
          const snap = await getDoc(doc(db, "usuarios", uid));
          const d = snap.data();
          perfis[uid] = {
            nome:     d?.nome    || "Corredor",
            avatarUrl: d?.avatarUrl,
            corRota:  d?.corRota || COR_FALLBACK,
          };
        };

        const lista: Corrida[] = [];
        await Promise.all(ids.map(async (uid) => {
          const snap = await getDocs(query(collection(db, "corridas"), where("uid", "==", uid)));

          const extras: Promise<void>[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if (!data.rota?.length) return;
            if (data.capturadaPor && !perfis[data.capturadaPor]) {
              extras.push(buscarPerfilExtra(data.capturadaPor));
            }
          });
          await Promise.all(extras);

          snap.forEach((d) => {
            const data = d.data();
            if (!data.rota?.length) return;

            // ✅ A cor da corrida é a cor do DONO ORIGINAL salva no momento da criação
            // Se não estiver salva, usa o perfil atual do dono
            const corOriginal = data.corRota || perfis[uid]?.corRota || COR_FALLBACK;
            const corCapturador = data.capturadaPor
              ? (perfis[data.capturadaPor]?.corRota || COR_FALLBACK)
              : undefined;

            lista.push({
              id:               d.id,
              uid,
              rota:             data.rota,
              distancia_km:     data.distancia_km  || 0,
              tempo_formatado:  data.tempo_formatado || "00:00",
              pace:             data.pace           || "--:--",
              criadoEm:         data.criadoEm,
              nomeOriginal:     perfis[uid]?.nome   || "Corredor",
              avatarOriginal:   perfis[uid]?.avatarUrl,
              corOriginal,
              capturadaPor:     data.capturadaPor,
              capturadaPorNome: data.capturadaPorNome,
              capturadaPorCor:  corCapturador,
              centro:           centroDaRota(data.rota),
              fechada:          isAreaFechada(data.rota),
            });
          });
        }));

        setCorridas(lista);
      } catch (e) { console.error("Erro ao buscar corridas:", e); }
    })();
  }, [currentUser]);

  // ── Card ──────────────────────────────────────────────────────────────────
  function abrirCard(corrida: Corrida) {
    setCorridaSel(corrida);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true }).start();
  }

  function fecharCard() {
    Animated.spring(cardAnim, { toValue: 300, useNativeDriver: true }).start(() => setCorridaSel(null));
  }

  // ── Capturar: vai para telaCorrendo com a rota como guia ──────────────────
  function handleCapturar() {
    if (!corridaSel || !currentUser) return;
    const donoAtual = corridaSel.capturadaPor || corridaSel.uid;
    if (donoAtual === currentUser.uid) return;

    fecharCard();
    router.push({
      pathname: "../../../telaCorrendo",
      params: {
        rotaEncodada:    JSON.stringify(corridaSel.rota),
        corridaIdAlvo:   corridaSel.id,
        corridaDono:     donoAtual,
        corridaDonoNome: corridaSel.capturadaPorNome || corridaSel.nomeOriginal,
        distanciaAlvo:   String(corridaSel.distancia_km),
        modoCaptura:     "true",
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const euSouDono = (c: Corrida) =>
    (c.capturadaPor || c.uid) === currentUser?.uid;

  return (
    <View style={styles.container}>

      {/* Hamburguer */}
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{ position: "absolute", top: 50, left: 15, zIndex: 10 }}
      >
        <Feather name="menu" size={30} color="black" />
      </TouchableOpacity>

      {/* Ofensiva */}
      <View style={{ position: "absolute", top: 50, right: 15, zIndex: 10 }}>
        <Ofensiva uid={currentUser?.uid ?? ""} modoCompacto />
      </View>

      {/* Botão re-centralizar */}
      <TouchableOpacity
        style={local.btnCentralizar}
        onPress={() => smoothLat && mapRef.current?.animateToRegion({
          latitude: smoothLat, longitude: smoothLng,
          latitudeDelta: 0.005, longitudeDelta: 0.005,
        }, 600)}
      >
        <Feather name="navigation" size={20} color="#2C3F69" />
      </TouchableOpacity>

      {/* Legenda de zoom */}
      {!mostrarRotas && (
        <View style={local.legendaZoom}>
          <Text style={local.legendaTexto}>🔍 Aproxime para ver os territórios</Text>
        </View>
      )}

      {/* Mapa */}
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          onPress={fecharCard}
          onRegionChange={(r: Region) => setZoomDelta(r.latitudeDelta)}
          initialRegion={{
            latitude: smoothLat || location.coords.latitude,
            longitude: smoothLng || location.coords.longitude,
            latitudeDelta: 0.005, longitudeDelta: 0.005,
          }}
        >
          {/* Marcador do usuário — suavizado por Kalman */}
          {smoothLat !== 0 && (
            <Marker
              coordinate={{ latitude: smoothLat, longitude: smoothLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              image={require("../../../../assets/images/NavegadorDaTelaHome.png")}
            />
          )}

          {/* ── ZOOM PRÓXIMO: rotas completas com sistema territorial ── */}
          {mostrarRotas && corridas.map((c) => {
            const foiCapturada = !!c.capturadaPor;
            const euSouDonoDesta = euSouDono(c);

            return (
              <React.Fragment key={c.id}>
                {/* ── Território DOMINADO (capturado) ── */}
                {foiCapturada && (
                  c.fechada ? (
                    // Polígono cinza = território dominado por outro
                    <Polygon
                      coordinates={c.rota}
                      strokeColor={euSouDonoDesta ? c.capturadaPorCor || COR_FALLBACK : "#888"}
                      fillColor={euSouDonoDesta ? (c.capturadaPorCor || COR_FALLBACK) + "50" : "#88888825"}
                      strokeWidth={euSouDonoDesta ? 3 : 2}
                      tappable
                      onPress={() => abrirCard(c)}
                    />
                  ) : (
                    // Polyline cinza = rota dominada
                    <Polyline
                      coordinates={c.rota}
                      strokeColor={euSouDonoDesta ? c.capturadaPorCor || COR_FALLBACK : "#888"}
                      strokeWidth={euSouDonoDesta ? 5 : 3}
                      tappable
                      onPress={() => abrirCard(c)}
                    />
                  )
                )}

                {/* ── Rastro pontilhado do dono original ── */}
                {foiCapturada && (
                  <Polyline
                    coordinates={c.rota}
                    strokeColor={c.corOriginal}
                    strokeWidth={2}
                    lineDashPattern={[6, 8]}
                    tappable
                    onPress={() => abrirCard(c)}
                  />
                )}

                {/* ── Território LIVRE (não capturado) ── */}
                {!foiCapturada && (
                  c.fechada ? (
                    <Polygon
                      coordinates={c.rota}
                      strokeColor={c.corOriginal}
                      fillColor={c.corOriginal + "35"}
                      strokeWidth={3}
                      tappable
                      onPress={() => abrirCard(c)}
                    />
                  ) : (
                    <Polyline
                      coordinates={c.rota}
                      strokeColor={c.corOriginal}
                      strokeWidth={4}
                      tappable
                      onPress={() => abrirCard(c)}
                    />
                  )
                )}

                {/* ── Marcador ⚔️ com pulse no centro ── */}
                {foiCapturada && (
                  <Marker
                    coordinate={c.centro}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() => abrirCard(c)}
                  >
                    <Animated.View style={[
                      local.markerCapturado,
                      euSouDonoDesta && {
                        transform: [{ scale: pulseAnim }],
                        backgroundColor: c.capturadaPorCor || "#FFD700",
                      },
                    ]}>
                      <Text style={{ fontSize: 13 }}>⚔️</Text>
                    </Animated.View>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}

          {/* ── ZOOM AFASTADO: pontos coloridos ── */}
          {!mostrarRotas && corridas.map((c) => {
            const foiCapturada = !!c.capturadaPor;
            const cor = foiCapturada ? (c.capturadaPorCor || "#FFD700") : c.corOriginal;
            return (
              <Marker key={c.id} coordinate={c.centro} anchor={{ x: 0.5, y: 0.5 }} onPress={() => abrirCard(c)}>
                <View style={[local.pontinho, { backgroundColor: cor }]}>
                  {foiCapturada && <Text style={{ fontSize: 7 }}>⚔️</Text>}
                </View>
              </Marker>
            );
          })}

          {/* Pontos turísticos */}
          {pontos
            .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
            .map((p) => (
              <Marker key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.nome} description={p.descricao} pinColor="#22C3A3"
              />
            ))}
        </MapView>
      )}

      {/* ── Card territorial ── */}
      {corridaSel && (
        <Animated.View style={[local.card, { transform: [{ translateY: cardAnim }] }]}>

          {/* Barra de cor do dono atual */}
          <View style={[
            local.cardBarra,
            { backgroundColor: corridaSel.capturadaPorCor || corridaSel.corOriginal }
          ]} />

          <TouchableOpacity onPress={fecharCard} style={local.cardClose}>
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>

          {/* Header: avatar + info territorial */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
            {corridaSel.avatarOriginal
              ? <Image source={{ uri: corridaSel.avatarOriginal }} style={local.avatar} />
              : <View style={[local.avatar, local.avatarPH, { backgroundColor: corridaSel.corOriginal }]}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                    {corridaSel.nomeOriginal[0]}
                  </Text>
                </View>
            }
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={local.cardNome}>{corridaSel.nomeOriginal}</Text>
              <Text style={local.cardData}>{formatDate(corridaSel.criadoEm)}</Text>
              {corridaSel.capturadaPor
                ? <Text style={[local.cardStatus, { color: corridaSel.capturadaPorCor || "#FFD700" }]}>
                    ⚔️ Dominado por {corridaSel.capturadaPorNome}
                  </Text>
                : <Text style={[local.cardStatus, { color: corridaSel.corOriginal }]}>
                    🏃 Território livre
                  </Text>
              }
            </View>
          </View>

          {/* Métricas */}
          <View style={local.metrics}>
            {[
              { v: corridaSel.distancia_km.toFixed(2), l: "km" },
              { v: corridaSel.tempo_formatado, l: "tempo" },
              { v: corridaSel.pace, l: "pace" },
            ].map((m) => (
              <View key={m.l} style={{ alignItems: "center" }}>
                <Text style={local.metricV}>{m.v}</Text>
                <Text style={local.metricL}>{m.l}</Text>
              </View>
            ))}
          </View>

          {/* Botão — comportamento por perspectiva */}
          {euSouDono(corridaSel) ? (
            <View style={[local.btnStatus, { backgroundColor: "#22C3A3" }]}>
              <Text style={local.btnStatusTxt}>✅ Você domina este território</Text>
            </View>
          ) : (
            <TouchableOpacity style={local.btnCapturar} onPress={handleCapturar} activeOpacity={0.85}>
              <Text style={local.btnCapturarTxt}>⚔️ Capturar território</Text>
              <Text style={local.btnCapturarSub}>
                Percorra {(corridaSel.distancia_km * 0.5).toFixed(1)} km do trajeto para capturar
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Painel inferior */}
      <View style={styles.panel}>
        <ScrollView>
          <View style={styles.buttonsRow}>
            <View style={styles.cards}>
              <TouchableOpacity style={styles.btncards}>
                <Octicons name="location" size={24} color="#22C3A3" />
                <Text>Descobrir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btncards}>
                <Feather name="check-circle" size={24} color="#22C3A3" />
                <Text>Metas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btncards} onPress={() => router.push("/rotasSugeridas")}>
                <FontAwesome5 name="route" size={24} color="#22C3A3" />
                <Text>Rotas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS LOCAIS
// ═══════════════════════════════════════════════════════════════════════════════

const local = StyleSheet.create({
  btnCentralizar: {
    position: "absolute", bottom: 160, right: 16, zIndex: 10,
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  legendaZoom: {
    position: "absolute", top: 100, alignSelf: "center", zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  legendaTexto: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Mapa
  pontinho: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  markerCapturado: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#FFD700",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "#fff",
    shadowColor: "#FFD700", shadowOpacity: 0.6,
    shadowRadius: 8, elevation: 6,
  },

  // Card
  card: {
    position: "absolute", bottom: 148, left: 14, right: 14,
    backgroundColor: "#fff", borderRadius: 20,
    overflow: "hidden", zIndex: 20,
    shadowColor: "#000", shadowOpacity: 0.18,
    shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 10,
  },
  cardBarra:    { height: 5, width: "100%" },
  cardClose:    { position: "absolute", top: 14, right: 14, zIndex: 2 },
  avatar:       { width: 50, height: 50, borderRadius: 25, marginLeft: 14, marginTop: 12 },
  avatarPH:     { alignItems: "center", justifyContent: "center" },
  cardNome:     { fontSize: 16, fontWeight: "800", color: "#1a1a2e" },
  cardData:     { fontSize: 11, color: "#aaa", marginTop: 1 },
  cardStatus:   { fontSize: 12, fontWeight: "700", marginTop: 3 },

  metrics: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 12, marginHorizontal: 14,
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
    marginBottom: 12,
  },
  metricV: { fontSize: 20, fontWeight: "800", color: "#1a1a2e", textAlign: "center" },
  metricL: { fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 2 },

  btnCapturar: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: "#2C3F69", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  btnCapturarTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btnCapturarSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 3 },

  btnStatus: {
    marginHorizontal: 14, marginBottom: 16,
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  btnStatusTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
