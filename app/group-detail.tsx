import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown, ShoppingCart, Edit2, ArrowUp, MoreVertical } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo } from "react";

export default function GroupDetailScreen() {
  const { groupId, type } = useLocalSearchParams();
  const { groups, chickenHistory, getAliveAnimals, getChickenStageCount } = useLivestock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const group = groups.find(g => g.id === groupId);
  const groupAnimals = getAliveAnimals(type as 'chicken').filter(a => a.groupId === groupId);
  const groupEvents = chickenHistory.filter(e => e.groupId === groupId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const { roosters, hens, chicks } = useMemo(() => {
    const groupChickens = groupAnimals;
    return {
      roosters: groupChickens.filter(a => a.sex === 'M' && (!a.stage || a.stage === 'mature')).length,
      hens: groupChickens.filter(a => a.sex === 'F' && (!a.stage || a.stage === 'mature')).length,
      chicks: groupChickens.filter(a => a.stage === 'chick').length,
    };
  }, [groupAnimals]);

  const breedBreakdown = useMemo(() => {
    const breakdown: { [breed: string]: number } = {};
    for (const animal of groupAnimals) {
      const breed = animal.breed || 'Unknown';
      breakdown[breed] = (breakdown[breed] || 0) + 1;
    }
    return Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  }, [groupAnimals]);

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.text }}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{group.name}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {groupAnimals.length} birds
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Current Count</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{groupAnimals.length}</Text>
          
          <View style={styles.typeCounts}>
            <View style={styles.typeItem}>
              <Text style={[styles.typeLabel, { color: colors.textMuted }]}>Roosters</Text>
              <Text style={[styles.typeValue, { color: colors.primary }]}>{roosters}</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={[styles.typeLabel, { color: colors.textMuted }]}>Hens</Text>
              <Text style={[styles.typeValue, { color: colors.primary }]}>{hens}</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={[styles.typeLabel, { color: colors.textMuted }]}>Chicks</Text>
              <View style={styles.chickCountWithButton}>
                <Text style={[styles.typeValue, { color: colors.primary }]}>{chicks}</Text>
                {chicks > 0 && (
                  <TouchableOpacity
                    style={[styles.matureButton, { backgroundColor: colors.accent }]}
                    onPress={() => {
                      const chickIds = groupAnimals.filter(a => a.stage === 'chick').map(a => a.id).join(',');
                      router.push({
                        pathname: '/mature-animals' as any,
                        params: { animalIds: chickIds, type: 'chicken' }
                      });
                    }}
                  >
                    <ArrowUp size={14} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {breedBreakdown.length > 0 && (
            <View style={[styles.breedBreakdown, { borderTopColor: colors.border }]}>
              {breedBreakdown.map(([breed, count]) => (
                <View key={breed} style={styles.breedItem}>
                  <Text style={[styles.breedName, { color: colors.text }]} numberOfLines={1}>{breed}</Text>
                  <View style={styles.breedItemRight}>
                    <Text style={[styles.breedCount, { color: colors.primary }]}>{count}</Text>
                    <TouchableOpacity 
                      style={styles.breedMenuButton}
                      onPress={() => router.push({
                        pathname: '/manage-animals',
                        params: { type, breed, groupId }
                      })}
                    >
                      <MoreVertical size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Event History</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push({
                pathname: '/add-chicken-event',
                params: { groupId }
              })}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>

          {groupEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No events yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Start by adding an acquisition event</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {groupEvents.map((event) => {
                const Icon = event.type === 'acquired' ? TrendingUp : event.type === 'sold' ? ShoppingCart : TrendingDown;
                const iconColor = event.type === 'acquired' ? '#10b981' : event.type === 'sold' ? '#3b82f6' : event.type === 'consumed' ? '#f59e0b' : '#ef4444';
                const typeLabel = event.type === 'acquired' ? 'Acquired' : event.type === 'sold' ? 'Sold' : event.type === 'consumed' ? 'Consumed' : 'Death/Loss';
                
                return (
                  <View key={event.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.historyCardHeader}>
                      <View style={[styles.historyIconContainer, { backgroundColor: colors.surface }]}>
                        <Icon size={20} color={iconColor} />
                      </View>
                      <View style={styles.historyCardContent}>
                        <Text style={[styles.historyCardTitle, { color: colors.text }]}>{typeLabel}</Text>
                        <Text style={[styles.historyCardDate, { color: colors.textSecondary }]}>{event.date}</Text>
                        {event.breeds && event.breeds.length > 0 && (
                          <Text style={[styles.historyCardBreed, { color: colors.textMuted }]}>
                            {event.breeds.map(b => `${b.breed} (${b.roosters}M/${b.hens}F)`).join(', ')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.historyCardRight}>
                        <Text style={[styles.historyCardQuantityText, { color: iconColor }]}>
                          {event.type === 'acquired' ? '+' : '-'}{event.quantity}
                        </Text>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => router.push(`/edit-chicken-event/${event.id}`)}
                        >
                          <Edit2 size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {event.notes && (
                      <Text style={[styles.historyCardNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                        {event.notes}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginTop: 4,
  },
  typeCounts: {
    flexDirection: "row",
    marginTop: 16,
    gap: 16,
    justifyContent: "center",
  },
  typeItem: {
    alignItems: "center",
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  typeValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  chickCountWithButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matureButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  breedBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  breedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  breedItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breedName: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500" as const,
  },
  breedCount: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  breedMenuButton: {
    padding: 4,
  },
  eventsSection: {
    marginBottom: 32,
  },
  eventsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  emptySubtext: {
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyCardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCardContent: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  historyCardDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historyCardBreed: {
    fontSize: 13,
    marginTop: 4,
  },
  historyCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  historyCardQuantityText: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  editButton: {
    padding: 4,
  },
  historyCardNotes: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },
});
