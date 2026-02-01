import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useLivestock, useRabbitBreeding } from "@/hooks/livestock-store";
import { Calendar, AlertTriangle, Plus, Baby, Heart, CheckCircle2, MinusCircle, PlusCircle, Edit2 } from "lucide-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState, useCallback } from "react";

export default function BreedingCalendarScreen() {
  const { rabbits, breedingRecords, updateBreedingRecord, addRabbit } = useLivestock();
  const { upcomingKindlings, activeBreedings } = useRabbitBreeding();
  const insets = useSafeAreaInsets();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, {
    litterSize: string;
    maleCount: string;
    femaleCount: string;
    harvestCount: string;
    saleCount: string;
    retainedForBreedingCount: string;
  }>>({});

  const onChangeForm = useCallback((id: string, key: keyof (typeof form)[string], value: string) => {
    setForm(prev => ({
      ...prev,
      [id]: {
        litterSize: prev[id]?.litterSize ?? "",
        maleCount: prev[id]?.maleCount ?? "",
        femaleCount: prev[id]?.femaleCount ?? "",
        harvestCount: prev[id]?.harvestCount ?? "",
        saleCount: prev[id]?.saleCount ?? "",
        retainedForBreedingCount: prev[id]?.retainedForBreedingCount ?? "",
        [key]: value,
      },
    }));
  }, []);

  const addAttempt = useCallback(async (id: string, outcome: 'falloff' | 'missed' | 'successful') => {
    try {
      const record = breedingRecords.find(b => b.id === id);
      const attempts = record?.attempts ?? [];
      const newAttempts = [...attempts, { id: `${id}-att-${attempts.length + 1}-${Date.now()}`, date: new Date().toISOString().split('T')[0], outcome }];
      const falloffCount = newAttempts.filter(a => a.outcome === 'falloff').length;
      await updateBreedingRecord(id, { attempts: newAttempts, falloffCount });
    } catch (e) {
      console.log('addAttempt error', e);
      Alert.alert('Error', 'Could not add attempt');
    }
  }, [breedingRecords, updateBreedingRecord]);

  const removeLastAttempt = useCallback(async (id: string) => {
    try {
      const record = breedingRecords.find(b => b.id === id);
      const attempts = record?.attempts ?? [];
      if (attempts.length === 0) return;
      const newAttempts = attempts.slice(0, -1);
      const falloffCount = newAttempts.filter(a => a.outcome === 'falloff').length;
      await updateBreedingRecord(id, { attempts: newAttempts, falloffCount });
    } catch (e) {
      console.log('removeLastAttempt error', e);
      Alert.alert('Error', 'Could not remove attempt');
    }
  }, [breedingRecords, updateBreedingRecord]);

  const setStatus = useCallback(async (id: string, status: 'bred' | 'confirmed' | 'failed') => {
    try {
      await updateBreedingRecord(id, { status });
    } catch (e) {
      console.log('setStatus error', e);
      Alert.alert('Error', 'Could not update status');
    }
  }, [updateBreedingRecord]);

  const livingRabbitsSummary = useMemo(() => {
    const today = new Date();
    return rabbits
      .filter(r => r.status === 'active')
      .map(r => {
        const dob = new Date(r.dateOfBirth);
        const ageDays = Math.max(0, Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)));
        const ageWeeks = Math.floor(ageDays / 7);
        return { id: r.id, name: r.name, gender: r.gender, ageWeeks, destination: 'breeding' as const };
      });
  }, [rabbits]);

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

  const completeBreeding = useCallback(async (id: string) => {
    try {
      const values = form[id];
      if (!values) {
        Alert.alert('Missing info', 'Enter litter details before completing.');
        return;
      }
      const litterSize = Number(values.litterSize || 0);
      const maleCount = Number(values.maleCount || 0);
      const femaleCount = Number(values.femaleCount || 0);
      const harvestCount = Number(values.harvestCount || 0);
      const saleCount = Number(values.saleCount || 0);
      const retainedForBreedingCount = Number(values.retainedForBreedingCount || 0);
      const sumDest = harvestCount + saleCount + retainedForBreedingCount;
      if (litterSize > 0 && sumDest > litterSize) {
        Alert.alert('Check counts', 'Destinations exceed litter size.');
        return;
      }
      const record = breedingRecords.find(b => b.id === id);
      const todayIso = new Date().toISOString().split('T')[0];
      await updateBreedingRecord(id, {
        actualKindlingDate: todayIso,
        weaningDate: todayIso,
        litterSize,
        maleCount,
        femaleCount,
        harvestCount,
        saleCount,
        retainedForBreedingCount,
        weanedCount: litterSize ? Math.max(0, Math.min(litterSize, sumDest)) : undefined,
        status: 'weaned',
      });

      if (record) {
        const doe = rabbits.find(r => r.id === record.doeId);
        const buck = rabbits.find(r => r.id === record.buckId);
        const baseName = `${getRabbitName(record.doeId)} × ${getRabbitName(record.buckId)}`;
        const baseBreed = doe?.breed ?? buck?.breed ?? 'Mixed';

        const addBatch = async (qty: number, gender: 'buck' | 'doe', purpose: 'retained' | 'sale' | 'harvest') => {
          if (qty <= 0) return;
          await addRabbit({
            name: `${baseName} (${purpose === 'retained' ? 'Retained' : purpose === 'sale' ? 'For Sale' : 'Harvest'}) ${gender === 'buck' ? '♂' : '♀'}`,
            breed: baseBreed,
            gender,
            dateOfBirth: todayIso,
            dateAcquired: todayIso,
            cost: 0,
            quantity: qty,
            status: 'active',
            color: doe?.color ?? buck?.color,
            parentBuckId: record.buckId,
            parentDoeId: record.doeId,
            notes: `Born from ${baseName} on ${todayIso}. Destination: ${purpose}.`
          });
        };

        const retainedBucks = Math.min(maleCount, retainedForBreedingCount);
        const retainedDoes = Math.min(femaleCount, Math.max(0, retainedForBreedingCount - retainedBucks));
        await addBatch(retainedBucks, 'buck', 'retained');
        await addBatch(retainedDoes, 'doe', 'retained');

        const remainingMalesAfterRetain = Math.max(0, maleCount - retainedBucks);
        const remainingFemalesAfterRetain = Math.max(0, femaleCount - retainedDoes);

        const saleBucks = Math.min(remainingMalesAfterRetain, saleCount);
        const saleDoes = Math.min(remainingFemalesAfterRetain, Math.max(0, saleCount - saleBucks));
        await addBatch(saleBucks, 'buck', 'sale');
        await addBatch(saleDoes, 'doe', 'sale');

        const remMalesAfterSale = Math.max(0, remainingMalesAfterRetain - saleBucks);
        const remFemalesAfterSale = Math.max(0, remainingFemalesAfterRetain - saleDoes);

        const harvestBucks = Math.min(remMalesAfterSale, harvestCount);
        const harvestDoes = Math.min(remFemalesAfterSale, Math.max(0, harvestCount - harvestBucks));
        await addBatch(harvestBucks, 'buck', 'harvest');
        await addBatch(harvestDoes, 'doe', 'harvest');
      }

      setExpandedId(null);
      Alert.alert('Saved', 'Breeding completed and kits added to herd.', [{ text: 'OK' }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to complete breeding.');
      console.log('completeBreeding error', e);
    }
  }, [form, updateBreedingRecord, breedingRecords, rabbits, addRabbit]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="add-breeding" style={styles.addButton} onPress={() => router.push('/add-breeding')}>
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Plan New Breeding</Text>
          </TouchableOpacity>

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
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Falloffs:</Text>
                      <Text style={styles.detailValue}>{breeding.falloffCount ?? 0}</Text>
                    </View>
                    {(breeding.attempts ?? []).length > 0 && (
                      <Text style={styles.detailText}>Attempts: {(breeding.attempts ?? []).map(a => a.outcome).join(', ')}</Text>
                    )}

                    <View style={styles.actionsRow}>
                      <TouchableOpacity testID={`attempt-falloff-${breeding.id}`} style={styles.attemptButton} onPress={() => addAttempt(breeding.id, 'falloff')}>
                        <PlusCircle size={18} color="#111827" />
                        <Text style={styles.attemptButtonText}>Add Falloff</Text>
                      </TouchableOpacity>
                      <TouchableOpacity testID={`attempt-missed-${breeding.id}`} style={styles.attemptButton} onPress={() => addAttempt(breeding.id, 'missed')}>
                        <PlusCircle size={18} color="#111827" />
                        <Text style={styles.attemptButtonText}>Add Missed</Text>
                      </TouchableOpacity>
                      <TouchableOpacity testID={`attempt-success-${breeding.id}`} style={styles.attemptButton} onPress={() => addAttempt(breeding.id, 'successful')}>
                        <PlusCircle size={18} color="#111827" />
                        <Text style={styles.attemptButtonText}>Add Successful</Text>
                      </TouchableOpacity>
                      <TouchableOpacity testID={`attempt-remove-${breeding.id}`} style={styles.removeAttemptButton} onPress={() => removeLastAttempt(breeding.id)}>
                        <MinusCircle size={18} color="#ef4444" />
                        <Text style={styles.removeAttemptButtonText}>Undo</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity testID={`status-bred-${breeding.id}`} style={styles.statusButton} onPress={() => setStatus(breeding.id, 'bred')}>
                        <Edit2 size={16} color="#111827" />
                        <Text style={styles.statusButtonText}>Mark Bred</Text>
                      </TouchableOpacity>
                      <TouchableOpacity testID={`status-confirmed-${breeding.id}`} style={styles.statusButton} onPress={() => setStatus(breeding.id, 'confirmed')}>
                        <Edit2 size={16} color="#111827" />
                        <Text style={styles.statusButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity testID={`status-failed-${breeding.id}`} style={styles.statusButton} onPress={() => setStatus(breeding.id, 'failed')}>
                        <Edit2 size={16} color="#111827" />
                        <Text style={styles.statusButtonText}>Fail</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        testID={`complete-${breeding.id}`}
                        style={styles.completeButton}
                        onPress={() => setExpandedId(p => (p === breeding.id ? null : breeding.id))}
                      >
                        <CheckCircle2 size={18} color="#fff" />
                        <Text style={styles.completeButtonText}>{expandedId === breeding.id ? 'Hide' : 'Complete Breeding'}</Text>
                      </TouchableOpacity>
                    </View>
                    {expandedId === breeding.id && (
                      <View style={styles.formContainer}>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Litter size</Text>
                          <TextInput
                            testID={`input-litter-${breeding.id}`}
                            style={styles.input}
                            keyboardType="number-pad"
                            value={form[breeding.id]?.litterSize ?? ''}
                            onChangeText={(t) => onChangeForm(breeding.id, 'litterSize', t)}
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Males</Text>
                          <TextInput
                            testID={`input-male-${breeding.id}`}
                            style={styles.input}
                            keyboardType="number-pad"
                            value={form[breeding.id]?.maleCount ?? ''}
                            onChangeText={(t) => onChangeForm(breeding.id, 'maleCount', t)}
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Females</Text>
                          <TextInput
                            testID={`input-female-${breeding.id}`}
                            style={styles.input}
                            keyboardType="number-pad"
                            value={form[breeding.id]?.femaleCount ?? ''}
                            onChangeText={(t) => onChangeForm(breeding.id, 'femaleCount', t)}
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Harvest</Text>
                          <TextInput
                            testID={`input-harvest-${breeding.id}`}
                            style={styles.input}
                            keyboardType="number-pad"
                            value={form[breeding.id]?.harvestCount ?? ''}
                            onChangeText={(t) => onChangeForm(breeding.id, 'harvestCount', t)}
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Sale</Text>
                          <TextInput
                            testID={`input-sale-${breeding.id}`}
                            style={styles.input}
                            keyboardType="number-pad"
                            value={form[breeding.id]?.saleCount ?? ''}
                            onChangeText={(t) => onChangeForm(breeding.id, 'saleCount', t)}
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>Retained</Text>
                          <TextInput
                            testID={`input-retained-${breeding.id}`}
                            style={styles.input}
                            keyboardType="number-pad"
                            value={form[breeding.id]?.retainedForBreedingCount ?? ''}
                            onChangeText={(t) => onChangeForm(breeding.id, 'retainedForBreedingCount', t)}
                            placeholder="0"
                          />
                        </View>
                        <TouchableOpacity
                          testID={`save-complete-${breeding.id}`}
                          style={styles.saveButton}
                          onPress={() => completeBreeding(breeding.id)}
                        >
                          <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Baby size={20} color="#374151" />
              <Text style={styles.sectionTitle}>Living Rabbits Summary</Text>
            </View>
            {livingRabbitsSummary.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No rabbits found</Text>
                <Text style={styles.emptySubtext}>Add rabbits to see their ages and purposes</Text>
              </View>
            ) : (
              livingRabbitsSummary.map(r => (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{r.name}</Text>
                      <Text style={styles.cardSubtitle}>Gender: {r.gender} • Age: {r.ageWeeks} wks</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                      <Text style={styles.statusText}>{r.destination}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
    </KeyboardAvoidingView>
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
  actionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  attemptButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attemptButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
  },
  removeAttemptButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeAttemptButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 12,
  },
  statusButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  formContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  formLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  input: {
    width: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});