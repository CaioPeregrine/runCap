import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Race } from '@/app/types/Race';
import { COLORS } from '@/constants/colordCalendario';
import { daysUntil, formatDateLong } from '@/app/utils/raceUtils';

interface Props {
  race: Race;
}

export function NextRaceCard({ race }: Props) {
  const days = daysUntil(race.date);
  const pill = days === 0 ? 'Hoje!' : days === 1 ? 'Amanhã' : `Em ${days} dias`;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.label}>Próxima corrida</Text>
          <Text style={styles.name} numberOfLines={2}>{race.name}</Text>
          <Text style={styles.location}>📍 {race.location}</Text>
        </View>

        <View style={styles.countdown}>
          {days === 0 ? (
            <Text style={styles.countdownEmoji}>🏁</Text>
          ) : (
            <>
              <Text style={styles.countdownNum}>{days}</Text>
              <Text style={styles.countdownLabel}>dias</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{race.type}</Text>
        </View>
        <Text style={styles.date}>{formatDateLong(race.date)}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{pill}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:           { backgroundColor: COLORS.greenDark, margin: 16, marginBottom: 0, borderRadius: 16, padding: 18 },
  top:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  label:          { fontSize: 11, fontWeight: '500', color: COLORS.greenDot, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  name:           { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  location:       { fontSize: 13, color: COLORS.greenLight },
  countdown:      { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minWidth: 60 },
  countdownEmoji: { fontSize: 28, lineHeight: 34 },
  countdownNum:   { fontSize: 28, fontWeight: '700', color: COLORS.white, lineHeight: 32 },
  countdownLabel: { fontSize: 11, color: COLORS.greenLight, marginTop: 2 },
  bottom:         { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeBadge:      { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  typeBadgeText:  { fontSize: 12, fontWeight: '600', color: COLORS.greenLight },
  date:           { fontSize: 12, color: COLORS.greenLight, flex: 1 },
  pill:           { backgroundColor: COLORS.greenDot, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillText:       { fontSize: 11, fontWeight: '700', color: COLORS.greenDark },
});
