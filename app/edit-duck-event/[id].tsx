import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { Hash, FileText, DollarSign, Trash2, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { DUCK_BREEDS } from "@/constants/breeds";

export default function EditDuckEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { duckHistory, updateDuckHistoryEvent, deleteDuckHistoryEvent, animals, removeAnimal, addAnimal } = useLivestock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const event = duckHistory.find(e => e.id === id);
  
  const [eventType, setEventType] = useState<'acquired' | 'death' | 'sold' | 'consumed'>(event?.type || 'acquired');
  const [date, setDate] = useState(event?.date || getLocalDateString());
  const [quantity, setQuantity] = useState(String(event?.quantity || 1));
  const [breed, setBreed] = useState(event?.breed || "");
  const [cost, setCost] = useState(event?.cost ? String(event.cost) : "");
  const [sex, setSex] = useState<'M' | 'F' | ''>(event?.sex || '');
  const [notes, setNotes] = useState(event?.notes || "");

  useEffect(() => {
    if (!event) {
      router.back();
    }
  }, [event]);

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

    // If this is an acquired event and key attributes changed, update associated individual animals
    if (event && event.type === 'acquired') {
      const breedChanged = breed !== event.breed;
      const sexChanged = sex !== event.sex;
      const dateChanged = date !== event.date;
      const quantityChanged = qty !== event.quantity;
      
      if (breedChanged || sexChanged || dateChanged || quantityChanged) {
        // Find all individual ducks linked to this event
        const linkedDucks = animals.filter(a => a.eventId === event.id);

        // Remove all linked ducks
        for (const duck of linkedDucks) {
          await removeAnimal(duck.id);
        }

        // Recreate with new attributes, linked to this event
        if (qty > 0) {
          for (let i = 0; i < qty; i++) {
            await addAnimal({
              type: 'duck',
              breed: breed || 'Unknown',
              dateAdded: date,
              status: 'alive',
              sex: sex || undefined,
              eventId: event.id,
            });
          }
        }
      }
    }

    await updateDuckHistoryEvent(id, {
      date,
      type: eventType,
      quantity: qty,
      breed: breed || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      sex: sex || undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  const handleDelete = () => {
    const confirmDelete = () => {
      deleteDuckHistoryEvent(id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to delete this event?")) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Event",
        "Are you sure you want to delete this event?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  if (!event) {
    return null;
  }

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top, backgroundColor: colors.accent }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Type *</Text>
            <View style={styles.eventTypeButtons}>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'acquired' && [styles.eventTypeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setEventType('acquired')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'acquired' && styles.eventTypeButtonTextActive]}>
                  Acquired
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'death' && [styles.eventTypeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setEventType('death')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'death' && styles.eventTypeButtonTextActive]}>
                  Death/Loss
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'sold' && [styles.eventTypeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setEventType('sold')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'sold' && styles.eventTypeButtonTextActive]}>
                  Sold
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'consumed' && [styles.eventTypeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setEventType('consumed')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'consumed' && styles.eventTypeButtonTextActive]}>
                  Consumed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <DatePicker
              label="Date *"
              value={date}
              onChange={setDate}
            />
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
              breeds={DUCK_BREEDS}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={16} color="#6b7280" />
              <Text style={styles.label}>Sex (optional)</Text>
            </View>
            <View style={styles.sexButtons}>
              <TouchableOpacity 
                style={[styles.sexButton, sex === 'M' && [styles.sexButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setSex('M')}
              >
                <Text style={[styles.sexButtonText, sex === 'M' && styles.sexButtonTextActive]}>
                  Drake
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sexButton, sex === 'F' && [styles.sexButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setSex('F')}
              >
                <Text style={[styles.sexButtonText, sex === 'F' && styles.sexButtonTextActive]}>
                  Female
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
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    maxWidth: "100%",
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
  deleteButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
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
});
