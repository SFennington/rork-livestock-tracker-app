import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLivestock, useRabbitBreeding, useRabbitHealth } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { Egg, Heart, DollarSign, TrendingUp, Plus, Calendar, Bird, AlertTriangle, Baby, Syringe, Rabbit, Mic } from "lucide-react-native";
import { router } from "expo-router";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const { chickens, rabbits, eggProduction, breedingRecords, expenses, income, isLoading } = useLivestock();
  const { upcomingKindlings, activeBreedings } = useRabbitBreeding();
  const { dueVaccinations } = useRabbitHealth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEggs = eggProduction.filter(e => e.date === today).reduce((sum, e) => sum + e.count, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const activeBreedings = breedingRecords.filter(b => b.status === 'bred').length;
    const activeChickens = chickens.filter(c => c.status === 'active').reduce((sum, c) => sum + c.quantity, 0);
    const activeRabbits = rabbits.filter(r => r.status === 'active').reduce((sum, r) => sum + r.quantity, 0);
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentEggs = eggProduction
      .filter(e => new Date(e.date) >= last30Days)
      .reduce((sum, e) => sum + e.count, 0);
    
    return {
      todayEggs,
      totalExpenses,
      totalIncome,
      profit: totalIncome - totalExpenses,
      activeBreedings,
      activeChickens,
      activeRabbits,
      recentEggs,
      avgEggsPerDay: recentEggs / 30,
    };
  }, [chickens, rabbits, eggProduction, breedingRecords, expenses, income]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome back!</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Alerts Section */}
      {(upcomingKindlings.length > 0 || dueVaccinations.length > 0) && (
        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={[styles.alertTitle, { color: colors.warning }]}>Urgent Reminders</Text>
          </View>
          
          {upcomingKindlings.length > 0 && (
            <TouchableOpacity 
              style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.warning }]}
              onPress={() => router.push('/breeding-calendar')}
            >
              <Baby size={20} color={colors.warning} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertText, { color: colors.text }]}>
                  {upcomingKindlings.length} Kindling{upcomingKindlings.length > 1 ? 's' : ''} Due Soon
                </Text>
                <Text style={[styles.alertSubtext, { color: colors.textMuted }]}>Next 7 days - Tap to view</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {dueVaccinations.length > 0 && (
            <TouchableOpacity 
              style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.error }]}
              onPress={() => router.push('/rabbit-health')}
            >
              <Syringe size={20} color={colors.error} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertText, { color: colors.text }]}>
                  {dueVaccinations.length} Vaccination{dueVaccinations.length > 1 ? 's' : ''} Due
                </Text>
                <Text style={[styles.alertSubtext, { color: colors.textMuted }]}>Health checkups needed</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.quickActions}>
        <View style={[styles.actionButton, styles.disabledButton, { backgroundColor: colors.textMuted }]}>
          <Mic size={20} color="#fff" />
          <Text style={styles.actionText}>Voice Log</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/log-eggs')}>
          <Egg size={20} color="#fff" />
          <Text style={styles.actionText}>Log Eggs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={() => router.push('/add-breeding')}>
          <Heart size={20} color="#fff" />
          <Text style={styles.actionText}>Breeding</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/add-expense')}>
          <DollarSign size={20} color="#fff" />
          <Text style={styles.actionText}>Finance</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
          <View style={styles.statHeader}>
            <Egg size={24} color="#fff" />
            <Text style={styles.statValue}>{stats.todayEggs}</Text>
          </View>
          <Text style={styles.statLabel}>Eggs Today</Text>
          <Text style={styles.statSubtext}>Avg: {stats.avgEggsPerDay.toFixed(1)}/day</Text>
        </View>

        <TouchableOpacity testID="stat-active-breedings" style={[styles.statCard, { backgroundColor: colors.secondary }]} onPress={() => router.push('/breeding-calendar')}>
          <View style={styles.statHeader}>
            <Heart size={24} color="#fff" />
            <Text style={styles.statValue}>{activeBreedings.length}</Text>
          </View>
          <Text style={styles.statLabel}>Active Breedings</Text>
          <Text style={styles.statSubtext}>
            {upcomingKindlings.length > 0 ? `${upcomingKindlings.length} due soon` : 'In progress'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
          <View style={styles.statHeader}>
            <TrendingUp size={24} color="#fff" />
            <Text style={[styles.statValue, stats.profit < 0 && { color: '#fca5a5' }]}>
              ${Math.abs(stats.profit).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.statLabel}>{stats.profit >= 0 ? 'Profit' : 'Loss'}</Text>
          <Text style={styles.statSubtext}>All time</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Bird size={24} color={colors.text} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.activeChickens + stats.activeRabbits}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.text }]}>Total Livestock</Text>
          <Text style={[styles.statSubtext, { color: colors.textMuted }]}>
            {stats.activeChickens} chickens, {stats.activeRabbits} rabbits
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {eggProduction.length === 0 && breedingRecords.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Calendar size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No recent activity</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Start by adding livestock and logging daily activities</Text>
          </View>
        ) : (
          <View style={[styles.activityList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[...eggProduction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map((egg) => (
              <View key={egg.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                <Egg size={20} color={colors.accent} />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityText, { color: colors.text }]}>{egg.count} eggs collected</Text>
                  <Text style={[styles.activityDate, { color: colors.textMuted }]}>{new Date(egg.date).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
            {[...breedingRecords].sort((a, b) => new Date(b.breedingDate).getTime() - new Date(a.breedingDate).getTime()).slice(0, 2).map((breeding) => {
              const buck = rabbits.find(r => r.id === breeding.buckId);
              const doe = rabbits.find(r => r.id === breeding.doeId);
              return (
                <View key={breeding.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                  <Heart size={20} color={colors.secondary} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, { color: colors.text }]}>
                      {buck?.name || 'Unknown'} × {doe?.name || 'Unknown'}
                    </Text>
                    <Text style={[styles.activityDate, { color: colors.textMuted }]}>
                      Status: {breeding.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

        <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  date: {
    fontSize: 13,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  disabledButton: {
    opacity: 0.6,
    position: "relative",
  },
  comingSoonBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700" as const,
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
    padding: 12,
    borderRadius: 12,
  },
  primaryCard: {
    backgroundColor: "#f59e0b",
  },
  secondaryCard: {
    backgroundColor: "#8b5cf6",
  },
  accentCard: {
    backgroundColor: "#10b981",
  },
  neutralCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
  },
  statSubtext: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  bottomSpacing: {
    height: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  activityList: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  activityDate: {
    fontSize: 12,
    marginTop: 2,
  },
  alertsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  alertSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
});