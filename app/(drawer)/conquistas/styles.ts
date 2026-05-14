import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2C3F69",
    marginBottom: 4,
  },
  subtitle: {
    color: "#888",
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    width: (width - 44) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    minHeight: 150,
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardLocked: {
    backgroundColor: "#F0F0F5",
  },
  cardIconeArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardIcone: {
    fontSize: 28,
  },
  cardIconeLocked: {
    opacity: 0.25,
  },
  cardTitulo: {
    color: "#2C3F69",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDescricao: {
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 16,
  },
  cardTextoOff: {
    color: "#A9ABB5",
  },
  cardCadeado: {
    position: "absolute",
    top: 12,
    right: 12,
  },
});

export default styles;
