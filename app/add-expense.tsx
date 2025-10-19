import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useLivestock, getLocalDateString } from "@/hooks/livestock-store";
import { DollarSign, FileText, TrendingUp, TrendingDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

type TransactionType = 'expense' | 'income';
type ExpenseCategory = 'feed' | 'bedding' | 'medical' | 'equipment' | 'other';
type IncomeType = 'eggs' | 'meat' | 'livestock' | 'breeding' | 'other';

export default function AddTransactionScreen() {
  const { addExpense, addIncome } = useLivestock();
  const insets = useSafeAreaInsets();
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('feed');
  const [incomeType, setIncomeType] = useState<IncomeType>('eggs');
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [livestockType, setLivestockType] = useState<'chicken' | 'rabbit' | 'general'>('general');
  const [description, setDescription] = useState("");

  const quickSelectOptions = transactionType === 'expense' 
    ? [
        { label: 'Feed - $50', amount: '50', category: 'feed', description: 'Feed purchase' },
        { label: 'Bedding - $30', amount: '30', category: 'bedding', description: 'Bedding material' },
        { label: 'Medical - $75', amount: '75', category: 'medical', description: 'Medical supplies' },
      ]
    : [
        { label: 'Egg Sales - $25', amount: '25', type: 'eggs', description: 'Egg sales' },
        { label: 'Meat Sales - $100', amount: '100', type: 'meat', description: 'Meat sales' },
        { label: 'Livestock Sales - $150', amount: '150', type: 'livestock', description: 'Livestock sales' },
      ];

  const handleQuickSelect = (option: any) => {
    setAmount(option.amount);
    setDescription(option.description);
    if (transactionType === 'expense') {
      setExpenseCategory(option.category as ExpenseCategory);
    } else {
      setIncomeType(option.type as IncomeType);
    }
  };

  const handleSave = async () => {
    if (!amount || !date || !description) {
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      }
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      if (Platform.OS === 'web') {
        alert("Please enter a valid amount");
      }
      return;
    }

    if (transactionType === 'expense') {
      await addExpense({
        category: expenseCategory,
        amount: transactionAmount,
        date,
        livestockType,
        description,
      });
    } else {
      await addIncome({
        type: incomeType,
        amount: transactionAmount,
        date,
        livestockType: livestockType === 'general' ? 'chicken' : livestockType,
        description,
      });
    }

    router.back();
  };

  return (
    <View style={[styles.backgroundContainer, { paddingTop: insets.top }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transaction Type *</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, transactionType === 'expense' && styles.typeButtonActive]}
              onPress={() => setTransactionType('expense')}
            >
              <TrendingDown size={18} color={transactionType === 'expense' ? '#fff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, transactionType === 'expense' && styles.typeButtonTextActive]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, transactionType === 'income' && styles.typeButtonActive]}
              onPress={() => setTransactionType('income')}
            >
              <TrendingUp size={18} color={transactionType === 'income' ? '#fff' : '#6b7280'} />
              <Text style={[styles.typeButtonText, transactionType === 'income' && styles.typeButtonTextActive]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quick Select</Text>
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

        {transactionType === 'expense' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {(['feed', 'bedding', 'medical', 'equipment', 'other'] as const).map((cat) => {
                const categoryName = cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryButton, expenseCategory === cat && styles.categoryButtonActive]}
                    onPress={() => setExpenseCategory(cat)}
                  >
                    <Text style={[styles.categoryButtonText, expenseCategory === cat && styles.categoryButtonTextActive]}>
                      {categoryName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Income Type *</Text>
            <View style={styles.categoryGrid}>
              {(['eggs', 'meat', 'livestock', 'breeding', 'other'] as const).map((type) => {
                const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.categoryButton, incomeType === type && styles.categoryButtonActive]}
                    onPress={() => setIncomeType(type)}
                  >
                    <Text style={[styles.categoryButtonText, incomeType === type && styles.categoryButtonTextActive]}>
                      {typeName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Applies To *</Text>
          <View style={styles.livestockButtons}>
            {(['general', 'chicken', 'rabbit'] as const).map((type) => {
              const typeName = type.charAt(0).toUpperCase() + type.slice(1);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.livestockButton, livestockType === type && styles.livestockButtonActive]}
                  onPress={() => setLivestockType(type)}
                >
                  <Text style={[styles.livestockButtonText, livestockType === type && styles.livestockButtonTextActive]}>
                    {typeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
            placeholder="What was this expense for?"
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
            <Text style={styles.saveButtonText}>
              {transactionType === 'expense' ? 'Add Expense' : 'Add Income'}
            </Text>
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
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  categoryButtonTextActive: {
    color: "#fff",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
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