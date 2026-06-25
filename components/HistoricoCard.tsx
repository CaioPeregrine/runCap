import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type HistoricoCardProps = {
  data: Date;
  distanciaKm: number;
  duracaoMin: number;
  onPress?: () => void;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatarData(date: Date): string {
  return `${date.getDate()} de ${MESES[date.getMonth()]}`;
}

function formatarHora(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function HistoricoCard({ data, distanciaKm, duracaoMin, onPress }: HistoricoCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTopo}>
        <View style={styles.cardIcone}>
          <Feather name="trending-up" size={20} color="#22C3A3" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>Corrida {formatarData(data)}</Text>
          <Text style={styles.cardHora}>{formatarHora(data)}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#C1C1C1" />
      </View>

      <View style={styles.cardMetricas}>
        <View style={styles.metrica}>
          <Feather name="map-pin" size={14} color="#22C3A3" />
          <Text style={styles.metricaValor}>{distanciaKm.toFixed(2)}</Text>
          <Text style={styles.metricaLabel}>KM</Text>
        </View>
        <View style={styles.metrica}>
          <Feather name="clock" size={14} color="#22C3A3" />
          <Text style={styles.metricaValor}>{duracaoMin}min</Text>
          <Text style={styles.metricaLabel}>TEMPO</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF9F2",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardIcone: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#DFF6F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitulo: {
    color: "#2C3F69",
    fontSize: 14,
    fontWeight: "700",
  },
  cardHora: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  cardMetricas: {
    flexDirection: "row",
    gap: 10,
  },
  metrica: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  metricaValor: {
    color: "#2C3F69",
    fontSize: 15,
    fontWeight: "800",
  },
  metricaLabel: {
    color: "#8E8E93",
    fontSize: 10,
  },
});
