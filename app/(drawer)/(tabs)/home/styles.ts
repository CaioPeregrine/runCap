import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

  panel: {
    backgroundColor: "#F2F4F8",
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    height: 350,
  },
  metric: {
    alignItems: "center",
  },
  metricValue: {
    color: "#000000",
    fontSize: 22,
    fontWeight: "700",
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
  cards: {
    width: '100%',
    height: 120,
    position: 'absolute',
    top: 80,
    alignItems: 'center',
    flexDirection: "row",
    justifyContent: "space-between"
  },
  btncards: {
    backgroundColor: "#ffff",
    height: "100%",
    width: "32%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"


  },
  estatis: {
    backgroundColor: "#22C3A3",
    width: "100%",
    height: 220,
    top: 220,
    position: "absolute",
    borderRadius: 10,
    opacity: 0.5,

  },
  drawerButton: {
    position: "absolute",
    top: 18,
    left: 14,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(34, 195, 163, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 20,
  },
  drawerPanel: {
    position: "absolute",
    top: 18,
    left: 14,
    width: width * 0.62,
    height: 320,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    zIndex: 21,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#111",
  },
  drawerItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#f7f9fc",
    marginBottom: 10,
  },
  drawerItemText: {
    fontSize: 15,
    color: "#0E1C2F",
    fontWeight: "600",
  },
  userHeader: {
    backgroundColor: "#2C3F69",
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: "#07070e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
    overflow: "hidden",
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
  },
  avatarText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  userName: { color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 2 },
  userId: { color: "#8E8E93", fontSize: 12, marginBottom: 10 },
  nivelBadge: {
    backgroundColor: "rgba(34, 195, 163, 0.17)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  nivelText: { color: "#22C3A3", fontSize: 13, fontWeight: "600" },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff",
    gap: 12,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(34, 195, 163, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },

  btnCentralizar: {

    position: "absolute",

    bottom: 160,

    right: 16,

    zIndex: 10,

    width: 44,

    height: 44,

    borderRadius: 22,

    backgroundColor: "#fff",

    alignItems: "center",

    justifyContent: "center",

    shadowColor: "#000",

    shadowOpacity: 0.15,

    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 4,
  },

  markerCapturado: {

    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: "#FFD700",

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 2,

    borderColor: "#fff",

    shadowColor: "#000",

    shadowOpacity: 0.25,

    shadowRadius: 5,

    elevation: 5,
  },

  card: {

    position: "absolute",

    bottom: 160,

    left: 16,

    right: 16,

    backgroundColor: "#fff",

    borderRadius: 20,

    padding: 16,

    zIndex: 20,

    shadowColor: "#000",

    shadowOpacity: 0.15,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 8,
  },

  cardClose: {

    position: "absolute",

    top: 12,

    right: 12,
  },

 
  avatarPlaceholder: {

    backgroundColor: "#2C3F69",

    alignItems: "center",

    justifyContent: "center",
  },

  cardNome: {

    fontSize: 16,

    fontWeight: "800",

    color: "#2C3F69",
  },

  cardData: {

    fontSize: 12,

    color: "#888",

    marginTop: 2,
  },

  cardCapturada: {

    fontSize: 11,

    color: "#FFD700",

    fontWeight: "700",

    marginTop: 2,
  },

  metricsRow: {

    flexDirection: "row",

    justifyContent: "space-around",

    marginBottom: 14,

    paddingTop: 4,

    borderTopWidth: 1,

    borderTopColor: "#f0f0f0",

    marginTop: 4,

    paddingBottom: 4,
  },

  metricValor: {

    fontSize: 20,

    fontWeight: "800",

    color: "#2C3F69",

    textAlign: "center",
  },

  metricLabel: {

    fontSize: 11,

    color: "#888",

    textAlign: "center",
  },

  btnCapturar: {

    backgroundColor: "#2C3F69",

    borderRadius: 12,

    paddingVertical: 12,

    alignItems: "center",
  },

  btnCapturarJa: {

    backgroundColor: "#aaa",
  },

  btnCapturarTexto: {

    color: "#fff",

    fontWeight: "700",

    fontSize: 14,
  },

  modalBg: {

    flex: 1,

    backgroundColor: "rgba(0,0,0,0.5)",

    alignItems: "center",

    justifyContent: "center",
  },

  modalBox: {

    backgroundColor: "#fff",

    borderRadius: 20,

    padding: 32,

    alignItems: "center",

    width: 280,
  },

  modalTitulo: {

    fontSize: 22,

    fontWeight: "800",

    color: "#2C3F69",

    marginBottom: 8,
  },

  modalSub: {

    fontSize: 14,

    color: "#888",

    textAlign: "center",

    marginBottom: 20,
  },

  modalBtn: {

    backgroundColor: "#2C3F69",

    borderRadius: 12,

    paddingHorizontal: 32,

    paddingVertical: 12,
  },

});
export default styles;