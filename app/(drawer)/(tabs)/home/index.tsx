import Feather from "@expo/vector-icons/Feather";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import Ofensiva from "../../../../components/ofensiva/ofensiva";
import { db } from "../../../../firebase/firebaseConfig";
import { useConquistas } from "../../../hooks/useConquistas";

const CORES = {
  primario:  "#2C3F69",
  verde:     "#22C3A3",
  dourado:   "#FFD700",
  vermelho:  "#FF3B30",
  laranja:   "#FF9F0A",
  fallback:  "#1a58e9",
  fundo:     "#F2F4F8",
  branco:    "#FFFFFF",
  cinza:     "#8E8E93",
  borda:     "#F0F0F0",
};

type Coord = { latitude: number; longitude: number };
type ModoMapa = "global" | "minhas";
type Corrida = {
  id: string; uid: string; rota: Coord[];
  distancia_km: number; tempo_formatado: string; pace: string; criadoEm: any;
  nomeOriginal: string; avatarOriginal?: string; corOriginal: string;
  capturadaPor?: string; capturadaPorNome?: string; capturadaPorCor?: string;
  historicoCaptura?: { uid: string; nome: string; cor: string; data?: string }[];
  centro: Coord; fechada: boolean;
};

const TAB_BAR_HEIGHT = 60;
const PAINEL_ALTURA  = 420;
const PALETA_CORES   = [
  "#1a58e9","#e91a1a","#1ae94a","#e9c51a",
  "#e91ae2","#1ae9e2","#ff6b00","#9b1ae9",
  "#e9821a","#00b300","#005ce6","#e9001a",
];

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

function segmentosSeIntersectam(p1: Coord, p2: Coord, p3: Coord, p4: Coord): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d1 = cross(p3.longitude, p3.latitude, p4.longitude, p4.latitude, p1.longitude, p1.latitude);
  const d2 = cross(p3.longitude, p3.latitude, p4.longitude, p4.latitude, p2.longitude, p2.latitude);
  const d3 = cross(p1.longitude, p1.latitude, p2.longitude, p2.latitude, p3.longitude, p3.latitude);
  const d4 = cross(p1.longitude, p1.latitude, p2.longitude, p2.latitude, p4.longitude, p4.latitude);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function rotasSeIntersectam(rotaA: Coord[], rotaB: Coord[]): boolean {
  for (let i = 0; i < rotaA.length - 1; i++)
    for (let j = 0; j < rotaB.length - 1; j++)
      if (segmentosSeIntersectam(rotaA[i], rotaA[i+1], rotaB[j], rotaB[j+1])) return true;
  return false;
}

class KalmanFilter {
  private q = 0.0001; private r = 0.01; private p = 1; private x = 0;
  filter(m: number) { this.p += this.q; const k = this.p / (this.p + this.r); this.x += k * (m - this.x); this.p *= 1 - k; return this.x; }
  init(v: number) { this.x = v; }
}

