import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { DollarSign, FileText, Hash } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function AddIncomeScreen() {
  const { addIncome } = useLivestock();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'eggs' | 'meat' | 'livestock' | 'breeding' | 'other'>('eggs');
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [livestockType, setLivestockType] = useState<'chicken' | 'rabbit'>('chicken');
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!amount || !date || !description) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    const incomeAmount = parseFloat(amount);
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      if (Platform.OS === 'web') {
        alert("Please enter a valid income amount");
      }
      return;
    }

    await addIncome({
      type,
      amount: incomeAmount,
      date,
      livestockType,
      quantity: quantity ? parseInt(quantity) : undefined,
      description,
    });

    router.back();
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Income Type *</Text>
          <View style={styles.typeGrid}>
            {(['eggs', 'meat', 'livestock', 'breeding', 'other'] as const).map((t) => {
              const typeName = t.charAt(0).toUpperCase() + t.slice(1);
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeButton, type === t && styles.typeButtonActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                    {typeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>From *</Text>
          <View style={styles.livestockButtons}>
            <TouchableOpacity
              style={[styles.livestockButton, livestockType === 'chicken' && styles.livestockButtonActive]}
              onPress={() => setLivestockType('chicken')}
            >
              <Text style={[styles.livestockButtonText, livestockType === 'chicken' && styles.livestockButtonTextActive]}>
                Chickens
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.livestockButton, livestockType === 'rabbit' && styles.livestockButtonActive]}
              onPress={() => setLivestockType('rabbit')}
            >
              <Text style={[styles.livestockButtonText, livestockType === 'rabbit' && styles.livestockButtonTextActive]}>
                Rabbits
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color="#6b7280" />
            <Text style={styles.label}>Amount *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Hash size={16} color="#6b7280" />
            <Text style={styles.label}>Quantity (optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Number of items sold"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
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
            <FileText size={16} color="#6b7280" />
            <Text style={styles.label}>Description *</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this income from?"
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
            <Text style={styles.saveButtonText}>Add Income</Text>
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
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  typeButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  livestockButtons: {
    flexDirection: "row",
    gap: 8,
  },
  livestockButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  livestockButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  livestockButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  livestockButtonTextActive: {
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