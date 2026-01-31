import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown, ShoppingCart, Edit2, ArrowUp, MoreVertical, Trash2, Edit3 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useEffect, useState } from "react";

export default function GroupDetailScreen() {
  const { groupId, type } = useLocalSearchParams();
  const { groups, chickenHistory, getAliveAnimals, getChickenStageCount, updateGroup, deleteGroup, getGroupsByType, updateAnimal, duckHistory } = useLivestock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'delete' | 'merge' | null>(null);
  const [selectedMergeGroupId, setSelectedMergeGroupId] = useState<string>('');

  const group = groups.find(g => g.id === groupId);
  const isUngrouped = groupId === 'ungrouped';
  
  // Get available groups for merging (exclude current group)
  const availableMergeGroups = useMemo(() => {
    return getGroupsByType(type as 'chicken').filter(g => g.id !== groupId);
  }, [getGroupsByType, type, groupId]);
  
  useEffect(() => {
    if (isUngrouped) {
      navigation.setOptions({
        title: 'Ungrouped',
      });
    } else if (group) {
      navigation.setOptions({
        title: group.name,
      });
    }
  }, [group, isUngrouped, navigation]);
  
  const groupAnimals = getAliveAnimals(type as 'chicken').filter(a => 
    isUngrouped ? !a.groupId : a.groupId === groupId
  );
  
  const historyList = type === 'chicken' ? chickenHistory : type === 'duck' ? duckHistory : [];
  const groupEvents = historyList.filter(e => 
    isUngrouped ? !e.groupId : e.groupId === groupId
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
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

  const handleRename = async () => {
    if (!group || !newGroupName.trim()) return;
    
    await updateGroup(group.id, { name: newGroupName.trim() });
    setShowRenameModal(false);
    setNewGroupName('');
    
    if (Platform.OS === 'web') {
      alert('Group renamed successfully');
    } else {
      Alert.alert('Success', 'Group renamed successfully');
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    
    if (deleteOption === 'delete') {
      // Delete all animals in the group
      for (const animal of groupAnimals) {
        await updateAnimal(animal.id, { status: 'dead', deathDate: new Date().toISOString().split('T')[0] });
      }
      // Delete the group
      await deleteGroup(group.id);
      
      if (Platform.OS === 'web') {
        alert('Group and animals deleted');
      } else {
        Alert.alert('Success', 'Group and animals deleted');
      }
      router.back();
    } else if (deleteOption === 'merge' && selectedMergeGroupId) {
      // Move all animals to selected group
      for (const animal of groupAnimals) {
        await updateAnimal(animal.id, { groupId: selectedMergeGroupId });
      }
      // Delete the group
      await deleteGroup(group.id);
      
      if (Platform.OS === 'web') {
        alert('Animals moved and group deleted');
      } else {
        Alert.alert('Success', 'Animals moved and group deleted');
      }
      router.back();
    }
  };

  if (!isUngrouped && !group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.text }}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isUngrouped && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setNewGroupName(group?.name || '');
                setShowRenameModal(true);
              }}
            >
              <Edit3 size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.error }]}
              onPress={() => {
                setDeleteOption(null);
                setSelectedMergeGroupId('');
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Group Count</Text>
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
                        params: { ids: chickIds, type: 'chicken' }
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
                        params: { type, breed: breed, groupId }
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
            {!isUngrouped && (
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
            )}
          </View>

          {isUngrouped && groupAnimals.length > 0 && (
            <View style={[styles.infoBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b', marginBottom: 16 }]}>
              <Text style={[styles.infoText, { color: '#92400e' }]}>
                💡 These animals don't belong to any group. You can move them to a group from the Manage Animals screen.
              </Text>
            </View>
          )}

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
                const typeLabel = event.type === 'acquired' 
                  ? (event.stage === 'chick' ? 'Acquired Chicks' : 'Acquired Mature')
                  : event.type === 'sold' ? 'Sold' : event.type === 'consumed' ? 'Consumed' : 'Death/Loss';
                
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
                            {event.breeds.map(b => {
                              if (event.stage === 'chick' && b.chicks) {
                                return `${b.breed} (${b.chicks} chicks)`;
                              }
                              return `${b.breed} (${b.roosters}R/${b.hens}H)`;
                            }).join(', ')}
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

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRenameModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Rename Group</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="Enter new group name"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowRenameModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleRename}
                  disabled={!newGroupName.trim()}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Rename</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Group</Text>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                This group has {groupAnimals.length} animal{groupAnimals.length !== 1 ? 's' : ''}. What would you like to do?
              </Text>
              
              <View style={styles.deleteOptions}>
                <TouchableOpacity
                  style={[
                    styles.deleteOption,
                    { borderColor: colors.border },
                    deleteOption === 'merge' && { borderColor: colors.primary, backgroundColor: colors.surface }
                  ]}
                  onPress={() => setDeleteOption('merge')}
                >
                  <Text style={[styles.deleteOptionText, { color: colors.text }]}>Move to another group</Text>
                </TouchableOpacity>
                
                {deleteOption === 'merge' && (
                  <View style={styles.mergeGroupList}>
                    {availableMergeGroups.length === 0 ? (
                      <Text style={[styles.noGroupsText, { color: colors.textMuted }]}>No other groups available</Text>
                    ) : (
                      availableMergeGroups.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.mergeGroupItem,
                            { borderColor: colors.border },
                            selectedMergeGroupId === g.id && { borderColor: colors.primary, backgroundColor: colors.surface }
                          ]}
                          onPress={() => setSelectedMergeGroupId(g.id)}
                        >
                          <Text style={[styles.mergeGroupText, { color: colors.text }]}>{g.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.deleteOption,
                    { borderColor: colors.border },
                    deleteOption === 'delete' && { borderColor: colors.error, backgroundColor: '#fee' }
                  ]}
                  onPress={() => setDeleteOption('delete')}
                >
                  <Text style={[styles.deleteOptionText, { color: deleteOption === 'delete' ? colors.error : colors.text }]}>
                    Delete animals with group
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalConfirmButton,
                    { backgroundColor: colors.error },
                    (!deleteOption || (deleteOption === 'merge' && !selectedMergeGroupId)) && { opacity: 0.5 }
                  ]}
                  onPress={handleDelete}
                  disabled={!deleteOption || (deleteOption === 'merge' && !selectedMergeGroupId)}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Delete Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  topHeaderContent: {
    flex: 1,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
  },
  topHeaderBirdCount: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
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
  headerBirdCount: {
    fontSize: 14,
    fontWeight: "600" as const,
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
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginTop: 4,
    textAlign: 'center',
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
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalConfirmButton: {
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteOptions: {
    marginBottom: 20,
    gap: 12,
  },
  deleteOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mergeGroupList: {
    paddingLeft: 16,
    gap: 8,
  },
  mergeGroupItem: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mergeGroupText: {
    fontSize: 14,
  },
  noGroupsText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
