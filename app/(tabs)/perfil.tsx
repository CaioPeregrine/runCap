/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Perfil.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASEADO NO SEU CÓDIGO ORIGINAL — o que foi mantido:
 *   • backgroundColor "#2C3F69" no fundo geral (inicial)
 *   • backgroundColor "#EDE8DF" no bloco superior (perfil)
 *   • backgroundColor "#b1832d" no círculo do avatar (circle)
 *   • backgroundColor "#1ffc48" na barra de XP (Cirxp)
 *   • Ideia do ScrollView de conquistas
 *
 * O QUE FOI EXPANDIDO:
 *   • Banner clicável para trocar imagem de fundo (Storage)
 *   • Avatar clicável com foto real do Storage
 *   • Barra XP animada com dados reais do Firestore
 *   • Grid 2×2 de estatísticas (km, tempo, sequência, corridas)
 *   • Conquistas: ScrollView vertical no perfil + Modal completo
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity,
  Image, Animated, Dimensions, Modal, FlatList,
  ActivityIndicator, Alert, Platform, StatusBar,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { db, storage } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// LISTA FIXA DE CONQUISTAS
// Fica no código. O Firestore guarda só os ids já desbloqueados.
// fetchConquistas() cruza as duas listas para marcar desbloqueada: true/false.
// ─────────────────────────────────────────────────────────────────────────────

