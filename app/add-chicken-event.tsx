import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal, KeyboardAvoidingView } from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { useTheme } from "@/hooks/theme-store";
import { Hash, FileText, DollarSign, User, Calendar, ChevronDown, List, Plus, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";
import type { BreedEntry } from "@/types/livestock";

export default function AddChickenEventScreen() {
  const { addChickenHistoryEvent, getAliveAnimals, updateAnimal, groups, getGroupsByType, addGroup } = useLivestock();
  const { settings } = useAppSettings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const preselectedGroupId = params.groupId as string | undefined;
  
  const [step, setStep] = useState<'group' | 'event'>(preselectedGroupId ? 'event' : 'group');
  const [groupName, setGroupName] = useState('');
  const [groupNotes, setGroupNotes] = useState('');
  const [useExistingGroup, setUseExistingGroup] = useState(false);
  
  const [eventType, setEventType] = useState(settings.chickenEventTypes[0] || 'acquired');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stage, setStage] = useState<'chick' | 'mature'>('mature');
  const [hatchDate, setHatchDate] = useState('');
  const [showHatchCalendar, setShowHatchCalendar] = useState(false);
  
  // Multi-breed support
  const [breeds, setBreeds] = useState<BreedEntry[]>([{ breed: '', roosters: 0, hens: 0, chicks: 0, cost: undefined, notes: '' }]);
  
  // Legacy single-breed fields (for backward compatibility in UI)
  const [quantity, setQuantity] = useState("1");
  const [breed, setBreed] = useState("");
  const [cost, setCost] = useState("");
  
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [groupId, setGroupId] = useState<string>(preselectedGroupId || '');
  const [notes, setNotes] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);

  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    // Step 1: Create or select group
    if (step === 'group') {
      if (useExistingGroup) {
        if (!groupId) {
          Alert.alert("Error", "Please select a group");
          return;
        }
      } else {
        if (!groupName.trim()) {
          Alert.alert("Error", "Please enter a group name");
          return;
        }
        // Create new group
        const newGroup = await addGroup({
          name: groupName,
          type: 'chicken',
          notes: groupNotes || undefined,
        });
        setGroupId(newGroup.id);
      }
      setStep('event');
      return;
    }
    
    // Step 2: Create event
    // Validate breeds array for acquired events
    if (eventType === 'acquired') {
      const validBreeds = breeds.filter(b => b.breed && (b.roosters > 0 || b.hens > 0 || (b.chicks && b.chicks > 0)));
      console.log('[AddChickenEvent] Breeds before filtering:', breeds);
      console.log('[AddChickenEvent] Valid breeds after filter:', validBreeds);
      
      if (validBreeds.length === 0) {
        Alert.alert("Error", stage === 'chick' ? "Please add at least one breed with chicks" : "Please add at least one breed with roosters or hens");
        return;
      }

      // Calculate total quantity and determine sex
      const totalRoosters = validBreeds.reduce((sum, b) => sum + b.roosters, 0);
      const totalHens = validBreeds.reduce((sum, b) => sum + b.hens, 0);
      const totalChicks = validBreeds.reduce((sum, b) => sum + (b.chicks || 0), 0);
      const totalQty = stage === 'chick' ? totalChicks : totalRoosters + totalHens;
      
      // Determine sex based on composition
      let determinedSex: 'M' | 'F' | undefined = undefined;
      if (stage !== 'chick') {
        if (totalRoosters > 0 && totalHens === 0) determinedSex = 'M';
        else if (totalHens > 0 && totalRoosters === 0) determinedSex = 'F';
      }

      const eventData = {
        date,
        type: 'acquired' as const,
        quantity: totalQty,
        breeds: validBreeds,
        sex: determinedSex,
        stage,
        hatchDate: stage === 'chick' ? hatchDate || undefined : undefined,
        groupId: groupId || undefined,
        notes: notes || undefined,
      };
      console.log('[AddChickenEvent] Event data being sent:', JSON.stringify(eventData, null, 2));

      await addChickenHistoryEvent(eventData);
    } else {
      // For other event types, use legacy single-breed approach
      if (!date || !quantity) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert("Error", "Quantity must be a positive number");
        return;
      }

      // For death/consumed events, validate selected animals match quantity
      if ((eventType === 'death' || eventType === 'consumed') && selectedAnimalIds.length > 0) {
        if (selectedAnimalIds.length !== qty) {
          Alert.alert("Error", `Please select exactly ${qty} animal(s)`);
          return;
        }
      }

      await addChickenHistoryEvent({
        date,
        type: eventType as 'acquired' | 'death' | 'sold' | 'consumed',
        quantity: qty,
        breed: breed || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        sex: sex || undefined,
        groupId: groupId || undefined,
        notes: notes || undefined,
      });

      // Mark selected animals as dead/consumed
      if ((eventType === 'death' || eventType === 'consumed') && selectedAnimalIds.length > 0) {
        for (const animalId of selectedAnimalIds) {
          await updateAnimal(animalId, {
            status: eventType === 'consumed' ? 'consumed' : 'dead',
            deathDate: date,
            deathReason: notes || undefined,
          });
        }
      }
    }

    router.back();
  };

  // Multi-breed management functions
  const addBreedEntry = () => {
    setBreeds([...breeds, { breed: '', roosters: 0, hens: 0, chicks: 0, cost: undefined, notes: '' }]);
  };

  const removeBreedEntry = (index: number) => {
    if (breeds.length > 1) {
      setBreeds(breeds.filter((_, i) => i !== index));
    }
  };

  const updateBreedEntry = (index: number, field: keyof BreedEntry, value: any) => {
    const updated = [...breeds];
    updated[index] = { ...updated[index], [field]: value };
    setBreeds(updated);
  };

  const chickenGroups = getGroupsByType('chicken');

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
    >
        <View style={styles.form}>
          {step === 'group' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.header}>Create or Select Group</Text>
                <Text style={styles.subheader}>Events are organized within groups</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <View style={styles.groupTypeButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.groupTypeButton,
                      !useExistingGroup && { backgroundColor: colors.accent, borderColor: colors.accent }
                    ]}
                    onPress={() => setUseExistingGroup(false)}
                  >
                    <Text style={[styles.groupTypeButtonText, !useExistingGroup && styles.groupTypeButtonTextActive]}>
                      Create New
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.groupTypeButton, 
                      useExistingGroup && { backgroundColor: colors.accent, borderColor: colors.accent },
                      chickenGroups.length === 0 && { opacity: 0.4 }
                    ]}
                    onPress={() => chickenGroups.length > 0 && setUseExistingGroup(true)}
                    disabled={chickenGroups.length === 0}
                  >
                    <Text style={[styles.groupTypeButtonText, useExistingGroup && styles.groupTypeButtonTextActive]}>
                      Use Existing
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!useExistingGroup ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Group Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={groupName}
                      onChangeText={setGroupName}
                      placeholder="e.g., Spring 2026 Batch"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notes (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={groupNotes}
                      onChangeText={setGroupNotes}
                      placeholder="Group description or notes"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Group *</Text>
                  {chickenGroups.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      {chickenGroups.map((group) => (
                        <TouchableOpacity 
                          key={group.id}
                          style={[styles.sexButton, groupId === group.id && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                          onPress={() => setGroupId(group.id)}
                        >
                          <Text style={[styles.sexButtonText, groupId === group.id && styles.sexButtonTextActive]}>
                            {group.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.label, { fontStyle: 'italic', color: '#9ca3af' }]}>
                      No groups available. Please create a new group.
                    </Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
          {/* Group Header */}
          {preselectedGroupId && (() => {
            const selectedGroup = groups.find(g => g.id === preselectedGroupId);
            return selectedGroup ? (
              <View style={[styles.inputGroup, { marginBottom: 24 }]}>
                <View style={[styles.groupHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.groupHeaderLabel, { color: colors.textSecondary }]}>Adding event to group:</Text>
                  <Text style={[styles.groupHeaderName, { color: colors.text }]}>{selectedGroup.name}</Text>
                </View>
              </View>
            ) : null;
          })()}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Type *</Text>
            <View style={styles.eventTypeButtons}>
              {settings.chickenEventTypes.map((evtType) => {
                const displayName = evtType === 'death' ? 'Death/Loss' : evtType.charAt(0).toUpperCase() + evtType.slice(1);
                return (
                  <TouchableOpacity
                    key={evtType}
                    style={[styles.eventTypeButton, eventType === evtType && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setEventType(evtType)}
                  >
                    <Text style={[styles.eventTypeButtonText, eventType === evtType && styles.eventTypeButtonTextActive]}>
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.label}>Date *</Text>
            </View>
            
            <View style={styles.quickDateButtons}>
              <TouchableOpacity 
                style={[styles.quickDateButton, date === getDateString(0) && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => setDate(getDateString(0))}
              >
                <Text style={[styles.quickDateText, date === getDateString(0) && styles.quickDateTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickDateButton, date === getDateString(1) && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => setDate(getDateString(1))}
              >
                <Text style={[styles.quickDateText, date === getDateString(1) && styles.quickDateTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickDateButton, date === getDateString(2) && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => setDate(getDateString(2))}
              >
                <Text style={[styles.quickDateText, date === getDateString(2) && styles.quickDateTextActive]}>
                  2 Days Ago
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.calendarToggle}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={styles.calendarToggleText}>
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
              </Text>
              <ChevronDown size={16} color="#6b7280" style={[showCalendar && { transform: [{ rotate: '180deg' }] }]} />
            </TouchableOpacity>

            {showCalendar && (
              <DatePicker
                label=""
                value={date}
                onChange={setDate}
              />
            )}
          </View>

          {eventType === 'acquired' && (
            <>
              {/* Stage Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stage *</Text>
                <View style={styles.sexButtons}>
                  <TouchableOpacity 
                    style={[styles.sexButton, stage === 'mature' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setStage('mature')}
                  >
                    <Text style={[styles.sexButtonText, stage === 'mature' && styles.sexButtonTextActive]}>
                      Mature
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sexButton, stage === 'chick' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setStage('chick')}
                  >
                    <Text style={[styles.sexButtonText, stage === 'chick' && styles.sexButtonTextActive]}>
                      Chicks
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hatch Date for Chicks */}
              {stage === 'chick' && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.label}>Hatch Date (optional)</Text>
                  </View>
                  {hatchDate ? (
                    <View style={styles.selectedDateContainer}>
                      <View style={[styles.selectedDateDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.selectedDateText, { color: colors.text }]}>{hatchDate}</Text>
                        <TouchableOpacity onPress={() => setHatchDate('')}>
                          <X size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowHatchCalendar(true)}
                    >
                      <Text style={{ color: '#9ca3af' }}>
                        Select hatch date
                      </Text>
                    </TouchableOpacity>
                  )}
                  {showHatchCalendar && (
                    <DatePicker
                      label=""
                      value={hatchDate}
                      onChange={(date) => {
                        setHatchDate(date);
                        setShowHatchCalendar(false);
                      }}
                    />
                  )}
                </View>
              )}

              {/* Display Group Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Group</Text>
                <Text style={styles.groupNameDisplay}>
                  {chickenGroups.find(g => g.id === groupId)?.name || 'Unknown Group'}
                </Text>
              </View>

              {/* Multi-Breed Entries */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Breeds *</Text>
                {breeds.map((breedEntry, index) => (
                  <View key={index} style={[styles.breedEntryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.breedEntryHeader}>
                      <Text style={[styles.breedEntryTitle, { color: colors.text }]}>Breed {index + 1}</Text>
                      {breeds.length > 1 && (
                        <TouchableOpacity onPress={() => removeBreedEntry(index)}>
                          <X size={20} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <BreedPicker
                      label=""
                      value={breedEntry.breed}
                      onChange={(breed) => updateBreedEntry(index, 'breed', breed)}
                      breeds={CHICKEN_BREEDS}
                      placeholder="Select breed"
                    />
                    
                    {stage === 'chick' ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={[styles.breedEntryLabel, { color: colors.textSecondary }]}>Quantity</Text>
                        <TextInput
                          key={`chick-qty-${index}`}
                          style={[styles.breedEntryInput, { borderColor: colors.border, color: colors.text }]}
                          value={String(breedEntry.chicks || '')}
                          onChangeText={(text) => {
                            const qty = text.trim() === '' ? 0 : parseInt(text) || 0;
                            updateBreedEntry(index, 'chicks', qty);
                          }}
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                        />
                      </View>
                    ) : (
                      <View style={styles.breedEntryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.breedEntryLabel, { color: colors.textSecondary }]}>Roosters</Text>
                          <TextInput
                            style={[styles.breedEntryInput, { borderColor: colors.border, color: colors.text }]}
                            value={String(breedEntry.roosters)}
                            onChangeText={(text) => updateBreedEntry(index, 'roosters', parseInt(text) || 0)}
                            placeholder="0"
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[styles.breedEntryLabel, { color: colors.textSecondary }]}>Hens</Text>
                          <TextInput
                            style={[styles.breedEntryInput, { borderColor: colors.border, color: colors.text }]}
                            value={String(breedEntry.hens)}
                            onChangeText={(text) => updateBreedEntry(index, 'hens', parseInt(text) || 0)}
                            placeholder="0"
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    )}
                    
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.breedEntryLabel, { color: colors.textSecondary }]}>Cost (optional)</Text>
                      <TextInput
                        style={[styles.breedEntryInput, { borderColor: colors.border, color: colors.text }]}
                        value={breedEntry.cost ? String(breedEntry.cost) : ''}
                        onChangeText={(text) => updateBreedEntry(index, 'cost', text ? parseFloat(text) : undefined)}
                        placeholder="0.00"
                        placeholderTextColor="#9ca3af"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity 
                  style={[styles.addBreedButton, { borderColor: colors.accent }]}
                  onPress={addBreedEntry}
                >
                  <Plus size={20} color={colors.accent} />
                  <Text style={[styles.addBreedButtonText, { color: colors.accent }]}>Add Another Breed</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {eventType !== 'acquired' && (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Hash size={16} color="#6b7280" />
                  <Text style={styles.label}>Quantity *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <BreedPicker
                  label="Breed (optional)"
                  value={breed}
                  onChange={setBreed}
                  breeds={CHICKEN_BREEDS}
                />
              </View>
            </>
          )}

          {(eventType === 'death' || eventType === 'consumed') && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <List size={16} color="#6b7280" />
                <Text style={styles.label}>Select Animals (optional)</Text>
              </View>
              <TouchableOpacity 
                style={styles.animalPickerButton}
                onPress={() => setShowAnimalPicker(true)}
              >
                <Text style={styles.animalPickerButtonText}>
                  {selectedAnimalIds.length > 0 
                    ? `${selectedAnimalIds.length} animal(s) selected`
                    : 'Tap to select specific animals'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <FileText size={16} color="#6b7280" />
              <Text style={styles.label}>Notes (optional)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
          </>
          )}

          <View style={styles.buttons}>
            {step === 'event' && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('group')}>
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{step === 'group' ? 'Continue' : 'Add Event'}</Text>
            </TouchableOpacity>
          </View>
      </View>

      {/* Animal Picker Modal */}
      <Modal
        visible={showAnimalPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnimalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Chickens</Text>
              <TouchableOpacity onPress={() => setShowAnimalPicker(false)}>
                <Text style={[styles.modalClose, { color: colors.accent }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {getAliveAnimals('chicken', breed || undefined)
                .sort((a, b) => {
                  if (a.breed !== b.breed) return a.breed.localeCompare(b.breed);
                  return a.number - b.number;
                })
                .map((animal) => {
                  const isSelected = selectedAnimalIds.includes(animal.id);
                  return (
                    <TouchableOpacity
                      key={animal.id}
                      style={[styles.animalItem, isSelected && { backgroundColor: `${colors.accent}15`, borderColor: colors.accent }]}
                      onPress={() => {
                        setSelectedAnimalIds(prev => 
                          isSelected 
                            ? prev.filter(id => id !== animal.id)
                            : [...prev, animal.id]
                        );
                      }}
                    >
                      <View style={styles.animalItemContent}>
                        <Text style={styles.animalItemNumber}>#{animal.number}</Text>
                        {animal.name && <Text style={styles.animalItemName}>{animal.name}</Text>}
                        <Text style={styles.animalItemBreed}>{animal.breed}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                        {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              {getAliveAnimals('chicken', breed || undefined).length === 0 && (
                <Text style={styles.emptyModalText}>No chickens available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  form: {
    padding: 20,
    paddingTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  groupHeaderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  groupHeaderLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  groupHeaderName: {
    fontSize: 20,
    fontWeight: '700',
  },
  eventTypeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  eventTypeButton: {
    minWidth: "48%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  eventTypeButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  eventTypeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  eventTypeButtonTextActive: {
    color: "#fff",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  header: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 4,
    color: "#000",
  },
  subheader: {
    fontSize: 14,
    lineHeight: 20,
    color: "#000",
  },
  groupTypeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  groupTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  groupTypeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  groupTypeButtonTextActive: {
    color: "#fff",
  },
  sexButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sexButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  sexButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  sexButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  sexButtonTextActive: {
    color: "#fff",
  },
  groupNameDisplay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    paddingVertical: 8,
  },
  quickDateButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  quickDateButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  quickDateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  quickDateTextActive: {
    color: "#fff",
  },
  calendarToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  calendarToggleText: {
    fontSize: 13,
    color: "#6b7280",
  },
  animalPickerButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  animalPickerButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalClose: {
    fontSize: 16,
    color: "#10b981",
    fontWeight: "600",
  },
  modalList: {
    padding: 16,
  },
  animalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  animalItemSelected: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  animalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  animalItemNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  animalItemName: {
    fontSize: 14,
    color: "#6b7280",
  },
  animalItemBreed: {
    fontSize: 13,
    color: "#9ca3af",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  checkboxCheck: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyModalText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    paddingVertical: 32,
  },
  breedEntryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  breedEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breedEntryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  breedEntryRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  breedEntryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  breedEntryInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addBreedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addBreedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDateContainer: {
    marginTop: 4,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
