import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { auth, db } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Image } from 'react-native';
import styles from './styles';

// ── XP ────────────────────────────────────────────────────────────────────────
import { initUsuario } from '@/app/hooks/useXP';

interface DadosLogin {
  email: string;
  senha: string;
}

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
  const [verSenha, setVerSenha] = useState<boolean>(true);

  const handleLogin = async () => {
    if (email === '' || senha === '') {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await realizarLogin({ email, senha });
      const user = userCredential.user;

      // ── 1. Verifica e corrige campos básicos do documento ─────────────────
      const userRef  = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);
      const data     = userSnap.data();

      const updates: Record<string, any> = { status: "online" };

      if (!data?.codigoId) updates.codigoId = gerarCodigoId();
      if (!data?.nome)     updates.nome     = user.displayName || "Corredor";
      if (!data?.email)    updates.email    = user.email?.toLowerCase() || "";

      await updateDoc(userRef, updates);

      // ── 2. initUsuario: cria campos de XP se for o primeiro acesso ────────
      //    Se o documento já tiver xpTotal, nivel etc., não faz nada.
      //    Se for um usuário novo (primeiro login), cria tudo e desbloqueia
      //    a conquista "Bem-vindo, corredor!" 👟 automaticamente.
      await initUsuario(user.uid, {
        nome:     data?.nome     || user.displayName || "Corredor",
        email:    data?.email    || user.email?.toLowerCase() || "",
        codigoId: data?.codigoId || updates.codigoId,
      });

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
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: 300, height: 300, resizeMode: 'contain', marginTop: -50 }}
        />
      </View>

      <View style={styles.BK2}>
        <Text style={styles.label}>Bem-vindo ao RunCap!</Text>
        <Text style={styles.subLabel}>Entre na sua conta para continuar</Text>

        <View style={styles.input}>
          <Fontisto name="email" size={20} color="#c1c1c1" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInputInner}
            placeholderTextColor="#c1c1c1"
            placeholder="E-mail"
            autoCapitalize='none'
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.input}>
          <Ionicons name="lock-closed" size={20} color="#c1c1c1" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.textInputInner}
            placeholderTextColor="#c1c1c1"
            placeholder="Senha"
            autoCapitalize='none'
            value={senha}
            secureTextEntry={verSenha}
            onChangeText={setSenha}
          />
          <TouchableOpacity onPress={() => setVerSenha(!verSenha)}>
            <Ionicons
              name={verSenha ? "eye-off" : "eye"}
              size={22}
              color="#24B28D"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ alignItems: "flex-end" }}
          onPress={() => router.push("/auth/recuperarSenha")}
        >
          <Text style={styles.TextEsqueci}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botao}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.textoBotao}>Entrar</Text>
          )}
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginVertical: 15 }}>
          {/* <Text style={{ color: '#A0A0A0' }}>ou</Text> */}
        </View>


        {/* <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={20} color="#34ff01" style={{ marginRight: 10 }} />
          <Text style={{ color: '#1B2B48', fontWeight: '600' }}>Continuar com Google</Text>
        </TouchableOpacity> */}

      </View>

      <View style={styles.viewCadastre}>
        <Text style={{ color: '#FFFFFF' }}>Não tem uma conta?</Text>
        <TouchableOpacity onPress={() => router.push("/auth/cadastro")}>
          <Text style={styles.cadastre}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
