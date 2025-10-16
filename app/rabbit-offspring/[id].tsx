import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLivestock, useRabbitBreeding } from '@/hooks/livestock-store';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RabbitOffspringDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rabbits } = useLivestock();
  const { getBreedingHistory } = useRabbitBreeding();
  const insets = useSafeAreaInsets();

  const rabbit = rabbits.find(r => r.id === id);
  const history = useMemo(() => getBreedingHistory(id ?? ''), [id, getBreedingHistory]);

  const header = rabbit ? `${rabbit.name} • ${rabbit.gender === 'buck' ? 'Buck' : 'Doe'} • ${rabbit.breed}` : 'Rabbit';

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} contentContainerStyle={styles.content}>
      <Text style={styles.title} testID="offspring-detail-title">{header}</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>No offspring history</Text>
      ) : (
        history.map((b) => (
          <View key={b.id} style={styles.card} testID={`breeding-${b.id}`}>
            <View style={styles.row}><Text style={styles.label}>Bred</Text><Text style={styles.value}>{new Date(b.breedingDate).toLocaleDateString()}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Expected</Text><Text style={styles.value}>{new Date(b.expectedKindlingDate).toLocaleDateString()}</Text></View>
            {b.actualKindlingDate && (
              <View style={styles.row}><Text style={styles.label}>Kindled</Text><Text style={styles.value}>{new Date(b.actualKindlingDate).toLocaleDateString()}</Text></View>
            )}
            {b.litterSize !== undefined && (
              <View style={styles.row}><Text style={styles.label}>Litter Size</Text><Text style={styles.value}>{b.litterSize}</Text></View>
            )}
            {(b.maleCount !== undefined || b.femaleCount !== undefined) && (
              <View style={styles.row}><Text style={styles.label}>M • F</Text><Text style={styles.value}>{b.maleCount ?? 0} • {b.femaleCount ?? 0}</Text></View>
            )}
            {(b.saleCount !== undefined || b.harvestCount !== undefined || b.retainedForBreedingCount !== undefined) && (
              <View style={styles.row}><Text style={styles.label}>Destinations</Text><Text style={styles.value}>Sale {b.saleCount ?? 0} • Harvest {b.harvestCount ?? 0} • Retained {b.retainedForBreedingCount ?? 0}</Text></View>
            )}
            {b.notes && <Text style={styles.notes}>{b.notes}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { fontSize: 14, color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { color: '#6b7280' },
  value: { color: '#111827', fontWeight: '600' },
  notes: { marginTop: 10, color: '#6b7280' },
});
