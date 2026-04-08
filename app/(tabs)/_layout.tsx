import { Tabs } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';

export default function LayoutTabs() {
    return(
        <Tabs 
        screenOptions={{ 
            tabBarStyle: 
            { backgroundColor: "#2C3F69",
            width: "100%",     
            height: 70, 
            paddingBottom:5,
            paddingTop: 5,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
           
            
             },
             
            tabBarActiveTintColor: "#22C3A3",
            tabBarInactiveTintColor: "#c1c1c1" }}>

           
            <Tabs.Screen name="home" options={{ headerShown: false, tabBarLabel: "home", tabBarIcon: ({color}) => <Feather name="home" size={24} color={color} /> }} />
            <Tabs.Screen name="relogio" options={{ headerShown: false, tabBarLabel: "relogio" }} />
            <Tabs.Screen name="ranking" options={{ headerShown: false, tabBarLabel: "ranking",tabBarIcon:({color}) => <Octicons name="trophy" size={24} color={color}  /> }} />
            <Tabs.Screen name="perfil" options={{ headerShown: false, tabBarLabel: "perfil", tabBarIcon: ({color}) => <FontAwesome5 name="user" size={24} color={color}  /> }} />   
        </Tabs>
    )
}



  
