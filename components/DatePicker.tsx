import { StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState, useEffect } from "react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
  const parseDate = (dateStr: string) => {
    if (!dateStr) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month, day };
  };

  const { year: initialYear, month: initialMonth, day: initialDay } = parseDate(value);
  
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(initialDay);

  useEffect(() => {
    const { year, month, day } = parseDate(value);
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  }, [value]);

  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const newDate = `${year}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onChange(newDate);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const maxDay = getDaysInMonth(selectedYear, month);
    const adjustedDay = selectedDay > maxDay ? maxDay : selectedDay;
    setSelectedDay(adjustedDay);
    const newDate = `${selectedYear}-${String(month).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
    onChange(newDate);
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    const newDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(newDate);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickersRow}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Month</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={handleMonthChange}
              style={styles.picker}
            >
              {months.map((month) => (
                <Picker.Item key={month.value} label={month.label} value={month.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Day</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedDay}
              onValueChange={handleDayChange}
              style={styles.picker}
            >
              {days.map((day) => (
                <Picker.Item key={day} label={String(day)} value={day} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Year</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={handleYearChange}
              style={styles.picker}
            >
              {years.map((year) => (
                <Picker.Item key={year} label={String(year)} value={year} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#374151",
    marginBottom: 8,
  },
  pickersRow: {
    flexDirection: "row",
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#6b7280",
    marginBottom: 4,
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: '#111827',
  },
});
