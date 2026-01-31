import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, KeyboardAvoidingView } from "react-native";
import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { useFinancialStore } from "@/hooks/financial-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { useTheme } from "@/hooks/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function LogEggsScreen() {
  const { addEggProduction, eggProduction, income, expenses } = useLivestock();
  const saveROISnapshot = useFinancialStore(state => state.saveROISnapshot);
  const { settings } = useAppSettings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();
  const [quantity, setQuantity] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [type, setType] = useState<'laid' | 'broken' | 'donated'>('laid');
  const [date, setDate] = useState(params.date || getLocalDateString());

  const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const recentQuantities = useMemo(() => {
    const sortedRecords = [...eggProduction].sort((a, b) => b.date.localeCompare(a.date));
    
    const quantities = sortedRecords.map(e => {
      if (type === 'laid' && e.laid) return e.laid;
      if (type === 'broken' && e.broken) return e.broken;
      if (type === 'donated' && e.donated) return e.donated;
      return null;
    }).filter((q): q is number => q !== null && q > 0);
    
    const uniqueQty = Array.from(new Set(quantities)).slice(0, 5).sort((a, b) => a - b);
    return uniqueQty;
  }, [eggProduction, type]);

  const handleSave = async () => {
    if (!date || quantity === null) {
      if (Platform.OS === 'web') {
        alert("Please select quantity and date");
      }
      return;
    }

    console.log('Saving egg production:', { date, quantity, type });
    const existingEntry = eggProduction.find(e => e.date === date);
    console.log('Existing entry:', existingEntry);
    let newData: { laid?: number; broken?: number; donated?: number } = {};
    
    if (existingEntry) {
      newData = {
        laid: existingEntry.laid,
        broken: existingEntry.broken,
        donated: existingEntry.donated,
      };
    }
    
    if (type === 'laid') newData.laid = quantity;
    else if (type === 'broken') newData.broken = quantity;
    else if (type === 'donated') newData.donated = quantity;
    
    const totalCount = newData.laid || 0;
    console.log('Total count to save:', totalCount, 'newData:', newData);

    await addEggProduction({
      date,
      count: totalCount,
      laid: newData.laid || undefined,
      broken: newData.broken || undefined,
      donated: newData.donated || undefined,
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
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.buttonGrid}>
              {recentQuantities.length > 0 ? (
                recentQuantities.map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, quantity === qty && [styles.quantityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => { setQuantity(qty); setQuantityInput(qty.toString()); }}
                  >
                    <Text style={[styles.quantityButtonText, quantity === qty && styles.quantityButtonTextActive]}>
                      {qty}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                ['10', '12', '15'].map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, quantity === parseInt(qty) && [styles.quantityButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                    onPress={() => { setQuantity(parseInt(qty)); setQuantityInput(qty); }}
                  >
                    <Text style={[styles.quantityButtonText, quantity === parseInt(qty) && styles.quantityButtonTextActive]}>
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
              value={quantityInput}
              onChangeText={(text) => {
                setQuantityInput(text);
                const parsed = parseInt(text);
                setQuantity(isNaN(parsed) ? null : parsed);
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'laid' && [styles.typeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setType('laid')}
              >
                <Text style={[styles.typeButtonText, type === 'laid' && styles.typeButtonTextActive]}>
                  Laid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'broken' && [styles.typeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setType('broken')}
              >
                <Text style={[styles.typeButtonText, type === 'broken' && styles.typeButtonTextActive]}>
                  Broken
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'donated' && [styles.typeButtonActive, { backgroundColor: colors.accent, borderColor: colors.accent }]]}
                onPress={() => setType('donated')}
              >
                <Text style={[styles.typeButtonText, type === 'donated' && styles.typeButtonTextActive]}>
                  Donated
                </Text>
              </TouchableOpacity>
            </View>
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
              style={[styles.saveButton, quantity === null && styles.saveButtonDisabled, quantity !== null && { backgroundColor: colors.accent }]} 
              onPress={handleSave}
              disabled={quantity === null}
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