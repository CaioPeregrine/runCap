import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";

export default function Login() {
  return (
    <View style={styles.background}>
      {/* Círculo superior com o nome */}
      <View style={styles.headerContainer}>
        <View style={styles.circle}>
          <Text style={styles.logoText}>RUNCAP</Text>
        </View>
      </View>
      <View style={styles.BK2}>

        {/* codigo para o campo de email, onde o usuario digita seu email para acessar sua conta */}
        <Text style={{ fontSize: 24, fontFamily: "afacad", color: "#ffffff" }}>E-mail</Text>
        <View style={styles.input}>
          <Fontisto name="email" size={20} color="#c1c1c1" style={{ marginRight: 10 }} />
          <TextInput maxLength={100} style={{ fontSize: 18, color: "#ffffff", flex: 1 }} placeholderTextColor= "#516376" placeholder="digite seu e-mail" autoCapitalize='none' keyboardType='email-address' autoComplete='email'></TextInput>
        </View>

        {/* codigo para o campo de senha, onde o usuario digita sua senha para acessar sua conta */}
        <Text style={{ fontSize: 24, fontFamily: "afacad", color: "#ffffff" }}>Senha</Text>
        <View style={styles.input}>
          <Ionicons name="lock-closed" size={20} color="#c1c1c1" style={{ marginRight: 10 }} />
          <TextInput maxLength={100} style={{ fontSize: 18, color: "#ffffff", flex: 1 }}  placeholderTextColor= "#516376" placeholder="digite sua senha" autoCapitalize='none' secureTextEntry></TextInput>
        </View>

        {/* codigo para o esqueceu a senha, onde o usuario pode clicar caso tenha esquecido sua senha e seguir os passos para recuperar a senha */}
        <View style={{ alignItems: "flex-end" }}>
          <TouchableOpacity onPress={()=> router.push("/recup")}>
            <Text style={styles.TextEsqueci}>esqueceu a senha?</Text>
          </TouchableOpacity>

        </View>

        <View>
          <TouchableOpacity style={styles.botao} onPress={() => router.push("/home")}> 
            <Text style={styles.textoBotao}>acessar</Text>
          </TouchableOpacity>
        </View>


      </View>

      {/* codigo para entrar com o google*/}
      <View>
        <Text style={styles.estiloGoogle}>ou entre com </Text>
      </View>

      <View>
        <Text>coloca o logo da google aqui</Text>
      </View>

      {/*codigo do nao possui conta*/}


      {/*codigo para cadastro*/}
      <View style={styles.viewCadastre}>
        <View>
          <Text>não tem uma conta?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/cadastro")}>
          <Text style={styles.cadastre}>cadastre-se</Text>
        </TouchableOpacity>
      </View>

    </View>

  )
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 200,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    overflow: 'visible',
    alignItems: 'center',
      
  },
  circle: {
    width: "100%",
    height: 230,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 150,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    backgroundColor: '#EDE8DF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    left:0, // desloca o círculo para a esquerda/direita
    overflow: 'hidden',
  },
  logoText: {
    fontFamily: 'alfa slab one',
    fontSize: 48,
    color: '  ',
    marginTop: 40,
  },

  background: {
    flex: 1,
    backgroundColor: "#2C3F69",
    alignItems: "center",
    justifyContent: "center"
  },
  //funcionalidade de login
  BK2: {

    width: "80%",
    height: "35%",
  
    justifyContent: "center",

  },
  //estilo do input,onde o usuario digita suas informações
  input: {
    alignItems: "center",
    borderColor: "#EDE8DF",
    borderRadius: 15,
    paddingHorizontal: 10,
    borderWidth: 2,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: "abeezee",
    flexDirection: 'row'

  },
  //estilo do esqueceu a senha
  TextEsqueci: {
    fontFamily: "abeezee",
    fontSize: 13,
    color: "#ffffff",

  },
  //estilo do botao de acessar
  botao: {
    backgroundColor: "#EDE8DF",
    borderRadius: 18,
    padding: 10,
    marginTop: 25,
    alignItems: "center",
  },

  //estilo do texto do botao de acessar
  textoBotao: {
    fontFamily: "helvetica",
    fontWeight: "bold",
    fontSize: 24,
    color: "#2C3F69",
  },

  //estilo do texto para entrar com o google
  estiloGoogle: {
    fontFamily: "ADlaM Display",
    fontWeight: "bold",
    fontSize: 15,
    color: "#ffffff",
  },

  //estilo do cadastre-se
  cadastre: {
    fontFamily: "alfa slab one",
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "bold",

  },

  //estilo da view cadastre-se
  viewCadastre: {
    position: 'absolute',
    bottom: 25,
    alignItems: 'center',
    paddingVertical: 20,
    justifyContent: 'center',
  }



})


