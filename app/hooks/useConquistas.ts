import { db } from "../../firebase/firebaseConfig";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { conquistasData } from "../(drawer)/conquistas/conquistasData";

export function useConquistas() {

  async function verificarConquistasPorNivel(uid: string, nivelAtual: number) {
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, "usuarios", uid));
      const data = snap.data() ?? {};
      const jaDesbloqueadas: string[] = data.conquistas ?? [];

      const novas = conquistasData
        .filter(c => c.nivelRequerido <= nivelAtual && !jaDesbloqueadas.includes(c.id))
        .map(c => c.id);

      if (novas.length === 0) return;

      await updateDoc(doc(db, "usuarios", uid), {
        conquistas: arrayUnion(...novas),
      });
    } catch (e) {
      console.error("Erro ao verificar conquistas:", e);
    }
  }

  async function migrarKmAntigos(uid: string) {
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, "usuarios", uid));
      const data = snap.data() ?? {};
      const nivel = data.nivel ?? 1;
      await verificarConquistasPorNivel(uid, nivel);
    } catch (e) {
      console.error("Erro na migração:", e);
    }
  }

  return { verificarConquistasPorNivel, migrarKmAntigos };
}