import { View, Text ,StyleSheet,} from "react-native";
import Map from "react-native-maps";

const coordenada = {
    latitude: -3.1341937992782882,
    longitude:-59.97931401033402,
    
}
export default function Home() {
    return (
        <View style={styles.container}>
          {/*  <Map 
             style={StyleSheet.absoluteFill}
             initialRegion={{
                latitude: coordenada.latitude,
                longitude: coordenada.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
             }
               
             }/>  */}

            
           
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
})