import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { Hash, FileText, DollarSign, User, Calendar, ChevronDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";

export default function AddChickenEventScreen() {
  const { addChickenHistoryEvent } = useLivestock();
  const { settings } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [eventType, setEventType] = useState(settings.chickenEventTypes[0] || 'acquired');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState("1");
  const [breed, setBreed] = useState("");
  const [cost, setCost] = useState("");
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [notes, setNotes] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

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
                    style={[styles.eventTypeButton, eventType === evtType && styles.eventTypeButtonActive]}
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
                style={[styles.quickDateButton, date === getDateString(0) && styles.quickDateButtonActive]}
                onPress={() => setDate(getDateString(0))}
              >
                <Text style={[styles.quickDateText, date === getDateString(0) && styles.quickDateTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickDateButton, date === getDateString(1) && styles.quickDateButtonActive]}
                onPress={() => setDate(getDateString(1))}
              >
                <Text style={[styles.quickDateText, date === getDateString(1) && styles.quickDateTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickDateButton, date === getDateString(2) && styles.quickDateButtonActive]}
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
});
