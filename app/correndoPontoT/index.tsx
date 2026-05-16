import Feather from "@expo/vector-icons/Feather";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import s from "./styles";

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

    const latDestino = latitude ? parseFloat(latitude) : Number.NaN;
    const lngDestino = longitude ? parseFloat(longitude) : Number.NaN;
    const destino: Coord | null = Number.isFinite(latDestino) && Number.isFinite(lngDestino)
        ? { latitude: latDestino, longitude: lngDestino }
        : null;

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

            if (!destino) {
                console.warn("Destino inválido: latitude ou longitude ausentes");
                setCarregando(false);
                return;
            }

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

            if (destino) {
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
            }

        })();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={s.back}>
                <Feather name="arrow-left" size={26} color="#1a1a1a" />
            </TouchableOpacity>

            <MapView ref={mapRef} style={{ flex: 1 }}>
                {user && (
                    <Marker
                        coordinate={user}
                        title="Você"
                        image={require("../../assets/images/NavegadorDaTelaHome.png")}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                    />
                )}
                {destino && <Marker coordinate={destino} pinColor="#22C3A3" title={nome} />}
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
                                <Text style={s.badgeTxt}>{formatDist(distRua)} até ao {nome}
                                    
                                </Text>
                            </View>
                        )}

                        <Text style={s.nome}>{nome}</Text>
                        {!!descricao && <Text style={s.desc}>{descricao}</Text>}

                        {distRua !== null && (
                            <View style={s.metricas}>
                                <View style={s.metrica}>
                                    <Text style={s.mVal}>{formatDist(distRua)}</Text>
                                    <Text style={s.mLbl}>DISTÂNCIA</Text>
                                </View>
                                <View style={s.divisor} />
                                <View style={s.metrica}>
                                    <Text style={s.mVal}>{tempoEstimado(distRua)}</Text>
                                    <Text style={s.mLbl}>TEMPO ESTIMADO</Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[s.botao, !destino && { opacity: 0.5 }]}
                            onPress={() => {
                                if (!destino) return;
                                router.push({
                                    pathname: "/telaCorrendo",
                                    params: {
                                        pontoLat: destino.latitude.toString(),
                                        pontoLng: destino.longitude.toString(),
                                        pontoNome: nome,
                                        rotaEncodada: JSON.stringify(rota),
                                    },
                                } as any);
                            }}
                            disabled={!destino}
                        >
                            <Feather name="play" size={18} color="#fff" />
                            <Text style={s.botaoTxt}>Correr até aqui</Text>
                        </TouchableOpacity>
                        {!destino && (
                            <Text style={{ color: "#ff4d4f", textAlign: "center", marginTop: 10 }}>
                                Coordenadas do destino inválidas. Tente selecionar outra rota.
                            </Text>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}