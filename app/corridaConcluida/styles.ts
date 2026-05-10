import { StyleSheet } from "react-native";
const GREEN = "#1db954";
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f0f2f0" },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: GREEN,
    paddingTop: 70,
    paddingBottom: 56,
    alignItems: "center",
    gap: 6,
  },
  medalWrap: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  medalIcon:   { fontSize: 36 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub:   { fontSize: 14, color: "rgba(255,255,255,0.75)" },

  // Card
  card: {
    backgroundColor: "#fff",
    marginTop: -24,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Métricas
  metricsRow:   { flexDirection: "row", marginBottom: 20 },
  metric:       { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  metricBorder: { borderRightWidth: 1, borderRightColor: "#f0f0f0" },
  metricIcon:   { fontSize: 16, marginBottom: 4 },
  metricValue:  { fontSize: 24, fontWeight: "800", color: "#111", lineHeight: 26 },
  metricUnit:   {
    fontSize: 11, color: "#999", fontWeight: "600",
    marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5,
  },

  // Mapa
  mapContainer: { borderRadius: 14, overflow: "hidden", height: 180 },
  mapLabel: {
    position: "absolute", top: 10, left: 12, zIndex: 10,
    fontSize: 11, fontWeight: "700", color: "#444",
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  map:          { width: "100%", height: 180 },
  mapEmpty:     { backgroundColor: "#e8ede8", alignItems: "center", justifyContent: "center" },
  mapEmptyText: { color: "#999", fontSize: 13 },

  // Stats secundários
  statsGrid: { flexDirection: "row", gap: 10, marginTop: 14 },
  statBox:   {
    flex: 1, backgroundColor: "#f7f8f7",
    borderRadius: 12, padding: 12,
  },
  statLabel: {
    fontSize: 11, color: "#888", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111" },

  // Compartilhar
  shareSection: { marginTop: 16, marginHorizontal: 16 },
  shareTitle: {
    fontSize: 12, fontWeight: "600", color: "#888",
    textTransform: "uppercase", letterSpacing: 0.8,
    textAlign: "center", marginBottom: 12,
  },
  shareButtons: { flexDirection: "row", gap: 10 },
  shareBtn: {
    flex: 1, alignItems: "center",
    paddingVertical: 14, borderRadius: 14,
  },
  shareIcon:    { fontSize: 26, marginBottom: 4 },
  shareBtnText: { fontSize: 11, fontWeight: "700" },
  btnWhatsApp:  { backgroundColor: "#e8f8ee" },
  btnInstagram: { backgroundColor: "#fce8f3" },
  btnGeral:     { backgroundColor: "#f0f0f0" },

  // Botão concluir
  btnConcluir: {
    marginHorizontal: 16, marginTop: 14,
    paddingVertical: 18,
    backgroundColor: GREEN,
    borderRadius: 16, alignItems: "center",
    shadowColor: GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnConcluirText: {
    color: "#fff", fontSize: 16,
    fontWeight: "800", letterSpacing: 0.3,
  },
});
export default styles;