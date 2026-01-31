import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLivestock, useRabbitBreeding, useRabbitHealth, getLocalDateString } from "@/hooks/livestock-store";
import { useFinancialStore } from "@/hooks/financial-store";
import { useTheme } from "@/hooks/theme-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { Egg, Heart, DollarSign, Calendar, Bird, AlertTriangle, Baby, Syringe, Rabbit, Plus, Minus, ShoppingCart } from "lucide-react-native";
import { router } from "expo-router";
import { useMemo, useEffect } from "react";
import EggLogChecker from "@/components/EggLogChecker";

export default function DashboardScreen() {
  const { rabbits, eggProduction, breedingRecords, expenses, income, isLoading, getAliveAnimals, chickenHistory, duckHistory } = useLivestock();
  const loadROISnapshots = useFinancialStore(state => state.loadROISnapshots);
  const { upcomingKindlings, activeBreedings } = useRabbitBreeding();
  const { dueVaccinations } = useRabbitHealth();
  const { colors } = useTheme();
  const { settings } = useAppSettings();

  useEffect(() => {
    loadROISnapshots();
  }, [loadROISnapshots]);

  const stats = useMemo(() => {
    const today = getLocalDateString();
    console.log('Today date:', today);
    console.log('Egg production records:', eggProduction.map(e => ({ date: e.date, count: e.count, laid: e.laid })));
    const todayEggs = eggProduction.filter(e => e.date === today).reduce((sum, e) => sum + e.count, 0);
    console.log('Today eggs count:', todayEggs);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const activeBreedings = breedingRecords.filter(b => b.status === 'bred').length;
    
    // Count individual animals instead of using history
    const activeChickens = getAliveAnimals('chicken').length;
    const activeDucks = getAliveAnimals('duck').length;
    const activeRabbits = rabbits.filter(r => r.status === 'active').reduce((sum, r) => sum + r.quantity, 0);
    
    // Count roosters, hens, and chicks from individual animals
    const aliveChickens = getAliveAnimals('chicken');
    const roosters = aliveChickens.filter(a => a.sex === 'M' && (!a.stage || a.stage === 'mature')).length;
    const hens = aliveChickens.filter(a => a.sex === 'F' && (!a.stage || a.stage === 'mature')).length;
    const chicks = aliveChickens.filter(a => a.stage === 'chick').length;
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentEggsRecords = eggProduction.filter(e => new Date(e.date) >= last30Days);
    const recentEggs = recentEggsRecords.reduce((sum, e) => sum + e.count, 0);
    
    // Calculate actual number of unique days with egg data in the last 30 days
    const uniqueDates = new Set(recentEggsRecords.map(e => e.date));
    const actualDaysForAvg = uniqueDates.size;
    
    let totalLaid = 0;
    let totalSold = 0;
    let totalBroken = 0;
    let totalDonated = 0;
    
    // Get sold and donated from income records (quantity already in eggs)
    income.forEach(record => {
      if (record.type === 'eggs' && record.quantity) {
        if (record.amount === 0) {
          totalDonated += record.quantity;
        } else {
          totalSold += record.quantity;
        }
      }
    });
    
    eggProduction.forEach(record => {
      totalLaid += record.laid || record.count;
      totalBroken += record.broken || 0;
    });
    
    const eggsConsumed = totalLaid - totalSold - settings.eggsOnHand - totalBroken - totalDonated;
    const consumptionSavings = (eggsConsumed / 12) * settings.eggValuePerDozen;
    const totalIncomeWithSavings = totalIncome + consumptionSavings;
    const roi = totalIncomeWithSavings - totalExpenses;
    const roiPercentage = totalExpenses > 0 ? ((totalIncomeWithSavings - totalExpenses) / totalExpenses) * 100 : 0;
    
    // Data validation: warn if income records show more eggs than laid
    const hasDataIssue = (totalSold + totalDonated) > totalLaid;
    
    return {
      todayEggs,
      totalExpenses,
      totalIncome,
      consumptionSavings,
      totalIncomeWithSavings,
      roi,
      roiPercentage,
      profit: roi,
      activeBreedings,
      activeChickens,
      activeDucks,
      activeRabbits,
      recentEggs,
      avgEggsPerDay: actualDaysForAvg > 0 ? recentEggs / actualDaysForAvg : 0,
      avgDaysCount: actualDaysForAvg,
      roosters,
      hens,
      chicks,
      hasDataIssue,
    };
  }, [rabbits, eggProduction, breedingRecords, expenses, income, getAliveAnimals, settings]);

  // Combined activity feed with timestamps
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'egg' | 'chicken-event' | 'duck-event' | 'breeding';
      timestamp: string;
      icon: any;
      text: string;
      subtitle?: string;
      color: string;
    }> = [];

    // Add egg logs
    eggProduction.forEach(egg => {
      const timestamp = egg.timestamp || `${egg.date}T12:00:00`;
      activities.push({
        id: egg.id,
        type: 'egg',
        timestamp,
        icon: Egg,
        text: `${egg.count} eggs ${egg.laid ? 'laid' : 'collected'}${egg.broken ? `, ${egg.broken} broken` : ''}`,
        subtitle: egg.breed ? `Breed: ${egg.breed}` : undefined,
        color: colors.accent,
      });
    });

    // Add chicken events
    chickenHistory.forEach(event => {
      const timestamp = `${event.date}T12:00:00`;
      let icon = Plus;
      let text = '';
      const eventTypeObj = settings.chickenEventTypes?.find(et => et.name === event.type);
      const operation = eventTypeObj?.operation || 'add';
      
      if (operation === 'subtract') {
        icon = Minus;
      }
      
      switch (event.type) {
        case 'acquired':
          text = `Acquired ${event.quantity} chicken${event.quantity > 1 ? 's' : ''}`;
          break;
        case 'hatched':
          text = `${event.quantity} chick${event.quantity > 1 ? 's' : ''} hatched`;
          break;
        case 'sold':
          text = `Sold ${event.quantity} chicken${event.quantity > 1 ? 's' : ''}`;
          icon = ShoppingCart;
          break;
        case 'death':
          text = `${event.quantity} chicken${event.quantity > 1 ? 's' : ''} died`;
          break;
        default:
          text = `${event.type}: ${event.quantity} chicken${event.quantity > 1 ? 's' : ''}`;
      }
      
      activities.push({
        id: event.id,
        type: 'chicken-event',
        timestamp,
        icon,
        text,
        subtitle: event.breed ? `Breed: ${event.breed}` : undefined,
        color: operation === 'add' ? colors.primary : colors.error,
      });
    });

    // Add duck events
    duckHistory.forEach(event => {
      const timestamp = `${event.date}T12:00:00`;
      let icon = Plus;
      let text = '';
      
      switch (event.type) {
        case 'acquired':
          text = `Acquired ${event.quantity} duck${event.quantity > 1 ? 's' : ''}`;
          break;
        case 'death':
          text = `${event.quantity} duck${event.quantity > 1 ? 's' : ''} died`;
          icon = Minus;
          break;
        case 'sold':
          text = `Sold ${event.quantity} duck${event.quantity > 1 ? 's' : ''}`;
          icon = ShoppingCart;
          break;
        default:
          text = `${event.type}: ${event.quantity} duck${event.quantity > 1 ? 's' : ''}`;
      }
      
      activities.push({
        id: event.id,
        type: 'duck-event',
        timestamp,
        icon,
        text,
        subtitle: event.breed ? `Breed: ${event.breed}` : undefined,
        color: event.type === 'acquired' ? colors.primary : colors.error,
      });
    });

    // Add breeding records
    breedingRecords.forEach(breeding => {
      const timestamp = `${breeding.breedingDate}T12:00:00`;
      const buck = rabbits.find(r => r.id === breeding.buckId);
      const doe = rabbits.find(r => r.id === breeding.doeId);
      
      activities.push({
        id: breeding.id,
        type: 'breeding',
        timestamp,
        icon: Heart,
        text: `${buck?.name || 'Unknown'} × ${doe?.name || 'Unknown'}`,
        subtitle: `Status: ${breeding.status}`,
        color: colors.secondary,
      });
    });

    // Sort by timestamp descending (newest first) and limit to 15 items
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  }, [eggProduction, chickenHistory, duckHistory, breedingRecords, rabbits, colors, settings]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
      chicks,
      hasDataIssue,
      totalLaid,
      totalSold,
      totalDonated,
    };
  }, [rabbits, eggProduction, breedingRecords, expenses, income, getAliveAnimals, settings.eggsOnHand, settings.eggValuePerDozen]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome back!</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Alerts Section - Disabled for rabbits */}
      {false && (upcomingKindlings.length > 0 || dueVaccinations.length > 0) && (
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

      {/* Egg Log Checker */}
      {settings.enabledAnimals.chickens && <EggLogChecker />}

      <View style={styles.quickActions}>
        {settings.enabledAnimals.chickens && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={() => router.push('/log-eggs')}>
            <Egg size={20} color="#fff" />
            <Text style={styles.actionText}>Log Eggs</Text>
          </TouchableOpacity>
        )}
        {false && settings.enabledAnimals.rabbits && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={() => router.push('/add-breeding')}>
            <Heart size={20} color="#fff" />
            <Text style={styles.actionText}>Breeding</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/add-expense')}>
          <DollarSign size={20} color="#fff" />
          <Text style={styles.actionText}>Finance</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.statsGrid}>
        {settings.enabledAnimals.chickens && (
          <View style={[
            styles.statCard, 
            { backgroundColor: colors.accent },
            !settings.enabledAnimals.rabbits && { width: '48%' }
          ]}>
            <View style={styles.statHeader}>
              <Egg size={24} color="#fff" />
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{stats.todayEggs}</Text>
            </View>
            <Text style={styles.statLabel}>Eggs Today</Text>
            {stats.avgDaysCount > 0 && (
              <Text style={styles.statSubtext}>
                Avg: {stats.avgEggsPerDay.toFixed(1)}/day (Last {stats.avgDaysCount} {stats.avgDaysCount === 1 ? 'day' : 'days'})
              </Text>
            )}
          </View>
        )}

        {false && settings.enabledAnimals.rabbits && (
          <TouchableOpacity 
            testID="stat-active-breedings" 
            style={[
              styles.statCard, 
              { backgroundColor: colors.secondary },
              !settings.enabledAnimals.chickens && { width: '48%' }
            ]} 
            onPress={() => router.push('/breeding-calendar')}
          >
            <View style={styles.statHeader}>
              <Heart size={24} color="#fff" />
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{activeBreedings.length}</Text>
            </View>
            <Text style={styles.statLabel}>Active Breedings</Text>
            <Text style={styles.statSubtext}>
              {upcomingKindlings.length > 0 ? `${upcomingKindlings.length} due soon` : 'In progress'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={[
          styles.statCard, 
          { backgroundColor: colors.primary },
          (!settings.enabledAnimals.chickens || !settings.enabledAnimals.rabbits) && { width: '48%' }
        ]}>
          <View style={styles.statHeader}>
            <DollarSign size={24} color="#fff" />
            <Text style={[styles.statValue, stats.roi < 0 && { color: '#fca5a5' }]} numberOfLines={1} adjustsFontSizeToFit>
              ${Math.abs(Math.round(stats.roi)).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.statLabel}>Return on Investment</Text>
          <Text style={styles.statSubtext}>
            {stats.roiPercentage >= 0 ? '↑' : '↓'} {Math.abs(stats.roiPercentage).toFixed(1)}% ROI
          </Text>
        </View>

        <View style={[
          styles.statCard, 
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          { width: '100%' }
        ]}>
          <View style={styles.statHeader}>
            <Bird size={24} color={colors.text} />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {(settings.enabledAnimals.chickens ? stats.activeChickens : 0) + (settings.enabledAnimals.ducks ? (stats.activeDucks || 0) : 0)}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.text }]}>Total Livestock</Text>
          <Text style={[styles.statSubtext, { color: colors.textMuted }]}>
            {(() => {
              const parts = [];
              if (settings.enabledAnimals.chickens) parts.push(`${stats.activeChickens} chicken${stats.activeChickens !== 1 ? 's' : ''}`);
              if (settings.enabledAnimals.ducks) parts.push(`${stats.activeDucks || 0} duck${(stats.activeDucks || 0) !== 1 ? 's' : ''}`);
              return parts.length > 0 ? parts.join(', ') : '0 animals';
            })()}
          </Text>
          {settings.enabledAnimals.chickens && (stats.roosters > 0 || stats.hens > 0 || stats.chicks > 0) ? (
            <Text style={[styles.statSubtext, { color: colors.textMuted, marginTop: 4 }]}>
              {stats.roosters > 0 && `${stats.roosters} rooster${stats.roosters !== 1 ? 's' : ''}`}
              {stats.roosters > 0 && stats.hens > 0 && ', '}
              {stats.hens > 0 && `${stats.hens} hen${stats.hens !== 1 ? 's' : ''}`}
              {(stats.roosters > 0 || stats.hens > 0) && stats.chicks > 0 && ', '}
              {stats.chicks > 0 && `${stats.chicks} chick${stats.chicks !== 1 ? 's' : ''}`}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {recentActivity.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Calendar size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No recent activity</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Start by adding livestock and logging daily activities</Text>
          </View>
        ) : (
          <ScrollView 
            style={[styles.activityList, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: 400 }]}
            nestedScrollEnabled
          >
            {recentActivity.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <View key={activity.id} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                  <IconComponent size={20} color={activity.color} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, { color: colors.text }]}>{activity.text}</Text>
                    {activity.subtitle && (
                      <Text style={[styles.activitySubtitle, { color: colors.textMuted, fontSize: 12 }]}>
                        {activity.subtitle}
                      </Text>
                    )}
                    <Text style={[styles.activityDate, { color: colors.textMuted }]}>
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
    width: "48%",
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
    flexShrink: 1,
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
  activitySubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  roiCardCompact: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
  },
  roiHeaderCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  roiTitleCompact: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
  },
  roiAmountCompact: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  roiPercentageCompact: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  roiDetailsCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  roiDetailItemCompact: {
    flex: 1,
    alignItems: "center",
  },
  roiDetailLabelCompact: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
    textAlign: "center",
  },
  roiDetailValueCompact: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
    textAlign: "center",
  },
});