import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import Octicons from '@expo/vector-icons/Octicons';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from '@react-navigation/native';
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import styles from "./styles";

type Coord = { latitude: number; longitude: number };

type Corrida = {
  id: string;
  uid: string;
  rota: Coord[];
  distancia_km: number;
  tempo_formatado: string;
  pace: string;
  criadoEm: any;
  cor: string;
  nomeCorredor: string;
};

// Paleta de cores para as corridas
const CORES = [
  "#1a58e9", "#e91a1a", "#1ae95a", "#e9c01a",
  "#9b1ae9", "#1ae9d4", "#e9681a", "#e91aa0",
  "#4CAF50", "#FF5722",
];

function formatDate(timestamp: any): string {
  if (!timestamp) return "Data desconhecida";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Verifica se os pontos formam uma área fechada (início e fim próximos)
function isAreaFechada(rota: Coord[]): boolean {
  if (rota.length < 4) return false;
  const inicio = rota[0];
  const fim = rota[rota.length - 1];
  const R = 6371000;
  const dLat = ((fim.latitude - inicio.latitude) * Math.PI) / 180;
  const dLon = ((fim.longitude - inicio.longitude) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((inicio.latitude * Math.PI) / 180) *
    Math.cos((fim.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const distancia = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distancia < 100; // menos de 100m entre início e fim = área fechada
}

export default function Home() {
  const [location, setLocation] = useState<any>(null);
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [corridaSelecionada, setCorridaSelecionada] = useState<Corrida | null>(null);
  const cardAnim = useRef(new Animated.Value(200)).current;
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  const currentUser = getAuth().currentUser;

  // ── Localização ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        setLocation(pos);
      }
    })();
  }, []);

  useEffect(() => {
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
      (response) => {
        setLocation(response);
        mapRef.current?.animateCamera({ pitch: 70, center: response.coords });
      }
    );
  }, []);

  // ── Busca corridas minhas + amigos ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    async function buscarCorridas() {
      try {
        // Busca lista de amigos
        const userSnap = await getDoc(doc(db, "usuarios", currentUser!.uid));
        const amigos: string[] = userSnap.data()?.amigos || [];
        const ids = [currentUser!.uid, ...amigos];

        // Busca nome de cada corredor
        const nomes: Record<string, string> = {};
        await Promise.all(ids.map(async (uid) => {
          const snap = await getDoc(doc(db, "usuarios", uid));
          nomes[uid] = snap.data()?.nome || "Corredor";
        }));

        // Busca corridas de cada uid
        let todasCorridas: Corrida[] = [];
        let corIndex = 0;

        await Promise.all(ids.map(async (uid) => {
          const q = query(collection(db, "corridas"), where("uid", "==", uid));
          const snap = await getDocs(q);
          snap.forEach((d) => {
            const data = d.data();
            if (data.rota && data.rota.length > 1) {
              todasCorridas.push({
                id: d.id,
                uid,
                rota: data.rota,
                distancia_km: data.distancia_km || 0,
                tempo_formatado: data.tempo_formatado || "00:00",
                pace: data.pace || "--:--",
                criadoEm: data.criadoEm,
                cor: CORES[corIndex++ % CORES.length],
                nomeCorredor: nomes[uid],
              });
            }
          });
        }));

        setCorridas(todasCorridas);
      } catch (e) {
        console.error("Erro ao buscar corridas:", e);
      }
    }

    buscarCorridas();
  }, [currentUser]);

  // ── Abre card ao clicar numa corrida ───────────────────────────────────────
  function abrirCard(corrida: Corrida) {
    setCorridaSelecionada(corrida);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true }).start();
  }

  function fecharCard() {
    Animated.spring(cardAnim, { toValue: 300, useNativeDriver: true }).start(() => {
      setCorridaSelecionada(null);
    });
  }

  return (
    <View style={styles.container}>
      {/* Botão hamburguer */}
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{ position: 'absolute', top: 50, left: 15, zIndex: 10 }}
      >
        <Feather name="menu" size={30} color="black" />
      </TouchableOpacity>

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
          onPress={fecharCard}
        >
          {/* Marcador posição atual */}
          <Marker coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }} />

          {/* Polylines e Polygons das corridas */}
          {corridas.map((corrida) => (
            <React.Fragment key={corrida.id}>
              {isAreaFechada(corrida.rota) ? (
                // Área fechada — desenha polígono preenchido
                <Polygon
                  coordinates={corrida.rota}
                  strokeColor={corrida.cor}
                  fillColor={corrida.cor + "40"} // 25% opacidade
                  strokeWidth={3}
                  tappable
                  onPress={() => abrirCard(corrida)}
                />
              ) : (
                // Rota aberta — desenha polyline
                <Polyline
                  coordinates={corrida.rota}
                  strokeColor={corrida.cor}
                  strokeWidth={4}
                  tappable
                  onPress={() => abrirCard(corrida)}
                />
              )}
            </React.Fragment>
          ))}
        </MapView>
      )}

      {/* ── Card popup da corrida selecionada ── */}
      {corridaSelecionada && (
        <Animated.View style={[{
          position: 'absolute',
          bottom: 160,
          left: 16,
          right: 16,
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 10,
          zIndex: 20,
          borderLeftWidth: 5,
          borderLeftColor: corridaSelecionada.cor,
        }, { transform: [{ translateY: cardAnim }] }]}>
          <TouchableOpacity
            onPress={fecharCard}
            style={{ position: 'absolute', top: 10, right: 10 }}
          >
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>

          <Text style={{ fontWeight: '800', fontSize: 16, color: '#2C3F69', marginBottom: 4 }}>
            🏃 {corridaSelecionada.nomeCorredor}
          </Text>
          <Text style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>
            📅 {formatDate(corridaSelecionada.criadoEm)}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#2C3F69' }}>
                {corridaSelecionada.distancia_km.toFixed(2)}
              </Text>
              <Text style={{ fontSize: 11, color: '#888' }}>km</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#2C3F69' }}>
                {corridaSelecionada.tempo_formatado}
              </Text>
              <Text style={{ fontSize: 11, color: '#888' }}>tempo</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#2C3F69' }}>
                {corridaSelecionada.pace}
              </Text>
              <Text style={{ fontSize: 11, color: '#888' }}>pace</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Painel inferior ── */}
      <View style={styles.panel}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnStart]}
            onPress={() => router.push('../../../telaCorrendo')}
          >
            <Text style={styles.btnText}>▶  Iniciar Corrida</Text>
          </TouchableOpacity>

          <View style={styles.cards}>
            <TouchableOpacity style={styles.btncards}>
              <Octicons name="location" size={24} color="#22C3A3" />
              <Text>Descobrir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btncards}>
              <Feather name="check-circle" size={24} color="#22C3A3" />
              <Text>Metas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btncards}>
              <FontAwesome5 name="route" size={24} color="#22C3A3" />
              <Text>Rotas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}