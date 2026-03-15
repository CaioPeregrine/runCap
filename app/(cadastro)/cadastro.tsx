import { auth } from '@/firebase/firebaseConfig';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


export default function Recup() {
 const [email, setEmail] = useState("");
 const [senha, setSenha] = useState("");
 const [nome, setNome] = useState("");
 const [error, setError] = useState("");

 async function handleRegistro(){
    setError("");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        
        // Adicionando o nome ao perfil do usuário
        await updateProfile(userCredential.user, { displayName: nome });
        
        console.log("Usuário criado:", userCredential.user.uid);
        router.push('./login');
    } catch (err: any) {
        setError("Erro ao criar conta: " + err.message);
        alert(err.message);
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
                        <Feather  name="user" size={20} color="black" style={{marginRight: 5}} />
                        <TextInput maxLength={100} placeholderTextColor="#000000" placeholder="Nome do usuário"
                        value={nome}
                        onChangeText={setNome}></TextInput>
                    </View>

                    <View style={styles.Input}>
                        <MaterialCommunityIcons name="email-outline" size={20} color="black" style={{marginRight: 5}} />
                        <TextInput maxLength={100} placeholderTextColor="#000000" placeholder="Email"
                        value = {email} 
                        onChangeText={setEmail}></TextInput>
                    </View>

                    <View style={styles.Input}>
                        <Ionicons name="lock-closed-outline" size={20} color="black" style={{marginRight: 5}} />
                        <TextInput  placeholderTextColor="#000000" placeholder="Senha"
                        value = {senha} 
                        onChangeText={setSenha}></TextInput>
                    </View>


                </View>
                <View>
                    <TouchableOpacity style={styles.Botao}>
                        <Text style={styles.textoBotao} onPress={handleRegistro}>cadastrar</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#2C3F69",

    },

    segundaCamada: {
        width: "100%",
        height: '88%',
        alignItems: 'center',
        backgroundColor: '#EDE8DF',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 120,
    },
    TerceiraCamada: {

        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "20%",
        borderRadius: 20,

    },
    Input: {
        width: 280,
        borderWidth: 1,
        borderColor: "#2C3F69",
        borderRadius: 12,
        padding: 7,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",

    },

    Botao: {
        backgroundColor: "#2C3F69",
        borderRadius: 18,
        padding: 10,
        marginTop: 25,
        alignItems: "center",
        width: 280,
    },

    textoBotao: {
        fontFamily: "helvetica",
        fontWeight: "bold",
        fontSize: 24,
        color: "#ffffff",
    },

    ViewSuperior: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 16,

    },



})  