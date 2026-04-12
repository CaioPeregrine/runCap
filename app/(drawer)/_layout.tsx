import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import CustomDrawer from "../../components/customDrawer"; // Importando seu design

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        // AQUI ESTÁ O SEGREDO: Isso chama o seu arquivo CustomDrawer/index.tsx
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{ 
          headerShown: false, // Recomendo true para aparecer o botão de abrir o menu
          headerStyle: { backgroundColor: "#2C3F69" },
          headerTintColor: "#FFF",
          drawerStyle: { width: '80%' } // Largura do menu
        }} 
      >
        {/* 1. As abas principais */}
        <Drawer.Screen 
          name="(tabs)" 
          options={{ drawerLabel: "Início" }} 
        />

        {/* 2. Suas outras telas (Ajuste o name para 'pasta/index' se necessário) */}
        <Drawer.Screen 
          name="adicionarAmigos/index" 
          options={{ drawerLabel: "Adicionar Amigos" }} 
        />
        
        <Drawer.Screen 
          name="historico/index" 
          options={{ drawerLabel: "Histórico" }} 
        />
        
        <Drawer.Screen 
          name="conquistas/index" 
          options={{ drawerLabel: "Conquistas" }} 
        />
        
        <Drawer.Screen 
          name="rotasSugeridas/index" 
          options={{ drawerLabel: "Rotas Sugeridas" }} 
        />
        
        <Drawer.Screen 
          name="pontosTuristicos/index" 
          options={{ drawerLabel: "Pontos Turísticos" }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}