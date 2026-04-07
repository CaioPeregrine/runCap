import { createDrawerNavigator } from "@react-navigation/drawer";
import Ranking from "../(tabs)/ranking";
import AdicionarAmigos from "./adicionarAmigos";
import Conquistas from "./conquistas";
import Historico from "./historico";
import pontosTuristicos from "./pontosTuristicos";
import RotasSugeridas from "./rotasSugeridas";

const Drawer = createDrawerNavigator();
export default function DrawerLayout(){
  return(
      <Drawer.Navigator initialRouteName="Ranking" screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="Ranking" component={Ranking} />
        <Drawer.Screen name="Adicionar Amigos" component={AdicionarAmigos} />
        <Drawer.Screen name="Conquistas" component={Conquistas} />
        <Drawer.Screen name="Histórico" component={Historico} />
        <Drawer.Screen name="Pontos Turísticos" component={pontosTuristicos} />
        <Drawer.Screen name="Rotas Sugeridas" component={RotasSugeridas} />
      </Drawer.Navigator>
  )
}