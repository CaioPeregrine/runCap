import Feather from "@expo/vector-icons/Feather";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs,
  query, updateDoc, where,
} from "firebase/firestore";
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Animated, Image, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polygon, Polyline, Region } from "react-native-maps";
import Ofensiva from "../../../../components/ofensiva/ofensiva";
import { db } from "../../../../firebase/firebaseConfig";
import { useConquistas } from "../../../hooks/useConquistas";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Coord = { latitude: number; longitude: number };
type ModoMapa = "global" | "minhas";

type Corrida = {
  id: string; uid: string; rota: Coord[];
  distancia_km: number; tempo_formatado: string; pace: string; criadoEm: any;
  nomeOriginal: string; avatarOriginal?: string; corOriginal: string;
  capturadaPor?: string; capturadaPorNome?: string; capturadaPorCor?: string;
  historicoCaptura?: { uid: string; nome: string; cor: string }[];
  centro: Coord; fechada: boolean;
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const COR_FALLBACK   = "#1a58e9";
const TAB_BAR_HEIGHT = 60;
const PAINEL_ALTURA  = 420;
const PALETA_CORES   = [
  "#1a58e9","#e91a1a","#1ae94a","#e9c51a",
  "#e91ae2","#1ae9e2","#ff6b00","#9b1ae9",
  "#e9821a","#00b300","#005ce6","#e9001a",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    Math.sin(((fim.latitude - ini.latitude) * Math.PI) / 180 / 2) ** 2 +
    Math.cos((ini.latitude * Math.PI) / 180) *
    Math.cos((fim.latitude * Math.PI) / 180) *
    Math.sin(((fim.longitude - ini.longitude) * Math.PI) / 180 / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) < 100;
}

function centroDaRota(rota: Coord[]): Coord {
  return {
    latitude:  rota.reduce((s, c) => s + c.latitude,  0) / rota.length,
    longitude: rota.reduce((s, c) => s + c.longitude, 0) / rota.length,
  };
}

// Detecta se dois segmentos se cruzam (para badge "disputado")
function segmentosSeIntersectam(p1: Coord, p2: Coord, p3: Coord, p4: Coord): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d1 = cross(p3.longitude, p3.latitude, p4.longitude, p4.latitude, p1.longitude, p1.latitude);
  const d2 = cross(p3.longitude, p3.latitude, p4.longitude, p4.latitude, p2.longitude, p2.latitude);
  const d3 = cross(p1.longitude, p1.latitude, p2.longitude, p2.latitude, p3.longitude, p3.latitude);
  const d4 = cross(p1.longitude, p1.latitude, p2.longitude, p2.latitude, p4.longitude, p4.latitude);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function rotasSeIntersectam(rotaA: Coord[], rotaB: Coord[]): boolean {
  const TOLE = 0.0001;
  for (let i = 0; i < rotaA.length - 1; i++) {
    for (let j = 0; j < rotaB.length - 1; j++) {
      const p1 = rotaA[i], p2 = rotaA[i + 1];
      const p3 = rotaB[j], p4 = rotaB[j + 1];
      const minBLat = Math.min(p3.latitude, p4.latitude) - TOLE;
      const maxBLat = Math.max(p3.latitude, p4.latitude) + TOLE;
      const minBLng = Math.min(p3.longitude, p4.longitude) - TOLE;
      const maxBLng = Math.max(p3.longitude, p4.longitude) + TOLE;
      const minALat = Math.min(p1.latitude, p2.latitude);
      const maxALat = Math.max(p1.latitude, p2.latitude);
      const minALng = Math.min(p1.longitude, p2.longitude);
      const maxALng = Math.max(p1.longitude, p2.longitude);
      if (maxALat < minBLat || minALat > maxBLat || maxALng < minBLng || minALng > maxBLng) continue;
      if (segmentosSeIntersectam(p1, p2, p3, p4)) return true;
    }
  }
  return false;
}

class KalmanFilter {
  private q = 0.0001; private r = 0.01; private p = 1; private x = 0;
  filter(m: number) { this.p += this.q; const k = this.p / (this.p + this.r); this.x += k * (m - this.x); this.p *= 1 - k; return this.x; }
  init(v: number) { this.x = v; }
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Home() {
  const [location, setLocation]     = useState<any>(null);
  const [smoothLat, setSmoothLat]   = useState(0);
  const [smoothLng, setSmoothLng]   = useState(0);
  const [heading, setHeading]       = useState(0);
  const [corridas, setCorridas]     = useState<Corrida[]>([]);
  const [corridaSel, setCorridaSel] = useState<Corrida | null>(null);
  const [modo, setModo]             = useState<ModoMapa>("global");
  const [modalCorVisivel, setModalCorVisivel] = useState(false);
  const [salvandoCor, setSalvandoCor]         = useState(false);

  const painelAnim    = useRef(new Animated.Value(0)).current;
  const cardAnim      = useRef(new Animated.Value(300)).current;
  const toggleAnim    = useRef(new Animated.Value(0)).current;
  const TOGGLE_WIDTH  = 320;
  const PILL_WIDTH    = (TOGGLE_WIDTH - 8) / 2;

  const kalmanLat     = useRef(new KalmanFilter());
  const kalmanLng     = useRef(new KalmanFilter());
  const iniciouGPS    = useRef(false);
  const mapRef        = useRef<MapView>(null);
  const regionTimeout = useRef<number | null>(null);

  const navigation  = useNavigation();
  const currentUser = getAuth().currentUser;
  const { migrarKmAntigos } = useConquistas();
  const insets      = useSafeAreaInsets();
  const BOTTOM_OFFSET = TAB_BAR_HEIGHT + insets.bottom;

  // ── GPS ───────────────────────────────────────────────────────────────
  useEffect(() => { if (currentUser?.uid) migrarKmAntigos(currentUser.uid); }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      kalmanLat.current.init(pos.coords.latitude);
      kalmanLng.current.init(pos.coords.longitude);
      setSmoothLat(pos.coords.latitude);
      setSmoothLng(pos.coords.longitude);
      setLocation(pos);
      iniciouGPS.current = true;
      mapRef.current?.animateToRegion(
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        600,
      );
    })();
  }, []);

  useEffect(() => {
    let headingSub: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 15 },
      (r) => {
        setLocation(r);
        if (!iniciouGPS.current) return;
        setSmoothLat(kalmanLat.current.filter(r.coords.latitude));
        setSmoothLng(kalmanLng.current.filter(r.coords.longitude));
      },
    );
    Location.watchHeadingAsync((h) => setHeading(h.trueHeading ?? h.magHeading ?? 0))
      .then((sub) => { headingSub = sub; });
    return () => { headingSub?.remove(); };
  }, []);

  // ── Firestore ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
        const amigos: string[] = userSnap.data()?.amigos ?? [];
        const ids = Array.from(new Set([currentUser.uid, ...amigos]));

        const perfis: Record<string, { nome: string; avatarUrl?: string; corRota: string }> = {};
        await Promise.all(ids.map(async (uid) => {
          const snap = await getDoc(doc(db, "usuarios", uid));
          const d = snap.data();
          perfis[uid] = { nome: d?.nome || "Corredor", avatarUrl: d?.avatarUrl, corRota: d?.corRota || COR_FALLBACK };
        }));

        const lista: Corrida[] = [];
        await Promise.all(ids.map(async (uid) => {
          const snap = await getDocs(query(collection(db, "corridas"), where("uid", "==", uid)));
          snap.forEach((d) => {
            const data = d.data();
            if (!data.rota?.length) return;
            lista.push({
              id: d.id, uid, rota: data.rota,
              distancia_km:     data.distancia_km    || 0,
              tempo_formatado:  data.tempo_formatado  || "00:00",
              pace:             data.pace             || "--:--",
              criadoEm:         data.criadoEm,
              nomeOriginal:     perfis[uid]?.nome     || "Corredor",
              avatarOriginal:   perfis[uid]?.avatarUrl,
              corOriginal:      data.corRota || perfis[uid]?.corRota || COR_FALLBACK,
              capturadaPor:     data.capturadaPor,
              capturadaPorNome: data.capturadaPorNome,
              capturadaPorCor:  data.capturadaPorCor  || COR_FALLBACK,
              historicoCaptura: data.historicoCaptura || [],
              centro:           centroDaRota(data.rota),
              fechada:          isAreaFechada(data.rota),
            });
          });
        }));

        lista.sort((a, b) => {
          const ta = a.criadoEm?.toDate?.()?.getTime?.() ?? 0;
          const tb = b.criadoEm?.toDate?.()?.getTime?.() ?? 0;
          return tb - ta;
        });

        setCorridas(lista);
      } catch (e) { console.error("Erro ao carregar corridas:", e); }
    })();
  }, [currentUser]);

  // ── Badge "disputado" — só para uso no card, não filtra corridas ──────
  // Corridas com intersecção com OUTRAS corridas de outros usuários
  const idsDisputados = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (let i = 0; i < corridas.length; i++) {
      for (let j = 0; j < corridas.length; j++) {
        if (i === j || corridas[i].uid === corridas[j].uid) continue;
        if (rotasSeIntersectam(corridas[i].rota, corridas[j].rota)) {
          s.add(corridas[i].id);
          s.add(corridas[j].id);
        }
      }
    }
    return s;
  }, [corridas]);

  // ── Corridas visíveis ─────────────────────────────────────────────────
  // GLOBAL: todas as corridas (cor do dominador atual)
  // MINHAS: apenas as minhas (cor original sempre)
  const corridasGlobal = useMemo(() => corridas, [corridas]);

  const corridasMinhas = useMemo(
    () => currentUser ? corridas.filter((c) => c.uid === currentUser.uid) : [],
    [corridas, currentUser],
  );

  const corridasVisiveis = modo === "global" ? corridasGlobal : corridasMinhas;

  // ── Ranking ───────────────────────────────────────────────────────────
  const ranking = useMemo(() => {
    const mapa: Record<string, { nome: string; cor: string; total: number }> = {};
    corridas.forEach((c) => {
      const uid  = c.capturadaPor  || c.uid;
      const nome = c.capturadaPorNome || c.nomeOriginal;
      const cor  = c.capturadaPorCor  || c.corOriginal;
      if (!mapa[uid]) mapa[uid] = { nome, cor, total: 0 };
      mapa[uid].total++;
    });
    return Object.entries(mapa)
      .map(([uid, v]) => ({ uid, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [corridas]);

  // ── Card ──────────────────────────────────────────────────────────────
  const abrirCard = useCallback((corrida: Corrida) => {
    setCorridaSel(corrida);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true }).start();
  }, []);

  const fecharCard = useCallback(() => {
    Animated.spring(cardAnim, { toValue: 300, useNativeDriver: true })
      .start(() => setCorridaSel(null));
  }, []);

  // ── Toggle ────────────────────────────────────────────────────────────
  function alternarModo(m: ModoMapa) {
    fecharCard();
    setModo(m);
    Animated.spring(toggleAnim, { toValue: m === "global" ? 4 : 4 + PILL_WIDTH, tension: 80, friction: 12, useNativeDriver: false }).start();
    Animated.spring(painelAnim, { toValue: m === "minhas" ? 1 : 0, tension: 60, friction: 14, useNativeDriver: false }).start();
  }

  // ── Paleta de cores ───────────────────────────────────────────────────
  async function salvarCorCorrida(novaCor: string) {
    if (!corridaSel || !currentUser) return;
    setSalvandoCor(true);
    try {
      await updateDoc(doc(db, "corridas", corridaSel.id), { corRota: novaCor });
      const atualizada = { ...corridaSel, corOriginal: novaCor };
      setCorridas((prev) => prev.map((c) => c.id === corridaSel.id ? atualizada : c));
      setCorridaSel(atualizada);
    } catch (e) { console.error(e); }
    finally { setSalvandoCor(false); setModalCorVisivel(false); }
  }

  // ── Cor da corrida por modo ───────────────────────────────────────────
  const corDaCorrida = useCallback((c: Corrida): string => {
    if (modo === "minhas") return c.corOriginal;
    return c.capturadaPor ? (c.capturadaPorCor || COR_FALLBACK) : c.corOriginal;
  }, [modo]);

  // ── Render do mapa — usa Polygon para área fechada ────────────────────
  const renderMapa = useMemo(() => {
    return corridasVisiveis.map((c) => {
      const cor = corDaCorrida(c);
      // ✅ Polígono fechado → usa Polygon com preenchimento
      if (c.fechada) {
        return (
          <Polygon
            key={c.id}
            coordinates={c.rota}
            strokeColor={cor}
            fillColor={`${cor}40`}
            strokeWidth={3}
            tappable
            onPress={() => abrirCard(c)}
          />
        );
      }
      // Rota aberta → Polyline
      return (
        <Polyline
          key={c.id}
          coordinates={c.rota}
          strokeColor={cor}
          strokeWidth={3}
          tappable
          geodesic={false}
          lineCap="round"
          lineJoin="round"
          onPress={() => abrirCard(c)}
        />
      );
    });
  }, [corridasVisiveis, corDaCorrida, abrirCard]);

  // ── Valores derivados ─────────────────────────────────────────────────
  const ehMinhaCorrida = corridaSel?.uid === currentUser?.uid;
  const painelBottom = painelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-PAINEL_ALTURA, BOTTOM_OFFSET],
  });

  // ─────────────────────────────────────────────────────────────────────
  return (
    <View style={StyleSheet.absoluteFill}>

      {/* Mapa tela cheia */}
      {location && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          onPress={fecharCard}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          initialRegion={{
            latitude:  smoothLat || location.coords.latitude,
            longitude: smoothLng || location.coords.longitude,
            latitudeDelta: 0.005, longitudeDelta: 0.005,
          }}
          onRegionChangeComplete={(r: Region) => {
            if (regionTimeout.current) clearTimeout(regionTimeout.current);
            regionTimeout.current = setTimeout(() => {}, 120);
          }}
        >
          {smoothLat !== 0 && (
            <Marker
              coordinate={{ latitude: smoothLat, longitude: smoothLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              flat rotation={heading}
              tracksViewChanges={false}
            >
              <View style={local.userMarkerWrap}>
                <View style={local.userArrow} />
                <View style={local.userDot} />
              </View>
            </Marker>
          )}
          {renderMapa}
        </MapView>
      )}

      {/* Menu */}
      <TouchableOpacity style={local.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <Feather name="menu" size={28} color="#111" />
      </TouchableOpacity>

      {/* Ofensiva */}
      <View style={local.ofensivaWrap}>
        <Ofensiva uid={currentUser?.uid ?? ""} modoCompacto />
      </View>

      {/* Toggle */}
      <View style={local.toggleWrap}>
        <View style={[local.toggleContainer, { width: TOGGLE_WIDTH }]}>
          <Animated.View style={[local.togglePill, { width: PILL_WIDTH, left: toggleAnim }]} />
          <TouchableOpacity style={local.toggleBtn} onPress={() => alternarModo("global")}>
            <Feather name="globe" size={14} color={modo === "global" ? "#fff" : "#777"} />
            <Text style={[local.toggleTxt, modo === "global" && local.toggleTxtActive]}>Online</Text>
          </TouchableOpacity>
          <TouchableOpacity style={local.toggleBtn} onPress={() => alternarModo("minhas")}>
            <Feather name="user" size={14} color={modo === "minhas" ? "#fff" : "#777"} />
            <Text style={[local.toggleTxt, modo === "minhas" && local.toggleTxtActive]}>Minhas corridas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ranking — modo global */}
      {modo === "global" && ranking.length > 0 && (
        <View style={[local.rankingCard, { bottom: BOTTOM_OFFSET + 16 }]}>
          <Text style={local.rankingTitulo}>
            <Feather name="award" size={13} color="#2C3F69" /> Dominando agora
          </Text>
          {ranking.map((r, i) => (
            <View key={r.uid} style={local.rankingRow}>
              <Text style={local.rankingPos}>#{i + 1}</Text>
              <View style={[local.rankingDot, { backgroundColor: r.cor }]} />
              <Text style={local.rankingNome} numberOfLines={1}>{r.nome}</Text>
              <Text style={local.rankingTotal}>{r.total} terr.</Text>
            </View>
          ))}
        </View>
      )}

      {/* Botão centralizar */}
      <TouchableOpacity
        style={[local.btnCentralizar, {
          bottom: modo === "global" ? BOTTOM_OFFSET + 16 : BOTTOM_OFFSET + PAINEL_ALTURA + 16,
        }]}
        onPress={() => smoothLat && mapRef.current?.animateToRegion(
          { latitude: smoothLat, longitude: smoothLng, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500,
        )}
      >
        <Feather name="navigation" size={20} color="#2C3F69" />
      </TouchableOpacity>

      {/* Card da corrida */}
      {corridaSel && (
        <Animated.View style={[local.card, { bottom: BOTTOM_OFFSET + 12, transform: [{ translateY: cardAnim }] }]}>
          <TouchableOpacity style={local.cardClose} onPress={fecharCard}>
            <Feather name="x" size={18} color="#999" />
          </TouchableOpacity>

          <View style={local.cardHeader}>
            {corridaSel.avatarOriginal
              ? <Image source={{ uri: corridaSel.avatarOriginal }} style={local.avatar} />
              : <View style={[local.avatar, { backgroundColor: corridaSel.corOriginal }]} />
            }
            <View style={{ flex: 1 }}>
              <Text style={local.cardNome}>{corridaSel.nomeOriginal}</Text>
              <Text style={local.cardSub}>{formatDate(corridaSel.criadoEm)}</Text>
              {/* Badge "disputado" — do primeiro código */}
              {idsDisputados.has(corridaSel.id) && (
                <View style={local.dominadoBadge}>
                  <View style={[local.dominadoDot, { backgroundColor: "#e9a01a" }]} />
                  <Text style={local.dominadoTxt}>Trecho disputado com outro corredor</Text>
                </View>
              )}
              {corridaSel.capturadaPor && corridaSel.capturadaPor !== corridaSel.uid && (
                <View style={local.dominadoBadge}>
                  <View style={[local.dominadoDot, { backgroundColor: corridaSel.capturadaPorCor }]} />
                  <Text style={local.dominadoTxt}>Dominado por {corridaSel.capturadaPorNome}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={local.metrics}>
            <View style={local.metricBox}>
              <Text style={local.metricV}>{corridaSel.distancia_km.toFixed(2)}km</Text>
              <Text style={local.metricL}>Distância</Text>
            </View>
            <View style={local.metricBox}>
              <Text style={local.metricV}>{corridaSel.tempo_formatado}</Text>
              <Text style={local.metricL}>Tempo</Text>
            </View>
            <View style={local.metricBox}>
              <Text style={local.metricV}>{corridaSel.pace}</Text>
              <Text style={local.metricL}>Pace</Text>
            </View>
          </View>

          <View style={local.botoesRow}>
            {ehMinhaCorrida ? (
              <>
                <TouchableOpacity
                  style={[local.btnAcao, { flex: 1, marginRight: 8 }]}
                  onPress={() => { fecharCard(); router.push("../historico"); }}
                >
                  <Text style={local.btnAcaoTxt}>Ver histórico</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[local.btnCor, { backgroundColor: corridaSel.corOriginal }]}
                  onPress={() => setModalCorVisivel(true)}
                >
                  <Feather name="droplet" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[local.btnAcao, { flex: 1, backgroundColor: "#e9a01a" }]}
                onPress={() => {
                  fecharCard();
                  router.push({
                    pathname: "../../../telaCorrendo",
                    params: {
                      corridaCapturarId:   corridaSel.id,
                      corridaCapturarRota: JSON.stringify(corridaSel.rota),
                      corridaCapturarCor:  corridaSel.corOriginal,
                      corridaCapturarNome: corridaSel.nomeOriginal,
                    },
                  });
                }}
              >
                <Feather name="flag" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={local.btnAcaoTxt}>Capturar</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Painel Minhas corridas */}
      <Animated.View style={[local.painel, { height: PAINEL_ALTURA, bottom: painelBottom }]}>
        <View style={local.painelMapa}>
          <MapView
            style={StyleSheet.absoluteFill}
            scrollEnabled={false} zoomEnabled={false}
            rotateEnabled={false} pitchEnabled={false}
            region={
              corridasMinhas.length > 0
                ? { latitude: corridasMinhas[0].centro.latitude, longitude: corridasMinhas[0].centro.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }
                : { latitude: smoothLat || -3.1, longitude: smoothLng || -60.0, latitudeDelta: 0.03, longitudeDelta: 0.03 }
            }
          >
            {corridasMinhas.map((c) =>
              c.fechada ? (
                <Polygon key={c.id} coordinates={c.rota}
                  strokeColor={c.corOriginal} fillColor={`${c.corOriginal}40`} strokeWidth={2} />
              ) : (
                <Polyline key={c.id} coordinates={c.rota}
                  strokeColor={c.corOriginal} strokeWidth={3} geodesic={false} lineCap="round" />
              )
            )}
          </MapView>
          <View style={local.painelMapaBadge}>
            <Text style={local.painelMapaBadgeTxt}>
              {corridasMinhas.length} corrida{corridasMinhas.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <ScrollView style={local.painelLista} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
          {corridasMinhas.length === 0
            ? <Text style={local.painelVazio}>Nenhuma corrida ainda.</Text>
            : corridasMinhas.map((c) => (
                <TouchableOpacity key={c.id} style={local.corridaItem}
                  onPress={() => {
                    mapRef.current?.animateToRegion(
                      { latitude: c.centro.latitude, longitude: c.centro.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400,
                    );
                    abrirCard(c);
                  }}
                >
                  <View style={[local.corridaItemDot, { backgroundColor: c.corOriginal }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={local.corridaItemData}>{formatDate(c.criadoEm)}</Text>
                    <Text style={local.corridaItemInfo}>
                      {c.distancia_km.toFixed(2)} km · {c.tempo_formatado} · {c.pace}/km
                    </Text>
                    {c.capturadaPor && c.capturadaPor !== currentUser?.uid && (
                      <Text style={local.corridaCapturada}>⚑ Dominada por {c.capturadaPorNome}</Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={16} color="#ccc" />
                </TouchableOpacity>
              ))
          }
        </ScrollView>
      </Animated.View>

      {/* Modal paleta */}
      <Modal visible={modalCorVisivel} transparent animationType="fade" onRequestClose={() => setModalCorVisivel(false)}>
        <TouchableOpacity style={local.modalOverlay} activeOpacity={1} onPress={() => setModalCorVisivel(false)}>
          <View style={local.modalBox}>
            <Text style={local.modalTitulo}>Cor da corrida</Text>
            <View style={local.paletaGrid}>
              {PALETA_CORES.map((cor) => (
                <TouchableOpacity key={cor}
                  style={[local.paletaItem, { backgroundColor: cor }, corridaSel?.corOriginal === cor && local.paletaItemSel]}
                  onPress={() => salvarCorCorrida(cor)} disabled={salvandoCor}
                />
              ))}
            </View>
            {salvandoCor && <Text style={local.salvando}>Salvando...</Text>}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const local = StyleSheet.create({
  menuBtn:      { position: "absolute", top: 52, left: 18, zIndex: 20 },
  ofensivaWrap: { position: "absolute", top: 50, right: 18, zIndex: 20 },

  toggleWrap: { position: "absolute", top: 95, width: "100%", alignItems: "center", zIndex: 20 },
  toggleContainer: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 18, height: 52, padding: 4, position: "relative", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  togglePill:      { position: "absolute", top: 4, bottom: 4, backgroundColor: "#2C3F69", borderRadius: 14 },
  toggleBtn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 2 },
  toggleTxt:       { fontSize: 15, fontWeight: "700", color: "#777" },
  toggleTxtActive: { color: "#fff" },

  rankingCard: {
    position: "absolute", left: 16, right: 16,
    backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 20, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6, zIndex: 20,
  },
  rankingTitulo: { fontSize: 13, fontWeight: "800", color: "#2C3F69", marginBottom: 10 },
  rankingRow:    { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  rankingPos:    { fontSize: 12, fontWeight: "700", color: "#999", width: 28 },
  rankingDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  rankingNome:   { flex: 1, fontSize: 13, fontWeight: "700", color: "#222" },
  rankingTotal:  { fontSize: 12, color: "#888", fontWeight: "600" },

  btnCentralizar: {
    position: "absolute", right: 16, width: 54, height: 54, borderRadius: 27,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center", zIndex: 20,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },

  userMarkerWrap: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  userArrow: {
    position: "absolute", top: 0, width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 12,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderBottomColor: "#2C3F69", opacity: 0.85,
  },
  userDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#2C3F69", borderWidth: 3, borderColor: "#fff", marginTop: 6 },

  card: {
    position: "absolute", left: 16, right: 16,
    backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 28, padding: 20, zIndex: 30,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  cardClose:      { position: "absolute", top: 16, right: 16, zIndex: 2 },
  cardHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar:         { width: 54, height: 54, borderRadius: 27, marginRight: 14 },
  cardNome:       { fontSize: 22, fontWeight: "800", color: "#111" },
  cardSub:        { fontSize: 13, color: "#777", marginTop: 4 },
  dominadoBadge:  { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dominadoDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  dominadoTxt:    { fontSize: 12, color: "#e9a01a", fontWeight: "700" },

  metrics:   { flexDirection: "row", justifyContent: "space-between" },
  metricBox: { alignItems: "center", flex: 1 },
  metricV:   { fontSize: 22, fontWeight: "800", color: "#111" },
  metricL:   { marginTop: 6, fontSize: 12, color: "#888" },

  botoesRow: { flexDirection: "row", alignItems: "center", marginTop: 22 },
  btnAcao:   { height: 52, borderRadius: 14, backgroundColor: "#2C3F69", alignItems: "center", justifyContent: "center", flexDirection: "row" },
  btnAcaoTxt:{ color: "#fff", fontSize: 15, fontWeight: "700" },
  btnCor:    { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  painel: {
    position: "absolute", left: 0, right: 0, backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
    elevation: 20, zIndex: 25, overflow: "hidden",
  },
  painelMapa:         { height: 160, width: "100%", backgroundColor: "#e8f0fe" },
  painelMapaBadge:    { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(44,63,105,0.85)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  painelMapaBadgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  painelLista:        { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  painelVazio:        { textAlign: "center", color: "#aaa", marginTop: 20, fontSize: 14 },

  corridaItem:      { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  corridaItemDot:   { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  corridaItemData:  { fontSize: 14, fontWeight: "700", color: "#111" },
  corridaItemInfo:  { fontSize: 12, color: "#888", marginTop: 2 },
  corridaCapturada: { fontSize: 11, color: "#e9a01a", fontWeight: "700", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  modalBox:     { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: 300, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  modalTitulo:  { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 20 },
  paletaGrid:   { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  paletaItem:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "transparent" },
  paletaItemSel:{ borderColor: "#111", transform: [{ scale: 1.18 }] },
  salvando:     { marginTop: 16, fontSize: 13, color: "#888" },
});
