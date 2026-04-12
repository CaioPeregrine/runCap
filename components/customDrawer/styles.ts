import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // ── Cabeçalho azul ──────────────────────────────────────────────────────────
  userHeader: {
    backgroundColor: '#2C3F69',
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
    
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: '#07070e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  userName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userId: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 10,
  },
  nivelBadge: {
    backgroundColor: 'rgba(34, 195, 163, 0.17)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  nivelText: {
    color: '#22C3A3',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Itens do menu ───────────────────────────────────────────────────────────
  menuContainer: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 195, 163, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },

  // ── Rodapé ──────────────────────────────────────────────────────────────────
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    marginBottom: 10,
  },
  back: {
    backgroundColor: '#ff0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});