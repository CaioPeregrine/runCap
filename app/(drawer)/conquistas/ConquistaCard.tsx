import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import styles from "./styles";

interface ConquistaCardProps {
  id: string;        // ← adicionado
  titulo: string;
  descricao: string;
  icone: string;
  desbloqueada?: boolean;
}

export default function ConquistaCard({
  id,
  titulo,
  descricao,
  icone,
  desbloqueada = false,
}: ConquistaCardProps) {
  return (
    <View
      style={[
        styles.card,
        !desbloqueada && styles.cardLocked,
      ]}
    >
      {/* Ícone da Conquista */}
      <View style={styles.cardIconeArea}>
        <Text
          style={[
            styles.cardIcone as any,
            !desbloqueada && styles.cardIconeLocked,
          ]}
        >
          {icone}
        </Text>
      </View>

      {/* Título */}
      <Text
        style={[
          styles.cardTitulo,
          !desbloqueada && styles.cardTextoOff,
        ]}
        numberOfLines={2}
      >
        {titulo}
      </Text>

      {/* Descrição */}
      <Text
        style={[
          styles.cardDescricao,
          !desbloqueada && styles.cardTextoOff,
        ]}
        numberOfLines={2}
      >
        {descricao}
      </Text>

      {/* Cadeado (se bloqueada) */}
      {!desbloqueada && (
        <View style={styles.cardCadeado}>
          <Ionicons name="lock-closed" size={16} color="#A9ABB5" />
        </View>
      )}
    </View>
  );
}
