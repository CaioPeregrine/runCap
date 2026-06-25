import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import {
    addDoc, collection, doc, getDoc,
    serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Feather from "@expo/vector-icons/Feather";
import { db } from "../../firebase/firebaseConfig";
import { useConquistas } from "../hooks/useConquistas";
import {
    resetarPontosNarrados,
    setPontoDetectadoCallback,
    startAudioGuide,
    stopAudioGuide,
} from "../services/audioGuideService";
import styles from "./styles";

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
        const sequenciaQuebrada: boolean = data.sequenciaQuebrada ?? false;
        const sequenciaAtual: number = data.sequenciaAtual ?? 0;
        const novaSequencia = correuOntem && !sequenciaQuebrada ? sequenciaAtual + 1 : 1;
        const maiorSequencia: number = data.maiorSequencia ?? 0;
        const novaMaior = Math.max(maiorSequencia, novaSequencia);
        await updateDoc(uRef, {
            diasCorridos: [...diasCorridos, hoje],
            sequenciaAtual: novaSequencia,
            maiorSequencia: novaMaior,
            sequenciaQuebrada: false,
        });
    } catch (e) {
        console.error("Erro ao atualizar sequência:", e);
    }
}

async function resetSequenciaAbandonada(uid: string) {
    try {
        const uRef = doc(db, "usuarios", uid);
        const uSnap = await getDoc(uRef);
        const data = uSnap.data();
        if (!data) return;
        const hoje = dataHoje();
        const diasCorridos: string[] = data.diasCorridos ?? [];
        if (diasCorridos.includes(hoje)) return;
        await updateDoc(uRef, {
            sequenciaAtual: 0,
            sequenciaQuebrada: true,
        });
    } catch (e) {
        console.error("Erro ao resetar sequência por abandono:", e);
    }
}

