import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useMemo, useState } from "react";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { AlertCircle, Calendar, X } from "lucide-react-native";
import { router } from "expo-router";

export default function EggLogChecker() {
  const { eggProduction, chickenHistory } = useLivestock();
  const { colors } = useTheme();
  const [dismissedDates, setDismissedDates] = useState<Set<string>>(new Set());

  const missingDays = useMemo(() => {
    if (!eggProduction.length) return [];
    // Find the first day an egg was logged
    const sortedEggs = [...eggProduction].sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime());
    const firstEggDate = new Date(sortedEggs[0].date + 'T00:00:00');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const missing: string[] = [];
    // Create set of unique dates that have any egg records
    const eggDates = new Set(eggProduction.map(e => e.date));

    // Only check for missing days after the first egg log
    const checkStartDate = new Date(firstEggDate);
    checkStartDate.setDate(checkStartDate.getDate() + 1); // Start from day after first log
    
    for (let d = new Date(checkStartDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!eggDates.has(dateStr) && !dismissedDates.has(dateStr)) {
        missing.push(dateStr);
      }
    }
    // Return only the most recent missing days (up to 7)
    return missing.slice(-7);
  }, [eggProduction, dismissedDates]);

  if (missingDays.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    }
  };

  const handleDatePress = (dateStr: string) => {
    router.push({
      pathname: '/log-eggs',
      params: { date: dateStr }
    });
  };

  const handleDismiss = (dateStr: string, e: any) => {
    e.stopPropagation();
    setDismissedDates(prev => new Set([...prev, dateStr]));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertCircle size={20} color={colors.error} />
        <Text style={[styles.title, { color: colors.error }]}>
          Missing Egg Logs
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Tap a date to log eggs for that day
      </Text>
      <View style={styles.datesList}>
        {missingDays.map((date) => (
          <TouchableOpacity
            key={date}
            style={[styles.dateChip, { backgroundColor: colors.card, borderColor: colors.error }]}
            onPress={() => handleDatePress(date)}
          >
            <Calendar size={14} color={colors.error} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(date)}
            </Text>
            <TouchableOpacity
              onPress={(e) => handleDismiss(date, e)}
              style={styles.dismissButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  datesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  dismissButton: {
    marginLeft: 4,
    padding: 2,
  },
});
