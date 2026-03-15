import { View, Text, StyleSheet, } from "react-native";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, LocationObject, watchPositionAsync, LocationAccuracy } from 'expo-location';
import { useEffect, useState,useRef } from "react";
import MapView ,{Marker} from 'react-native-maps'


export default function Home() {

    const mapRef = useRef<MapView>(null);
    const [location, setLocation] = useState<LocationObject | null>(null);

    async function requestLocationPermissions() {

        const { granted } = await requestForegroundPermissionsAsync();

        if (granted) {
            const currentPosition = await getCurrentPositionAsync();
            setLocation(currentPosition);
        }

    }
    useEffect(() => {
        requestLocationPermissions();
    }, []);

    useEffect(() => {watchPositionAsync({
        accuracy: LocationAccuracy.Highest,
        timeInterval:1000,
        distanceInterval:1
    }, (Response) => {setLocation(Response);
        mapRef.current?.animateCamera({
            pitch: 70,
            center: Response.coords
        })
    });
},
 []);
    return (
        <View style={styles.container}>
            {location &&

                <MapView 
                ref={mapRef}
                style={styles.map}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005
                    }} >

                        <Marker
                           coordinate={{
                            latitude:location.coords.latitude,
                            longitude:location.coords.longitude
                           }}/>

                    </MapView>
            }



        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },

    map: {
        flex: 1,
        width: "100%"
    }
})