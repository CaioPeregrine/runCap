import { Tabs } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';

export default function LayoutTabs() {
    return(
        <Tabs 
        screenOptions={{ 
            tabBarStyle: 
            { backgroundColor: "#fcfafa", 
            height: 70, 
            paddingBottom: 5,
            paddingTop: 5,
             },
             
            tabBarActiveTintColor: "#ef8605",
            tabBarInactiveTintColor: "#000000" }}>

            <Tabs.Screen name="index" options={{ headerShown: false, tabBarLabel: "index", tabBarIcon: () => <Feather name="home" size={24} color="black" /> }} />
            <Tabs.Screen name="home" options={{ headerShown: false, tabBarLabel: "home", tabBarIcon: () => <Feather name="home" size={24} color="black" /> }} />
            <Tabs.Screen name="relogio" options={{ headerShown: false, tabBarLabel: "relogio" }} />
            <Tabs.Screen name="ranking" options={{ headerShown: false, tabBarLabel: "ranking",tabBarIcon:() => <Octicons name="trophy" size={24} color="black" /> }} />
            <Tabs.Screen name="perfil" options={{ headerShown: false, tabBarLabel: "perfil", tabBarIcon: () => <FontAwesome5 name="user" size={24} color="black" /> }} />   
        </Tabs>
    )
}



  
