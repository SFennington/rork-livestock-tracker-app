import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLivestock, useRabbitBreeding } from '@/hooks/livestock-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { Calendar, Users } from 'lucide-react-native';
import { router } from 'expo-router';

export default function RabbitOffspringSummaryScreen() {
  const { rabbits } = useLivestock();
  const { getBreedingHistory } = useRabbitBreeding();
  const insets = useSafeAreaInsets();

  const summary = useMemo(() => {
    return rabbits.map(r => {
      const history = getBreedingHistory(r.id);
      const totalLitters = history.length;
      const totalKits = history.reduce((sum, b) => sum + (b.litterSize ?? 0), 0);
      const aliveAtBirth = history.reduce((sum, b) => sum + (b.aliveAtBirth ?? b.litterSize ?? 0), 0);
      const males = history.reduce((sum, b) => sum + (b.maleCount ?? 0), 0);
      const females = history.reduce((sum, b) => sum + (b.femaleCount ?? 0), 0);
      return { id: r.id, name: r.name, gender: r.gender, totalLitters, totalKits, aliveAtBirth, males, females };
    }).sort((a, b) => b.totalKits - a.totalKits);
  }, [rabbits, getBreedingHistory]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} testID="offspring-summary-title">Offspring Summary</Text>
        {summary.length === 0 ? (
          <View style={styles.empty}>
            <Users size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No rabbits</Text>
            <Text style={styles.emptySubtitle}>Add rabbits and breeding records to see offspring</Text>
          </View>
        ) : (
          summary.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push((`/rabbit-offspring/${item.id}` as unknown) as any)}
              testID={`offspring-summary-${item.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.gender}</Text></View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Litters</Text>
                <Text style={styles.value}>{item.totalLitters}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Kits</Text>
                <Text style={styles.value}>{item.totalKits}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>M • F</Text>
                <Text style={styles.value}>{item.males} • {item.females}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/breeding-calendar')} testID="to-breeding-calendar">
          <Calendar size={18} color="#fff" />
          <Text style={styles.navButtonText}>Open Breeding Calendar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  badge: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { color: '#6b7280' },
  value: { color: '#111827', fontWeight: '600' },
  navButton: { marginTop: 12, backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  navButtonText: { color: '#fff', fontWeight: '700' },
});
