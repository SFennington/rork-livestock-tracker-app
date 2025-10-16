import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { Bird, Rabbit, Plus, Calendar, TrendingUp, TrendingDown, ShoppingCart, Edit2 } from "lucide-react-native";
import { router } from "expo-router";
import { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LivestockScreen() {
  const { chickenHistory, rabbits, isLoading, getChickenCountOnDate } = useLivestock();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'chickens' | 'rabbits'>('chickens');
  const insets = useSafeAreaInsets();

  const sortedChickenHistory = useMemo(() => {
    return [...chickenHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [chickenHistory]);

  const currentChickenCount = useMemo(() => {
    return getChickenCountOnDate(new Date().toISOString().split('T')[0]);
  }, [getChickenCountOnDate]);

  const activeRabbitCount = useMemo(() => {
    return rabbits.filter(r => r.status === 'active').reduce((sum, r) => sum + r.quantity, 0);
  }, [rabbits]);

  const chickenBreedBreakdown = useMemo(() => {
    const breakdown: { [breed: string]: number } = {};
    const today = new Date().toISOString().split('T')[0];
    const sortedEvents = [...chickenHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const event of sortedEvents) {
      if (new Date(event.date).getTime() > new Date(today).getTime()) break;
      
      const breed = event.breed || 'Unknown';
      if (!breakdown[breed]) breakdown[breed] = 0;
      
      if (event.type === 'acquired') {
        breakdown[breed] += event.quantity;
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        breakdown[breed] -= event.quantity;
      }
    }
    
    return Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [chickenHistory]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chickens' && styles.activeTab]}
          onPress={() => setActiveTab('chickens')}
        >
          <Bird size={20} color={activeTab === 'chickens' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'chickens' ? colors.primary : colors.textMuted }]}>
            Chickens ({currentChickenCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'rabbits' && styles.activeTab]}
          onPress={() => setActiveTab('rabbits')}
        >
          <Rabbit size={20} color={activeTab === 'rabbits' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'rabbits' ? colors.primary : colors.textMuted }]}>
            Rabbits ({activeRabbitCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {activeTab === 'chickens' ? (
          <>
            <View style={styles.historyHeader}>
              <View style={[styles.currentCountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.currentCountLabel, { color: colors.textSecondary }]}>Current Chicken Count</Text>
                <Text style={[styles.currentCountValue, { color: colors.primary }]}>{currentChickenCount}</Text>
                {chickenBreedBreakdown.length > 0 && (
                  <View style={[styles.breedBreakdown, { borderTopColor: colors.border }]}>
                    {chickenBreedBreakdown.map(([breed, count]) => (
                      <View key={breed} style={styles.breedItem}>
                        <Text style={[styles.breedName, { color: colors.textSecondary }]}>{breed}</Text>
                        <Text style={[styles.breedCount, { color: colors.primary }]}>{count}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/add-chicken-event')}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>

            {sortedChickenHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No chicken events</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Log acquisitions, deaths, or sales</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {sortedChickenHistory.map((event) => {
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
                          {event.breed && (
                            <Text style={[styles.historyCardBreed, { color: colors.textMuted }]}>{event.breed}</Text>
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
                        <Text style={[styles.historyCardNotes, { color: colors.textSecondary, borderTopColor: colors.border }]}>{event.notes}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.historyHeader}>
              <View style={[styles.currentCountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.currentCountLabel, { color: colors.textSecondary }]}>Current Rabbit Count</Text>
                <Text style={[styles.currentCountValue, { color: colors.primary }]}>{activeRabbitCount}</Text>
              </View>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/add-rabbit')}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptyState}>
              <Rabbit size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No rabbit events</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Rabbit event tracking coming soon</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  historyHeader: {
    marginBottom: 20,
  },
  currentCountCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  currentCountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  currentCountValue: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 14,
    marginTop: 2,
  },
  historyCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  historyCardQuantityText: {
    fontSize: 20,
    fontWeight: "700",
  },
  historyCardBreed: {
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    padding: 4,
  },
  historyCardNotes: {
    fontSize: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  breedBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  breedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  breedName: {
    fontSize: 14,
    flex: 1,
  },
  breedCount: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
