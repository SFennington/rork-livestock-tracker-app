import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { FileText } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function AddBreedingScreen() {
  const { rabbits, addBreedingRecord } = useLivestock();
  const insets = useSafeAreaInsets();
  const [selectedBuck, setSelectedBuck] = useState("");
  const [selectedDoe, setSelectedDoe] = useState("");
  const [breedingDate, setBreedingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  const bucks = rabbits.filter(r => r.gender === 'buck' && r.status === 'active');
  const does = rabbits.filter(r => r.gender === 'doe' && r.status === 'active');

  const quickSelectOptions = [
    { label: 'Today', date: new Date().toISOString().split('T')[0] },
    { label: 'Yesterday', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    { label: '2 Days Ago', date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
  ];

  const handleQuickSelect = (option: { label: string; date: string }) => {
    setBreedingDate(option.date);
  };

  const calculateExpectedKindling = (date: string) => {
    const breeding = new Date(date);
    breeding.setDate(breeding.getDate() + 31);
    return breeding.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!selectedBuck || !selectedDoe || !breedingDate) {
      if (Platform.OS === 'web') {
        alert("Please select both rabbits and breeding date");
      }
      return;
    }

    await addBreedingRecord({
      buckId: selectedBuck,
      doeId: selectedDoe,
      breedingDate,
      expectedKindlingDate: calculateExpectedKindling(breedingDate),
      status: 'bred',
      notes: notes || undefined,
    });

    router.back();
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quick Select Date</Text>
          <View style={styles.quickSelectGrid}>
            {quickSelectOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickSelectButton}
                onPress={() => handleQuickSelect(option)}
              >
                <Text style={styles.quickSelectText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Buck *</Text>
          <View style={styles.selectionGrid}>
            {bucks.length === 0 ? (
              <Text style={styles.emptyText}>No bucks available</Text>
            ) : (
              bucks.map((buck) => (
                <TouchableOpacity
                  key={buck.id}
                  style={[styles.selectionCard, selectedBuck === buck.id && styles.selectedCard]}
                  onPress={() => setSelectedBuck(buck.id)}
                >
                  <Text style={[styles.selectionName, selectedBuck === buck.id && styles.selectedText]}>
                    {buck.name}
                  </Text>
                  <Text style={[styles.selectionBreed, selectedBuck === buck.id && styles.selectedSubtext]}>
                    {buck.breed}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Doe *</Text>
          <View style={styles.selectionGrid}>
            {does.length === 0 ? (
              <Text style={styles.emptyText}>No does available</Text>
            ) : (
              does.map((doe) => (
                <TouchableOpacity
                  key={doe.id}
                  style={[styles.selectionCard, selectedDoe === doe.id && styles.selectedCard]}
                  onPress={() => setSelectedDoe(doe.id)}
                >
                  <Text style={[styles.selectionName, selectedDoe === doe.id && styles.selectedText]}>
                    {doe.name}
                  </Text>
                  <Text style={[styles.selectionBreed, selectedDoe === doe.id && styles.selectedSubtext]}>
                    {doe.breed}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <DatePicker
            label="Breeding Date *"
            value={breedingDate}
            onChange={setBreedingDate}
          />
          <Text style={styles.helperText}>
            Expected kindling: {calculateExpectedKindling(breedingDate)} (31 days)
          </Text>
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
            placeholder="Any observations or notes"
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
            <Text style={styles.saveButtonText}>Record Breeding</Text>
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
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  selectionCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
  },
  selectedCard: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  selectionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  selectedText: {
    color: "#fff",
  },
  selectionBreed: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  selectedSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
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
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  quickSelectText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
});