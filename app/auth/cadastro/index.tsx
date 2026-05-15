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
import Fontisto from '@expo/vector-icons/Fontisto';


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
  const [verSenha, setVerSenha] = useState<boolean>(true);
  

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
      
      <View style={styles.ViewSuperior}>
        <TouchableOpacity onPress={() => router.push('./login')}>
          <AntDesign name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloTela}>Crie sua Conta!</Text>
      <Text style={styles.subtituloTela}>Registre-se no RunCap!</Text>

      <View style={styles.segundaCamada}>
        <View style={styles.TerceiraCamada}>
          

            <View style={styles.input}>
              <Feather name="user" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                maxLength={20}
                placeholderTextColor="#9CA3AF"
                placeholder="Insira seu nome"
                value={nome}
                onChangeText={setNome}
              />
            </View>
        

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

          {error ? <Text style={styles.erroText}>{error}</Text> : null}
        </View>

        <TouchableOpacity style={styles.Botao} onPress={handleRegistro} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.textoBotao}>Criar minha conta</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.rodapeContainer}>
        <Text style={styles.textoRodape}>Já tem uma conta? </Text>
        <TouchableOpacity onPress={() => router.push('./login')}>
          <Text style={styles.linkRodape}>Entrar</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
