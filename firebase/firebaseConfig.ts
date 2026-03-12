import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Copie esses dados do Firebase Console → Configurações do projeto → SDK Web
const firebaseConfig = {
  apiKey: "AIzaSyAFlgFqpJJ8Gol8y5meMcy6kncwsJo3968",
  authDomain: "runcap-ee9fe.firebaseapp.com",
  databaseURL: "https://runcap-ee9fe-default-rtdb.firebaseio.com",
  projectId: "runcap-ee9fe",
  storageBucket: "runcap-ee9fe.firebasestorage.app",
  messagingSenderId: "34660717424",
  appId: "1:34660717424:web:22e5cb45548a3893f0f5b5"
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);