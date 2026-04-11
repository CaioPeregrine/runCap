import { StyleSheet } from "react-native";


const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#2C3F69",
  },
  segundaCamada: {
    width: "100%",
    height: "88%",
    alignItems: "center",
    backgroundColor: "#EDE8DF",
    justifyContent: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 120,
  },
  TerceiraCamada: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 20,
    paddingVertical: 20,
  },
  Input: {
    width: 280,
    borderWidth: 1,
    borderColor: "#2C3F69",
    borderRadius: 12,
    padding: 7,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  Botao: {
    backgroundColor: "#2C3F69",
    borderRadius: 18,
    padding: 10,
    marginTop: 25,
    alignItems: "center",
    width: 280,
    height: 50,
    justifyContent: "center",
  },
  textoBotao: {
    fontFamily: "helvetica",
    fontWeight: "bold",
    fontSize: 24,
    color: "#ffffff",
  },
  ViewSuperior: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 16,
  },
  erroText: {
    color: "#FF3B30",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
});
export default styles;