const AvatarMarker = React.memo(({ corrida, selecionada, onPress }: {
  corrida: Corrida; selecionada: boolean; onPress: () => void;
}) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const corBorda = corrida.capturadaPor && corrida.capturadaPor !== corrida.uid
    ? CORES.dourado : corrida.corOriginal;

  return (
    <Marker
      coordinate={corrida.centro}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={onPress}
    >
      <Animated.View style={[
        local.avatarMarkerWrap,
        { borderColor: selecionada ? CORES.branco : corBorda },
        selecionada ? { opacity: 1, borderWidth: 4 } : { opacity: opacityAnim, borderWidth: 3 },
      ]}>
        {corrida.avatarOriginal
          ? <Image source={{ uri: corrida.avatarOriginal }} style={local.avatarMarkerImg} />
          : <View style={[local.avatarMarkerPlaceholder, { backgroundColor: corrida.corOriginal }]}>
              <Text style={local.avatarMarkerLetra}>
                {corrida.nomeOriginal.charAt(0).toUpperCase()}
              </Text>
            </View>
        }
      </Animated.View>
    </Marker>
  );
});

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

  const painelAnim   = useRef(new Animated.Value(0)).current;
  const cardAnim     = useRef(new Animated.Value(300)).current;
  const toggleAnim   = useRef(new Animated.Value(4)).current;
  const TOGGLE_WIDTH = 320;
  const PILL_WIDTH   = (TOGGLE_WIDTH - 8) / 2;

  const kalmanLat  = useRef(new KalmanFilter());
  const kalmanLng  = useRef(new KalmanFilter());
  const iniciouGPS = useRef(false);
  const mapRef     = useRef<MapView>(null);

  const navigation  = useNavigation();
  const currentUser = getAuth().currentUser;
  const { migrarKmAntigos } = useConquistas();
  const insets      = useSafeAreaInsets();
  const BOTTOM_OFFSET = TAB_BAR_HEIGHT + insets.bottom;

  useEffect(() => {
    if (currentUser?.uid) migrarKmAntigos(currentUser.uid);
  }, []);

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
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 600,
      );
    })();
  }, []);

  useEffect(() => {
    let headingSub: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 20 },
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

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const corridasSnap = await getDocs(collection(db, "corridas"));

        const uidsUnicos = new Set<string>();
        corridasSnap.forEach(d => {
          const data = d.data();
          if (Array.isArray(data.rota) && data.rota.length >= 2 && data.uid) {
            uidsUnicos.add(data.uid);
          }
        });

        const perfis: Record<string, { nome: string; avatarUrl?: string; corRota: string }> = {};
        await Promise.all(Array.from(uidsUnicos).map(async (uid) => {
          const snap = await getDoc(doc(db, "usuarios", uid));
          const d = snap.data();
          perfis[uid] = {
            nome: d?.nome || "Corredor",
            avatarUrl: d?.avatarUrl,
            corRota: d?.corRota || CORES.fallback,
          };
        }));

        const lista: Corrida[] = [];
        corridasSnap.forEach((d) => {
          const data = d.data();

          // Validação robusta — ignora corridas com rota inválida
          if (!Array.isArray(data.rota) || data.rota.length < 2) return;
          if (!data.uid) return;

          const rota: Coord[] = data.rota.filter(
            (c: any) => c && typeof c.latitude === "number" && typeof c.longitude === "number"
          );
          if (rota.length < 2) return;

          const uid = data.uid;
          lista.push({
            id: d.id, uid, rota,
            distancia_km: data.distancia_km || 0,
            tempo_formatado: data.tempo_formatado || "00:00",
            pace: data.pace || "--:--",
            criadoEm: data.criadoEm,
            nomeOriginal: perfis[uid]?.nome || "Corredor",
            avatarOriginal: perfis[uid]?.avatarUrl,
            corOriginal: data.corRota || perfis[uid]?.corRota || CORES.fallback,
            capturadaPor: data.capturadaPor,
            capturadaPorNome: data.capturadaPorNome,
            capturadaPorCor: data.capturadaPorCor || CORES.fallback,
            historicoCaptura: data.historicoCaptura || [],
            centro: centroDaRota(rota),
            fechada: isAreaFechada(rota),
          });
        });

        lista.sort((a, b) => {
          const ta = a.criadoEm?.toDate?.()?.getTime?.() ?? 0;
          const tb = b.criadoEm?.toDate?.()?.getTime?.() ?? 0;
          return tb - ta;
        });
        setCorridas(lista);
      } catch (e) {
        console.error("Erro ao carregar corridas:", e);
      }
    })();
  }, [currentUser]);

  const idsDisputados = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (let i = 0; i < corridas.length; i++)
      for (let j = 0; j < corridas.length; j++) {
        if (i === j || corridas[i].uid === corridas[j].uid) continue;
        if (rotasSeIntersectam(corridas[i].rota, corridas[j].rota)) {
          s.add(corridas[i].id); s.add(corridas[j].id);
        }
      }
    return s;
  }, [corridas]);

  const corridasGlobal   = useMemo(() => corridas, [corridas]);
  const corridasMinhas   = useMemo(() => currentUser ? corridas.filter(c => c.uid === currentUser.uid) : [], [corridas, currentUser]);
  const corridasVisiveis = modo === "global" ? corridasGlobal : corridasMinhas;

  const ranking = useMemo(() => {
    const mapa: Record<string, { nome: string; cor: string; total: number }> = {};
    corridas.forEach((c) => {
      const uid  = c.capturadaPor || c.uid;
      const nome = c.capturadaPorNome || c.nomeOriginal;
      const cor  = c.capturadaPorCor || c.corOriginal;
      if (!mapa[uid]) mapa[uid] = { nome, cor, total: 0 };
      mapa[uid].total++;
    });
    return Object.entries(mapa).map(([uid, v]) => ({ uid, ...v })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [corridas]);

  const corDaCorrida = useCallback((c: Corrida): string => {
    if (modo === "minhas") return c.corOriginal;
    const foiCapturada = c.capturadaPor && c.capturadaPor !== c.uid;
    const euCapturei   = c.capturadaPor === currentUser?.uid;
    const ehMinha      = c.uid === currentUser?.uid;
    if (ehMinha && foiCapturada) return CORES.vermelho;
    if (euCapturei)              return CORES.verde;
    if (foiCapturada)            return CORES.dourado;
    return c.corOriginal;
  }, [modo, currentUser]);

  const abrirCard = useCallback((corrida: Corrida) => {
    setCorridaSel(corrida);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    mapRef.current?.animateToRegion(
      { latitude: corrida.centro.latitude, longitude: corrida.centro.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400,
    );
  }, []);

  const fecharCard = useCallback(() => {
    Animated.spring(cardAnim, { toValue: 300, useNativeDriver: true }).start(() => setCorridaSel(null));
  }, []);

  function alternarModo(m: ModoMapa) {
    fecharCard();
    setModo(m);
    Animated.spring(toggleAnim, { toValue: m === "global" ? 4 : 4 + PILL_WIDTH, tension: 80, friction: 12, useNativeDriver: false }).start();
    Animated.spring(painelAnim, { toValue: m === "minhas" ? 1 : 0, tension: 60, friction: 14, useNativeDriver: false }).start();
  }

  async function salvarCorCorrida(novaCor: string) {
    if (!corridaSel || !currentUser) return;
    setSalvandoCor(true);
    try {
      await updateDoc(doc(db, "corridas", corridaSel.id), { corRota: novaCor });
      const atualizada = { ...corridaSel, corOriginal: novaCor };
      setCorridas(prev => prev.map(c => c.id === corridaSel.id ? atualizada : c));
      setCorridaSel(atualizada);
    } catch (e) { console.error(e); }
    finally { setSalvandoCor(false); setModalCorVisivel(false); }
  }

  const renderMapa = useMemo(() => {
    return corridasVisiveis.map((c) => {
      const cor       = corDaCorrida(c);
      const selecionada = corridaSel?.id === c.id;
      const largura   = selecionada ? 6 : 3;

      return (
        <React.Fragment key={c.id}>
          {c.fechada ? (
            <Polygon
              coordinates={c.rota}
              strokeColor={cor}
              fillColor={`${cor}40`}
              strokeWidth={largura}
              tappable
              onPress={() => abrirCard(c)}
            />
          ) : (
            <Polyline
              coordinates={c.rota}
              strokeColor={cor}
              strokeWidth={largura}
              tappable
              geodesic={false}
              lineCap="round"
              lineJoin="round"
              onPress={() => abrirCard(c)}
            />
          )}
          <AvatarMarker corrida={c} selecionada={selecionada} onPress={() => abrirCard(c)} />
        </React.Fragment>
      );
    });
  }, [corridasVisiveis, corDaCorrida, corridaSel, abrirCard]);

  const ehMinhaCorrida   = corridaSel?.uid === currentUser?.uid;
  const euCaptureiEssa   = corridaSel?.capturadaPor === currentUser?.uid;
  const elaPerdeuParaMim = !!(corridaSel?.capturadaPor && corridaSel.capturadaPor !== corridaSel.uid);

  const painelBottom = painelAnim.interpolate({ inputRange: [0, 1], outputRange: [-PAINEL_ALTURA, BOTTOM_OFFSET] });

  return (
    <View style={StyleSheet.absoluteFill}>

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
        >
          {smoothLat !== 0 && (
            <Marker coordinate={{ latitude: smoothLat, longitude: smoothLng }} anchor={{ x: 0.5, y: 0.5 }} flat rotation={heading} tracksViewChanges={false}>
              <View style={local.userMarkerWrap}>
                <View style={local.userArrow} />
                <View style={local.userDot} />
              </View>
            </Marker>
          )}
          {renderMapa}
        </MapView>
      )}

      <TouchableOpacity style={local.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <Feather name="menu" size={28} color="#111" />
      </TouchableOpacity>

      <View style={local.ofensivaWrap}>
        <Ofensiva uid={currentUser?.uid ?? ""} modoCompacto />
      </View>

      <View style={local.toggleWrap}>
        <View style={[local.toggleContainer, { width: TOGGLE_WIDTH }]}>
          <Animated.View style={[local.togglePill, { width: PILL_WIDTH, left: toggleAnim }]} />
          <TouchableOpacity style={local.toggleBtn} onPress={() => alternarModo("global")}>
            <Feather name="globe" size={14} color={modo === "global" ? CORES.branco : CORES.cinza} />
            <Text style={[local.toggleTxt, modo === "global" && local.toggleTxtActive]}>Online</Text>
          </TouchableOpacity>
          <TouchableOpacity style={local.toggleBtn} onPress={() => alternarModo("minhas")}>
            <Feather name="user" size={14} color={modo === "minhas" ? CORES.branco : CORES.cinza} />
            <Text style={[local.toggleTxt, modo === "minhas" && local.toggleTxtActive]}>Minhas corridas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {modo === "global" && (
        <View style={local.legendaWrap}>
          <View style={local.legendaItem}><View style={[local.legendaDot, { backgroundColor: CORES.verde }]} /><Text style={local.legendaTxt}>Dominando</Text></View>
          <View style={local.legendaItem}><View style={[local.legendaDot, { backgroundColor: CORES.dourado }]} /><Text style={local.legendaTxt}>Capturado</Text></View>
          <View style={local.legendaItem}><View style={[local.legendaDot, { backgroundColor: CORES.vermelho }]} /><Text style={local.legendaTxt}>Perdido</Text></View>
        </View>
      )}

      {modo === "global" && ranking.length > 0 && (
        <View style={[local.rankingCard, { bottom: BOTTOM_OFFSET + 16 }]}>
          <Text style={local.rankingTitulo}><Feather name="award" size={13} color={CORES.primario} /> Dominando agora</Text>
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

      <TouchableOpacity
        style={[local.btnCentralizar, { bottom: modo === "global" ? BOTTOM_OFFSET + 16 : BOTTOM_OFFSET + PAINEL_ALTURA + 16 }]}
        onPress={() => smoothLat && mapRef.current?.animateToRegion({ latitude: smoothLat, longitude: smoothLng, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500)}
      >
        <Feather name="navigation" size={20} color={CORES.primario} />
      </TouchableOpacity>

      {corridaSel && (
        <Animated.View style={[local.card, { bottom: BOTTOM_OFFSET + 12, transform: [{ translateY: cardAnim }] }]}>
          <TouchableOpacity style={local.cardClose} onPress={fecharCard}>
            <Feather name="x" size={18} color={CORES.cinza} />
          </TouchableOpacity>

          <View style={local.cardHeader}>
            {corridaSel.avatarOriginal
              ? <Image source={{ uri: corridaSel.avatarOriginal }} style={local.avatar} />
              : <View style={[local.avatar, { backgroundColor: corridaSel.corOriginal, alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 22 }}>{corridaSel.nomeOriginal.charAt(0).toUpperCase()}</Text>
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={local.cardNome}>{corridaSel.nomeOriginal}</Text>
              <Text style={local.cardSub}>{formatDate(corridaSel.criadoEm)}</Text>
              {idsDisputados.has(corridaSel.id) && (
                <View style={local.badge}>
                  <View style={[local.badgeDot, { backgroundColor: CORES.laranja }]} />
                  <Text style={[local.badgeTxt, { color: CORES.laranja }]}>Trecho disputado</Text>
                </View>
              )}
              {ehMinhaCorrida && elaPerdeuParaMim && (
                <View style={local.badge}>
                  <View style={[local.badgeDot, { backgroundColor: CORES.vermelho }]} />
                  <Text style={[local.badgeTxt, { color: CORES.vermelho }]}>Perdido para {corridaSel.capturadaPorNome}</Text>
                </View>
              )}
              {!ehMinhaCorrida && elaPerdeuParaMim && !euCaptureiEssa && (
                <View style={local.badge}>
                  <View style={[local.badgeDot, { backgroundColor: CORES.dourado }]} />
                  <Text style={[local.badgeTxt, { color: CORES.dourado }]}>Dominado por {corridaSel.capturadaPorNome}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={local.metrics}>
            <View style={local.metricBox}><Text style={local.metricV}>{corridaSel.distancia_km.toFixed(2)}km</Text><Text style={local.metricL}>Distância</Text></View>
            <View style={local.metricBox}><Text style={local.metricV}>{corridaSel.tempo_formatado}</Text><Text style={local.metricL}>Tempo</Text></View>
            <View style={local.metricBox}><Text style={local.metricV}>{corridaSel.pace}</Text><Text style={local.metricL}>Pace</Text></View>
          </View>

          {corridaSel.historicoCaptura && corridaSel.historicoCaptura.length > 0 && (
            <View style={local.historicoWrap}>
              <Text style={local.historicoTitulo}>Histórico de domínio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {corridaSel.historicoCaptura.map((h, i) => (
                  <View key={i} style={local.historicoItem}>
                    <View style={[local.historicoDot, { backgroundColor: h.cor }]} />
                    <Text style={local.historicoNome}>{h.nome}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={local.botoesRow}>
            {ehMinhaCorrida ? (
              <>
                <TouchableOpacity style={[local.btnAcao, { flex: 1, marginRight: 8 }]} onPress={() => { fecharCard(); router.push("../historico"); }}>
                  <Feather name="clock" size={15} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={local.btnAcaoTxt}>Ver histórico</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[local.btnCor, { backgroundColor: corridaSel.corOriginal }]} onPress={() => setModalCorVisivel(true)}>
                  <Feather name="droplet" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[local.btnAcao, { flex: 1, backgroundColor: CORES.dourado }]}
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
                <Feather name="flag" size={15} color={CORES.primario} style={{ marginRight: 6 }} />
                <Text style={[local.btnAcaoTxt, { color: CORES.primario }]}>Capturar território</Text>
              </TouchableOpacity>
            )}

            {ehMinhaCorrida && elaPerdeuParaMim && (
              <TouchableOpacity
                style={[local.btnAcao, { flex: 1, marginLeft: 8, backgroundColor: CORES.vermelho }]}
                onPress={() => {
                  fecharCard();
                  router.push({
                    pathname: "../../../telaCorrendo",
                    params: {
                      corridaCapturarId:   corridaSel.id,
                      corridaCapturarRota: JSON.stringify(corridaSel.rota),
                      corridaCapturarCor:  corridaSel.corOriginal,
                      corridaCapturarNome: corridaSel.nomeOriginal,
                      modoRecuperar:       "true",
                    },
                  });
                }}
              >
                <Feather name="refresh-cw" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={local.btnAcaoTxt}>Recuperar</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <Animated.View style={[local.painel, { height: PAINEL_ALTURA, bottom: painelBottom }]}>
        <View style={local.painelMapa}>
          <MapView
            style={StyleSheet.absoluteFill}
            scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}
            region={
              corridasMinhas.length > 0
                ? { latitude: corridasMinhas[0].centro.latitude, longitude: corridasMinhas[0].centro.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }
                : { latitude: smoothLat || -3.1, longitude: smoothLng || -60.0, latitudeDelta: 0.03, longitudeDelta: 0.03 }
            }
          >
            {corridasMinhas.map((c) =>
              c.fechada
                ? <Polygon key={c.id} coordinates={c.rota} strokeColor={c.corOriginal} fillColor={`${c.corOriginal}40`} strokeWidth={2} />
                : <Polyline key={c.id} coordinates={c.rota}
                    strokeColor={c.capturadaPor && c.capturadaPor !== c.uid ? CORES.vermelho : c.corOriginal}
                    strokeWidth={3} geodesic={false} lineCap="round" />
            )}
          </MapView>
          <View style={local.painelMapaBadge}>
            <Text style={local.painelMapaBadgeTxt}>{corridasMinhas.length} corrida{corridasMinhas.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        <ScrollView style={local.painelLista} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
          {corridasMinhas.length === 0
            ? <Text style={local.painelVazio}>Nenhuma corrida ainda.</Text>
            : corridasMinhas.map((c) => {
                const perdida = !!(c.capturadaPor && c.capturadaPor !== currentUser?.uid);
                return (
                  <TouchableOpacity key={c.id} style={local.corridaItem}
                    onPress={() => { mapRef.current?.animateToRegion({ latitude: c.centro.latitude, longitude: c.centro.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400); abrirCard(c); }}
                  >
                    <View style={[local.corridaItemDot, { backgroundColor: perdida ? CORES.vermelho : c.corOriginal }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={local.corridaItemData}>{formatDate(c.criadoEm)}</Text>
                      <Text style={local.corridaItemInfo}>{c.distancia_km.toFixed(2)} km · {c.tempo_formatado} · {c.pace}/km</Text>
                      {perdida && <Text style={[local.corridaCapturada, { color: CORES.vermelho }]}>⚑ Perdido para {c.capturadaPorNome}</Text>}
                    </View>
                    <Feather name="chevron-right" size={16} color="#ccc" />
                  </TouchableOpacity>
                );
              })
          }
        </ScrollView>
      </Animated.View>

      <Modal visible={modalCorVisivel} transparent animationType="fade" onRequestClose={() => setModalCorVisivel(false)}>
        <TouchableOpacity style={local.modalOverlay} activeOpacity={1} onPress={() => setModalCorVisivel(false)}>
          <View style={local.modalBox}>
            <Text style={local.modalTitulo}>Cor da corrida</Text>
            <View style={local.paletaGrid}>
              {PALETA_CORES.map((cor) => (
                <TouchableOpacity key={cor} style={[local.paletaItem, { backgroundColor: cor }, corridaSel?.corOriginal === cor && local.paletaItemSel]}
                  onPress={() => salvarCorCorrida(cor)} disabled={salvandoCor} />
              ))}
            </View>
            {salvandoCor && <Text style={local.salvando}>Salvando...</Text>}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  menuBtn:      { position: "absolute", top: 52, left: 18, zIndex: 20 },
  ofensivaWrap: { position: "absolute", top: 50, right: 18, zIndex: 20 },
  toggleWrap:   { position: "absolute", top: 95, width: "100%", alignItems: "center", zIndex: 20 },
  toggleContainer: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 18, height: 52, padding: 4, position: "relative", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  togglePill:      { position: "absolute", top: 4, bottom: 4, backgroundColor: CORES.primario, borderRadius: 14 },
  toggleBtn:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 2 },
  toggleTxt:       { fontSize: 15, fontWeight: "700", color: CORES.cinza },
  toggleTxtActive: { color: CORES.branco },
  legendaWrap:  { position: "absolute", top: 158, alignSelf: "center", flexDirection: "row", gap: 12, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, zIndex: 19 },
  legendaItem:  { flexDirection: "row", alignItems: "center", gap: 5 },
  legendaDot:   { width: 10, height: 10, borderRadius: 5 },
  legendaTxt:   { fontSize: 11, fontWeight: "600", color: "#444" },
  rankingCard:  { position: "absolute", left: 16, right: 16, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 20, padding: 14, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6, zIndex: 20 },
  rankingTitulo:{ fontSize: 13, fontWeight: "800", color: CORES.primario, marginBottom: 10 },
  rankingRow:   { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  rankingPos:   { fontSize: 12, fontWeight: "700", color: CORES.cinza, width: 28 },
  rankingDot:   { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  rankingNome:  { flex: 1, fontSize: 13, fontWeight: "700", color: "#222" },
  rankingTotal: { fontSize: 12, color: "#888", fontWeight: "600" },
  btnCentralizar: { position: "absolute", right: 16, width: 54, height: 54, borderRadius: 27, backgroundColor: CORES.branco, alignItems: "center", justifyContent: "center", zIndex: 20, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  userMarkerWrap: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  userArrow:    { position: "absolute", top: 0, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 12, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: CORES.primario, opacity: 0.85 },
  userDot:      { width: 14, height: 14, borderRadius: 7, backgroundColor: CORES.primario, borderWidth: 3, borderColor: CORES.branco, marginTop: 6 },
  avatarMarkerWrap:        { width: 38, height: 38, borderRadius: 19, overflow: "hidden", backgroundColor: CORES.branco, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  avatarMarkerImg:         { width: "100%", height: "100%" },
  avatarMarkerPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarMarkerLetra:       { color: CORES.branco, fontWeight: "800", fontSize: 16 },
  card:       { position: "absolute", left: 16, right: 16, backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 28, padding: 20, zIndex: 30, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  cardClose:  { position: "absolute", top: 16, right: 16, zIndex: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar:     { width: 54, height: 54, borderRadius: 27, marginRight: 14 },
  cardNome:   { fontSize: 22, fontWeight: "800", color: "#111" },
  cardSub:    { fontSize: 13, color: CORES.cinza, marginTop: 4 },
  badge:      { flexDirection: "row", alignItems: "center", marginTop: 5 },
  badgeDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  badgeTxt:   { fontSize: 12, fontWeight: "700" },
  metrics:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  metricBox:  { alignItems: "center", flex: 1 },
  metricV:    { fontSize: 22, fontWeight: "800", color: "#111" },
  metricL:    { marginTop: 4, fontSize: 12, color: "#888" },
  historicoWrap:   { backgroundColor: CORES.fundo, borderRadius: 12, padding: 10, marginBottom: 12 },
  historicoTitulo: { fontSize: 11, fontWeight: "700", color: CORES.cinza, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  historicoItem:   { flexDirection: "row", alignItems: "center", marginRight: 12, backgroundColor: CORES.branco, borderRadius: 8, padding: 6 },
  historicoDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  historicoNome:   { fontSize: 12, fontWeight: "600", color: "#333" },
  botoesRow:  { flexDirection: "row", alignItems: "center" },
  btnAcao:    { height: 52, borderRadius: 14, backgroundColor: CORES.primario, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  btnAcaoTxt: { color: CORES.branco, fontSize: 15, fontWeight: "700" },
  btnCor:     { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  painel:     { position: "absolute", left: 0, right: 0, backgroundColor: CORES.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 20, zIndex: 25, overflow: "hidden" },
  painelMapa:         { height: 160, width: "100%", backgroundColor: "#e8f0fe" },
  painelMapaBadge:    { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(44,63,105,0.85)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  painelMapaBadgeTxt: { color: CORES.branco, fontSize: 12, fontWeight: "700" },
  painelLista:        { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  painelVazio:        { textAlign: "center", color: "#aaa", marginTop: 20, fontSize: 14 },
  corridaItem:      { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: CORES.borda },
  corridaItemDot:   { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  corridaItemData:  { fontSize: 14, fontWeight: "700", color: "#111" },
  corridaItemInfo:  { fontSize: 12, color: "#888", marginTop: 2 },
  corridaCapturada: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  modalBox:     { backgroundColor: CORES.branco, borderRadius: 24, padding: 24, width: 300, alignItems: "center" },
  modalTitulo:  { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 20 },
  paletaGrid:   { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  paletaItem:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "transparent" },
  paletaItemSel:{ borderColor: "#111", transform: [{ scale: 1.18 }] },
  salvando:     { marginTop: 16, fontSize: 13, color: "#888" },
});