const TODAS_CONQUISTAS = [
  { id: "bom_inicio",   titulo: "Bom Início",     descricao: "Complete sua primeira corrida",    icone: "🏅" },
  { id: "corrida_fogo", titulo: "Corrida Fogo",   descricao: "Corra 5 km em menos de 30 min",   icone: "🔥" },
  { id: "estrela_mes",  titulo: "Estrela do Mês", descricao: "Corra todos os dias por 30 dias", icone: "⭐" },
  { id: "lendario",     titulo: "Lendário",       descricao: "Alcance o nível 10",              icone: "👑" },
  { id: "maratonista",  titulo: "Maratonista",    descricao: "Acumule 42 km no total",          icone: "🏃" },
  { id: "sequencia_7",  titulo: "Sequência 7",    descricao: "7 dias consecutivos correndo",    icone: "📅" },
  { id: "velocista",    titulo: "Velocista",      descricao: "Corra 1 km em menos de 5 min",   icone: "⚡" },
  { id: "explorador",   titulo: "Explorador",     descricao: "Corra em 3 rotas diferentes",    icone: "🗺️" },
  { id: "madrugueiro",  titulo: "Madrugador",     descricao: "Corrida antes das 6h",           icone: "🌅" },
  { id: "centenario",   titulo: "Centenário",     descricao: "Complete 100 corridas",           icone: "💯" },
  { id: "ultraman",     titulo: "Ultraman",       descricao: "Corra 100 km no total",           icone: "🦸" },
  { id: "noturno",      titulo: "Noturno",        descricao: "Corrida após as 22h",            icone: "🌙" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * uploadImage
 * 1. fetch(uri) — lê o arquivo local (file://...)
 * 2. .blob()   — converte para formato aceito pelo Storage
 * 3. uploadBytes — envia para o Firebase Storage
 * 4. getDownloadURL — retorna URL pública para salvar no Firestore
 */
async function uploadImage(uri: string, path: string): Promise<string> {
  const response = await fetch(uri);
  const blob     = await response.blob();
  const fileRef  = ref(storage, path);
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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: BarraXP
// Antigo "Brxp" (container branco) + "Cirxp" (barra verde interna).
// Manteve as cores originais. Adicionou animação e valores reais.
//
// useRef → guarda Animated.Value sem causar re-render
// useEffect → dispara Animated.timing ao montar (0 → pct% em 900ms)
// interpolate → converte número em string de porcentagem para o style width
// useNativeDriver:false → obrigatório para animar "width" (não suportado no nativo)
// ─────────────────────────────────────────────────────────────────────────────

function BarraXP({ xp, xpProximo, nivel }: { xp: number; xpProximo: number; nivel: number }) {
  const pct       = Math.min((xp / xpProximo) * 100, 100);
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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: StatCard
// Card reutilizável para uma estatística. Usado 4× no grid 2×2.
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icone, valor, rotulo }: { icone: string; valor: string; rotulo: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcone}>{icone}</Text>
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statRotulo}>{rotulo}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: ModalConquistas
// Grade 3 colunas com todas as conquistas.
// Desbloqueada → colorida + clicável
// Bloqueada    → cinza + cadeado + disabled (toque desativado)
// Destaque     → borda verde + check (a pinada no perfil)
// ─────────────────────────────────────────────────────────────────────────────

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
              <Text style={[styles.cqDesc,   !c.desbloqueada && styles.cqTextoOff]} numberOfLines={2}>{c.descricao}</Text>
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
  const uid  = auth.currentUser?.uid ?? "";

  const [nome,          setNome]          = useState("Corredor");
  const [codigoId,      setCodigoId]      = useState("");
  const [nivel,         setNivel]         = useState(1);
  const [xp,            setXp]            = useState(0);
  const [xpProximo,     setXpProximo]     = useState(2000);
  const [totalKm,       setTotalKm]       = useState(0);
  const [totalMin,      setTotalMin]      = useState(0);
  const [sequencia,     setSequencia]     = useState(0);
  const [totalCorridas, setTotalCorridas] = useState(0);
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null);
  const [bgUrl,         setBgUrl]         = useState<string | null>(null);
  const [conquistas,    setConquistas]    = useState<(typeof TODAS_CONQUISTAS[0] & { desbloqueada: boolean })[]>([]);
  const [destaque,      setDestaque]      = useState<string | null>(null);
  const [modalAberto,   setModalAberto]   = useState(false);
  const [loadAvatar,    setLoadAvatar]    = useState(false);
  const [loadBg,        setLoadBg]        = useState(false);
  const [carregando,    setCarregando]    = useState(true);

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
      const u    = uDoc.data();
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
   * Lê array de ids desbloqueados do Firestore e mescla com TODAS_CONQUISTAS.
   */
  async function fetchConquistas() {
    try {
      const uDoc = await getDoc(doc(db, "usuarios", uid));
      const ids: string[] = uDoc.data()?.conquistas ?? [];
      setConquistas(TODAS_CONQUISTAS.map((c) => ({ ...c, desbloqueada: ids.includes(c.id) })));
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
  const iniciais      = nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

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

        {/* ══════════════════════════════════════════════════════════════
            BLOCO SUPERIOR
            Antigo: "perfil" (fundo bege) + "circle" (avatar marrom) + "nome"
            Novo: banner clicável + avatar com foto real + info ao lado
        ══════════════════════════════════════════════════════════════ */}
        <View style={styles.perfil}>

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
        <View style={styles.secao}>
          <View style={styles.statsGrid}>
            <StatCard icone="🛣️" valor={`${totalKm.toFixed(1)} km`} rotulo="Distância total" />
            <StatCard icone="⏱️" valor={formatarTempo(totalMin)}      rotulo="Tempo total"     />
            <StatCard icone="🔥" valor={`${sequencia} dias`}          rotulo="Maior sequência" />
            <StatCard icone="🏃" valor={`${totalCorridas}`}           rotulo="Corridas"        />
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

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS — nomes originais mantidos onde possível
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Fundo geral — cor original #2C3F69 mantida
  inicial: { flex: 1, backgroundColor: "#2C3F69" },

  // Bloco bege superior — cor original #EDE8DF mantida
  perfil: { backgroundColor: "#EDE8DF", paddingBottom: 20 },

  bannerArea: { width: "100%", height: 130, overflow: "hidden" },
  bannerImg:  { width: "100%", height: "100%", resizeMode: "cover" },
  bannerCamera: {
    position: "absolute", bottom: 8, right: 12,
    backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 16, padding: 6,
  },

  // marginTop: -40 → avatar sobe sobre o banner (overlap)
  perfilInfo: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 20, marginTop: -40, gap: 14,
  },

  // Círculo — cor original #b1832d mantida
  circle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: "#EDE8DF",
    backgroundColor: "#b1832d",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 4,
  },
  circleImg:     { width: "100%", height: "100%", resizeMode: "cover" },
  circleIniciais:{ color: "#fff", fontSize: 26, fontWeight: "800" },
  circleLapis: {
    position: "absolute", bottom: 3, right: 3,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#22C3A3", alignItems: "center", justifyContent: "center",
  },

  nomeBox:   { flex: 1, paddingBottom: 4 },
  nomeTexto: { color: "#2C3F69", fontSize: 17, fontWeight: "800" },
  idTexto:   { color: "#888", fontSize: 11, marginTop: 2 },
  nivelBadge:{
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#2C3F69", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginTop: 5,
  },
  nivelTexto: { color: "#FFD700", fontSize: 12, fontWeight: "700" },

  secao: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, paddingVertical: 16,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6,
  },
  secaoHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, marginBottom: 12,
  },
  secaoTitulo: { color: "#2C3F69", fontSize: 16, fontWeight: "800" },
  verTodas:    { color: "#22C3A3", fontSize: 13, fontWeight: "600" },

  // Barra XP — Brxp (trilha branca) + Cirxp (barra verde #1ffc48 original)
  xpBox:     { paddingHorizontal: 16 },
  xpTopo:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  xpLabel:   { color: "#2C3F69", fontWeight: "700", fontSize: 14 },
  xpValor:   { color: "#888", fontSize: 13 },
  xpTrilha:  { height: 20, backgroundColor: "#EBEBF0", borderRadius: 20, overflow: "hidden" },
  xpBarra:   { height: "100%", backgroundColor: "#1ffc48", borderRadius: 20 },
  xpRodape:  { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  xpFaltando:{ color: "#888", fontSize: 11 },
  xpNivel:   { color: "#888", fontSize: 11 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
  statCard:  { width: (width - 32 - 10 - 24) / 2, backgroundColor: "#F7F8FC", borderRadius: 12, padding: 14 },
  statIcone: { fontSize: 22, marginBottom: 6 },
  statValor: { color: "#2C3F69", fontSize: 20, fontWeight: "800" },
  statRotulo:{ color: "#888", fontSize: 12, marginTop: 3 },

  semCq:    { color: "#888", fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  cqPerfil: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F7F8FC", borderRadius: 12, padding: 12,
  },
  cqPerfilDestaque: { borderWidth: 1.5, borderColor: "#22C3A3", backgroundColor: "#F0FBF8" },
  cqPerfilIcone:    { fontSize: 26 },
  cqPerfilTitulo:   { color: "#2C3F69", fontSize: 13, fontWeight: "700" },
  cqPerfilDesc:     { color: "#888", fontSize: 11, marginTop: 2 },

  menuItem:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  menuDivisor:{ height: 1, backgroundColor: "#F0F0F5", marginHorizontal: 16 },
  menuTexto:  { color: "#2C3F69", fontSize: 15, fontWeight: "500" },

  modalWrap: { flex: 1, backgroundColor: "#F2F4F8" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, paddingTop: Platform.OS === "android" ? 40 : 20,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F5",
  },
  modalTitulo: { color: "#2C3F69", fontSize: 20, fontWeight: "800" },
  modalDica:   { color: "#888", fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff" },

  cqItem: {
    flex: 1, margin: 5, backgroundColor: "#fff", borderRadius: 14, padding: 12,
    alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, position: "relative", minHeight: 115,
  },
  cqBloqueada:  { backgroundColor: "#F0F0F5", elevation: 0 },
  cqDestaque:   { borderWidth: 2, borderColor: "#22C3A3" },
  cqIcone:  { fontSize: 28, marginBottom: 6 },
  cqTitulo: { color: "#2C3F69", fontSize: 11, fontWeight: "700", textAlign: "center" },
  cqDesc:   { color: "#888", fontSize: 9, textAlign: "center", marginTop: 3 },
  cqTextoOff: { color: "#BBBBC8" },
  cqCadeado:  { position: "absolute", top: 8, right: 8 },
  cqCheck:    { position: "absolute", top: 6, left: 6 },
});
