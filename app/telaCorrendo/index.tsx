import Feather from '@expo/vector-icons/Feather';
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import {
    addDoc,
    collection,
    doc, getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { db } from "../../firebase/firebaseConfig";
import styles from "./styles";
import { useConquistas } from "../hooks/useConquistas";

const API_URL = "runcapapi-production.up.railway.app";

const { verificarConquistas } = useConquistas();

type Coord = { latitude: number; longitude: number };
type RunStatus = "running" | "paused";

function haversineDistance(a: Coord, b: Coord): number {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function calcPace(distM: number, seconds: number): string {
    if (distM < 10) return "--:-- /km";
    const secPerKm = seconds / (distM / 1000);
    const pm = Math.floor(secPerKm / 60);
    const ps = Math.floor(secPerKm % 60).toString().padStart(2, "0");
    return `${pm}:${ps} /km`;
}

function dataHoje(): string {
    return new Date().toISOString().split("T")[0];
}

async function atualizarSequencia(uid: string) {
    try {
        const uRef = doc(db, "usuarios", uid);
        const uSnap = await getDoc(uRef);
        const data = uSnap.data();
        if (!data) return;

        const hoje = dataHoje();
        const diasCorridos: string[] = data.diasCorridos ?? [];
        if (diasCorridos.includes(hoje)) return;

        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = ontem.toISOString().split("T")[0];
        const correuOntem = diasCorridos.includes(ontemStr);

        const sequenciaAtual: number = data.sequenciaAtual ?? 0;
        const novaSequencia = correuOntem ? sequenciaAtual + 1 : 1;
        const maiorSequencia: number = data.maiorSequencia ?? 0;
        const novaMaior = Math.max(maiorSequencia, novaSequencia);

        await updateDoc(uRef, {
            diasCorridos: [...diasCorridos, hoje],
            sequenciaAtual: novaSequencia,
            maiorSequencia: novaMaior,
        });
    } catch (e) {
        console.error("Erro ao atualizar sequência:", e);
    }
}

export default function Correndo() {
    // ── Params recebidos do mapaPonto ────────────────────────────────────────
    const params = useLocalSearchParams();

    const pontoDestino: Coord | null = params.pontoLat
        ? { latitude: parseFloat(params.pontoLat as string), longitude: parseFloat(params.pontoLng as string) }
        : null;
    const pontoNome = (params.pontoNome as string) ?? "";

    const rotaGuia: Coord[] = params.rotaEncodada
        ? JSON.parse(params.rotaEncodada as string)
        : [];

    // ── Estados da corrida ───────────────────────────────────────────────────
    const [location, setLocation] = useState<any>(null);
    const [filteredLocation, setFilteredLocation] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
    const [status, setStatus] = useState<RunStatus>("running");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [saving, setSaving] = useState(false);
    const [distRestante, setDistRestante] = useState<number | null>(null);

    // ── Heading suavizado tipo Uber ──────────────────────────────────────────
    const [smoothHeading, setSmoothHeading] = useState(0);
    const smoothHeadingRef = useRef(0);

    // IA
    const [iaMsg, setIaMsg] = useState<string>("");
    const [iaLoading, setIaLoading] = useState(false);

    const mapRef = useRef<MapView>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const statusRef = useRef<RunStatus>("running");
    const distanceRef = useRef(0);
    const lastNarratedKm = useRef(0);

    statusRef.current = status;

    async function narrarPonto(coord: Coord, distanciaAtualM: number) {
        try {
            setIaLoading(true);
            let nomePonto = "Manaus";
            try {
                const [geo] = await Location.reverseGeocodeAsync(coord);
                nomePonto = geo?.street || geo?.district || geo?.city || "Manaus";
            } catch (_) { }

            const response = await fetch(`${API_URL}/narrar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ponto: nomePonto,
                    distancia: (distanciaAtualM / 1000).toFixed(2),
                }),
            });
            const data = await response.json();
            setIaMsg(data.mensagem ?? "Continue assim! 💪");
        } catch (e) {
            console.warn("Erro ao narrar:", e);
        } finally {
            setIaLoading(false);
        }
    }

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Posição inicial
    useEffect(() => {
        (async () => {
            const { status: perm } = await Location.requestForegroundPermissionsAsync();
            if (perm === "granted") {
                const pos = await Location.getCurrentPositionAsync({});
                setLocation(pos);
                setFilteredLocation(pos);
            }
        })();
    }, []);

    // ── Bússola com interpolação suave tipo Uber ─────────────────────────────
    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        (async () => {
            subscription = await Location.watchHeadingAsync((headingData) => {
                const graus = headingData.trueHeading >= 0
                    ? headingData.trueHeading
                    : headingData.magHeading;

                // Pega o caminho mais curto entre os ângulos (ex: 350° → 10° = +20°, não -340°)
                const diff = graus - smoothHeadingRef.current;
                const shortestDiff = ((diff + 540) % 360) - 180;

                // Interpola 15% da diferença por update — movimento fluido e gradual
                const novoHeading = smoothHeadingRef.current + shortestDiff * 0.15;

                smoothHeadingRef.current = novoHeading;
                setSmoothHeading(novoHeading);

                mapRef.current?.animateCamera({ heading: novoHeading, pitch: 60 });
            });
        })();
        return () => subscription?.remove();
    }, []);

    // Rastreamento GPS
    useEffect(() => {
        Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
            (response) => {
                setLocation(response);

                if (!filteredLocation ||
                    haversineDistance(response.coords, filteredLocation.coords) >= 2) {
                    setFilteredLocation(response);
                    mapRef.current?.animateCamera({ center: response.coords, pitch: 60 });
                }

                if (statusRef.current === "running") {
                    const newCoord: Coord = {
                        latitude: response.coords.latitude,
                        longitude: response.coords.longitude,
                    };

                    if (pontoDestino) {
                        setDistRestante(haversineDistance(newCoord, pontoDestino));
                    }

                    setRouteCoords((prev) => {
                        if (prev.length > 0) {
                            const extra = haversineDistance(prev[prev.length - 1], newCoord);
                            if (extra > 2) {
                                const novaDistancia = distanceRef.current + extra;
                                distanceRef.current = novaDistancia;
                                setDistanceMeters(novaDistancia);

                                const kmAtual = Math.floor(novaDistancia / 1000);
                                if (kmAtual > lastNarratedKm.current) {
                                    lastNarratedKm.current = kmAtual;
                                    narrarPonto(newCoord, novaDistancia);
                                }

                                return [...prev, newCoord];
                            }
                            return prev;
                        }
                        distanceRef.current = 0;
                        return [newCoord];
                    });
                }
            }
        );
    }, []);

    function handlePauseResume() {
        if (status === "running") {
            setStatus("paused");
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        } else {
            setStatus("running");
            timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        }
    }

async function handleFinish() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setSaving(true);
    try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) { Alert.alert("Erro", "Usuário não autenticado."); return; }

        const pace = calcPace(distanceMeters, elapsedSeconds);

        await addDoc(collection(db, "corridas"), {
            uid,
            distancia_m: distanceMeters,
            distancia_km: parseFloat((distanceMeters / 1000).toFixed(3)),
            duracao_min: Math.floor(elapsedSeconds / 60),
            tempo_s: elapsedSeconds,
            tempo_formatado: formatTime(elapsedSeconds),
            pace,
            rota: routeCoords,
            criadoEm: serverTimestamp(),
        });

        await atualizarSequencia(uid);

        // ✅ LINHA NOVA — verifica e desbloqueia conquistas
        await verificarConquistas(uid, {
            distancia_km: distanceMeters / 1000,
            pace,
            rotaFechada: false,    // deixe false por enquanto
            pontosVisitados: [],   // deixe vazio por enquanto
        });

        router.replace({
            pathname: "./corridaConcluida",
            params: {
                distancia_km: (distanceMeters / 1000).toFixed(2),
                tempo_formatado: formatTime(elapsedSeconds),
                pace,
                rota: JSON.stringify(routeCoords),
            },
        });
    } catch (e) {
        Alert.alert("Erro ao salvar", String(e));
    } finally {
        setSaving(false);
    }
}

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={{ position: "absolute", top: 50, left: 15, zIndex: 10 }}
            >
                <Feather name="arrow-left" size={30} color="black" />
            </TouchableOpacity>

            <Text style={[styles.statusText, { top: 50, right: 0, zIndex: 10, alignItems: "center", fontSize: 18, fontWeight: "600", color: "#000000" }]}>
                {status === "running" ? " Correndo…" : "⏸ Pausado"}
            </Text>

            {filteredLocation && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    rotateEnabled
                    pitchEnabled
                    initialRegion={{
                        latitude: filteredLocation.coords.latitude,
                        longitude: filteredLocation.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }}
                >
                    {/* Marcador do usuário com heading suavizado tipo Uber */}
                    <Marker
                        coordinate={{
                            latitude: filteredLocation.coords.latitude,
                            longitude: filteredLocation.coords.longitude,
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                        rotation={smoothHeading}
                        image={require("../../assets/images/NavegadorDaTelaHome.png")}
                    />

                    {/* Rastro do percurso já feito (azul) */}
                    {routeCoords.length > 1 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor="#1a58e9"
                            strokeWidth={15}
                        />
                    )}

                    {/* Traçado guia pelas ruas até o destino (verde) */}
                    {rotaGuia.length > 1 && (
                        <Polyline
                            coordinates={rotaGuia}
                            strokeColor="#22C3A3"
                            strokeWidth={12}
                            lineDashPattern={[12, 6]}
                        />
                    )}

                    {/* Marcador do ponto turístico de destino */}
                    {pontoDestino && (
                        <Marker
                            coordinate={pontoDestino}
                            title={pontoNome}
                            pinColor="#22C3A3"
                        />
                    )}
                </MapView>
            )}

            <View style={styles.panel}>
                {/* Distância restante até o destino */}
                {pontoDestino && distRestante !== null && (
                    <View style={{
                        backgroundColor: "#E1F5EE", borderRadius: 10,
                        padding: 8, marginBottom: 8, alignItems: "center",
                    }}>
                        <Text style={{ color: "#0F6E56", fontWeight: "600", fontSize: 13 }}>
                            📍 {distRestante < 1000
                                ? `${Math.round(distRestante)}m até ${pontoNome}`
                                : `${(distRestante / 1000).toFixed(1)}km até ${pontoNome}`}
                        </Text>
                    </View>
                )}

                {/* Balão da IA */}
                {(iaMsg || iaLoading) && (
                    <View style={{
                        backgroundColor: "#1a58e9", borderRadius: 12,
                        padding: 12, marginBottom: 10, marginHorizontal: 4,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 13, fontStyle: "italic" }}>
                            {iaLoading ? "🤖 Gerando mensagem..." : `🤖 ${iaMsg}`}
                        </Text>
                    </View>
                )}

                <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                        <Text style={styles.metricValue}>{(distanceMeters / 1000).toFixed(2)}</Text>
                        <Text style={styles.metricLabel}>km</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricValue}>{formatTime(elapsedSeconds)}</Text>
                        <Text style={styles.metricLabel}>tempo</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricValue}>{calcPace(distanceMeters, elapsedSeconds)}</Text>
                        <Text style={styles.metricLabel}>pace</Text>
                    </View>
                </View>

                <View style={styles.buttonsRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnPause]} onPress={handlePauseResume}>
                        <Text style={styles.btnText}>{status === "running" ? "⏸  Pausar" : "▶  Retomar"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnFinish]} onPress={handleFinish} disabled={saving}>
                        <Text style={styles.btnText}>{saving ? "Salvando…" : "⏹  Finalizar"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
