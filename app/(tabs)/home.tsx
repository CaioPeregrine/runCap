import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { db } from "../../firebase/firebaseConfig"; // ajuste se necessário
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { router } from "expo-router";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Coord = { latitude: number; longitude: number };
type RunStatus = "idle" | "running" | "paused";

// ─── Utilitários ──────────────────────────────────────────────────────────────

/** Distância em metros entre dois pontos (Haversine) */
function haversineDistance(a: Coord, b: Coord): number {
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

/** Segundos → "MM:SS" */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Pace em "M:SS /km" */
function calcPace(distM: number, seconds: number): string {
  if (distM < 10) return "--:-- /km";
  const secPerKm = seconds / (distM / 1000);
  const pm = Math.floor(secPerKm / 60);
  const ps = Math.floor(secPerKm % 60).toString().padStart(2, "0");
  return `${pm}:${ps} /km`;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Home() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [saving, setSaving] = useState(false);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref para acessar status atual dentro do watchPositionAsync (evita closure stale)
  const statusRef = useRef<RunStatus>("idle");
  statusRef.current = status;

  // ── Permissão + posição inicial — igual ao original ────────────────────────
  async function requestLocationPermissions() {
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm === "granted") {
      const currentPosition = await Location.getCurrentPositionAsync({});
      setLocation(currentPosition);
    }
  }

  useEffect(() => {
    requestLocationPermissions();
  }, []);

  // ── watchPositionAsync contínuo — igual ao original + polyline ─────────────
  useEffect(() => {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (Response) => {
        setLocation(Response);

        // Câmera 3D — igual ao original
        mapRef.current?.animateCamera({
          pitch: 70,
          center: Response.coords,
        });

        // Acumula rota e distância somente quando correndo
        if (statusRef.current === "running") {
          const newCoord: Coord = {
            latitude: Response.coords.latitude,
            longitude: Response.coords.longitude,
          };

          setRouteCoords((prev) => {
            if (prev.length > 0) {
              const extra = haversineDistance(prev[prev.length - 1], newCoord);
              if (extra > 2) {
                // filtra ruído do GPS (< 2m não conta)
                setDistanceMeters((d) => d + extra);
                return [...prev, newCoord];
              }
              return prev;
            }
            return [newCoord];
          });
        }
      }
    );
  }, []);

  // ── INICIAR ────────────────────────────────────────────────────────────────
  function handleStart() {
    setRouteCoords([]);
    setDistanceMeters(0);
    setElapsedSeconds(0);
    setStatus("running");

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }

  // ── PAUSAR / RETOMAR ───────────────────────────────────────────────────────
  function handlePauseResume() {
    if (status === "running") {
      setStatus("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (status === "paused") {
      setStatus("running");
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
  }

  // ── FINALIZAR ──────────────────────────────────────────────────────────────
  async function handleFinish() {
    setStatus("idle");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSaving(true);

    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;

      if (!uid) {
        Alert.alert("Erro", "Usuário não autenticado.");
        return;
      }

      const pace = calcPace(distanceMeters, elapsedSeconds);
      await addDoc(collection(db, "corridas"), {
        uid,                          // ← campo uid adicionado
        distancia_m: distanceMeters,
        distancia_km: parseFloat((distanceMeters / 1000).toFixed(3)),
        duracao_min: Math.floor(elapsedSeconds / 60), // ← campo para o perfil
        tempo_s: elapsedSeconds,
        tempo_formatado: formatTime(elapsedSeconds),
        pace,
        rota: routeCoords,
        criadoEm: serverTimestamp(),
      });

      Alert.alert(
        "✅ Corrida salva!",
        `📏 ${(distanceMeters / 1000).toFixed(2)} km\n` +
          `⏱ ${formatTime(elapsedSeconds)}\n` +
          `⚡ Pace: ${pace}`
      );
    } catch (e) {
      Alert.alert("Erro ao salvar", String(e));
    } finally {
      setSaving(false);
      setRouteCoords([]);
      setDistanceMeters(0);
      setElapsedSeconds(0);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
        
          {/* Marcador — igual ao original */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
          />

          {/* ✅ Polyline — rastro da corrida em vermelho */}
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#1a58e9"
              strokeWidth={5}
            />
          )}
        </MapView>
      )}

      {/* ── Painel inferior ─────────────────────────────────────────────── */}
      <View style={styles.panel}>
        {/* Métricas — visíveis durante a corrida */}
        {status !== "idle" && (
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {(distanceMeters / 1000).toFixed(2)}
              </Text>
              <Text style={styles.metricLabel}>km</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatTime(elapsedSeconds)}
              </Text>
              <Text style={styles.metricLabel}>tempo</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {calcPace(distanceMeters, elapsedSeconds)}
              </Text>
              <Text style={styles.metricLabel}>pace</Text>
            </View>
          </View>
        )}

        {/* Botões */}
        <View style={styles.buttonsRow}>
          {status === "idle" && (
            <TouchableOpacity
              style={[styles.btn, styles.btnStart]}
              onPress={handleStart}
            >
              <Text style={styles.btnText}>▶  Iniciar Corrida</Text>
            </TouchableOpacity>

           
          )}
         <View style = {styles.cards}>
          <TouchableOpacity style={styles.btncards} onPress={()=>router.push("/(drawer)/pontosTuristicos")}><Text>descobrir</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btncards}><Text>metas</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btncards}><Text>rotas</Text></TouchableOpacity>
          </View>

          <View style={styles.estatis}></View>

          {(status === "running" || status === "paused") && (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.btnPause]}
                onPress={handlePauseResume}
              >
                <Text style={styles.btnText}>
                  {status === "running" ? "⏸  Pausar" : "▶  Retomar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnFinish]}
                onPress={handleFinish}
                disabled={saving}
              >
                <Text style={styles.btnText}>
                  {saving ? "Salvando…" : "⏹  Finalizar"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {status === "running" && (
          <Text style={styles.statusText}>🔴  Correndo…</Text>
        )}
        {status === "paused" && (
          <Text style={styles.statusText}>⏸  Pausado</Text>
        )}
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  panel: {
    backgroundColor: "#F2F4F8",
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    height:600
    
    
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  metric: {
    alignItems: "center",
  },
  metricValue: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "700",
  },
  metricLabel: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    
  },
  btnStart: {
    backgroundColor: "#22C3A3",
  },
  btnPause: {
    backgroundColor: "#FF9F0A",
  },
  btnFinish: {
    backgroundColor: "#FF3B30",
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16
  },
  statusText: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
  },
  cards:{
    width: '100%',
    height: 120,
    position: 'absolute',
    top: 80,
    alignItems: 'center',
    flexDirection:"row",
    justifyContent:"space-between"
  },
  btncards: {
    backgroundColor:"#ffff",
    height:"100%",
    width:"32%",
    borderRadius:10,
    alignItems:"center",
    justifyContent:"flex-end"
  
   
  },
  estatis:{
    backgroundColor:"#22C3A3",
    width:"100%",
    height:220,
    top:220,
    position:"absolute",
    borderRadius:10,
    opacity:0.5,
    
  }
});
