import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Octicons from "@expo/vector-icons/Octicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LayoutTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#2C3F69",
          width: "102%",
          height: 60 + insets.bottom,
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
      <Tabs.Screen
        name="home/index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          tabBarLabel: "Eventos",
          tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking/index"
        options={{
          tabBarLabel: "Ranking",
          tabBarIcon: ({ color }) => <Octicons name="trophy" size={24} color={color} />,    
        }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={24} color={color} />,
        }}
      />
     <Tabs.Screen 
    name="home/styles" 
    options={{ href: null }} 
  />
  <Tabs.Screen 
    name="events/styles" 
    options={{ href: null }} 
  />
  <Tabs.Screen 
    name="ranking/styles" 
    options={{ href: null }} 
  />
  <Tabs.Screen 
    name="perfil/styles" 
    options={{ href: null }} 
  />

    </Tabs>
  );
}