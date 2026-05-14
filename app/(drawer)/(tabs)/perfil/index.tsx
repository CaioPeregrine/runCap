

  import React, { useEffect, useRef, useState } from "react";
  import {
    ActivityIndicator, Alert,
    Animated, Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
  } from "react-native";

  import { Ionicons } from "@expo/vector-icons";
  import * as ImagePicker from "expo-image-picker";
  import { LinearGradient } from "expo-linear-gradient";

  import { conquistasData } from "../../conquistas/conquistasData";
  import { db, storage } from "../../../../firebase/firebaseConfig";
  import { getAuth } from "firebase/auth";
  import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
  import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
  import styles from "./styles";


  const { width } = Dimensions.get("window");

  async function uploadImage(uri: string, path: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
  }

  /** Converte minutos → "45 min" ou "1h 30min" */
  function formatarTempo(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }


  function BarraXP({ xp, xpProximo, nivel }: { xp: number; xpProximo: number; nivel: number }) {
    const pct = Math.min((xp / xpProximo) * 100, 100);
    const animWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animWidth, { toValue: pct, duration: 900, useNativeDriver: false }).start();
    }, [pct]);

    const largura = animWidth.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

    return (
      <View style={styles.xpBox}>
        <View style={styles.xpTopo}>
          <Text style={styles.xpLabel}>Progresso XP</Text>
          <Text style={styles.xpValor}>{xp.toLocaleString()} / {xpProximo.toLocaleString()}</Text>
        </View>
        {/* Trilha branca — antigo Brxp */}
        <View style={styles.xpTrilha}>
          {/* Barra verde animada — antigo Cirxp */}
          <Animated.View style={[styles.xpBarra, { width: largura }]} />
        </View>
        <View style={styles.xpRodape}>
          <Text style={styles.xpFaltando}>{(xpProximo - xp).toLocaleString()} xp para o próximo nível</Text>
          <Text style={styles.xpNivel}>nível {nivel}</Text>
        </View>
      </View>
    );
  }

  function StatCard({ icone, valor, rotulo }: { icone: string; valor: string; rotulo: string }) {
    return (
      <View style={styles.statCard}>
        <Text style={styles.statIcone}>{icone}</Text>
        <Text style={styles.statValor}>{valor}</Text>
        <Text style={styles.statRotulo}>{rotulo}</Text>
      </View>
    );
  }

  function ModalConquistas({ visivel, onFechar, conquistas, destaque, onSelecionar }: {
    visivel: boolean;
    onFechar: () => void;
    conquistas: { id: string; titulo: string; descricao: string; icone: string; desbloqueada: boolean }[];
    destaque: string | null;
    onSelecionar: (id: string) => void;
  }) {
    return (
      <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
        <View style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Conquistas</Text>
            <TouchableOpacity onPress={onFechar}>
              <Ionicons name="close-circle" size={28} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalDica}>Toque em uma desbloqueada para exibi-la no perfil.</Text>

          <FlatList
            data={conquistas}
            keyExtractor={(c) => c.id}
            numColumns={3}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            renderItem={({ item: c }) => (
              <TouchableOpacity
                style={[
                  styles.cqItem,
                  !c.desbloqueada && styles.cqBloqueada,
                  c.id === destaque && styles.cqDestaque,
                ]}
                onPress={() => onSelecionar(c.id)}
                disabled={!c.desbloqueada}
                activeOpacity={0.75}
              >
                <Text style={[styles.cqIcone, !c.desbloqueada && { opacity: 0.2 }]}>{c.icone}</Text>
                <Text style={[styles.cqTitulo, !c.desbloqueada && styles.cqTextoOff]}>{c.titulo}</Text>
                <Text style={[styles.cqDesc, !c.desbloqueada && styles.cqTextoOff]} numberOfLines={2}>{c.descricao}</Text>
                {!c.desbloqueada && <View style={styles.cqCadeado}><Ionicons name="lock-closed" size={12} color="#BBBBC8" /></View>}
                {c.id === destaque && <View style={styles.cqCheck}><Ionicons name="checkmark-circle" size={17} color="#22C3A3" /></View>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TELA PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────

  export default function Perfil() {
    const auth = getAuth();
    const uid = auth.currentUser?.uid ?? "";

    const [nome, setNome] = useState("Corredor");
    const [codigoId, setCodigoId] = useState("");
    const [nivel, setNivel] = useState(1);
    const [xp, setXp] = useState(0);
    const [xpProximo, setXpProximo] = useState(2000);
    const [totalKm, setTotalKm] = useState(0);
    const [totalMin, setTotalMin] = useState(0);
    const [sequencia, setSequencia] = useState(0);
    const [totalCorridas, setTotalCorridas] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bgUrl, setBgUrl] = useState<string | null>(null);
    const [conquistas, setConquistas] = useState<(typeof conquistasData[0] & { desbloqueada: boolean })[]>([]);
    const [destaque, setDestaque] = useState<string | null>(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [loadAvatar, setLoadAvatar] = useState(false);
    const [loadBg, setLoadBg] = useState(false);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => { if (uid) { fetchDados(); fetchConquistas(); } }, [uid]);

    /**
     * fetchDados
     * Lê o documento do usuário + soma corridas para calcular stats.
     * totalKm/totalMin/totalCorridas são CALCULADOS (não salvos) para
     * evitar inconsistência caso corridas sejam deletadas no futuro.
     */
    async function fetchDados() {
      try {
        const uDoc = await getDoc(doc(db, "usuarios", uid));
        const u = uDoc.data();
        const snap = await getDocs(query(collection(db, "corridas"), where("uid", "==", uid)));
        let km = 0, min = 0, total = 0;
        snap.forEach((d) => { km += d.data().distancia_km || 0; min += d.data().duracao_min || 0; total++; });

        setNome(u?.nome ?? "Corredor");
        setCodigoId(u?.codigoId ?? "");
        setNivel(u?.nivel ?? 1);
        setXp(u?.xp ?? 0);
        setXpProximo(u?.xpProximoNivel ?? 2000);
        setSequencia(u?.maiorSequencia ?? 0);
        setAvatarUrl(u?.avatarUrl ?? null);
        setBgUrl(u?.backgroundUrl ?? null);
        setDestaque(u?.conquistaDestaque ?? null);
        setTotalKm(km); setTotalMin(min); setTotalCorridas(total);
      } catch (e) { console.error(e); }
      finally { setCarregando(false); }
    }

    /**
     * fetchConquistas
     * Lê array de ids desbloqueados do Firestore e mescla com conquistasData.
     */
    async function fetchConquistas() {
      try {
        const uDoc = await getDoc(doc(db, "usuarios", uid));
        const ids: string[] = uDoc.data()?.conquistas ?? [];
        setConquistas(conquistasData.map((c) => ({ ...c, desbloqueada: ids.includes(c.id) })));
      } catch (e) { console.error(e); }
    }

    /**
     * escolherAvatar
     * Permissão → ImagePicker [1,1] → uploadImage → Firestore → setState
     * aspect [1,1]: recorte quadrado ideal para o círculo do avatar
     */
    async function escolherAvatar() {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Precisamos de acesso à galeria."); return; }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (res.canceled) return;
      setLoadAvatar(true);
      try {
        const uri = res.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `avatars/${uid}.jpg`);
        await uploadBytes(fileRef, blob);
        const url = await getDownloadURL(fileRef);
        await updateDoc(doc(db, "usuarios", uid), { avatarUrl: url });
        setAvatarUrl(url);
      } catch (e) {
        console.error("Erro avatar:", e);
        Alert.alert("Erro ao atualizar avatar.");
      }
      finally { setLoadAvatar(false); }
    }

    /**
     * escolherBackground
     * Mesmo fluxo do avatar. aspect [16,7] para banner horizontal.
     */
    async function escolherBackground() {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Precisamos de acesso à galeria."); return; }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", allowsEditing: true, aspect: [16, 7], quality: 0.8,
      });
      if (res.canceled) return;
      setLoadBg(true);
      try {
        const uri = res.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `backgrounds/${uid}.jpg`);
        await uploadBytes(fileRef, blob);
        const url = await getDownloadURL(fileRef);
        await updateDoc(doc(db, "usuarios", uid), { backgroundUrl: url });
        setBgUrl(url);
      } catch (e) {
        console.error("Erro background:", e);
        Alert.alert("Erro ao atualizar background.");
      }
      finally { setLoadBg(false); }
    }

    /**
     * selecionarDestaque
     * Toggle: clicar na selecionada → remove (null). Outra → seleciona.
     * ATUALIZAÇÃO OTIMISTA: setState antes do await → UI responde na hora.
     */
    async function selecionarDestaque(id: string) {
      const novo = id === destaque ? null : id;
      setDestaque(novo);
      try { await updateDoc(doc(db, "usuarios", uid), { conquistaDestaque: novo }); }
      catch (e) { console.error(e); }
    }

    const desbloqueadas = conquistas.filter((c) => c.desbloqueada);
    const iniciais = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    if (carregando) {
      return (
        <View style={[styles.inicial, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color="#22C3A3" />
        </View>
      );
    }

    return (
      <View style={styles.inicial}>
        <StatusBar barStyle="light-content" backgroundColor="#2C3F69" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>


          <View>

            {/* Banner — toca para trocar o fundo */}
            <TouchableOpacity style={styles.bannerArea} onPress={escolherBackground} activeOpacity={0.85}>
              {bgUrl
                ? <Image source={{ uri: bgUrl }} style={styles.bannerImg} />
                : <LinearGradient colors={["#EDE8DF", "#c8c3bb"]} style={{ flex: 1 }} />}
              <View style={styles.bannerCamera}>
                {loadBg ? <ActivityIndicator size="small" color="#2C3F69" /> : <Ionicons name="camera" size={15} color="#2C3F69" />}
              </View>
            </TouchableOpacity>

            {/* Avatar + textos — marginTop negativo cria o overlap sobre o banner */}
            <View style={styles.perfilInfo}>
              <TouchableOpacity onPress={escolherAvatar} activeOpacity={0.85}>
                <View style={styles.circle}>
                  {loadAvatar ? (
                    <ActivityIndicator color="#fff" />
                  ) : avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.circleImg} />
                  ) : (
                    // Sem foto: iniciais sobre cor original #b1832d
                    <Text style={styles.circleIniciais}>{iniciais}</Text>
                  )}
                  <View style={styles.circleLapis}>
                    <Ionicons name="pencil" size={10} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Antigo "nome" — agora com ID e badge de nível */}
              <View style={styles.nomeBox}>
                <Text style={styles.nomeTexto} numberOfLines={1}>{nome}</Text>
                <Text style={styles.idTexto}>ID: {codigoId}</Text>
                <View style={styles.nivelBadge}>
                  <Ionicons name="star" size={11} color="#FFD700" />
                  <Text style={styles.nivelTexto}>nível {nivel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              BARRA DE XP — antigo Brxp + Cirxp, agora animada
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.secao}>
            <BarraXP xp={xp} xpProximo={xpProximo} nivel={nivel} />
          </View>

          {/* ══════════════════════════════════════════════════════════════
              ESTATÍSTICAS — substituiu o scrollview de texto aleatório
          ══════════════════════════════════════════════════════════════ */}
          <View style={{
            marginHorizontal: 16, marginTop: 12,
            borderRadius: 16, paddingVertical: 16,
          }}>
            <View style={styles.statsGrid}>
              <StatCard icone="" valor={`${totalKm.toFixed(1)} km`} rotulo="Distância total" />
              <StatCard icone="" valor={formatarTempo(totalMin)} rotulo="Tempo total" />
              <StatCard icone="" valor={`${sequencia} dias`} rotulo="Maior sequência" />
              <StatCard icone="" valor={`${totalCorridas}`} rotulo="Corridas" />
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              CONQUISTAS — ScrollView vertical + botão "ver todas"
              nestedScrollEnabled: obrigatório no Android para scroll
              dentro de scroll funcionar corretamente.
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.secao}>
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Conquistas</Text>
              <TouchableOpacity onPress={() => setModalAberto(true)}>
                <Text style={styles.verTodas}>ver todas ›</Text>
              </TouchableOpacity>
            </View>
            {desbloqueadas.length === 0 ? (
              <Text style={styles.semCq}>Nenhuma conquista ainda. Comece a correr! 🏅</Text>
            ) : (
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}
                style={{ maxHeight: 240 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                {desbloqueadas.map((c) => (
                  <View key={c.id} style={[styles.cqPerfil, c.id === destaque && styles.cqPerfilDestaque]}>
                    <Text style={styles.cqPerfilIcone}>{c.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cqPerfilTitulo}>{c.titulo}</Text>
                      <Text style={styles.cqPerfilDesc}>{c.descricao}</Text>
                    </View>
                    {c.id === destaque && <Ionicons name="checkmark-circle" size={20} color="#22C3A3" />}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Menu */}
          <View style={[styles.secao, { paddingVertical: 0 }]}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuTexto}>Histórico de corridas</Text>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
            <View style={styles.menuDivisor} />
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuTexto}>Configurações</Text>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

        </ScrollView>

        <ModalConquistas
          visivel={modalAberto}
          onFechar={() => setModalAberto(false)}
          conquistas={conquistas}
          destaque={destaque}
          onSelecionar={selecionarDestaque}
        />
      </View>
    );
  }
