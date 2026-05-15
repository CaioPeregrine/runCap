import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Fundo cinza bem claro idêntico à imagem
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  containerIconeTopo: {
    width: 64,
    height: 64,
    backgroundColor: '#1ABC9C', // Verde água da marca
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  tituloTela: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtituloTela: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  segundaCamada: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  campoContainer: {
    width: '100%',
    gap: 6,
    marginBottom: 16,
  },
  labelInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  inputWrapper: {
    width: '100%',
    height: 46,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#1ABC9C', // Borda destacada em verde
  },
  textInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    padding: 0,
  },
  botao: {
    width: '100%',
    height: 46,
    backgroundColor: '#1ABC9C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  botaoVoltar: {
    marginTop: 28,
    padding: 8,
  },
  textoBotaoVoltar: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ABC9C',
  },
});

export default styles;
