import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";

// ─── COLOQUE SUA CHAVE AQUI ───────────────────────────────────────────────────
const GOOGLE_API_KEY = "AIzaSyCcxDWR-vpgSatfKW-2JW_71zWS55OcrRw";
// ─────────────────────────────────────────────────────────────────────────────

type Coord = { latitude: number; longitude: number };

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

function tempoEstimado(metros: number): string {
    const min = Math.round((metros / 1000) * 6);
    if (min < 60) return `~${min} min`;
    return `~${Math.floor(min / 60)}h ${min % 60}min`;
}

function formatDist(metros: number): string {
    return metros < 1000
        ? `${Math.round(metros)} m`
        : `${(metros / 1000).toFixed(1)} km`;
}

// Decodifica o polyline encodado da Google Directions API
function decodePolyline(encoded: string): Coord[] {
    const coords: Coord[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let shift = 0, result = 0, byte: number;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;
        coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coords;
}

async function buscarRota(origem: Coord, destino: Coord): Promise<{ pontos: Coord[]; distanciaMetros: number }> {
    const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origem.latitude},${origem.longitude}` +
        `&destination=${destino.latitude},${destino.longitude}` +
        `&mode=walking` +
        `&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.routes.length) {
        console.warn("Directions API status:", data.status);
        return {
            pontos: [origem, destino],
            distanciaMetros: haversineDistance(origem, destino),
        };
    }

    const pontos = decodePolyline(data.routes[0].overview_polyline.points);
    const distanciaMetros = data.routes[0].legs[0].distance.value;
    return { pontos, distanciaMetros };
}

export default function MapaPonto() {
    const { nome, descricao, latitude, longitude } = useLocalSearchParams<{
        nome: string; descricao: string; latitude: string; longitude: string;
    }>();

    const destino: Coord = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

    const [user, setUser] = useState<Coord | null>(null);
    const [rota, setRota] = useState<Coord[]>([]);
    const [distRua, setDistRua] = useState<number | null>(null);
    const [carregando, setCarregando] = useState(true);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const pos = await Location.getCurrentPositionAsync({});
            const coord: Coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setUser(coord);

            try {
                const { pontos, distanciaMetros } = await buscarRota(coord, destino);
                setRota(pontos);
                setDistRua(distanciaMetros);
            } catch (e) {
                console.warn("Erro rota:", e);
                setRota([coord, destino]);
                setDistRua(haversineDistance(coord, destino));
            } finally {
                setCarregando(false);
            }

            // Centraliza para mostrar rota inteira
            setTimeout(() => {
                mapRef.current?.fitToCoordinates([coord, destino], {
                    edgePadding: { top: 80, right: 60, bottom: 260, left: 60 },
                    animated: true,
                });
            }, 400);

            // Atualiza posição e rota a cada 50m
            Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 50 },
                async (r) => {
                    const c: Coord = { latitude: r.coords.latitude, longitude: r.coords.longitude };
                    setUser(c);
                    try {
                        const { pontos, distanciaMetros } = await buscarRota(c, destino);
                        setRota(pontos);
                        setDistRua(distanciaMetros);
                    } catch (_) { }
                }
            );
        })();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.back}>
                <Feather name="arrow-left" size={26} color="#1a1a1a" />
            </TouchableOpacity>

            <MapView ref={mapRef} style={{ flex: 1 }}>
                {user && <Marker coordinate={user} pinColor="blue" title="Você" />}
                <Marker coordinate={destino} pinColor="#22C3A3" title={nome} />
                {rota.length > 1 && (
                    <Polyline
                        coordinates={rota}
                        strokeColor="#22C3A3"
                        strokeWidth={5}
                    />
                )}
            </MapView>

            <View style={s.sheet}>
                {carregando ? (
                    <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <ActivityIndicator color="#22C3A3" size="large" />
                        <Text style={{ color: "#888", marginTop: 8 }}>Calculando rota...</Text>
                    </View>
                ) : (
                    <>
                        {distRua !== null && (
                            <View style={s.badge}>
                                <Text style={s.badgeTxt}>{formatDist(distRua)} pela rua</Text>
                            </View>
                        )}

                        <Text style={s.nome}>{nome}</Text>
                        {!!descricao && <Text style={s.desc}>{descricao}</Text>}

                        {distRua !== null && (
                            <View style={s.metricas}>
                                <View style={s.metrica}>
                                    <Text style={s.mVal}>{formatDist(distRua)}</Text>
                                    <Text style={s.mLbl}>pela rua</Text>
                                </View>
                                <View style={s.divisor} />
                                <View style={s.metrica}>
                                    <Text style={s.mVal}>{tempoEstimado(distRua)}</Text>
                                    <Text style={s.mLbl}>tempo estimado</Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={s.botao}
                            onPress={() =>
                                router.push({
                                    pathname: "/telaCorrendo",
                                    params: {
                                        pontoLat: destino.latitude.toString(),
                                        pontoLng: destino.longitude.toString(),
                                        pontoNome: nome,
                                        // Passa a rota encodada para a tela correndo desenhar
                                        rotaEncodada: JSON.stringify(rota),
                                    },
                                } as any)
                            }
                        >
                            <Feather name="play" size={18} color="#fff" />
                            <Text style={s.botaoTxt}>Correr até aqui</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    back: {
        position: "absolute", top: 52, left: 16, zIndex: 10,
        backgroundColor: "#fff", borderRadius: 20, padding: 8,
        elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8,
    },
    sheet: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 44,
        elevation: 10, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16,
    },
    badge: {
        backgroundColor: "#E1F5EE", borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 4,
        alignSelf: "flex-start", marginBottom: 10,
    },
    badgeTxt: { fontSize: 13, color: "#0F6E56", fontWeight: "500" },
    nome: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4 },
    desc: { fontSize: 14, color: "#666", marginBottom: 16 },
    metricas: {
        flexDirection: "row", backgroundColor: "#f5f5f5",
        borderRadius: 16, padding: 14, marginBottom: 18, alignItems: "center",
    },
    metrica: { flex: 1, alignItems: "center" },
    mVal: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },
    mLbl: { fontSize: 12, color: "#888", marginTop: 2 },
    divisor: { width: 1, height: 36, backgroundColor: "#ddd" },
    botao: {
        backgroundColor: "#22C3A3", borderRadius: 16, paddingVertical: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    },
    botaoTxt: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
