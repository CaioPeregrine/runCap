import { View,Text} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { DrawerActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";   


export default function Conquistas() {
    const navigation = useNavigation();
    return (
        <View>
               {/* Botão hamburguer */}
                  <TouchableOpacity 
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={{ position: 'absolute', top: 80, left: 15, zIndex: 10 }}
                  >
                    <Feather name="menu" size={30} color="black" />
                  </TouchableOpacity> 
            <Text>Em Breve...</Text>
        </View>
    )
}