import { StyleSheet, Dimensions} from "react-native";

const { height } = Dimensions.get("window");
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a2e",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 6,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  closeIcon: { fontSize: 14, color: "#555" },

  // Opções
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    gap: 14,
  },
  opcaoDestaque: {
    backgroundColor: "#22C3A3",
    shadowColor: "#22C3A3",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  opcaoNormal: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#eee",
  },
  opcaoIcone: {
    width: 48, height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  opcaoIconeDestaque: { backgroundColor: "rgba(255,255,255,0.25)" },
  opcaoIconeNormal:   { backgroundColor: "#f5f5f5" },
  opcaoTexto: { flex: 1 },
  opcaoTitulo: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  opcaoDesc:   { fontSize: 13, marginTop: 3, lineHeight: 18 },
});
export default styles;