import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { DollarSign, FileText, Hash } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function AddIncomeScreen() {
  const { addIncome } = useLivestock();
  const { settings } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState(settings.incomeTypes[0] || 'eggs');
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(getLocalDateString());
  const [livestockType, setLivestockType] = useState<'chicken' | 'rabbit'>('chicken');
  const [description, setDescription] = useState("");

  const totalAmount = (parseFloat(unitPrice) || 0) * (parseInt(quantity) || 0);

  const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!unitPrice || !quantity || !date || !description) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    const price = parseFloat(unitPrice);
    const qty = parseInt(quantity);
    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      if (Platform.OS === 'web') {
        alert("Please enter valid price and quantity");
      }
      return;
    }

    await addIncome({
      type: type as 'eggs' | 'meat' | 'livestock' | 'breeding' | 'other',
      amount: price * qty,
      date,
      livestockType,
      quantity: qty,
      description,
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
          <Text style={styles.label}>Income Type *</Text>
          <View style={styles.typeGrid}>
            {settings.incomeTypes.map((t) => {
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

        {settings.incomeQuickSelects.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quick Select</Text>
            <View style={styles.quickSelectGrid}>
              {settings.incomeQuickSelects.map((quick, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickSelectButton}
                  onPress={() => {
                    setType(quick.type || type);
                    setUnitPrice(quick.amount);
                    setDescription(quick.description);
                    setQuantity("1");
                  }}
                >
                  <Text style={styles.quickSelectText}>{quick.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color="#6b7280" />
            <Text style={styles.label}>Unit Price *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={unitPrice}
            onChangeText={setUnitPrice}
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
            keyboardType="number-pad"
          />
        </View>

        {totalAmount > 0 && (
          <View style={styles.totalDisplay}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <View style={styles.dateButtonsRow}>
            <TouchableOpacity
              style={[styles.dateQuickButton, date === getDateString(0) && styles.dateQuickButtonActive]}
              onPress={() => setDate(getDateString(0))}
            >
              <Text style={[styles.dateQuickButtonText, date === getDateString(0) && styles.dateQuickButtonTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateQuickButton, date === getDateString(1) && styles.dateQuickButtonActive]}
              onPress={() => setDate(getDateString(1))}
            >
              <Text style={[styles.dateQuickButtonText, date === getDateString(1) && styles.dateQuickButtonTextActive]}>
                Yesterday
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateQuickButton, date === getDateString(2) && styles.dateQuickButtonActive]}
              onPress={() => setDate(getDateString(2))}
            >
              <Text style={[styles.dateQuickButtonText, date === getDateString(2) && styles.dateQuickButtonTextActive]}>
                2 Days Ago
              </Text>
            </TouchableOpacity>
          </View>
          <DatePicker
            value={date}
            onChange={setDate}
            collapsible={true}
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
  dateButtonsRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 12,
  },
  dateQuickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center" as const,
  },
  dateQuickButtonActive: {
    backgroundColor: "#10b981",
  },
  dateQuickButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  dateQuickButtonTextActive: {
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
  quickSelectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickSelectButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  quickSelectText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  totalDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
  },
});