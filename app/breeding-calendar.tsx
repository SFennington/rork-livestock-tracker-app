import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLivestock, useRabbitBreeding } from "@/hooks/livestock-store";
import { Calendar, Clock, AlertTriangle, Plus, Baby, Heart } from "lucide-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BreedingCalendarScreen() {
  const { rabbits, breedingRecords } = useLivestock();
  const { upcomingKindlings, activeBreedings } = useRabbitBreeding();
  const insets = useSafeAreaInsets();

  const getDaysUntilKindling = (expectedDate: string) => {
    const today = new Date();
    const kindling = new Date(expectedDate);
    const diffTime = kindling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBreedingStatusColor = (status: string) => {
    switch (status) {
      case 'bred': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'kindled': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRabbitName = (id: string) => {
    const rabbit = rabbits.find(r => r.id === id);
    return rabbit?.name || 'Unknown';
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-breeding')}>
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Plan New Breeding</Text>
          </TouchableOpacity>

          {/* Urgent Kindlings */}
          {upcomingKindlings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={20} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Upcoming Kindlings (Next 7 Days)</Text>
              </View>
              {upcomingKindlings.map((breeding) => {
                const daysUntil = getDaysUntilKindling(breeding.expectedKindlingDate);
                return (
                  <View key={breeding.id} style={[styles.card, styles.urgentCard]}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.cardTitle}>
                          {getRabbitName(breeding.doeId)} × {getRabbitName(breeding.buckId)}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          Expected: {new Date(breeding.expectedKindlingDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: daysUntil <= 2 ? '#ef4444' : '#f59e0b' }]}>
                        <Text style={styles.statusText}>
                          {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardDetails}>
                      <Text style={styles.detailText}>
                        Bred: {new Date(breeding.breedingDate).toLocaleDateString()}
                      </Text>
                      {daysUntil <= 2 && (
                        <Text style={styles.reminderText}>
                          🏠 Prepare nest box • 🥬 Increase pellets • 💧 Fresh water
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Active Breedings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Active Breedings</Text>
            </View>
            {activeBreedings.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No active breedings</Text>
                <Text style={styles.emptySubtext}>Plan your first breeding to get started</Text>
              </View>
            ) : (
              activeBreedings.map((breeding) => (
                <View key={breeding.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>
                        {getRabbitName(breeding.doeId)} × {getRabbitName(breeding.buckId)}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Bred: {new Date(breeding.breedingDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getBreedingStatusColor(breeding.status) }]}>
                      <Text style={styles.statusText}>{breeding.status}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expected Kindling:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(breeding.expectedKindlingDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {breeding.actualKindlingDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Actual Kindling:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(breeding.actualKindlingDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {breeding.litterSize && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Litter Size:</Text>
                        <Text style={styles.detailValue}>{breeding.litterSize} kits</Text>
                      </View>
                    )}
                    {breeding.weaningDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Weaning Date:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(breeding.weaningDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Recent Completed Breedings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Baby size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Recent Completed Breedings</Text>
            </View>
            {breedingRecords
              .filter(b => b.status === 'weaned')
              .slice(0, 5)
              .map((breeding) => (
                <View key={breeding.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>
                        {getRabbitName(breeding.doeId)} × {getRabbitName(breeding.buckId)}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Weaned: {breeding.weaningDate ? new Date(breeding.weaningDate).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                      <Text style={styles.statusText}>Completed</Text>
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Litter Size:</Text>
                      <Text style={styles.detailValue}>{breeding.litterSize || 0} kits</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Weaned:</Text>
                      <Text style={styles.detailValue}>{breeding.weanedCount || 0} kits</Text>
                    </View>
                    {breeding.averageKitWeight && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Avg. Weight:</Text>
                        <Text style={styles.detailValue}>{breeding.averageKitWeight} lbs</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: "#10b981",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  urgentCard: {
    borderColor: "#f59e0b",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  reminderText: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
});