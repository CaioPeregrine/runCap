import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { db } from "../../firebase/firebaseConfig";

import {
  collection, addDoc, serverTimestamp,
  doc, getDoc, updateDoc,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";
import { router } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import styles from "./styles";


//  PASSO 1: coloque o IP da sua máquina na rede local
// Android físico → IP do seu PC (ex: 192.168.1.100)
// Emulador Android → 10.0.2.2
// iOS Simulator → localhost
const API_URL = "runcapapi-production.up.railway.app"; // ← TROQUE pelo seu IP


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
    const uRef  = doc(db, "usuarios", uid);
    const uSnap = await getDoc(uRef);
    const data  = uSnap.data();
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
      diasCorridos:   [...diasCorridos, hoje],
      sequenciaAtual: novaSequencia,
      maiorSequencia: novaMaior,
    });
  } catch (e) {
    console.error("Erro ao atualizar sequência:", e);
  }
}

export default function Correndo() {
  const [location, setLocation]             = useState<any>(null);
  const [routeCoords, setRouteCoords]       = useState<Coord[]>([]);
  const [status, setStatus]                 = useState<RunStatus>("running");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [saving, setSaving]                 = useState(false);
  const [heading, setHeading]               = useState(0);


  // ✅ PASSO 2: estado para a mensagem da IA
  const [iaMsg, setIaMsg] = useState<string>("");
  const [iaLoading, setIaLoading] = useState(false);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const statusRef = useRef<RunStatus>("running");
  const distanceRef = useRef(0); // ref para acessar dentro do watchPosition
  // ✅ PASSO 3: controla em qual km a IA foi chamada pela última vez
  const lastNarratedKm = useRef(0);

  statusRef.current = status;


  // ✅ PASSO 4: função que chama sua API
  async function narrarPonto(coord: Coord, distanciaAtualM: number) {
    try {
      setIaLoading(true);

      // Busca o nome da rua/bairro usando GPS (opcional, melhora o prompt)
      let nomePonto = "Manaus";
      try {
        const [geo] = await Location.reverseGeocodeAsync(coord);
        nomePonto = geo?.street || geo?.district || geo?.city || "Manaus";
      } catch (_) {}

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
      // Não quebra a corrida se a API falhar
    } finally {
      setIaLoading(false);
    }
  }

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
      }
    })();
  }, []);

  // ── Bússola — usa o sensor de orientação do dispositivo ──────────────────
  // Location.watchHeadingAsync retorna o ângulo magnético real do aparelho,
  // independente de o usuário estar parado ou em movimento.
  // É muito mais confiável que response.coords.heading (que retorna -1 parado).
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      subscription = await Location.watchHeadingAsync((headingData) => {
        // magHeading: direção magnética em graus (0-360)
        // trueHeading: direção verdadeira (mais precisa, usa GPS + bússola)
        const graus = headingData.trueHeading >= 0
          ? headingData.trueHeading
          : headingData.magHeading;

        setHeading(graus);

        // Rotaciona o mapa junto com a bússola
        mapRef.current?.animateCamera({
          heading: graus,
          pitch: 70,
        });
      });
    })();

    return () => { subscription?.remove(); };
  }, []);

  // Rastreamento de posição/rota
  useEffect(() => {
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
      (response) => {
        setLocation(response);

        // Centraliza a câmera no usuário sem alterar o heading
        // (o heading já é controlado pelo watchHeadingAsync acima)
        mapRef.current?.animateCamera({
          center: response.coords,
          pitch: 70,
        });

        if (statusRef.current === "running") {
          const newCoord: Coord = {
            latitude:  response.coords.latitude,
            longitude: response.coords.longitude,
          };

          setRouteCoords((prev) => {
            if (prev.length > 0) {
              const extra = haversineDistance(prev[prev.length - 1], newCoord);
              if (extra > 2) {
                const novaDistancia = distanceRef.current + extra;
                distanceRef.current = novaDistancia;
                setDistanceMeters(novaDistancia);

                // ✅ PASSO 5: dispara a IA a cada 1km completo
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
        distancia_m:     distanceMeters,
        distancia_km:    parseFloat((distanceMeters / 1000).toFixed(3)),
        duracao_min:     Math.floor(elapsedSeconds / 60),
        tempo_s:         elapsedSeconds,
        tempo_formatado: formatTime(elapsedSeconds),
        pace,
        rota:            routeCoords,
        criadoEm:        serverTimestamp(),
      });

      await atualizarSequencia(uid);

      Alert.alert(
        "✅ Corrida salva!",
        `📏 ${(distanceMeters / 1000).toFixed(2)} km\n⏱ ${formatTime(elapsedSeconds)}\n⚡ Pace: ${pace}`,
        [{ text: "OK", onPress: () => router.replace("/(drawer)/(tabs)/home") }]
      );
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
        
        
   

      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          rotateEnabled
          pitchEnabled
          initialRegion={{
            latitude:      location.coords.latitude,
            longitude:     location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {/* Marcador que gira com a bússola */}
          <Marker
            coordinate={{
              latitude:  location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            rotation={heading}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true} // flat:true faz o marcador girar colado no mapa
          />

          {routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor="#1a58e9" strokeWidth={5} />
            
          )}
        </MapView>
      )}

      <View style={styles.panel}>

        {/* ✅ PASSO 6: balão da IA aparece quando tem mensagem */}
        {(iaMsg || iaLoading) && (
          <View style={{
            backgroundColor: "#1a58e9",
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            marginHorizontal: 4,
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

        <Text style={styles.statusText}>{status === "running" ? " Correndo…" : " Pausado"}</Text>
      </View>
    </View>
  );
}
