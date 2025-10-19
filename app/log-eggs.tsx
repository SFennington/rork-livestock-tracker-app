import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput } from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import DatePicker from "@/components/DatePicker";

export default function LogEggsScreen() {
  const { addEggProduction, eggProduction } = useLivestock();
  const [quantity, setQuantity] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [type, setType] = useState<'laid' | 'broken' | 'consumed'>('laid');
  const [date, setDate] = useState(getLocalDateString());

  const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const recentQuantities = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    
    const recentRecords = eggProduction.filter(e => e.date >= oneWeekAgoStr);
    const quantities = recentRecords.map(e => {
      if (type === 'laid' && e.laid) return e.laid;
      if (type === 'broken' && e.broken) return e.broken;
      if (type === 'consumed' && e.consumed) return e.consumed;
      return null;
    }).filter((q): q is number => q !== null && q > 0);
    
    const uniqueQty = Array.from(new Set(quantities)).sort((a, b) => b - a);
    return uniqueQty.slice(0, 3);
  }, [eggProduction, type]);

  const handleSave = async () => {
    if (!date || quantity === null) {
      if (Platform.OS === 'web') {
        alert("Please select quantity and date");
      }
      return;
    }

    const existingEntry = eggProduction.find(e => e.date === date);
    let newData: { laid?: number; broken?: number; consumed?: number } = {};
    
    if (existingEntry) {
      newData = {
        laid: existingEntry.laid,
        broken: existingEntry.broken,
        consumed: existingEntry.consumed,
      };
    }
    
    if (type === 'laid') newData.laid = quantity;
    else if (type === 'broken') newData.broken = quantity;
    else if (type === 'consumed') newData.consumed = quantity;
    
    const totalCount = (newData.laid || 0) + (newData.broken || 0) + (newData.consumed || 0);

    await addEggProduction({
      date,
      count: totalCount,
      laid: newData.laid || undefined,
      broken: newData.broken || undefined,
      consumed: newData.consumed || undefined,
    });

    router.back();
  };



  return (
    <View style={styles.backgroundContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.screenTitle}>Log Egg Record</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.buttonGrid}>
              {recentQuantities.length > 0 ? (
                recentQuantities.map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={[styles.quantityButton, quantity === qty && styles.quantityButtonActive]}
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
                    style={[styles.quantityButton, quantity === parseInt(qty) && styles.quantityButtonActive]}
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
                style={[styles.typeButton, type === 'laid' && styles.typeButtonActive]}
                onPress={() => setType('laid')}
              >
                <Text style={[styles.typeButtonText, type === 'laid' && styles.typeButtonTextActive]}>
                  Laid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'broken' && styles.typeButtonActive]}
                onPress={() => setType('broken')}
              >
                <Text style={[styles.typeButtonText, type === 'broken' && styles.typeButtonTextActive]}>
                  Broken
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'consumed' && styles.typeButtonActive]}
                onPress={() => setType('consumed')}
              >
                <Text style={[styles.typeButtonText, type === 'consumed' && styles.typeButtonTextActive]}>
                  Consumed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[styles.dateButton, date === getDateString(0) && styles.dateButtonActive]}
                onPress={() => setDate(getDateString(0))}
              >
                <Text style={[styles.dateButtonText, date === getDateString(0) && styles.dateButtonTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, date === getDateString(1) && styles.dateButtonActive]}
                onPress={() => setDate(getDateString(1))}
              >
                <Text style={[styles.dateButtonText, date === getDateString(1) && styles.dateButtonTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, date === getDateString(2) && styles.dateButtonActive]}
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
              placeholder="Or pick a date"
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, quantity === null && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={quantity === null}
            >
              <Text style={styles.saveButtonText}>Save Record</Text>
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