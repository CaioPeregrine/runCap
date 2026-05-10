import {StyleSheet} from 'react-native';

const s = StyleSheet.create({
    back: {
        position: "absolute", top: 52, left: 16, zIndex: 10,
        backgroundColor: "#fff", borderRadius: 20, padding: 8,
        elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8,
    },
    sheet: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 44,
        elevation: 10, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16,
    },
    badge: {
        backgroundColor: "#E1F5EE", borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 4,
        alignSelf: "flex-start", marginBottom: 10,
    },
    badgeTxt: { fontSize: 13, color: "#0F6E56", fontWeight: "500" },
    nome: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4 },
    desc: { fontSize: 14, color: "#666", marginBottom: 16 },
    metricas: {
        flexDirection: "row", backgroundColor: "#f5f5f5",
        borderRadius: 16, padding: 14, marginBottom: 18, alignItems: "center",
    },
    metrica: { flex: 1, alignItems: "center" },
    mVal: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },
    mLbl: { fontSize: 12, color: "#888", marginTop: 2 },
    divisor: { width: 1, height: 36, backgroundColor: "#ddd" },
    botao: {
        backgroundColor: "#22C3A3", borderRadius: 16, paddingVertical: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    },
    botaoTxt: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
export default s; 