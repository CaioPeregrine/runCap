import { auth, db } from '@/firebase/firebaseConfig';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import styles from './styles';

// ─── Gera um ID único no formato ID + 6 caracteres ────────────────────────────
function gerarCodigoId(): string {
  return "ID" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegistro() {
    setError("");

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2️⃣ Atualiza o nome no perfil do Auth
      await updateProfile(user, { displayName: nome });

      // 3️⃣ ✅ Cria o documento do usuário no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        nivel: 1,
        status: "online",
        codigoId: gerarCodigoId(),
        amigos: [],
        totalKm: 0,
        criadoEm: serverTimestamp(),
        conquistas: [],
        areasFechardasTotal: 0,
        pontosVisitadosTotal: [],
      });

      console.log("Usuário criado com sucesso:", user.uid);
      router.push('./login');

    } catch (err: any) {
      let mensagem = "Erro ao criar conta.";
      if (err.code === "auth/email-already-in-use") {
        mensagem = "Este e-mail já está em uso.";
      } else if (err.code === "auth/weak-password") {
        mensagem = "A senha deve ter no mínimo 6 caracteres.";
      } else if (err.code === "auth/invalid-email") {
        mensagem = "E-mail inválido.";
      }
      setError(mensagem);
      alert(mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.background}>
      <View style={styles.segundaCamada}>

        <View style={styles.ViewSuperior}>
          <TouchableOpacity onPress={() => router.push('./login')}>
            <AntDesign name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.TerceiraCamada}>
          <View style={styles.Input}>
            <Feather name="user" size={20} color="black" style={{ marginRight: 5 }} />
            <TextInput
              maxLength={20}
              placeholderTextColor="#000000"
              placeholder="Nome do usuário"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={styles.Input}>
            <MaterialCommunityIcons name="email-outline" size={20} color="black" style={{ marginRight: 5 }} />
            <TextInput
              maxLength={100}
              placeholderTextColor="#000000"
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.Input}>
            <Ionicons name="lock-closed-outline" size={20} color="black" style={{ marginRight: 5 }} />
            <TextInput
              placeholderTextColor="#000000"
              placeholder="Senha"
              autoCapitalize="none"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          {error ? <Text style={styles.erroText}>{error}</Text> : null}
        </View>

        <TouchableOpacity style={styles.Botao} onPress={handleRegistro} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.textoBotao}>cadastrar</Text>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}
