import { StyleSheet } from "react-native";


const styles = StyleSheet.create({
  label: { fontSize: 22, fontWeight: "400" },
  textInputInner: { fontSize: 18, color: "#000000", flex: 1 },
  viewGoogleContainer: { alignItems: 'center', marginTop: 60 },
  headerContainer: {
    width: '100%',
    height: 200,
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  circle: {
    width: "100%",
    height: 230,
    borderBottomLeftRadius: 150,
    backgroundColor: '#2c3f69',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'alfa slab one',
    fontSize: 48,
    marginTop: 40,
  },
  background: {
    flex: 1,
    backgroundColor: "#F2F4F8",
    alignItems: "center",
    justifyContent: "center"
  },
  BK2: {
    width: "80%",
    marginTop: 100,
  },
  input: {
    alignItems: "center",
    borderColor: "#000000",
    borderRadius: 15,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    marginBottom: 10,
    flexDirection: 'row',
  },
  TextEsqueci: {
    fontSize: 13,
    color: "#22C3A3",
  },
  botao: {
    backgroundColor: "#22C3A3",
    borderRadius: 18,
    padding: 10,
    marginTop: 25,
    alignItems: "center",
    height: 55,
    justifyContent: 'center',
    elevation: 5,
    shadowOpacity: 0.8,
    shadowColor: "#000",
  },
  textoBotao: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#ffff",
  },
  estiloGoogle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#000000",
  },
  cadastre: {
    fontSize: 20,
    color: "#22C3A3",
    fontWeight: "bold",
    marginLeft: 5,
  },
  viewCadastre: {
    position: 'absolute',
    bottom: 90,
    flexDirection: "column",
    alignItems: 'center',
  }
});
export default styles;
