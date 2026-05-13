import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Pressable, Dimensions,
} from "react-native";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Octicons from "@expo/vector-icons/Octicons";

const { height } = Dimensions.get("window");
import styles from './styles';


interface Props {
  visivel: boolean;
  onFechar: () => void;
}

export default function ModalModoCorrida({ visivel, onFechar }: Props) {
  const slideAnim  = useRef(new Animated.Value(300)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.95)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
        Animated.spring(scaleAnim1, { toValue: 1, tension: 80, friction: 8, delay: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim2, { toValue: 1, tension: 80, friction: 8, delay: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
      scaleAnim1.setValue(0.95);
      scaleAnim2.setValue(0.95);
    }
  }, [visivel]);

  function irModeLivre() {
    onFechar();
    setTimeout(() => router.push("../../../telaCorrendo"), 250);
  }

  function irRotaProgramada() {
    onFechar();
    setTimeout(() => router.push("../../../correndoPontoT"), 250);
  }

  return (
    <Modal transparent visible={visivel} animationType="none" onRequestClose={onFechar}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Como você{"\n"}quer correr?</Text>
            <Text style={styles.subtitle}>Escolha seu modo de corrida em Manaus.</Text>
          </View>
          <TouchableOpacity onPress={onFechar} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Opção 1 — Modo Livre */}
        <Animated.View style={{ transform: [{ scale: scaleAnim1 }] }}>
          <TouchableOpacity
            style={[styles.opcao, styles.opcaoDestaque]}
            onPress={irModeLivre}
            activeOpacity={0.88}
          >
            <View style={[styles.opcaoIcone, styles.opcaoIconeDestaque]}>
              <Octicons name="location" size={24} color="#fff" />
            </View>
            <View style={styles.opcaoTexto}>
              <Text style={[styles.opcaoTitulo, { color: "#fff" }]}>Modo Livre</Text>
              <Text style={[styles.opcaoDesc, { color: "rgba(255,255,255,0.8)" }]}>
                Conquiste Manaus do seu jeito!
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={14} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Opção 2 — Rota Programada */}
        <Animated.View style={{ transform: [{ scale: scaleAnim2 }] }}>
          <TouchableOpacity
            style={[styles.opcao, styles.opcaoNormal]}
            onPress={irRotaProgramada}
            activeOpacity={0.88}
          >
            <View style={[styles.opcaoIcone, styles.opcaoIconeNormal]}>
              <FontAwesome5 name="route" size={22} color="#444" />
            </View>
            <View style={styles.opcaoTexto}>
              <Text style={[styles.opcaoTitulo, { color: "#1a1a2e" }]}>Rota Programada</Text>
              <Text style={[styles.opcaoDesc, { color: "#888" }]}>
                Explore a cultura regional em trajetos históricos.
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </Animated.View>
    </Modal>
  );
}
