import { Tabs } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function LayoutTabs() {
    const insets = useSafeAreaInsets();

    function handleStart() {
        throw new Error("Function not implemented.");
    }

    function EmptyScreen() {
        return null;
    }

    return (
        <Tabs
            screenOptions={{
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
            }}>

            <Tabs.Screen name="home" options={{ headerShown: false, tabBarLabel: "Home", tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} /> }} />
            <Tabs.Screen name="relogio" options={{ headerShown: false, tabBarLabel: "Eventos", tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} /> }} />
            <Tabs.Screen name="ranking" options={{ headerShown: false, tabBarLabel: "Ranking", tabBarIcon: ({ color }) => <Octicons name="trophy" size={24} color={color} /> }} />
            <Tabs.Screen name="perfil" options={{ headerShown: false, tabBarLabel: "Perfil", tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={24} color={color} /> }} />
        </Tabs>
    );
}
