import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLivestock, useRabbitBreeding, useRabbitHealth } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { Bird, Rabbit, Plus, Calendar, TrendingUp, TrendingDown, ShoppingCart, Edit2, User2, Hash, Syringe, MoreVertical, ArrowUp } from "lucide-react-native";
import { router } from "expo-router";
import { useState, useMemo } from "react";

export default function LivestockScreen() {
  const { chickenHistory, duckHistory, rabbits, isLoading, getChickenCountOnDate, getDuckCountOnDate, getRoostersAndHensCount, getChickenStageCount, getDrakesAndHensCount, getAliveAnimals, groups, getGroupsByType } = useLivestock();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'chickens' | 'ducks' | 'rabbits'>('chickens');
  const rabbitsDisabled = true;
  const { activeBreedings } = useRabbitBreeding();
  const { dueVaccinations } = useRabbitHealth();

  // Breed name normalization - map abbreviated names to full names
  const breedNameMap: Record<string, string> = {
    'RIR': 'Rhode Island Red',
    'BO': 'Orpington',
    'BR': 'Plymouth Rock (Barred)',
    'PR': 'Plymouth Rock (Barred)',
    'ISA': 'ISA Brown',
    'WL': 'White Leghorn',
    'SG': 'Silver Spangled Hamburg',
  };

  const getFullBreedName = (breed: string): string => {
    return breedNameMap[breed] || breed;
  };

  const sortedChickenHistory = useMemo(() => {
    return [...chickenHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [chickenHistory]);

  const sortedDuckHistory = useMemo(() => {
    return [...duckHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [duckHistory]);

  const chickenGroups = useMemo(() => getGroupsByType('chicken'), [getGroupsByType]);
  const duckGroups = useMemo(() => getGroupsByType('duck'), [getGroupsByType]);

  const today = new Date().toISOString().split('T')[0];
  
  const currentChickenCount = useMemo(() => {
    return getChickenCountOnDate(today);
  }, [getChickenCountOnDate, today]);

  const currentDuckCount = useMemo(() => {
    return getDuckCountOnDate(today);
  }, [getDuckCountOnDate, today]);

  const { roosters, hens, chicks } = useMemo(() => {
    return getChickenStageCount(today);
  }, [getChickenStageCount, today]);

  const { drakes, hens: duckHens } = useMemo(() => {
    return getDrakesAndHensCount(today);
  }, [getDrakesAndHensCount, today]);

  const activeRabbitCount = useMemo(() => {
    const count = rabbits.filter(r => r.status === 'active').reduce((sum, r) => sum + r.quantity, 0);
    console.log('[Livestock] activeRabbitCount computed', { count, rabbitsCount: rabbits.length });
    return count;
  }, [rabbits]);

  const chickenBreedBreakdown = useMemo(() => {
    const breakdown: { [breed: string]: number } = {};
    
    // Get counts from individual animals (primary source)
    const aliveChickens = getAliveAnimals('chicken');
    for (const animal of aliveChickens) {
      const breed = animal.breed || 'Unknown';
      breakdown[breed] = (breakdown[breed] || 0) + 1;
    }
    
    // Also compute from history events for breeds without individual animals
    const today = new Date().toISOString().split('T')[0];
    const sortedEvents = [...chickenHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const historyBreakdown: { [breed: string]: number } = {};
    for (const event of sortedEvents) {
      if (new Date(event.date).getTime() > new Date(today).getTime()) break;
      
      const breed = event.breed || 'Unknown';
      if (!historyBreakdown[breed]) historyBreakdown[breed] = 0;
      
      if (event.type === 'acquired') {
        historyBreakdown[breed] += event.quantity;
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        historyBreakdown[breed] -= event.quantity;
      }
    }
    
    // Merge: use individual animal count if exists, otherwise use history count
    for (const [breed, count] of Object.entries(historyBreakdown)) {
      if (count > 0 && !breakdown[breed]) {
        breakdown[breed] = count;
      }
    }
    
    return Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [chickenHistory, getAliveAnimals]);

  const duckBreedBreakdown = useMemo(() => {
    const breakdown: { [breed: string]: number } = {};
    
    // Get counts from individual animals (primary source)
    const aliveDucks = getAliveAnimals('duck');
    for (const animal of aliveDucks) {
      const breed = animal.breed || 'Unknown';
      breakdown[breed] = (breakdown[breed] || 0) + 1;
    }
    
    // Also compute from history events for breeds without individual animals
    const today = new Date().toISOString().split('T')[0];
    const sortedEvents = [...duckHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const historyBreakdown: { [breed: string]: number } = {};
    for (const event of sortedEvents) {
      if (new Date(event.date).getTime() > new Date(today).getTime()) break;
      
      const breed = event.breed || 'Unknown';
      if (!historyBreakdown[breed]) historyBreakdown[breed] = 0;
      
      if (event.type === 'acquired') {
        historyBreakdown[breed] += event.quantity;
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        historyBreakdown[breed] -= event.quantity;
      }
    }
    
    // Merge: use individual animal count if exists, otherwise use history count
    for (const [breed, count] of Object.entries(historyBreakdown)) {
      if (count > 0 && !breakdown[breed]) {
        breakdown[breed] = count;
      }
    }
    
    return Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [duckHistory, getAliveAnimals]);

  const rabbitBreedBreakdown = useMemo(() => {
    const breakdown: { [breed: string]: number } = {};
    for (const r of rabbits) {
      if (r.status !== 'active') continue;
      const breed = r.breed || 'Unknown';
      breakdown[breed] = (breakdown[breed] ?? 0) + (r.quantity ?? 0);
    }
    const result = Object.entries(breakdown)
      .filter(([_, count]) => (count ?? 0) > 0)
      .sort((a, b) => b[1] - a[1]);
    console.log('[Livestock] rabbitBreedBreakdown', result);
    return result;
  }, [rabbits]);

  if (isLoading) {
    return (
      <View style={[styles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chickens' && styles.activeTab]}
          onPress={() => setActiveTab('chickens')}
          testID="tab-chickens"
        >
          <Bird size={20} color={activeTab === 'chickens' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'chickens' ? colors.primary : colors.textMuted }]}>
            Chickens ({currentChickenCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ducks' && styles.activeTab]}
          onPress={() => setActiveTab('ducks')}
          testID="tab-ducks"
        >
          <Bird size={20} color={activeTab === 'ducks' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'ducks' ? colors.primary : colors.textMuted }]}>
            Ducks ({currentDuckCount})
          </Text>
        </TouchableOpacity>
        {false && (
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'rabbits' && styles.activeTab]}
          onPress={() => setActiveTab('rabbits')}
          testID="tab-rabbits"
        >
          <Rabbit size={20} color={activeTab === 'rabbits' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'rabbits' ? colors.primary : colors.textMuted }]}>
            Rabbits ({activeRabbitCount})
          </Text>
        </TouchableOpacity>
        )}
      </View>

      {/* Management header per animal */}
      {activeTab === 'rabbits' && (
        <View style={styles.managementHeader}>
          <View style={styles.managementActions}>
            <TouchableOpacity
              style={[styles.managementActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/breeding-calendar')}
              testID="manage-rabbits-breeding"
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.managementActionText, { color: colors.text }]}>Breeding Calendar</Text>
              {activeBreedings.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{activeBreedings.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.managementActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/rabbit-health')}
              testID="manage-rabbits-health"
            >
              <Syringe size={20} color={colors.error} />
              <Text style={[styles.managementActionText, { color: colors.text }]}>Health Tracking</Text>
              {dueVaccinations.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{dueVaccinations.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.managementActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/rabbit-offspring-summary')}
              testID="manage-rabbits-offspring"
            >
              <Calendar size={20} color={colors.accent} />
              <Text style={[styles.managementActionText, { color: colors.text }]}>Offspring Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {activeTab === 'chickens' ? (
          <>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Chicken Groups</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/add-chicken-event')} testID="add-chicken-event-btn">
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Log New Event</Text>
              </TouchableOpacity>
            </View>

            {chickenGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Bird size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No chicken groups</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create a group to start tracking chickens</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {chickenGroups.map((group) => {
                  const groupAnimals = getAliveAnimals('chicken').filter(a => a.groupId === group.id);
                  const groupCount = groupAnimals.length;
                  
                  return (
                    <TouchableOpacity
                      key={group.id}
                      style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push({
                        pathname: '/group-detail',
                        params: { groupId: group.id, type: 'chicken' }
                      })}
                    >
                      <View style={styles.groupCardHeader}>
                        <View style={[styles.groupIconContainer, { backgroundColor: colors.surface }]}>
                          <Bird size={24} color={colors.accent} />
                        </View>
                        <View style={styles.groupCardContent}>
                          <Text style={[styles.groupCardTitle, { color: colors.text }]}>{group.name}</Text>
                          <Text style={[styles.groupCardDate, { color: colors.textSecondary }]}>
                            Created {group.dateCreated}
                          </Text>
                        </View>
                        <View style={styles.groupCardRight}>
                          <Text style={[styles.groupCardCount, { color: colors.primary }]}>{groupCount}</Text>
                          <Text style={[styles.groupCardCountLabel, { color: colors.textMuted }]}>birds</Text>
                        </View>
                      </View>
                      {group.notes && (
                        <Text style={[styles.groupCardNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                          {group.notes}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : activeTab === 'ducks' ? (
          <>
            <View style={styles.historyHeader}>
              <View style={[styles.currentCountCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="duck-count-card">
                <Text style={[styles.currentCountLabel, { color: colors.textSecondary }]}>Current Duck Count</Text>
                <Text style={[styles.currentCountValue, { color: colors.primary }]}>{currentDuckCount}</Text>
                <View style={styles.chickenTypeCounts}>
                  <View style={styles.chickenTypeItem}>
                    <Text style={[styles.chickenTypeLabel, { color: colors.textMuted }]}>Drakes</Text>
                    <Text style={[styles.chickenTypeValue, { color: colors.primary }]}>{drakes}</Text>
                  </View>
                  <View style={styles.chickenTypeItem}>
                    <Text style={[styles.chickenTypeLabel, { color: colors.textMuted }]}>Hens</Text>
                    <Text style={[styles.chickenTypeValue, { color: colors.primary }]}>{duckHens}</Text>
                  </View>
                </View>
                {duckBreedBreakdown.length > 0 && (
                  <View style={[styles.breedBreakdown, { borderTopColor: colors.border }]}> 
                    {duckBreedBreakdown.map(([breed, count]) => (
                      <View key={breed} style={styles.breedItem}>
                        <Text style={[styles.breedName, { color: colors.text }]} numberOfLines={1}>{getFullBreedName(breed)}</Text>
                        <View style={styles.breedItemRight}>
                          <Text style={[styles.breedCount, { color: colors.primary }]}>{count}</Text>
                          <TouchableOpacity 
                            style={styles.breedMenuButton}
                            onPress={() => router.push({
                              pathname: '/manage-animals',
                              params: { type: 'duck', breed }
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
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/add-duck-event')} testID="add-duck-event-btn">
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>

            {sortedDuckHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No duck events</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Log acquisitions, deaths, or sales</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {sortedDuckHistory.map((event) => {
                  const Icon = event.type === 'acquired' ? TrendingUp : event.type === 'sold' ? ShoppingCart : TrendingDown;
                  const iconColor = event.type === 'acquired' ? '#10b981' : event.type === 'sold' ? '#3b82f6' : event.type === 'consumed' ? '#f59e0b' : '#ef4444';
                  const typeLabel = event.type === 'acquired' ? 'Acquired' : event.type === 'sold' ? 'Sold' : event.type === 'consumed' ? 'Consumed' : 'Death/Loss';
                  
                  return (
                    <View key={event.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID={`duck-event-${event.id}`}>
                      <View style={styles.historyCardHeader}>
                        <View style={[styles.historyIconContainer, { backgroundColor: colors.surface }]}>
                          <Icon size={20} color={iconColor} />
                        </View>
                        <View style={styles.historyCardContent}>
                          <Text style={[styles.historyCardTitle, { color: colors.text }]}>{typeLabel}</Text>
                          <Text style={[styles.historyCardDate, { color: colors.textSecondary }]}>{event.date}</Text>
                          {event.breed ? (
                            <Text style={[styles.historyCardBreed, { color: colors.textMuted }]}>
                              {getFullBreedName(event.breed)}
                              {event.sex && (
                                <Text> • {event.sex === 'M' ? 'Drakes' : 'Hens'}</Text>
                              )}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.historyCardRight}>
                          <Text style={[styles.historyCardQuantityText, { color: iconColor }]}>
                            {event.type === 'acquired' ? '+' : '-'}{event.quantity}
                          </Text>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => router.push(`/edit-duck-event/${event.id}`)}
                            testID={`edit-duck-event-${event.id}`}
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
              <View style={[styles.currentCountCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="rabbit-count-card">
                <Text style={[styles.currentCountLabel, { color: colors.textSecondary }]}>Current Rabbit Count</Text>
                <Text style={[styles.currentCountValue, { color: colors.primary }]}>{activeRabbitCount}</Text>
                {rabbitBreedBreakdown.length > 0 && (
                  <View style={[styles.breedBreakdown, { borderTopColor: colors.border }]} testID="rabbit-breed-breakdown">
                    {rabbitBreedBreakdown.map(([breed, count]) => (
                      <View key={breed} style={styles.breedItem}>
                        <Text style={[styles.breedName, { color: colors.text }]} numberOfLines={1}>{getFullBreedName(breed)}</Text>
                        <View style={styles.breedItemRight}>
                          <Text style={[styles.breedCount, { color: colors.primary }]}>{count}</Text>
                          <TouchableOpacity 
                            style={styles.breedMenuButton}
                            onPress={() => router.push({
                              pathname: '/manage-animals',
                              params: { type: 'rabbit', breed }
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
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: rabbitsDisabled ? colors.textMuted : colors.accent, opacity: rabbitsDisabled ? 0.5 : 1 }]} 
                onPress={() => !rabbitsDisabled && router.push('/add-rabbit')} 
                disabled={rabbitsDisabled}
                testID="add-rabbit-btn"
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Rabbit {rabbitsDisabled ? '(Coming Soon)' : ''}</Text>
              </TouchableOpacity>
            </View>

            {rabbits.length === 0 ? (
              <View style={styles.emptyState} testID="rabbits-empty-state">
                <Rabbit size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No rabbits yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add your first rabbit to get started</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {rabbits.filter(r => r.status === 'active').map((r) => (
                  <View key={r.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID={`rabbit-${r.id}`}>
                    <View style={styles.historyCardHeader}>
                      <View style={[styles.historyIconContainer, { backgroundColor: colors.surface }]}> 
                        <User2 size={20} color={colors.primary} />
                      </View>
                      <View style={styles.historyCardContent}>
                        <Text style={[styles.historyCardTitle, { color: colors.text }]}>{r.name || 'Rabbit'}</Text>
                        <Text style={[styles.historyCardDate, { color: colors.textSecondary }]}>Acquired {r.dateAcquired}</Text>
                        {r.breed ? (
                          <Text style={[styles.historyCardBreed, { color: colors.textMuted }]}>{getFullBreedName(r.breed)} • {r.gender === 'buck' ? 'Buck' : 'Doe'}</Text>
                        ) : null}
                      </View>
                      <View style={styles.historyCardRight}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Hash size={14} color={colors.textMuted} />
                          <Text style={[styles.historyCardQuantityText, { color: colors.primary }]}>{r.quantity}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => router.push(`/edit-rabbit/${r.id}`)}
                            testID={`edit-rabbit-${r.id}`}
                          >
                            <Edit2 size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => router.push((`/rabbit-offspring/${r.id}` as unknown) as any)}
                            testID={`offspring-${r.id}`}
                          >
                            <Calendar size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {r.notes && (
                      <Text style={[styles.historyCardNotes, { color: colors.textSecondary, borderTopColor: colors.border }]}>{r.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
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
  managementHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  managementActions: {
    flexDirection: 'row',
    gap: 12,
  },
  managementActionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  managementActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
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
    alignItems: 'center',
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
    includeFontPadding: false,
    flex: 1,
    minWidth: 140,
    fontWeight: "500" as const,
  },
  breedCount: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  breedMenuButton: {
    padding: 4,
  },
  chickenTypeCounts: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
    justifyContent: "center",
  },
  chickenTypeItem: {
    alignItems: "center",
    flex: 1,
  },
  chickenTypeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  chickenTypeValue: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  groupCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  groupCardContent: {
    flex: 1,
  },
  groupCardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  groupCardDate: {
    fontSize: 12,
  },
  groupCardRight: {
    alignItems: "flex-end",
  },
  groupCardCount: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  groupCardCountLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  groupCardNotes: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },
});
