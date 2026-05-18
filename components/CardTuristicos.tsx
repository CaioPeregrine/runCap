import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CardTuristicosProps = {
  title: string;
  description: string;
  imageUrl: string;
  /** Se false, exibe o card bloqueado com cadeado. Padrão: false */
  desbloqueado?: boolean;
};

export default function CardTuristicos({
  title,
  description,
  imageUrl,
  desbloqueado = false,
}: CardTuristicosProps) {

  // ── Card BLOQUEADO ──────────────────────────────────────────────────────────
  if (!desbloqueado) {
    return (
      <View style={[styles.card, styles.cardBloqueado]}>
        {/* Imagem escureciida */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.img, styles.imgBloqueada]} />
        ) : (
          <View style={[styles.img, styles.imgBloqueada]} />
        )}

        {/* Overlay escuro sobre a imagem */}
        <View style={styles.overlayEscuro} />

        {/* Cadeado centralizado */}
        <View style={styles.cadeadoWrap}>
          <Ionicons name="lock-closed" size={36} color="#FFFFFF" />
          <Text style={styles.cadeadoTexto}>Complete a corrida{"\n"}para desbloquear</Text>
        </View>

        {/* Nome do local (visível mas cinza) */}
        <View style={styles.overlay}>
          <Text style={[styles.title, { color: "rgba(255,255,255,0.5)" }]}>{title}</Text>
        </View>
      </View>
    );
  }

  // ── Card DESBLOQUEADO ───────────────────────────────────────────────────────
  return (
    <TouchableOpacity style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.img} />
      ) : (
        <View style={styles.img} />
      )}

      {/* Badge "Visitado" */}
      <View style={styles.badgeVisitado}>
        <Ionicons name="checkmark-circle" size={14} color="#fff" />
        <Text style={styles.badgeTexto}>Visitado</Text>
      </View>

      <View style={styles.overlay}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView style={styles.descricaoScroll} nestedScrollEnabled>
        <Text style={styles.descricao}>{description}</Text>
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF9F2',
    height: 280,
    width: '100%',
    borderRadius: 20,
    margin: 5,
    overflow: 'hidden',
  },
  cardBloqueado: {
    backgroundColor: '#E5E7EB',
  },
  img: {
    backgroundColor: "#ffffff",
    width: '100%',
    height: 150,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imgBloqueada: {
    opacity: 0.35,
  },

  // Overlay escuro sobre imagem bloqueada
  overlayEscuro: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Cadeado centralizado na imagem
  cadeadoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cadeadoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Título sobre a imagem
  overlay: {
    position: 'absolute',
    top: 100,
    left: 5,
    right: 0,
    bottom: 0,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 2 },
    textShadowRadius: 10,
  },

  // Badge "Visitado"
  badgeVisitado: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C3A3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Descrição
  descricaoScroll: {
    marginTop: 60,
    paddingHorizontal: 10,
  },
  descricao: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});
