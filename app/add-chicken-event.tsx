import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Modal } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { useTheme } from "@/hooks/theme-store";
import { Hash, FileText, DollarSign, User, Calendar, ChevronDown, List } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";

export default function AddChickenEventScreen() {
  const { addChickenHistoryEvent, getAliveAnimals, updateAnimal } = useLivestock();
  const { settings } = useAppSettings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [eventType, setEventType] = useState(settings.chickenEventTypes[0] || 'acquired');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState("1");
  const [breed, setBreed] = useState("");
  const [cost, setCost] = useState("");
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
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
    if (!date || !quantity) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      } else {
        Alert.alert("Error", "Please fill in all required fields");
      }
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      if (Platform.OS === 'web') {
        alert("Quantity must be a positive number");
      } else {
        Alert.alert("Error", "Quantity must be a positive number");
      }
      return;
    }

    // Gender is required for acquired events
    if (eventType === 'acquired' && !sex) {
      Alert.alert("Error", "Please select a gender for acquired chickens");
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

    router.back();
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
        <View style={styles.form}>
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
              <User size={16} color="#6b7280" />
              <Text style={styles.label}>Sex *</Text>
            </View>
            <View style={styles.sexButtons}>
              <TouchableOpacity 
                style={[styles.sexButton, sex === 'M' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => setSex('M')}
              >
                <Text style={[styles.sexButtonText, sex === 'M' && styles.sexButtonTextActive]}>
                  Rooster
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sexButton, sex === 'F' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => setSex('F')}
              >
                <Text style={[styles.sexButtonText, sex === 'F' && styles.sexButtonTextActive]}>
                  Hen
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {eventType === 'acquired' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <DollarSign size={16} color="#6b7280" />
                <Text style={styles.label}>Cost (optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
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

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Add Event</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  form: {
    padding: 20,
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
});
