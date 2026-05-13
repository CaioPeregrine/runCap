import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Octicons from "@expo/vector-icons/Octicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRef, useState } from "react";
import ModalModoCorrida from "../../../components/modoDeCorrida"; // ajuste o caminho se necessário

export default function LayoutTabs() {
  const insets = useSafeAreaInsets();
  const [modalVisivel, setModalVisivel] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function abrirModal() {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.85, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    setModalVisivel(true);
  }

  const TAB_HEIGHT = 60 + insets.bottom;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#2C3F69",
            width: "102%",
            height: TAB_HEIGHT,
            paddingBottom: insets.bottom + 5,
            paddingTop: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: "absolute",
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: "#22C3A3",
          tabBarInactiveTintColor: "#c1c1c1",
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="home/index"
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
          }}
        />

        {/* Eventos */}
        <Tabs.Screen
          name="events/index"
          options={{
            tabBarLabel: "Eventos",
            tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
          }}
        />

        {/* ── Botão central ── */}
        <Tabs.Screen
          name="correr"
          options={{
            tabBarLabel: "",
       tabBarButton: () => (
  <TouchableOpacity
    style={styles.centerWrapper}
    onPress={abrirModal}
    activeOpacity={0.9}
  >
    <Animated.View style={[styles.centerBtn, { transform: [{ scale: scaleAnim }] }]}>
      <Feather name="play" size={29} color="#fff" style={{ marginLeft: 4 }} />
    </Animated.View>
  </TouchableOpacity>
),
          }}
        />

        {/* Ranking */}
        <Tabs.Screen
          name="ranking/index"
          options={{
            tabBarLabel: "Ranking",
            tabBarIcon: ({ color }) => <Octicons name="trophy" size={24} color={color} />,
          }}
        />

        {/* Perfil */}
        <Tabs.Screen
          name="perfil/index"
          options={{
            tabBarLabel: "Perfil",
            tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={24} color={color} />,
          }}
        />

        {/* Rotas ocultas */}
        <Tabs.Screen name="home/styles"    options={{ href: null }} />
        <Tabs.Screen name="events/styles"  options={{ href: null }} />
        <Tabs.Screen name="ranking/styles" options={{ href: null }} />
        <Tabs.Screen name="perfil/styles"  options={{ href: null }} />
      </Tabs>

      {/* Modal de seleção de modo */}
      <ModalModoCorrida
        visivel={modalVisivel}
        onFechar={() => setModalVisivel(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
 centerWrapper: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
},
centerBtn: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: "#22C3A3",
  alignItems: "center",
  justifyContent: "center",
  marginTop: -30, // sobe o botão visualmente mas mantém a área de toque
  shadowColor: "#22C3A3",
  shadowOpacity: 0.5,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
},
});
