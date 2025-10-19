import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

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

  const { year: selectedYear, month: selectedMonth, day: selectedDay } = parseDate(value);
  const [displayYear, setDisplayYear] = useState(selectedYear);
  const [displayMonth, setDisplayMonth] = useState(selectedMonth);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth - 1, 1);
    const lastDay = new Date(displayYear, displayMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [displayYear, displayMonth]);

  const handleDayPress = (day: number) => {
    const newDate = `${displayYear}-${String(displayMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(newDate);
  };

  const handlePrevMonth = () => {
    if (displayMonth === 1) {
      setDisplayMonth(12);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayMonth(1);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.calendar}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <ChevronLeft size={20} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.monthYear}>
            {months[displayMonth - 1]} {displayYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={styles.weekday}>{day}</Text>
          ))}
        </View>

        <View style={styles.days}>
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <View key={`empty-${i}`} style={styles.dayCell} />;
            }

            const dateStr = `${displayYear}-${String(displayMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === value;
            const isToday = dateStr === todayStr;

            return (
              <TouchableOpacity
                key={i}
                style={styles.dayCell}
                onPress={() => handleDayPress(day)}
              >
                <View style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                  isToday && !isSelected && styles.dayButtonToday,
                ]}>
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}>
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#374151",
    marginBottom: 8,
  },
  calendar: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navButton: {
    padding: 4,
  },
  monthYear: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
  },
  weekdays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#9ca3af",
  },
  days: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  dayButtonSelected: {
    backgroundColor: "#10b981",
  },
  dayButtonToday: {
    borderWidth: 2,
    borderColor: "#10b981",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#111827",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  dayTextToday: {
    color: "#10b981",
    fontWeight: "600" as const,
  },
});
