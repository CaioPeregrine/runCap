import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import styles from './styles';
import { router } from 'expo-router';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    const auth = getAuth();

    if (email === "") {
      Alert.alert("Erro", "Por favor, digite seu e-mail.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert(
          "Sucesso",
          "Enviamos um link de redefinição para o seu e-mail. Verifique também a caixa de spam."
        );
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/user-not-found') {
          Alert.alert("Erro", "Usuário não encontrado.");
        } else if (errorCode === 'auth/invalid-email') {
          Alert.alert("Erro", "E-mail inválido.");
        } else {
          Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
        }
      });
  };

  return (
    <View style={styles.background}>
      
      {/* Ícone de e-mail verde no topo */}
      <View style={styles.containerIconeTopo}>
        <MaterialCommunityIcons name="email-outline" size={32} color="#FFFFFF" />
      </View>

      {/* Cabeçalho de texto */}
      <Text style={styles.tituloTela}>Recuperar minha senha!</Text>
      <Text style={styles.subtituloTela}>Iremos enviar um link para redefinir sua senha</Text>

      {/* Card branco centralizado */}
      <View style={styles.segundaCamada}>
        <View style={styles.campoContainer}>
          <Text style={styles.labelInput}>Email</Text>
          
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="seu@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.botao}>
          <Text style={styles.textoBotao}>Redefinir minha senha</Text>
        </TouchableOpacity>
      </View>

      {/* Link inferior para retornar */}
      <TouchableOpacity style={styles.botaoVoltar} onPress={()=> router.push('./login')}>
        <Text style={styles.textoBotaoVoltar}>← Voltar para o login</Text>
      </TouchableOpacity>

    </View>
  );
}
