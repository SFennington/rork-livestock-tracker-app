import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { DollarSign, Palette, FileText, Hash } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";

export default function EditChickenScreen() {
  const { updateChicken, chickens, chickenHistory } = useLivestock();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [dateAcquired, setDateAcquired] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");

  // Get unique breeds from history
  const availableBreeds = Array.from(
    new Set(
      chickenHistory.flatMap(event => 
        event.breeds?.map(b => b.breed).filter(Boolean) || (event.breed ? [event.breed] : [])
      )
    )
  ).sort();

  useEffect(() => {
    const chicken = chickens.find(c => c.id === id);
    if (chicken) {
      setName(chicken.name);
      setBreed(chicken.breed);
      setDateAcquired(chicken.dateAcquired);
      setCost(chicken.cost.toString());
      setQuantity(chicken.quantity?.toString() || "1");
      setColor(chicken.color || "");
      setNotes(chicken.notes || "");
    }
  }, [id, chickens]);

  const handleSave = async () => {
    if (!name || !breed || !dateAcquired || !cost || !quantity) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    await updateChicken(id as string, {
      name,
      breed,
      dateAcquired,
      cost: parseFloat(cost),
      quantity: parseInt(quantity),
      color: color || undefined,
      notes: notes || undefined,
    });

    router.back();
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top, backgroundColor: colors.accent }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            breeds={availableBreeds}
            placeholder="Select chicken breed"
          />
        </View>

        <View style={styles.inputGroup}>
          <DatePicker
            label="Date Acquired *"
            value={dateAcquired}
            onChange={setDateAcquired}
          />
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
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Update Chicken</Text>
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
});