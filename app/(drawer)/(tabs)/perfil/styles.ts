import { StyleSheet, Dimensions, Platform } from "react-native";
const { width } = Dimensions.get("window");



const styles = StyleSheet.create({


  inicial: { flex: 1, backgroundColor: "#F2F4F8" },

  // Bloco bege superior — cor original #EDE8DF mantida

  bannerArea: { width: "100%", height: 240, overflow: "hidden" },
  bannerImg: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerCamera: {
    position: "absolute", bottom: 8, right: 12,
    backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 16, padding: 6,
  },


  perfilInfo: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 20, marginTop: -75, gap: 14,
  },

  // Círculo — cor original #b1832d mantida
  circle: {
    width: 70, height: 70, borderRadius: 15,
    borderWidth: 3, borderColor: "transparent", 
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 4,
  },
  circleImg: { width: "100%", height: "100%", resizeMode: "cover" },
  circleIniciais: { color: "#fff", fontSize: 26, fontWeight: "800" },
  circleLapis: {
    position: "absolute", bottom: -1, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#22C3A3", alignItems: "center", justifyContent: "center",
  },

  nomeBox: { flex: 1, paddingBottom: 4 },
  nomeTexto: { color: "#2C3F69", fontSize: 17, fontWeight: "800" },
  idTexto: { color: "#888", fontSize: 11, marginTop: 2 },
  nivelBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#22c3a343", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginTop: 5,
  },
  nivelTexto: { color: "#22c3a3c1", fontSize: 12, fontWeight: "700" },

  secao: {
    backgroundColor: "#FFF9F2", marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, paddingVertical: 16,

  },
  secaoHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, marginBottom: 12,
  },
  secaoTitulo: 
  { color: "#2C3F69", fontSize: 16, fontWeight: "800" },
  verTodas: 
  { color: "#22C3A3", fontSize: 13, fontWeight: "600" },

  // Barra XP — Brxp (trilha branca) + Cirxp (barra verde #1ffc48 original)
  xpBox:
    { paddingHorizontal: 16 },
  xpTopo:
    { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  xpLabel:
    { color: "#2C3F69", fontWeight: "700", fontSize: 14 },
  xpValor:
    { color: "#888", fontSize: 13 },
  xpTrilha:
    { height: 20, backgroundColor: "#EBEBF0", borderRadius: 20, overflow: "hidden" },
  xpBarra:
    { height: "100%", backgroundColor: "#1ffc48", borderRadius: 20 },
  xpRodape:
    { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  xpFaltando:
    { color: "#888", fontSize: 11 },
  xpNivel:
    { color: "#888", fontSize: 11 },
  statsGrid:
    { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
  statCard:
    { width: (width - 32 - 10 - 24) / 2, backgroundColor: "#FFF9F2", borderRadius: 12, padding: 14 },
  statIcone:
    { fontSize: 22, marginBottom: 6 },
  statValor:
    { color: "#2C3F69", fontSize: 20, fontWeight: "800" },
  statRotulo:
    { color: "#888", fontSize: 12, marginTop: 3 },

  semCq: { color: "#888", fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  cqPerfil: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F7F8FC", borderRadius: 12, padding: 12,
  },
  cqPerfilDestaque: { borderWidth: 1.5, borderColor: "#22C3A3", backgroundColor: "#F0FBF8" },
  cqPerfilIcone: { fontSize: 26 },
  cqPerfilTitulo: { color: "#2C3F69", fontSize: 13, fontWeight: "700" },
  cqPerfilDesc: { color: "#888", fontSize: 11, marginTop: 2 },

  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  menuDivisor: { height: 1, backgroundColor: "#F0F0F5", marginHorizontal: 16 },
  menuTexto: { color: "#2C3F69", fontSize: 15, fontWeight: "500" },

  modalWrap: { flex: 1, backgroundColor: "#F2F4F8" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: Platform.OS === "android" ? 40 : 20,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F5",
  },
  modalTitulo: { color: "#2C3F69", fontSize: 20, fontWeight: "800" },
  modalDica: { color: "#888", fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff" },

  cqItem: {
    flex: 1, margin: 5, backgroundColor: "#fff", borderRadius: 14, padding: 12,
    alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, position: "relative", minHeight: 115,
  },
  cqBloqueada: { backgroundColor: "#F0F0F5", elevation: 0 },
  cqDestaque: { borderWidth: 2, borderColor: "#22C3A3" },
  cqIcone: { fontSize: 28, marginBottom: 6 },
  cqTitulo: { color: "#2C3F69", fontSize: 11, fontWeight: "700", textAlign: "center" },
  cqDesc: { color: "#888", fontSize: 9, textAlign: "center", marginTop: 3 },
  cqTextoOff: { color: "#BBBBC8" },
  cqCadeado: { position: "absolute", top: 8, right: 8 },
  cqCheck: { position: "absolute", top: 6, left: 6 },
});
export default styles;
