import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { TrendingUp, DollarSign, Egg, Eye, EyeOff } from "lucide-react-native";
import { useMemo, useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  const { eggProduction, expenses, income } = useLivestock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());

  const toggleChart = useCallback((chartId: string) => {
    setHiddenCharts(prev => {
      const next = new Set(prev);
      if (next.has(chartId)) next.delete(chartId); else next.add(chartId);
      return next;
    });
  }, []);

  const analytics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const roi = totalIncome - totalExpenses;
    const roiPercentage = totalExpenses > 0 ? ((totalIncome - totalExpenses) / totalExpenses) * 100 : 0;

    const monthlyEggsByYear: { [monthKey: string]: { [year: string]: number } } = {};
    const seasonalEggs = { spring: 0, summer: 0, fall: 0, winter: 0 };
    
    let totalSold = 0;
    let totalLaid = 0;
    let totalBroken = 0;
    let totalConsumed = 0;
    
    eggProduction.forEach(record => {
      const date = new Date(record.date);
      const year = date.getFullYear().toString();
      const monthNum = date.getMonth() + 1;
      const monthKey = String(monthNum).padStart(2, '0');
      
      if (!monthlyEggsByYear[monthKey]) {
        monthlyEggsByYear[monthKey] = {};
      }
      monthlyEggsByYear[monthKey][year] = (monthlyEggsByYear[monthKey][year] || 0) + record.count;
      
      const month = date.getMonth();
      if (month >= 2 && month <= 4) seasonalEggs.spring += record.count;
      else if (month >= 5 && month <= 7) seasonalEggs.summer += record.count;
      else if (month >= 8 && month <= 10) seasonalEggs.fall += record.count;
      else seasonalEggs.winter += record.count;
      
      totalSold += record.sold || 0;
      totalLaid += record.laid || 0;
      totalBroken += record.broken || 0;
      totalConsumed += record.consumed || 0;
    });

    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const allYears = new Set<string>();
    Object.values(monthlyEggsByYear).forEach(yearData => {
      Object.keys(yearData).forEach(year => allYears.add(year));
    });
    const sortedYears = Array.from(allYears).sort();
    
    const yearColors: { [year: string]: string } = {};
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    sortedYears.forEach((year, index) => {
      yearColors[year] = colors[index % colors.length];
    });
    
    let maxMonthlyEggs = 1;
    months.forEach(month => {
      const monthTotal = Object.values(monthlyEggsByYear[month] || {}).reduce((sum, count) => sum + count, 0);
      if (monthTotal > maxMonthlyEggs) maxMonthlyEggs = monthTotal;
    });

    let avgEggsPerMonth = 0;
    let totalMonths = 0;
    let avgEggsPerDay7d = 0;
    if (eggProduction.length > 0) {
      const dates = eggProduction.map(e => new Date(e.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const monthsDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 30)));
      totalMonths = monthsDiff;
      const totalEggs = eggProduction.reduce((sum, e) => sum + e.count, 0);
      avgEggsPerMonth = totalEggs / monthsDiff;
      
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const recent7DaysEggs = eggProduction
        .filter(e => new Date(e.date) >= last7Days)
        .reduce((sum, e) => sum + e.count, 0);
      avgEggsPerDay7d = recent7DaysEggs / 7;
    }

    return {
      totalExpenses,
      totalIncome,
      roi,
      roiPercentage,
      monthlyEggsByYear,
      months,
      sortedYears,
      yearColors,
      maxMonthlyEggs,
      seasonalEggs,
      avgEggsPerMonth,
      avgEggsPerDay7d,
      totalMonths,
      totalEggs: eggProduction.reduce((sum, e) => sum + e.count, 0),
      totalSold,
      totalLaid,
      totalBroken,
      totalConsumed,
    };
  }, [eggProduction, expenses, income]);

  const maxSeasonalEggs = Math.max(...Object.values(analytics.seasonalEggs), 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Overview</Text>
        <View style={[styles.roiCard, { backgroundColor: colors.primary }]}>
          <View style={styles.roiHeader}>
            <DollarSign size={24} color="#fff" />
            <Text style={styles.roiTitle}>Return on Investment</Text>
          </View>
          <Text style={[styles.roiAmount, analytics.roi < 0 && styles.negativeAmount]}>
            {analytics.roi >= 0 ? '+' : ''} ${Math.abs(analytics.roi).toFixed(2)}
          </Text>
          <Text style={styles.roiPercentage}>
            {analytics.roiPercentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.roiPercentage).toFixed(1)}% ROI
          </Text>
          <View style={styles.roiDetails}>
            <View style={styles.roiDetailItem}>
              <Text style={styles.roiDetailLabel}>Income</Text>
              <Text style={styles.roiDetailValue}>${analytics.totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.roiDetailItem}>
              <Text style={styles.roiDetailLabel}>Expenses</Text>
              <Text style={styles.roiDetailValue}>${analytics.totalExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Egg Production Trends</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Production History</Text>
            <TouchableOpacity onPress={() => toggleChart('production')} style={styles.eyeButton}>
              {hiddenCharts.has('production') ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
          {!hiddenCharts.has('production') && (
            <>
              <View style={styles.barChart}>
                {analytics.months.map((month) => {
                  const yearData = analytics.monthlyEggsByYear[month] || {};
                  
                  return (
                    <View key={month} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        {analytics.sortedYears.map((year) => {
                          const count = yearData[year] || 0;
                          if (count === 0) return null;
                          const barHeight = (count / analytics.maxMonthlyEggs) * 120;
                          return (
                            <View 
                              key={year}
                              style={[
                                styles.bar, 
                                { 
                                  height: Math.max(4, barHeight),
                                  backgroundColor: analytics.yearColors[year]
                                }
                              ]} 
                            />
                          );
                        })}
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                        {new Date(`2024-${month}-15`).toLocaleDateString('en', { month: 'short', timeZone: 'UTC' }).toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {analytics.sortedYears.length > 0 && (
                <View style={styles.legend}>
                  {analytics.sortedYears.map((year) => (
                    <View key={year} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: analytics.yearColors[year] }]} />
                      <Text style={[styles.legendText, { color: colors.textMuted }]}>{year}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Egg size={20} color="#f59e0b" />
            <Text style={[styles.statValue, { color: colors.text }]}>{analytics.totalEggs}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Eggs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrendingUp size={20} color="#10b981" />
            <Text style={[styles.statValue, { color: colors.text }]}>{analytics.avgEggsPerDay7d.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg/Day (7d)</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrendingUp size={20} color="#3b82f6" />
            <Text style={[styles.statValue, { color: colors.text }]}>{analytics.avgEggsPerMonth.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg/Month</Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>{analytics.totalMonths} months</Text>
          </View>
        </View>


      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Seasonal Production</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Seasonal Breakdown</Text>
            <TouchableOpacity onPress={() => toggleChart('seasonal')} style={styles.eyeButton}>
              {hiddenCharts.has('seasonal') ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
          {!hiddenCharts.has('seasonal') && (
            <View style={styles.seasonalChart}>
              {Object.entries(analytics.seasonalEggs).map(([season, count]) => (
                <View key={season} style={styles.seasonItem}>
                  <View style={styles.seasonHeader}>
                    <Text style={[styles.seasonName, { color: colors.text }]}>
                      {season.charAt(0).toUpperCase() + season.slice(1)}
                    </Text>
                    <Text style={[styles.seasonCount, { color: colors.text }]}>{count} eggs</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.card }]}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${(count / maxSeasonalEggs) * 100}%` },
                        season === 'spring' && styles.springBar,
                        season === 'summer' && styles.summerBar,
                        season === 'fall' && styles.fallBar,
                        season === 'winter' && styles.winterBar,
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  roiCard: {
    borderRadius: 16,
    padding: 20,
  },
  roiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  roiTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  roiAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },
  negativeAmount: {
    color: "#fca5a5",
  },
  roiPercentage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  roiDetails: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  roiDetailItem: {
    flex: 1,
  },
  roiDetailLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  roiDetailValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  eyeButton: {
    padding: 4,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 150,
    gap: 4,
    justifyContent: "space-between",
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  barWrapper: {
    width: "100%",
    flexDirection: "row",
    gap: 1,
    alignItems: "flex-end",
  },
  bar: {
    borderRadius: 2,
    minHeight: 4,
    flex: 1,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  seasonalChart: {
    gap: 16,
  },
  seasonItem: {
    gap: 8,
  },
  seasonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seasonName: {
    fontSize: 14,
    fontWeight: "500",
  },
  seasonCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  springBar: {
    backgroundColor: "#86efac",
  },
  summerBar: {
    backgroundColor: "#fbbf24",
  },
  fallBar: {
    backgroundColor: "#fb923c",
  },
  winterBar: {
    backgroundColor: "#93c5fd",
  },
  bottomSpacing: {
    height: 20,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
