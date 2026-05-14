import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import { COLORS } from '../../../../constants/colordCalendario';
import { useRaces } from '@/app/hooks/useRaces';
import { getNextRace, buildMarkedDates } from '@/app/utils/raceUtils';
import { NextRaceCard } from '@/components/NextRaceCard';
import { EventCard } from '@/components/EventCard';
import { Race } from '@/app/types/Race';

export default function EventosScreen() {
  const { races, loading, error } = useRaces();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const nextRace    = useMemo(() => getNextRace(races), [races]);
  const markedDates = useMemo(() => buildMarkedDates(races, selectedDate), [races, selectedDate]);

  // Corridas do dia selecionado, ou todas as futuras se nenhum dia estiver selecionado
  const filteredRaces = useMemo(() => {
    if (selectedDate) return races.filter(r => r.date === selectedDate);
    const today = new Date().toISOString().split('T')[0];
    return races.filter(r => r.date >= today);
  }, [races, selectedDate]);

  const sectionTitle = selectedDate
    ? `Corridas em ${selectedDate}`
    : 'Próximas corridas';

  const handleDayPress = (day: { dateString: string }) => {
    // Toca no mesmo dia já selecionado → limpa o filtro
    setSelectedDate(prev => (prev === day.dateString ? null : day.dateString));
  };

  // ── Estados de loading / erro ──────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.greenDark} />
        <Text style={styles.loadingText}>Carregando corridas...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar dados.</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos</Text>
        <Text style={styles.bellIcon}>🔔</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ① Card da próxima corrida */}
        {nextRace && <NextRaceCard race={nextRace} />}

        {/* ② Calendário (react-native-calendars) */}
        <View style={styles.calCard}>
          <Calendar
            markingType="custom"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            // Abre no mês da próxima corrida
            initialDate={nextRace?.date}
            theme={{
              backgroundColor:             COLORS.white,
              calendarBackground:          COLORS.white,
              todayTextColor:              COLORS.greenDark,
              todayBackgroundColor:        COLORS.todayBg,
              selectedDayBackgroundColor:  COLORS.greenMid,
              selectedDayTextColor:        COLORS.greenLight,
              arrowColor:                  COLORS.greenDark,
              monthTextColor:              COLORS.textPrimary,
              textMonthFontWeight:         '500' as const,
              dayTextColor:                COLORS.textPrimary,
              textDisabledColor:           COLORS.textHint,
              dotColor:                    COLORS.greenDot,
              selectedDotColor:            COLORS.greenLight,
            }}
          />

          {/* Legenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.greenDark, borderColor: COLORS.greenBorder, borderWidth: 1.5 }]} />
              <Text style={styles.legendText}>Corrida</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.todayBg, borderColor: COLORS.borderMid, borderWidth: 0.5 }]} />
              <Text style={styles.legendText}>Hoje</Text>
            </View>
          </View>
        </View>

        {/* ③ Lista filtrada */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <Text style={styles.clearFilter}>Ver todas</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredRaces.length === 0 ? (
          <Text style={styles.emptyMsg}>
            {selectedDate ? 'Sem corrida neste dia.' : 'Sem corridas agendadas.'}
          </Text>
        ) : (
          filteredRaces.map(race => (
            <EventCard
              key={race.id}
              race={race}
              onPress={(r: Race) => console.log('Abrir detalhes de:', r.name)}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.background },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scroll:      { paddingBottom: 40 },

  header:      { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary },
  bellIcon:    { fontSize: 20 },

  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textMuted },
  errorText:   { fontSize: 16, fontWeight: '600', color: '#c0392b', marginBottom: 6 },
  errorSub:    { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 32 },

  calCard:     { backgroundColor: COLORS.white, margin: 16, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', paddingBottom: 12 },
  legend:      { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.borderLight, marginTop: 4 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendText:  { fontSize: 12, color: COLORS.textMuted },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  clearFilter:  { fontSize: 13, color: COLORS.greenMid, fontWeight: '500' },
  emptyMsg:     { textAlign: 'center', paddingVertical: 32, color: COLORS.textHint, fontSize: 14 },
});
