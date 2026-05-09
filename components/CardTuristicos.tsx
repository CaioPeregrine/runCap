import { Image, StyleSheet, Text, TouchableOpacity, View ,ScrollView} from "react-native";


type CardTuristicosProps = {
  title: string;
  description: string;
  imageUrl: string;
};

export default function CardTuristicos({ title, description, imageUrl }: CardTuristicosProps) {
  return (
    <TouchableOpacity style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.img} />
      ) : (
        <View style={styles.img} />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView>
        <View><Text>{description}</Text></View>
      </ScrollView>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
    card:{
        backgroundColor: '#FFF9F2',
        height: 280,
        width: '100%',
        borderRadius: 20,
        margin: 5,
    },
    img:{
      backgroundColor: "#ffffff",
      width: '100%',
      height: 150,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    overlay: {
      position: 'absolute',
      top: 100,
      left: 5,
      right: 0,
      bottom: 0,
      alignItems: 'flex-start',
    },
    title:{
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 2},
      textShadowRadius: 10,
    }
})  