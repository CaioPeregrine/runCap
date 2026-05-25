import { StyleSheet, Dimensions } from "react-native";

const styles = StyleSheet.create({

//  RANKINGGGGGG
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
  },

  blueBlock: {
    width:"100%",
    height:"25%",
    backgroundColor: "#2C3F69",
    paddingTop: 90,
    paddingBottom:50, // ✅ era 90 — reduziu para valor normal
    alignItems: "center",
    borderBottomLeftRadius:25,
    borderBottomRightRadius:25
   
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 6,
    position: "relative",
    height: 40,
    width: "70%",
  },
  tabIndicator: {
    position: "absolute",
    width: "50%",
    height: 40,
    backgroundColor: "#22c3a3c1",
    borderRadius: 12,
  
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  scrollView: {
    flex: 1,
  },

  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF9F2",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rankPosition: {
    color: "#2C3F69",
    fontWeight: "700",
    fontSize: 14,
    width: 28,
  },
  rankName: {
    color: "#2C3F69",
    fontWeight: "600",
    fontSize: 15,
  },
  rankStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  rankKm: {
    color: "#1B2B5E",
    fontWeight: "700",
    fontSize: 13,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#8E8E93",
    fontSize: 15,
  },

  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#22C3A3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#22C3A3",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  drawer: {
    position: "absolute",
    top: 25,
    backgroundColor:"transparent",
    height: 50,
    width: 50,
    left:5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
  },
  drawerPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: Dimensions.get("window").width * 0.70,
    height: "100%",
    backgroundColor: "#ffffff",
    zIndex: 11,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
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
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
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
  back: {
    backgroundColor: "#ff0000",
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 90,
    width: 120, 
  },

  
});
export default styles;