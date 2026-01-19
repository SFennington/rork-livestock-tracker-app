import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { DollarSign, Palette, FileText, Hash, Calendar, ChevronDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";

export default function AddChickenScreen() {
  const { addChicken } = useLivestock();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [dateAcquired, setDateAcquired] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!name || !breed || !dateAcquired || !cost || !quantity) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    await addChicken({
      name,
      breed,
      dateAcquired,
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
      status: 'active',
      color: color || undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter chicken name"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <BreedPicker
            label="Breed *"
            value={breed}
            onChange={setBreed}
            breeds={CHICKEN_BREEDS}
            placeholder="Select chicken breed"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.label}>Date Acquired *</Text>
          </View>
          
          <View style={styles.quickDateButtons}>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateAcquired === getDateString(0) && styles.quickDateButtonActive]}
              onPress={() => setDateAcquired(getDateString(0))}
            >
              <Text style={[styles.quickDateText, dateAcquired === getDateString(0) && styles.quickDateTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateAcquired === getDateString(1) && styles.quickDateButtonActive]}
              onPress={() => setDateAcquired(getDateString(1))}
            >
              <Text style={[styles.quickDateText, dateAcquired === getDateString(1) && styles.quickDateTextActive]}>
                Yesterday
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickDateButton, dateAcquired === getDateString(2) && styles.quickDateButtonActive]}
              onPress={() => setDateAcquired(getDateString(2))}
            >
              <Text style={[styles.quickDateText, dateAcquired === getDateString(2) && styles.quickDateTextActive]}>
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
              value={dateAcquired}
              onChange={setDateAcquired}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color="#6b7280" />
            <Text style={styles.label}>Cost *</Text>
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
          <View style={styles.labelRow}>
            <Palette size={16} color="#6b7280" />
            <Text style={styles.label}>Color (optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="e.g., Brown, White"
            placeholderTextColor="#9ca3af"
          />
        </View>

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
            <Text style={styles.saveButtonText}>Add Chicken</Text>
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