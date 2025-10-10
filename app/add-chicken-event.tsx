import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { Hash, FileText, DollarSign, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";

export default function AddChickenEventScreen() {
  const { addChickenHistoryEvent } = useLivestock();
  const insets = useSafeAreaInsets();
  const [eventType, setEventType] = useState<'acquired' | 'death' | 'sold' | 'consumed'>('acquired');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState("1");
  const [breed, setBreed] = useState("");
  const [cost, setCost] = useState("");
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [notes, setNotes] = useState("");

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

    await addChickenHistoryEvent({
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

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Type *</Text>
            <View style={styles.eventTypeButtons}>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'acquired' && styles.eventTypeButtonActive]}
                onPress={() => setEventType('acquired')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'acquired' && styles.eventTypeButtonTextActive]}>
                  Acquired
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'death' && styles.eventTypeButtonActive]}
                onPress={() => setEventType('death')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'death' && styles.eventTypeButtonTextActive]}>
                  Death/Loss
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'sold' && styles.eventTypeButtonActive]}
                onPress={() => setEventType('sold')}
              >
                <Text style={[styles.eventTypeButtonText, eventType === 'sold' && styles.eventTypeButtonTextActive]}>
                  Sold
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.eventTypeButton, eventType === 'consumed' && styles.eventTypeButtonActive]}
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
              breeds={CHICKEN_BREEDS}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={16} color="#6b7280" />
              <Text style={styles.label}>Sex (optional)</Text>
            </View>
            <View style={styles.sexButtons}>
              <TouchableOpacity 
                style={[styles.sexButton, sex === 'M' && styles.sexButtonActive]}
                onPress={() => setSex('M')}
              >
                <Text style={[styles.sexButtonText, sex === 'M' && styles.sexButtonTextActive]}>
                  Rooster
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sexButton, sex === 'F' && styles.sexButtonActive]}
                onPress={() => setSex('F')}
              >
                <Text style={[styles.sexButtonText, sex === 'F' && styles.sexButtonTextActive]}>
                  Hen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sexButton, sex === '' && styles.sexButtonActive]}
                onPress={() => setSex('')}
              >
                <Text style={[styles.sexButtonText, sex === '' && styles.sexButtonTextActive]}>
                  N/A
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
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
      </View>
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
});
