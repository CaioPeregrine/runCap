import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Race } from '@/app/types/Race'
import { COLORS } from '@/constants/colordCalendario';
import { formatDateLong } from '@/app/utils/raceUtils';

interface Props {
  race: Race;
  onPress?: (race: Race) => void;
}

export function EventCard({ race, onPress }: Props) {
  const d = new Date(race.date);
  const day = d.getDate() + 1;
  const monthShort = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={() => onPress?.(race)}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMon}>{monthShort}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{race.name}</Text>
        <View style={styles.meta}>
          <Text style={styles.location}>📍 {race.location}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{race.type}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:      { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.greenBorder, marginHorizontal: 16, marginBottom: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBox:   { backgroundColor: COLORS.greenBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center', minWidth: 42 },
  dateDay:   { fontSize: 18, fontWeight: '600', color: COLORS.greenDark, lineHeight: 20 },
  dateMon:   { fontSize: 10, color: COLORS.greenMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  info:      { flex: 1 },
  name:      { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
  meta:      { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  location:  { fontSize: 12, color: COLORS.textMuted },
  badge:     { backgroundColor: COLORS.greenBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '500', color: COLORS.greenDark },
  chevron:   { fontSize: 20, color: COLORS.textHint },
});
