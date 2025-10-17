import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock } from "@/hooks/livestock-store";
import { Egg, FileText } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

export default function LogEggsScreen() {
  const { addEggProduction, eggProduction } = useLivestock();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sold, setSold] = useState("");
  const [laid, setLaid] = useState("");
  const [broken, setBroken] = useState("");
  const [consumed, setConsumed] = useState("");
  const [notes, setNotes] = useState("");

  const quickSelectOptions = [
    { label: 'Today', date: new Date().toISOString().split('T')[0] },
    { label: 'Yesterday', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    { label: '2 Days Ago', date: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
    { label: '3 Days Ago', date: new Date(Date.now() - 259200000).toISOString().split('T')[0] },
  ];

  const handleQuickSelect = (option: { label: string; date: string }) => {
    setDate(option.date);
  };

  const handleSave = async () => {
    if (!date) {
      if (Platform.OS === 'web') {
        alert("Please enter date");
      }
      return;
    }

    const soldCount = sold ? parseInt(sold) : 0;
    const laidCount = laid ? parseInt(laid) : 0;
    const brokenCount = broken ? parseInt(broken) : 0;
    const consumedCount = consumed ? parseInt(consumed) : 0;
    
    if (isNaN(soldCount) || isNaN(laidCount) || isNaN(brokenCount) || isNaN(consumedCount)) {
      if (Platform.OS === 'web') {
        alert("Please enter valid numbers");
      }
      return;
    }
    
    const totalCount = soldCount + laidCount + brokenCount + consumedCount;
    
    if (totalCount === 0) {
      if (Platform.OS === 'web') {
        alert("Please enter at least one egg count");
      }
      return;
    }

    const existingEntry = eggProduction.find(e => e.date === date);
    if (existingEntry) {
      const [year, month, day] = date.split('-');
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const confirmMsg = `An entry for ${localDate.toLocaleDateString()} already exists. Do you want to overwrite it?`;
      const shouldOverwrite = Platform.OS === 'web' 
        ? ((globalThis as any).confirm ? (globalThis as any).confirm(confirmMsg) : true)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Duplicate Entry',
              confirmMsg,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Overwrite', style: 'destructive', onPress: () => resolve(true) }
              ]
            );
          });
      
      if (!shouldOverwrite) {
        return;
      }
    }

    await addEggProduction({
      date,
      count: totalCount,
      sold: soldCount || undefined,
      laid: laidCount || undefined,
      broken: brokenCount || undefined,
      consumed: consumedCount || undefined,
      notes: notes || undefined,
    });

    router.back();
  };



  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.screenTitle}>Log Egg Records</Text>
        
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
          <DatePicker
            label="Date *"
            value={date}
            onChange={setDate}
          />
        </View>

        <View style={styles.eggCountsRow}>
          <View style={styles.eggCountItem}>
            <View style={styles.labelRow}>
              <Egg size={14} color="#10b981" style={{ marginRight: 4 }} />
              <Text style={styles.labelSmall}>Laid</Text>
            </View>
            <TextInput
              style={styles.inputSmall}
              value={laid}
              onChangeText={setLaid}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.eggCountItem}>
            <View style={styles.labelRow}>
              <Egg size={14} color="#3b82f6" style={{ marginRight: 4 }} />
              <Text style={styles.labelSmall}>Sold</Text>
            </View>
            <TextInput
              style={styles.inputSmall}
              value={sold}
              onChangeText={setSold}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.eggCountItem}>
            <View style={styles.labelRow}>
              <Egg size={14} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.labelSmall}>Broken</Text>
            </View>
            <TextInput
              style={styles.inputSmall}
              value={broken}
              onChangeText={setBroken}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.eggCountItem}>
            <View style={styles.labelRow}>
              <Egg size={14} color="#8b5cf6" style={{ marginRight: 4 }} />
              <Text style={styles.labelSmall}>Consumed</Text>
            </View>
            <TextInput
              style={styles.inputSmall}
              value={consumed}
              onChangeText={setConsumed}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <FileText size={16} color="#6b7280" style={{ marginRight: 6 }} />
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
            <Text style={styles.saveButtonText}>Save Record</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
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
  eggCountsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  eggCountItem: {
    flex: 1,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  inputSmall: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    textAlign: "center",
  },
});