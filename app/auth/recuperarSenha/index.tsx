import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import styles from './styles';


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
        // Tratamento de erros comuns
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
    <View style={styles.segundaCamada}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Recuperar Senha</Text>
      
      <TextInput
        placeholder="Digite seu e-mail de cadastro"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 8,
          marginBottom: 20
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity 
        onPress={handleReset}
        style={{
          backgroundColor: '#ff4444', // Já usando o vermelho que você quer
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>ENVIAR E-MAIL</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
}