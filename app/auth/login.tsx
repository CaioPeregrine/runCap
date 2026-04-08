import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { auth } from '@/firebase/firebaseConfig';
import { db } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface DadosLogin {
  email: string;
  senha: string;
}

// ─── Gera um ID único no formato ID + 6 caracteres ────────────────────────────
function gerarCodigoId(): string {
  return "ID" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const realizarLogin = async ({ email, senha }: DadosLogin) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    console.log("Login feito com sucesso!", userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    console.error("Erro ao entrar:", error.message);
    throw error;
  }
};

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (email === '' || senha === '') {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await realizarLogin({ email, senha });
      const user = userCredential.user;

      // ✅ Verifica e corrige documento incompleto no Firestore
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      const updates: Record<string, any> = { status: "online" };

      if (!data?.codigoId) {
        updates.codigoId = gerarCodigoId();
      }
      if (!data?.nome) {
        updates.nome = user.displayName || "Corredor";
      }
      if (!data?.email) {
        updates.email = user.email?.toLowerCase() || "";
      }

      await updateDoc(userRef, updates);

      router.replace("/home");
    } catch (error: any) {
      console.log(error.code);
      let message = "Ocorreu um erro ao entrar.";

      if (error.code === 'auth/invalid-credential') {
        message = "E-mail ou senha incorretos.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Formato de e-mail inválido.";
      }

      Alert.alert("Erro de Login", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.headerContainer}>
        <View style={styles.circle}>
          <Text style={styles.logoText}>RUNCAP</Text>
        </View>
      </View>

      <View style={styles.BK2}>
        <Text style={styles.label}>E-mail</Text>
        <View style={styles.input}>
          <Fontisto name="email" size={20} color="#c1c1c1" style={{ marginRight: 10 }} />
          <TextInput
            maxLength={100}
            style={styles.textInputInner}
            placeholderTextColor="#c1c1c1"
            placeholder="digite seu e-mail"
            autoCapitalize='none'
            keyboardType='email-address'
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Senha</Text>
        <View style={styles.input}>
          <Ionicons name="lock-closed" size={20} color="#c1c1c1" style={{ marginRight: 10 }} />
          <TextInput
            maxLength={100}
            style={styles.textInputInner}
            placeholderTextColor="#c1c1c1"
            placeholder="digite sua senha"
            autoCapitalize='none'
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <TouchableOpacity onPress={() => router.push("/auth/recup")}>
            <Text style={styles.TextEsqueci}>esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity
            style={styles.botao}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#2C3F69" />
            ) : (
              <Text style={styles.textoBotao}>acessar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewGoogleContainer}>
        <Text style={styles.estiloGoogle}>ou entre com </Text>
        <TouchableOpacity style={{ marginTop: 10 }}>
          <Ionicons name="logo-google" size={30} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.viewCadastre}>
        <Text style={{ color: '#000000' }}>não tem uma conta?</Text>
        <TouchableOpacity onPress={() => router.push("/auth/cadastro")}>
          <Text style={styles.cadastre}>cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
