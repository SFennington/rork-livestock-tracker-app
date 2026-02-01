import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform, Alert, KeyboardAvoidingView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { Plus, Minus, FileText } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function ChickenHistoryScreen() {
  const { addChickenHistoryEvent } = useLivestock();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'acquired' | 'death'>('acquired');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!date || !quantity) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      if (Platform.OS === 'web') {
        alert("Quantity must be a positive number");
      } else {
        Alert.alert("Invalid", "Quantity must be a positive number");
      }
      return;
    }

    await addChickenHistoryEvent({
      date,
      type,
      quantity: qty,
      notes: notes || undefined,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Type *</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'acquired' && styles.typeButtonActive]}
              onPress={() => setType('acquired')}
            >
              <Plus size={20} color={type === 'acquired' ? '#fff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, type === 'acquired' && styles.typeButtonTextActive]}>
                Acquired
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'death' && styles.typeButtonActive]}
              onPress={() => setType('death')}
            >
              <Minus size={20} color={type === 'death' ? '#fff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, type === 'death' && styles.typeButtonTextActive]}>
                Death
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
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Number of chickens"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
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
            <Text style={styles.saveButtonText}>Save Event</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
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
  typeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  typeButtonTextActive: {
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
});
