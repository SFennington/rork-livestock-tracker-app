import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, KeyboardAvoidingView } from "react-native";
import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { useFinancialStore } from "@/hooks/financial-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { useTheme } from "@/hooks/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";
import BreedPicker from "@/components/BreedPicker";
import { CHICKEN_BREEDS } from "@/constants/breeds";

export default function LogEggsScreen() {
  const { addEggProduction, eggProduction, income, expenses, getGroupsByType } = useLivestock();
  const saveROISnapshot = useFinancialStore(state => state.saveROISnapshot);
  const { settings } = useAppSettings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();
  const [laidQuantity, setLaidQuantity] = useState<number | null>(null);
  const [laidInput, setLaidInput] = useState("");
  const [brokenQuantity, setBrokenQuantity] = useState<number | null>(null);
  const [brokenInput, setBrokenInput] = useState("");
  const [date, setDate] = useState(params.date || getLocalDateString());
  const [breed, setBreed] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");

  const chickenGroups = getGroupsByType('chicken');

  const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const recentLaidQuantities = useMemo(() => {
    const sortedRecords = [...eggProduction].sort((a, b) => b.date.localeCompare(a.date));
    const quantities = sortedRecords.map(e => e.laid).filter((q): q is number => q !== null && q !== undefined && q > 0);
    const uniqueQty = Array.from(new Set(quantities)).slice(0, 5).sort((a, b) => a - b);
    return uniqueQty;
  }, [eggProduction]);

  const recentBrokenQuantities = useMemo(() => {
    const sortedRecords = [...eggProduction].sort((a, b) => b.date.localeCompare(a.date));
    const quantities = sortedRecords.map(e => e.broken).filter((q): q is number => q !== null && q !== undefined && q > 0);
    const uniqueQty = Array.from(new Set(quantities)).slice(0, 5).sort((a, b) => a - b);
    return uniqueQty;
  }, [eggProduction]);

  const handleSave = async () => {
    if (!date || (laidQuantity === null && brokenQuantity === null)) {
      if (Platform.OS === 'web') {
        alert("Please enter at least one quantity (laid or broken) and date");
      }
      return;
    }

    const laid = laidQuantity ?? 0;
    const broken = brokenQuantity ?? 0;
    const totalCount = laid;

    await addEggProduction({
      date,
      count: totalCount,
      laid: laid > 0 ? laid : undefined,
      broken: broken > 0 ? broken : undefined,
      breed: breed || undefined,
      groupId: groupId || undefined,
    });

    // Calculate and save ROI snapshot
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    let totalSold = 0, totalLaid = 0, totalBroken = 0, totalDonated = 0;
    income.forEach(r => {
      if (r.type === 'eggs' && r.quantity) {
        if (r.amount === 0) totalDonated += r.quantity;
        else totalSold += r.quantity;
      }
    });
    eggProduction.forEach(r => {
      totalLaid += r.laid || r.count;
      totalBroken += r.broken || 0;
    });
    const eggsConsumed = totalLaid - totalSold - settings.eggsOnHand - totalBroken - totalDonated;
    const consumptionSavings = (eggsConsumed / 12) * settings.eggValuePerDozen;
    const roi = (totalIncome + consumptionSavings) - totalExpenses;
    await saveROISnapshot(roi);

    console.log('Egg production saved');
    router.back();
  };



  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.backgroundContainer, { paddingBottom: insets.bottom, backgroundColor: colors.accent }]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.screenTitle}>Log Egg Record</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eggs Laid</Text>
            <View style={styles.buttonGrid}>
              {recentLaidQuantities.length > 0 ? (
                recentLaidQuantities.map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, laidQuantity === qty && [styles.quantityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => { setLaidQuantity(qty); setLaidInput(qty.toString()); }}
                  >
                    <Text style={[styles.quantityButtonText, laidQuantity === qty && styles.quantityButtonTextActive]}>
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                ['10', '12', '15'].map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, laidQuantity === parseInt(qty) && [styles.quantityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => { setLaidQuantity(parseInt(qty)); setLaidInput(qty); }}
                  >
                    <Text style={[styles.quantityButtonText, laidQuantity === parseInt(qty) && styles.quantityButtonTextActive]}>
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            <TextInput
              style={styles.quantityInput}
              placeholder="Or enter quantity"
              keyboardType="numeric"
              value={laidInput}
              onChangeText={(text) => {
                setLaidInput(text);
                const parsed = parseInt(text);
                setLaidQuantity(isNaN(parsed) ? null : parsed);
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eggs Broken</Text>
            <View style={styles.buttonGrid}>
              {recentBrokenQuantities.length > 0 ? (
                recentBrokenQuantities.map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, brokenQuantity === qty && [styles.quantityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => { setBrokenQuantity(qty); setBrokenInput(qty.toString()); }}
                  >
                    <Text style={[styles.quantityButtonText, brokenQuantity === qty && styles.quantityButtonTextActive]}>
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                ['1', '2', '3'].map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, brokenQuantity === parseInt(qty) && [styles.quantityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => { setBrokenQuantity(parseInt(qty)); setBrokenInput(qty); }}
                  >
                    <Text style={[styles.quantityButtonText, brokenQuantity === parseInt(qty) && styles.quantityButtonTextActive]}>
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            <TextInput
              style={styles.quantityInput}
              placeholder="Or enter quantity"
              keyboardType="numeric"
              value={brokenInput}
              onChangeText={(text) => {
                setBrokenInput(text);
                const parsed = parseInt(text);
                setBrokenQuantity(isNaN(parsed) ? null : parsed);
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Breed (optional)</Text>
            <BreedPicker
              label=""
              value={breed}
              onChange={setBreed}
              breeds={CHICKEN_BREEDS}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group (optional)</Text>
            {chickenGroups.length > 0 ? (
              <View style={{ gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.groupButton, groupId === '' && [styles.groupButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                  onPress={() => setGroupId('')}
                >
                  <Text style={[styles.groupButtonText, groupId === '' && styles.groupButtonTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {chickenGroups.map((group) => (
                  <TouchableOpacity 
                    key={group.id}
                    style={[styles.groupButton, groupId === group.id && [styles.groupButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => setGroupId(group.id)}
                  >
                    <Text style={[styles.groupButtonText, groupId === group.id && styles.groupButtonTextActive]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.sectionSubtitle, { fontStyle: 'italic' }]}>
                No groups available
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[styles.dateButton, date === getDateString(0) && [styles.dateButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setDate(getDateString(0))}
              >
                <Text style={[styles.dateButtonText, date === getDateString(0) && styles.dateButtonTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, date === getDateString(1) && [styles.dateButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setDate(getDateString(1))}
              >
                <Text style={[styles.dateButtonText, date === getDateString(1) && styles.dateButtonTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, date === getDateString(2) && [styles.dateButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setDate(getDateString(2))}
              >
                <Text style={[styles.dateButtonText, date === getDateString(2) && styles.dateButtonTextActive]}>
                  2 Days Ago
                </Text>
              </TouchableOpacity>
            </View>
            <DatePicker
              value={date}
              onChange={(value: string) => setDate(value)}
              collapsible={true}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, (laidQuantity === null && brokenQuantity === null) && styles.saveButtonDisabled, (laidQuantity !== null || brokenQuantity !== null) && { backgroundColor: colors.accent }]} 
              onPress={handleSave}
              disabled={laidQuantity === null && brokenQuantity === null}
            >
              <Text style={styles.saveButtonText}>Save Record</Text>
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
    padding: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 8,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quantityButton: {
    flex: 1,
    minWidth: 60,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  quantityButtonTextActive: {
    color: "#fff",
  },
  typeButton: {
    flex: 1,
    minWidth: 80,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  dateButton: {
    flex: 1,
    minWidth: 80,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  dateButtonTextActive: {
    color: "#fff",
  },
  groupButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  groupButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  groupButtonTextActive: {
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#9ca3af",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
  },
  quantityInput: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
  },
});