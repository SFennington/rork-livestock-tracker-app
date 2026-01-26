import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAppSettings, QuickSelectOption } from "@/hooks/app-settings-store";
import { useTheme } from "@/hooks/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Trash2, Edit3, RotateCcw } from "lucide-react-native";

export default function AppConfigurationScreen() {
  const { settings, updateExpenseCategories, updateIncomeTypes, updateChickenEventTypes, updateExpenseQuickSelects, updateIncomeQuickSelects, updateEnabledAnimals, resetToDefaults } = useAppSettings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Enabled Animals
  const [enabledAnimals, setEnabledAnimals] = useState(settings.enabledAnimals);

  // Expense Categories
  const [expenseCategories, setExpenseCategories] = useState(settings.expenseCategories);
  const [newExpenseCategory, setNewExpenseCategory] = useState("");

  // Income Types
  const [incomeTypes, setIncomeTypes] = useState(settings.incomeTypes);
  const [newIncomeType, setNewIncomeType] = useState("");

  // Chicken Event Types
  const [chickenEventTypes, setChickenEventTypes] = useState(settings.chickenEventTypes);
  const [newChickenEventType, setNewChickenEventType] = useState("");

  // Expense Quick Selects
  const [expenseQuickSelects, setExpenseQuickSelects] = useState(settings.expenseQuickSelects);
  const [showExpenseQuickForm, setShowExpenseQuickForm] = useState(false);
  const [expenseQuickLabel, setExpenseQuickLabel] = useState("");
  const [expenseQuickAmount, setExpenseQuickAmount] = useState("");
  const [expenseQuickCategory, setExpenseQuickCategory] = useState("");
  const [expenseQuickDesc, setExpenseQuickDesc] = useState("");

  // Income Quick Selects
  const [incomeQuickSelects, setIncomeQuickSelects] = useState(settings.incomeQuickSelects);
  const [showIncomeQuickForm, setShowIncomeQuickForm] = useState(false);
  const [incomeQuickLabel, setIncomeQuickLabel] = useState("");
  const [incomeQuickAmount, setIncomeQuickAmount] = useState("");
  const [incomeQuickType, setIncomeQuickType] = useState("");
  const [incomeQuickDesc, setIncomeQuickDesc] = useState("");

  const handleAddExpenseCategory = () => {
    if (!newExpenseCategory.trim()) return;
    const updated = [...expenseCategories, newExpenseCategory.trim().toLowerCase()];
    setExpenseCategories(updated);
    updateExpenseCategories(updated);
    setNewExpenseCategory("");
  };

  const handleRemoveExpenseCategory = (index: number) => {
    const updated = expenseCategories.filter((_, i) => i !== index);
    setExpenseCategories(updated);
    updateExpenseCategories(updated);
  };

  const handleAddIncomeType = () => {
    if (!newIncomeType.trim()) return;
    const updated = [...incomeTypes, newIncomeType.trim().toLowerCase()];
    setIncomeTypes(updated);
    updateIncomeTypes(updated);
    setNewIncomeType("");
  };

  const handleRemoveIncomeType = (index: number) => {
    const updated = incomeTypes.filter((_, i) => i !== index);
    setIncomeTypes(updated);
    updateIncomeTypes(updated);
  };

  const handleAddChickenEventType = () => {
    if (!newChickenEventType.trim()) return;
    const updated = [...chickenEventTypes, newChickenEventType.trim().toLowerCase()];
    setChickenEventTypes(updated);
    updateChickenEventTypes(updated);
    setNewChickenEventType("");
  };

  const handleRemoveChickenEventType = (index: number) => {
    const updated = chickenEventTypes.filter((_, i) => i !== index);
    setChickenEventTypes(updated);
    updateChickenEventTypes(updated);
  };

  const handleAddExpenseQuickSelect = () => {
    if (!expenseQuickLabel || !expenseQuickAmount || !expenseQuickCategory || !expenseQuickDesc) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    const newQuick: QuickSelectOption = {
      label: expenseQuickLabel,
      amount: expenseQuickAmount,
      category: expenseQuickCategory,
      description: expenseQuickDesc,
    };
    const updated = [...expenseQuickSelects, newQuick];
    setExpenseQuickSelects(updated);
    updateExpenseQuickSelects(updated);
    setShowExpenseQuickForm(false);
    setExpenseQuickLabel("");
    setExpenseQuickAmount("");
    setExpenseQuickCategory("");
    setExpenseQuickDesc("");
  };

  const handleRemoveExpenseQuickSelect = (index: number) => {
    const updated = expenseQuickSelects.filter((_, i) => i !== index);
    setExpenseQuickSelects(updated);
    updateExpenseQuickSelects(updated);
  };

  const handleAddIncomeQuickSelect = () => {
    if (!incomeQuickLabel || !incomeQuickAmount || !incomeQuickType || !incomeQuickDesc) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    const newQuick: QuickSelectOption = {
      label: incomeQuickLabel,
      amount: incomeQuickAmount,
      type: incomeQuickType,
      description: incomeQuickDesc,
    };
    const updated = [...incomeQuickSelects, newQuick];
    setIncomeQuickSelects(updated);
    updateIncomeQuickSelects(updated);
    setShowIncomeQuickForm(false);
    setIncomeQuickLabel("");
    setIncomeQuickAmount("");
    setIncomeQuickType("");
    setIncomeQuickDesc("");
  };

  const handleRemoveIncomeQuickSelect = (index: number) => {
    const updated = incomeQuickSelects.filter((_, i) => i !== index);
    setIncomeQuickSelects(updated);
    updateIncomeQuickSelects(updated);
  };

  const handleResetToDefaults = () => {
    const confirmMessage = "This will reset all custom categories and quick selects to defaults. Continue?";
    
    const doReset = async () => {
      await resetToDefaults();
      setExpenseCategories(settings.expenseCategories);
      setIncomeTypes(settings.incomeTypes);
      setChickenEventTypes(settings.chickenEventTypes);
      setExpenseQuickSelects(settings.expenseQuickSelects);
      setIncomeQuickSelects(settings.incomeQuickSelects);
      Alert.alert("Success", "Settings reset to defaults");
    };

    if (Platform.OS === 'web') {
      if (confirm(confirmMessage)) {
        doReset();
      }
    } else {
      Alert.alert(
        "Reset to Defaults",
        confirmMessage,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: doReset }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enabled Animals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Enabled Animals</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Control which animals appear in your dashboard and records
          </Text>
          <View style={styles.animalTogglesContainer}>
            {Object.entries(enabledAnimals).map(([animal, enabled]) => {
              const isDisabled = animal !== 'chicken';
              const isChicken = animal === 'chicken';
              
              return (
                <TouchableOpacity
                  key={animal}
                  style={[
                    styles.animalToggle,
                    {
                      backgroundColor: (isChicken || (enabled && !isDisabled)) ? colors.primary : colors.card,
                      borderColor: (isChicken || (enabled && !isDisabled)) ? colors.primary : colors.border,
                      opacity: isDisabled ? 0.5 : 1,
                    }
                  ]}
                  onPress={() => {
                    if (isChicken) {
                      // Chicken is always enabled, cannot be toggled off
                      return;
                    }
                    if (isDisabled) {
                      Alert.alert('Coming Soon', 'Other animals will be available in a future update.');
                      return;
                    }
                    const updated = { ...enabledAnimals, [animal]: !enabled };
                    setEnabledAnimals(updated);
                    updateEnabledAnimals(updated);
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[styles.animalToggleText, { color: (isChicken || (enabled && !isDisabled)) ? '#fff' : colors.text }]}>
                    {animal.charAt(0).toUpperCase() + animal.slice(1)}
                  </Text>
                  {isDisabled && (
                    <View style={[styles.comingSoonBadge, { backgroundColor: '#f59e0b' }]}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Expense Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Categories</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Manage expense category options
          </Text>
          <View style={styles.chipContainer}>
            {expenseCategories.map((cat, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{cat}</Text>
                <TouchableOpacity onPress={() => handleRemoveExpenseCategory(index)}>
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={newExpenseCategory}
              onChangeText={setNewExpenseCategory}
              placeholder="New category"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddExpenseCategory}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Income Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Types</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Manage income type options
          </Text>
          <View style={styles.chipContainer}>
            {incomeTypes.map((type, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{type}</Text>
                <TouchableOpacity onPress={() => handleRemoveIncomeType(index)}>
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={newIncomeType}
              onChangeText={setNewIncomeType}
              placeholder="New income type"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddIncomeType}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chicken Event Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chicken Event Types</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Manage chicken history event types
          </Text>
          <View style={styles.chipContainer}>
            {chickenEventTypes.map((type, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{type}</Text>
                <TouchableOpacity onPress={() => handleRemoveChickenEventType(index)}>
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={newChickenEventType}
              onChangeText={setNewChickenEventType}
              placeholder="New event type"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddChickenEventType}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expense Quick Selects */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Quick Selects</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Preset expense amounts for quick entry
          </Text>
          {expenseQuickSelects.map((quick, index) => (
            <View key={index} style={[styles.quickSelectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.quickSelectInfo}>
                <Text style={[styles.quickSelectLabel, { color: colors.text }]}>{quick.label}</Text>
                <Text style={[styles.quickSelectDetail, { color: colors.textMuted }]}>
                  ${quick.amount} • {quick.category} • {quick.description}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveExpenseQuickSelect(index)}>
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {!showExpenseQuickForm ? (
            <TouchableOpacity
              style={[styles.addQuickButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowExpenseQuickForm(true)}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={[styles.addQuickButtonText, { color: colors.primary }]}>Add Quick Select</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.quickForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={expenseQuickLabel}
                onChangeText={setExpenseQuickLabel}
                placeholder="Label (e.g., Feed - $50)"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={expenseQuickAmount}
                onChangeText={setExpenseQuickAmount}
                placeholder="Amount (e.g., 50)"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={expenseQuickCategory}
                onChangeText={setExpenseQuickCategory}
                placeholder="Category"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={expenseQuickDesc}
                onChangeText={setExpenseQuickDesc}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.quickFormButtons}>
                <TouchableOpacity
                  style={[styles.quickFormButton, { backgroundColor: colors.background }]}
                  onPress={() => setShowExpenseQuickForm(false)}
                >
                  <Text style={[styles.quickFormButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickFormButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddExpenseQuickSelect}
                >
                  <Text style={[styles.quickFormButtonText, { color: '#fff' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Income Quick Selects */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Quick Selects</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
            Preset income amounts for quick entry
          </Text>
          {incomeQuickSelects.map((quick, index) => (
            <View key={index} style={[styles.quickSelectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.quickSelectInfo}>
                <Text style={[styles.quickSelectLabel, { color: colors.text }]}>{quick.label}</Text>
                <Text style={[styles.quickSelectDetail, { color: colors.textMuted }]}>
                  ${quick.amount} • {quick.type} • {quick.description}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveIncomeQuickSelect(index)}>
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {!showIncomeQuickForm ? (
            <TouchableOpacity
              style={[styles.addQuickButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowIncomeQuickForm(true)}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={[styles.addQuickButtonText, { color: colors.primary }]}>Add Quick Select</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.quickForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={incomeQuickLabel}
                onChangeText={setIncomeQuickLabel}
                placeholder="Label (e.g., Egg Sales - $25)"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={incomeQuickAmount}
                onChangeText={setIncomeQuickAmount}
                placeholder="Amount (e.g., 25)"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={incomeQuickType}
                onChangeText={setIncomeQuickType}
                placeholder="Type"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.quickInput, { color: colors.text, borderColor: colors.border }]}
                value={incomeQuickDesc}
                onChangeText={setIncomeQuickDesc}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.quickFormButtons}>
                <TouchableOpacity
                  style={[styles.quickFormButton, { backgroundColor: colors.background }]}
                  onPress={() => setShowIncomeQuickForm(false)}
                >
                  <Text style={[styles.quickFormButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickFormButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddIncomeQuickSelect}
                >
                  <Text style={[styles.quickFormButtonText, { color: '#fff' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Reset Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.error }]}
            onPress={handleResetToDefaults}
          >
            <RotateCcw size={18} color="#fff" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  addRow: {
    flexDirection: "row",
    gap: 8,
  },
  addInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quickSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  quickSelectInfo: {
    flex: 1,
  },
  quickSelectLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  quickSelectDetail: {
    fontSize: 12,
  },
  addQuickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addQuickButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  quickForm: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  quickInput: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
  },
  quickFormButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickFormButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  quickFormButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  animalTogglesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  animalToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 100,
  },
  animalToggleText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  comingSoonBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600" as const,
  },
  bottomSpacing: {
    height: 40,
  },
});
