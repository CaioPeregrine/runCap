import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1B2B48', // Azul escuro do fundo
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // O "Card" branco da imagem
  BK2: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2B48',
    marginBottom: 5,
  },
  subLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 20,
  },
  // Inputs com bordas arredondadas e cinza claro
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E1E8EF',
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },
  textInputInner: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  TextEsqueci: {
    color: '#24B28D', // Verde água da imagem
    fontWeight: '600',
    marginBottom: 20,
  },
  botao: {
    backgroundColor: '#24B28D',
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  viewGoogleContainer: {
    alignItems: 'center',
    marginTop: 25,
  },
  estiloGoogle: {
    color: '#FFFFFF',
    marginBottom: 10,
  },
  // Botão do Google branco
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8EF',
  },
  viewCadastre: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 5,
  },
  cadastre: {
    color: '#24B28D',
    fontWeight: '700',
  },
});