export default function Correndo() {
    const { verificarConquistasPorNivel } = useConquistas();
    const params = useLocalSearchParams();

    const parsedPontoLat = params.pontoLat ? parseFloat(params.pontoLat as string) : Number.NaN;
    const parsedPontoLng = params.pontoLng ? parseFloat(params.pontoLng as string) : Number.NaN;
    const pontoDestino: Coord | null =
        Number.isFinite(parsedPontoLat) && Number.isFinite(parsedPontoLng)
            ? { latitude: parsedPontoLat, longitude: parsedPontoLng }
            : null;
    const pontoNome = (params.pontoNome as string) ?? "";

    const rotaGuia: Coord[] = params.rotaEncodada
        ? JSON.parse(params.rotaEncodada as string)
        : [];
    const rotaGuiaValid = rotaGuia.filter(
        (c): c is Coord => c != null && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
    );

    const corridaCapturarId   = (params.corridaCapturarId as string)   ?? null;
    const corridaCapturarNome = (params.corridaCapturarNome as string) ?? "";
    const corridaCapturarCor  = (params.corridaCapturarCor as string)  ?? "#FFD700";
    const modoRecuperar       = params.modoRecuperar === "true";

    const rotaCapturar: Coord[] = params.corridaCapturarRota
        ? JSON.parse(params.corridaCapturarRota as string)
        : [];
    const rotaCapturarValid = rotaCapturar.filter(
        (c): c is Coord => c != null && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
    );

    const corTracejadoCaptura = modoRecuperar ? "#FF3B30" : "#FFD700";

    const [filteredLocation, setFilteredLocation] = useState<any>(null);
    const [routeCoords, setRouteCoords]           = useState<Coord[]>([]);
    const [status, setStatus]                     = useState<RunStatus>("running");
    const [elapsedSeconds, setElapsedSeconds]     = useState(0);
    const [distanceMeters, setDistanceMeters]     = useState(0);
    const [saving, setSaving]                     = useState(false);
    const [distRestante, setDistRestante]         = useState<number | null>(null);
    const [smoothHeading, setSmoothHeading]       = useState(0);
    const [pontoAtivo, setPontoAtivo]             = useState<string | null>(null);

    const mapRef               = useRef<MapView>(null);
    const timerRef             = useRef<ReturnType<typeof setInterval> | null>(null);
    const statusRef            = useRef<RunStatus>("running");
    const corridaFinalizadaRef = useRef(false);
    const distanceRef          = useRef(0);
    const smoothHeadingRef     = useRef(0);

    statusRef.current = status;

    useEffect(() => {
        setPontoDetectadoCallback((nome) => {
            setPontoAtivo(nome);
            setTimeout(() => setPontoAtivo(null), 8000);
        });
        startAudioGuide().catch((e) => console.warn("[Correndo] AudioGuide:", e));
        return () => { stopAudioGuide().catch(() => {}); };
    }, []);

    useEffect(() => {
        timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    useEffect(() => {
        (async () => {
            const { status: perm } = await Location.requestForegroundPermissionsAsync();
            if (perm === "granted") {
                const pos = await Location.getCurrentPositionAsync({});
                setFilteredLocation(pos);
                if (rotaCapturarValid.length > 1) {
                    setTimeout(() => {
                        mapRef.current?.fitToCoordinates(
                            [{ latitude: pos.coords.latitude, longitude: pos.coords.longitude }, ...rotaCapturarValid],
                            { edgePadding: { top: 80, right: 60, bottom: 260, left: 60 }, animated: true }
                        );
                    }, 600);
                }
            }
        })();
    }, []);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        (async () => {
            subscription = await Location.watchHeadingAsync((headingData) => {
                const graus = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
                const diff = graus - smoothHeadingRef.current;
                const shortestDiff = ((diff + 540) % 360) - 180;
                const novoHeading = smoothHeadingRef.current + shortestDiff * 0.15;
                smoothHeadingRef.current = novoHeading;
                setSmoothHeading(novoHeading);
                mapRef.current?.animateCamera({ heading: novoHeading, pitch: 60 });
            });
        })();
        return () => subscription?.remove();
    }, []);

    useEffect(() => {
        Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
            (response) => {
                if (!filteredLocation || haversineDistance(response.coords, filteredLocation.coords) >= 2) {
                    setFilteredLocation(response);
                    mapRef.current?.animateCamera({ center: response.coords, pitch: 60 });
                }
                if (statusRef.current === "running") {
                    const newCoord: Coord = { latitude: response.coords.latitude, longitude: response.coords.longitude };
                    if (pontoDestino) setDistRestante(haversineDistance(newCoord, pontoDestino));
                    setRouteCoords((prev) => {
                        if (prev.length > 0) {
                            const extra = haversineDistance(prev[prev.length - 1], newCoord);
                            if (extra > 2) {
                                const novaDistancia = distanceRef.current + extra;
                                distanceRef.current = novaDistancia;
                                setDistanceMeters(novaDistancia);
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

    useEffect(() => {
        return () => {
            const uid = getAuth().currentUser?.uid;
            if (!uid) return;
            if (!corridaFinalizadaRef.current) {
                resetSequenciaAbandonada(uid);
            }
        };
    }, []);

    function handlePauseResume() {
        if (status === "running") {
            setStatus("paused");
            stopAudioGuide();
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        } else {
            setStatus("running");
            resetarPontosNarrados();
            startAudioGuide();
            timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        }
    }

    async function handleFinish() {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        await stopAudioGuide();
        setSaving(true);
        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) { Alert.alert("Erro", "Usuário não autenticado."); return; }

            const userSnap = await getDoc(doc(db, "usuarios", uid));
            const userData = userSnap.data();
            const nomeUsuario = userData?.nome || "Corredor";
            const corUsuario  = userData?.corRota || "#1a58e9";

            const pace = calcPace(distanceMeters, elapsedSeconds);

            await addDoc(collection(db, "corridas"), {
                uid,
                distancia_m:     distanceMeters,
                distancia_km:    parseFloat((distanceMeters / 1000).toFixed(3)),
                duracao_min:     Math.floor(elapsedSeconds / 60),
                tempo_s:         elapsedSeconds,
                tempo_formatado: formatTime(elapsedSeconds),
                pace,
                rota:            routeCoords,
                criadoEm:        serverTimestamp(),
            });

            if (corridaCapturarId) {
                const corridaRef = doc(db, "corridas", corridaCapturarId);
                const corridaSnap = await getDoc(corridaRef);
                const corridaData = corridaSnap.data();
                const historicoAtual = corridaData?.historicoCaptura ?? [];
                await updateDoc(corridaRef, {
                    capturadaPor:     uid,
                    capturadaPorNome: nomeUsuario,
                    capturadaPorCor:  corUsuario,
                    historicoCaptura: [
                        ...historicoAtual,
                        { uid, nome: nomeUsuario, cor: corUsuario, data: new Date().toISOString() },
                    ],
                });
            }

            await atualizarSequencia(uid);
            corridaFinalizadaRef.current = true;

            const nivelAtual = userData?.nivel ?? 1;
            await verificarConquistasPorNivel(uid, nivelAtual);

            router.replace({
                pathname: "./corridaConcluida",
                params: {
                    distancia_km:    (distanceMeters / 1000).toFixed(2),
                    tempo_formatado: formatTime(elapsedSeconds),
                    pace,
                    rota:            JSON.stringify(routeCoords),
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

            <Text style={[styles.statusText, { top: 40, right: 0, zIndex: 10, alignItems: "center", fontSize: 18, fontWeight: "600", color: "#000000" }]}>
                {status === "running" ? " Correndo…" : " Pausado"}
            </Text>

            {corridaCapturarId && (
                <View style={{
                    position: "absolute", top: 36, alignSelf: "center", zIndex: 15,
                    backgroundColor: modoRecuperar ? "#FF3B30" : "#FFD700",
                    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
                    flexDirection: "row", alignItems: "center", gap: 6,
                }}>
                    <Feather name={modoRecuperar ? "refresh-cw" : "flag"} size={13} color={modoRecuperar ? "#fff" : "#2C3F69"} />
                    <Text style={{ color: modoRecuperar ? "#fff" : "#2C3F69", fontWeight: "700", fontSize: 12 }}>
                        {modoRecuperar ? `Recuperando: ${corridaCapturarNome}` : `Capturando: ${corridaCapturarNome}`}
                    </Text>
                </View>
            )}

            {filteredLocation && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    rotateEnabled
                    pitchEnabled
                    initialRegion={{
                        latitude:  filteredLocation.coords.latitude,
                        longitude: filteredLocation.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }}
                >
                    <Marker
                        coordinate={{ latitude: filteredLocation.coords.latitude, longitude: filteredLocation.coords.longitude }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                        rotation={smoothHeading}
                        image={require("../../assets/images/NavegadorDaTelaHome.png")}
                    />

                    {routeCoords.length > 1 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor="#1a58e9"
                            strokeWidth={15}
                        />
                    )}

                    {rotaGuiaValid.length > 1 && !corridaCapturarId && (
                        <Polyline
                            coordinates={rotaGuiaValid}
                            strokeColor="#22C3A3"
                            strokeWidth={12}
                            lineDashPattern={[12, 6]}
                        />
                    )}

                    {rotaCapturarValid.length > 1 && (
                        <Polyline
                            coordinates={rotaCapturarValid}
                            strokeColor={corTracejadoCaptura}
                            strokeWidth={10}
                            lineDashPattern={[14, 7]}
                        />
                    )}

                    {pontoDestino && !corridaCapturarId && (
                        <Marker coordinate={pontoDestino} title={pontoNome} pinColor="#22C3A3" />
                    )}
                </MapView>
            )}

            <View style={[styles.panel, { backgroundColor: "#D4F5E9" }]}>

                {pontoDestino && distRestante !== null && !corridaCapturarId && (
                    <View style={{ backgroundColor: "#A8EDD4", borderRadius: 10, padding: 8, marginBottom: 8, alignItems: "center" }}>
                        <Text style={{ color: "#0F6E56", fontWeight: "600", fontSize: 13 }}>
                            📍 {distRestante < 1000
                                ? `${Math.round(distRestante)}m até ${pontoNome}`
                                : `${(distRestante / 1000).toFixed(1)}km até ${pontoNome}`}
                        </Text>
                    </View>
                )}

                {pontoAtivo && (
                    <View style={{
                        backgroundColor: "#1a58e9", borderRadius: 12, padding: 12,
                        marginBottom: 10, marginHorizontal: 4, flexDirection: "row", alignItems: "center", gap: 8,
                    }}>
                        <Text style={{ fontSize: 20 }}>🗺️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: "#fff", fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Ponto turístico
                            </Text>
                            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>{pontoAtivo}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setPontoAtivo(null)}>
                            <Feather name="x" size={18} color="#fff" />
                        </TouchableOpacity>
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
                        <Text style={styles.btnText}>{status === "running" ? "  Pausar" : "  Retomar"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnFinish]} onPress={handleFinish} disabled={saving}>
                        <Text style={styles.btnText}>{saving ? "Salvando…" : "  Finalizar"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}