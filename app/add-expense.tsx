import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { router } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { useFinancialStore } from "@/hooks/financial-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { DollarSign, FileText, Calendar } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS, DUCK_BREEDS, RABBIT_BREEDS } from "@/constants/breeds";

export default function AddExpenseScreen() {
  const { groups, getGroupsByType } = useLivestock();
  const { addRecord } = useFinancialStore();
  const saveROISnapshot = useFinancialStore(state => state.saveROISnapshot);
  const { settings } = useAppSettings();
  const insets = useSafeAreaInsets();
  
  const [category, setCategory] = useState(settings.expenseCategories[0] || 'feed');
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [livestockType, setLivestockType] = useState<'chicken' | 'rabbit' | 'duck' | 'general'>('general');
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [recurring, setRecurring] = useState(false);

  // Get breeds for current livestock type
  const availableBreeds = useMemo(() => {
    switch (livestockType) {
      case 'chicken':
        return [...CHICKEN_BREEDS, ...(settings.customChickenBreeds || [])].sort();
      case 'duck':
        return [...DUCK_BREEDS, ...(settings.customDuckBreeds || [])].sort();
      case 'rabbit':
        return [...RABBIT_BREEDS, ...(settings.customRabbitBreeds || [])].sort();
      default:
        return [];
    }
  }, [livestockType, settings]);

  // Get groups for current livestock type
  const currentGroups = useMemo(() => {
    if (livestockType === 'general') return [];
    return getGroupsByType(livestockType);
  }, [livestockType, getGroupsByType]);

  // Reset group and breed when livestock type changes
  useEffect(() => {
    setGroupId("");
    setBreed("");
  }, [livestockType]);

  // Auto-select group if only one exists
  useEffect(() => {
    if (currentGroups.length === 1) {
      setGroupId(currentGroups[0].id);
    } else if (currentGroups.length === 0) {
      setGroupId("");
    }
  }, [currentGroups]);

  // Group options for picker
  const groupOptions = ['None', ...currentGroups.map(g => g.name)];
  
  const getGroupIdFromName = (name: string) => {
    if (name === 'None') return '';
    const group = currentGroups.find(g => g.name === name);
    return group?.id || '';
  };
  
  const getGroupNameFromId = (id: string) => {
    if (!id) return 'None';
    const group = currentGroups.find(g => g.id === id);
    return group?.name || 'None';
  };

  const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!amount || !date || !description) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    await addRecord({
      date,
      type: 'expense',
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: expenseAmount,
      description,
      groupId: groupId || undefined,
      breed: breed || undefined,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {settings.expenseCategories.map((cat) => {
              const categoryName = cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>For</Text>
          <View style={styles.livestockButtons}>
            <TouchableOpacity
              style={[styles.livestockButton, livestockType === 'general' && styles.livestockButtonActive]}
              onPress={() => setLivestockType('general')}
            >
              <Text style={[styles.livestockButtonText, livestockType === 'general' && styles.livestockButtonTextActive]}>
                General
              </Text>
            </TouchableOpacity>
            {settings.enabledAnimals.chickens && (
              <TouchableOpacity
                style={[styles.livestockButton, livestockType === 'chicken' && styles.livestockButtonActive]}
                onPress={() => setLivestockType('chicken')}
              >
                <Text style={[styles.livestockButtonText, livestockType === 'chicken' && styles.livestockButtonTextActive]}>
                  Chickens
                </Text>
              </TouchableOpacity>
            )}
            {settings.enabledAnimals.ducks && (
              <TouchableOpacity
                style={[styles.livestockButton, livestockType === 'duck' && styles.livestockButtonActive]}
                onPress={() => setLivestockType('duck')}
              >
                <Text style={[styles.livestockButtonText, livestockType === 'duck' && styles.livestockButtonTextActive]}>
                  Ducks
                </Text>
              </TouchableOpacity>
            )}
            {settings.enabledAnimals.rabbits && (
              <TouchableOpacity
                style={[styles.livestockButton, livestockType === 'rabbit' && styles.livestockButtonActive]}
                onPress={() => setLivestockType('rabbit')}
              >
                <Text style={[styles.livestockButtonText, livestockType === 'rabbit' && styles.livestockButtonTextActive]}>
                  Rabbits
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {livestockType !== 'general' && currentGroups.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group (optional)</Text>
            <BreedPicker
              label=""
              value={getGroupNameFromId(groupId)}
              onChange={(name) => setGroupId(getGroupIdFromName(name))}
              breeds={groupOptions}
              placeholder="Select Group"
              maxVisibleItems={6}
              modalTitle="Select Group"
            />
          </View>
        )}

        {livestockType !== 'general' && availableBreeds.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed (optional)</Text>
            <BreedPicker
              label=""
              value={breed}
              onChange={setBreed}
              breeds={availableBreeds}
              placeholder="Select Breed"
              maxVisibleItems={6}
              modalTitle="Select Breed"
            />
          </View>
        )}

        {settings.expenseQuickSelects.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quick Select</Text>
            <View style={styles.quickSelectGrid}>
              {settings.expenseQuickSelects.map((quick, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickSelectButton}
                  onPress={() => {
                    setCategory(quick.category || category);
                    setAmount(quick.amount);
                    setDescription(quick.description);
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
            placeholder="What was this expense for?"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setRecurring(!recurring)}
          >
            <View style={[styles.checkbox, recurring && styles.checkboxChecked]}>
              {recurring && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Recurring expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  categoryButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  categoryButtonTextActive: {
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
    backgroundColor: "#ef4444",
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
    flexWrap: "wrap",
    gap: 8,
  },
  livestockButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  livestockButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
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
    backgroundColor: "#ef4444",
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
  },
});
