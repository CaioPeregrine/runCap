import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Octicons from '@expo/vector-icons/Octicons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { styles } from './styles';

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const currentUser = getAuth().currentUser;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [userData, setUserData] = useState<{
    nome: string;
    nivel: number;
    codigoId: string;
    avatarUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, 'usuarios', currentUser.uid)).then((snap) => {
        const d = snap.data();
        if (d) {
          setUserData({
            nome: d.nome || 'Corredor',
            nivel: d.nivel || 1,
            codigoId: d.codigoId || currentUser.uid.slice(0, 8).toUpperCase(),
            avatarUrl: d.avatarUrl || null,
          });
        }
      });
    }
  }, [currentUser]);

  const navigateTo = (route: string) => {
    props.navigation.closeDrawer();
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        style={{ paddingTop: 0, marginHorizontal: -12 }}
      >
        {/* ── Cabeçalho azul ── */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            {userData?.avatarUrl ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {userData?.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '??'}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{userData?.nome || 'Carregando...'}</Text>
          <Text style={styles.userId}>ID: {userData?.codigoId || '...'}</Text>
          <View style={styles.nivelBadge}>
            <Text style={styles.nivelText}>⭐ nível {userData?.nivel || 1}</Text>
          </View>
        </View>

        {/* ── Itens do menu ── */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(drawer)/rotasSugeridas')}>
            <View style={styles.menuIconWrapper}><FontAwesome6 name="route" size={22} color="#22C3A3" /></View>
            <Text style={styles.menuText}>Rotas Sugeridas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(drawer)/conquistas')}>
            <View style={styles.menuIconWrapper}><Entypo name="medal" size={22} color="#22C3A3" /></View>
            <Text style={styles.menuText}>Conquistas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(drawer)/pontosTuristicos')}>
            <View style={styles.menuIconWrapper}><Ionicons name="location-outline" size={22} color="#22C3A3" /></View>
            <Text style={styles.menuText}>Meus Pontos Turísticos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(drawer)/historico')}>
            <View style={styles.menuIconWrapper}><AntDesign name="field-time" size={22} color="#22C3A3" /></View>
            <Text style={styles.menuText}>Histórico de Corridas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(drawer)/adicionarAmigos')}>
            <View style={styles.menuIconWrapper}><Feather name="user-plus" size={22} color="#22C3A3" /></View>
            <Text style={styles.menuText}>Adicionar Amigos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(drawer)/(tabs)/ranking')}>
            <View style={styles.menuIconWrapper}><Octicons name="trophy" size={22} color="#22C3A3" /></View>
            <Text style={styles.menuText}>Ranking</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* ── Botão Sair ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.back} onPress={() => setShowLogoutModal(true)}>
          <Text style={{ fontWeight: '900', fontSize: 18, color: 'white' }}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal de confirmação ── */}
      <Modal transparent visible={showLogoutModal} animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              width: '80%',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1a1a2e' }}>Sair da conta?</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
              Você precisará fazer login novamente para acessar.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '600', color: '#374151' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowLogoutModal(false); router.replace('/auth/login' as any); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e53935', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: 'white' }}>Sair</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
