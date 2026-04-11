import { useEffect } from "react";
import { AppState } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase/firebaseConfig";
export function usePresenca() {
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "usuarios", user.uid);

    // Marca online ao montar (entrar no app)
    updateDoc(userRef, { status: "online" }).catch(console.error);

    // Detecta quando app vai para background ou volta para foreground
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        updateDoc(userRef, { status: "online" }).catch(console.error);
      } else if (nextState === "background" || nextState === "inactive") {
        updateDoc(userRef, { status: "offline" }).catch(console.error);
      }
    });

    return () => {
      // Marca offline ao desmontar (sair do app / fazer logout)
      updateDoc(userRef, { status: "offline" }).catch(console.error);
      subscription.remove();
    };
  }, []);
}
