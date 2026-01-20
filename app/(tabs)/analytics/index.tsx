import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { TrendingUp, DollarSign, Egg, Eye, EyeOff } from "lucide-react-native";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Svg, { Polyline, Circle, Line as SvgLine, Rect, Text as SvgText } from "react-native-svg";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

export default function AnalyticsScreen() {
  const { eggProduction, expenses, income, getChickenCountOnDate } = useLivestock();
  const { settings } = useAppSettings();
  const { colors } = useTheme();
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
    
    // Calculate egg consumption savings
    let totalSold = 0;
    let totalLaid = 0;
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

    const monthlyEggsByYear: { [monthKey: string]: { [year: string]: number } } = {};
    const seasonalEggs = { spring: 0, summer: 0, fall: 0, winter: 0 };
    
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
    let dozenPerWeek = 0;
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
      
      // Calculate dozen per week (last 4 weeks average)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const last4WeeksEggs = eggProduction
        .filter(e => {
          const recordDate = new Date(e.date);
          return recordDate >= fourWeeksAgo;
        })
        .reduce((sum, e) => sum + e.count, 0);
      dozenPerWeek = (last4WeeksEggs / 12) / 4; // Convert to dozen, then divide by 4 weeks
    }

    const totalsByDate = new Map<string, number>();
    eggProduction.forEach(record => {
      const key = record.date;
      totalsByDate.set(key, (totalsByDate.get(key) ?? 0) + record.count);
    });

    let dailyEggHistory: { date: string; total: number }[] = [];
    if (eggProduction.length > 0) {
      const sortedRecords = [...eggProduction].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const start = new Date(sortedRecords[0].date + "T00:00:00");
      const end = new Date(sortedRecords[sortedRecords.length - 1].date + "T00:00:00");

      for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor.setDate(cursor.getDate() + 1)) {
        const iso = cursor.toISOString().split("T")[0];
        dailyEggHistory.push({
          date: iso,
          total: totalsByDate.get(iso) ?? 0,
        });
      }
    }

    const maxDailyEggs = dailyEggHistory.reduce((max, day) => Math.max(max, day.total), 0);

    let eggsPerChickenHistory: { date: string; perChicken: number }[] = [];
    if (dailyEggHistory.length > 0) {
      eggsPerChickenHistory = dailyEggHistory.map(day => {
        const chickenCount = getChickenCountOnDate(day.date);
        const perChicken = chickenCount > 0 ? day.total / chickenCount : 0;
        return {
          date: day.date,
          perChicken,
        };
      });
    }

    const maxEggsPerChicken = eggsPerChickenHistory.reduce((max, day) => Math.max(max, day.perChicken), 0);

    // Calculate eggs per chicken per month
    const monthlyEggsPerChicken: { [monthKey: string]: { [year: string]: number } } = {};
    const monthlyChickenCounts: { [monthKey: string]: { [year: string]: number } } = {};
    
    eggProduction.forEach(record => {
      const date = new Date(record.date);
      const year = date.getFullYear().toString();
      const monthNum = date.getMonth() + 1;
      const monthKey = String(monthNum).padStart(2, '0');
      
      const chickenCount = getChickenCountOnDate(record.date);
      
      if (!monthlyEggsPerChicken[monthKey]) {
        monthlyEggsPerChicken[monthKey] = {};
        monthlyChickenCounts[monthKey] = {};
      }
      
      monthlyEggsPerChicken[monthKey][year] = (monthlyEggsPerChicken[monthKey][year] || 0) + record.count;
      
      // Track chicken count (we'll average it later)
      if (!monthlyChickenCounts[monthKey][year]) {
        monthlyChickenCounts[monthKey][year] = chickenCount;
      }
    });

    // Calculate average eggs per chicken per month
    let maxMonthlyEggsPerChicken = 1;
    Object.keys(monthlyEggsPerChicken).forEach(month => {
      Object.keys(monthlyEggsPerChicken[month]).forEach(year => {
        const totalEggs = monthlyEggsPerChicken[month][year];
        const avgChickens = monthlyChickenCounts[month][year];
        const perChicken = avgChickens > 0 ? totalEggs / avgChickens : 0;
        monthlyEggsPerChicken[month][year] = perChicken;
        if (perChicken > maxMonthlyEggsPerChicken) {
          maxMonthlyEggsPerChicken = perChicken;
        }
      });
    });

    return {
      totalExpenses,
      totalIncome,
      totalIncomeWithSavings,
      consumptionSavings,
      eggsConsumed,
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
      dozenPerWeek,
      totalEggs: eggProduction.reduce((sum, e) => sum + e.count, 0),
      totalSold,
      totalLaid,
      totalBroken,
      totalDonated,
      eggsConsumed,
      dailyEggHistory,
      maxDailyEggs,
      eggsPerChickenHistory,
      maxEggsPerChicken,
      monthlyEggsPerChicken,
      maxMonthlyEggsPerChicken,
    };
  }, [eggProduction, expenses, income, getChickenCountOnDate, settings.eggsOnHand, settings.eggValuePerDozen]);

  const BASE_DAY_WIDTH = 32;
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;
  const VIEWPORT_WIDTH = 350; // Approximate chart width

  const chartScrollRef = useRef<ScrollView | null>(null);
  const chartData = analytics.dailyEggHistory;
  const chartMaxValue = Math.max(analytics.maxDailyEggs, 1);
  const chartHeight = 200;
  const chartPadding = 24;
  const yAxisWidth = 40;
  const yAxisSteps = 5;
  const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    return Math.round((chartMaxValue / yAxisSteps) * (yAxisSteps - i));
  });

  const perChickenScrollRef = useRef<ScrollView | null>(null);
  const perChickenData = analytics.eggsPerChickenHistory;
  const perChickenMaxValue = Math.max(analytics.maxEggsPerChicken, 1);
  const perChickenYAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    return ((perChickenMaxValue / yAxisSteps) * (yAxisSteps - i)).toFixed(2);
  });
  const perChickenInitialZoom = useMemo(() => {
    const days = Math.max(perChickenData.length, 30);
    const requiredWidth = days * BASE_DAY_WIDTH;
    if (requiredWidth > VIEWPORT_WIDTH) {
      return Math.max(MIN_ZOOM, VIEWPORT_WIDTH / requiredWidth);
    }
    return 1;
  }, [perChickenData.length]);

  const [perChickenZoom, setPerChickenZoom] = useState(perChickenInitialZoom);
  const perChickenZoomAnchorRef = useRef(perChickenInitialZoom);

  useEffect(() => {
    setPerChickenZoom(perChickenInitialZoom);
    perChickenZoomAnchorRef.current = perChickenInitialZoom;
  }, [perChickenInitialZoom]);
  const perChickenDayWidth = BASE_DAY_WIDTH * perChickenZoom;
  const perChickenContentWidth = Math.max(perChickenData.length, 30) * perChickenDayWidth;
  const perChickenHighlightWidth = Math.min(perChickenData.length, 30) * perChickenDayWidth;
  const perChickenHighlightX = chartPadding + Math.max(0, perChickenContentWidth - perChickenHighlightWidth);
  const perChickenLabelInterval = Math.max(1, Math.floor(30 / 10));
  const perChickenGridInterval = Math.max(1, Math.floor(perChickenData.length / 12));
  const last30DaysPerChicken = perChickenData.slice(-30);
  const last30DayTotalPerChicken = last30DaysPerChicken.reduce((sum, day) => sum + day.perChicken, 0);
  const last30DayAveragePerChicken = last30DaysPerChicken.length > 0 ? last30DayTotalPerChicken / last30DaysPerChicken.length : 0;

  const initialZoom = useMemo(() => {
    const days = Math.max(chartData.length, 30);
    const requiredWidth = days * BASE_DAY_WIDTH;
    if (requiredWidth > VIEWPORT_WIDTH) {
      return Math.max(MIN_ZOOM, VIEWPORT_WIDTH / requiredWidth);
    }
    return 1;
  }, [chartData.length]);

  const [zoomScale, setZoomScale] = useState(initialZoom);
  const zoomAnchorRef = useRef(initialZoom);

  useEffect(() => {
    setZoomScale(initialZoom);
    zoomAnchorRef.current = initialZoom;
  }, [initialZoom]);

  const dayWidth = BASE_DAY_WIDTH * zoomScale;
  const chartContentWidth = Math.max(chartData.length, 30) * dayWidth;
  const highlightWidth = Math.min(chartData.length, 30) * dayWidth;
  const highlightX = chartPadding + Math.max(0, chartContentWidth - highlightWidth);
  const labelInterval = Math.max(1, Math.floor(30 / 10));
  const gridInterval = Math.max(1, Math.floor(chartData.length / 12));
  const last30DaysData = chartData.slice(-30);
  const last30DayTotal = last30DaysData.reduce((sum, day) => sum + day.total, 0);
  const last30DayAverage = last30DaysData.length > 0 ? last30DayTotal / last30DaysData.length : 0;

  useEffect(() => {
    if (chartData.length === 0) return;
    const timeout = setTimeout(() => {
      chartScrollRef.current?.scrollToEnd({ animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [chartData.length]);

  useEffect(() => {
    if (perChickenData.length === 0) return;
    const timeout = setTimeout(() => {
      perChickenScrollRef.current?.scrollToEnd({ animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [perChickenData.length]);

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const handlePinchGesture = useCallback(
    (event: any) => {
      const { scale } = event.nativeEvent;
      const nextScale = clampZoom(zoomAnchorRef.current * scale);
      setZoomScale(nextScale);
    },
    [clampZoom]
  );

  const handlePinchStateChange = useCallback(
    (event: any) => {
      const { state, scale } = event.nativeEvent;
      if (state === State.BEGAN) {
        zoomAnchorRef.current = zoomScale;
      }
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        zoomAnchorRef.current = clampZoom(zoomAnchorRef.current * scale);
        setZoomScale(zoomAnchorRef.current);
      }
    },
    [zoomScale, clampZoom]
  );

  const handlePerChickenPinchGesture = useCallback(
    (event: any) => {
      const { scale } = event.nativeEvent;
      const nextScale = clampZoom(perChickenZoomAnchorRef.current * scale);
      setPerChickenZoom(nextScale);
    },
    [clampZoom]
  );

  const handlePerChickenPinchStateChange = useCallback(
    (event: any) => {
      const { state, scale } = event.nativeEvent;
      if (state === State.BEGAN) {
        perChickenZoomAnchorRef.current = perChickenZoom;
      }
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        perChickenZoomAnchorRef.current = clampZoom(perChickenZoomAnchorRef.current * scale);
        setPerChickenZoom(perChickenZoomAnchorRef.current);
      }
    },
    [perChickenZoom, clampZoom]
  );

  const getPointCoordinates = useCallback(
    (value: number, index: number, maxValue: number, width: number) => {
      const x = chartPadding + index * width + width / 2;
      const normalized = maxValue === 0 ? 0 : value / maxValue;
      const usableHeight = chartHeight - chartPadding * 2;
      const y = chartPadding + (1 - normalized) * usableHeight;
      return { x, y };
    },
    [chartPadding, chartHeight]
  );

  const linePoints = chartData
    .map((day, index) => {
      const { x, y } = getPointCoordinates(day.total, index, chartMaxValue, dayWidth);
      return `${x},${y}`;
    })
    .join(" ");

  const latestPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const latestPointCoords = latestPoint
    ? (() => {
        const idx = chartData.length - 1;
        return getPointCoordinates(latestPoint.total, idx, chartMaxValue, dayWidth);
      })()
    : null;

  const perChickenLinePoints = perChickenData
    .map((day, index) => {
      const { x, y } = getPointCoordinates(day.perChicken, index, perChickenMaxValue, perChickenDayWidth);
      return `${x},${y}`;
    })
    .join(" ");

  const perChickenLatestPoint = perChickenData.length > 0 ? perChickenData[perChickenData.length - 1] : null;
  const perChickenLatestPointCoords = perChickenLatestPoint
    ? (() => {
        const idx = perChickenData.length - 1;
        return getPointCoordinates(perChickenLatestPoint.perChicken, idx, perChickenMaxValue, perChickenDayWidth);
      })()
    : null;

  const maxSeasonalEggs = Math.max(...Object.values(analytics.seasonalEggs), 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Overview</Text>
        <View style={[styles.roiCard, { backgroundColor: colors.primary }]}>
          <View style={styles.roiHeader}>
            <DollarSign size={24} color="#fff" />
            <Text style={styles.roiTitle}>Return on Investment</Text>
          </View>
          <Text style={[styles.roiAmount, analytics.roi < 0 && styles.negativeAmount]} numberOfLines={1} adjustsFontSizeToFit>
            {analytics.roi >= 0 ? '+' : ''}${Math.abs(Math.round(analytics.roi)).toLocaleString()}
          </Text>
          <Text style={styles.roiPercentage}>
            {analytics.roiPercentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.roiPercentage).toFixed(1)}% ROI
          </Text>
          <View style={styles.roiDetails}>
            <View style={styles.roiDetailItem}>
              <Text style={styles.roiDetailLabel}>Income (Sales)</Text>
              <Text style={styles.roiDetailValue} numberOfLines={1} adjustsFontSizeToFit>${Math.round(analytics.totalIncome).toLocaleString()}</Text>
            </View>
            <View style={styles.roiDetailItem}>
              <Text style={styles.roiDetailLabel}>Egg Savings</Text>
              <Text style={styles.roiDetailValue} numberOfLines={1} adjustsFontSizeToFit>${Math.round(analytics.consumptionSavings).toLocaleString()}</Text>
            </View>
            <View style={styles.roiDetailItem}>
              <Text style={styles.roiDetailLabel}>Total Income</Text>
              <Text style={styles.roiDetailValue} numberOfLines={1} adjustsFontSizeToFit>${Math.round(analytics.totalIncomeWithSavings).toLocaleString()}</Text>
            </View>
            <View style={styles.roiDetailItem}>
              <Text style={styles.roiDetailLabel}>Expenses</Text>
              <Text style={styles.roiDetailValue} numberOfLines={1} adjustsFontSizeToFit>${Math.round(analytics.totalExpenses).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Egg Production Trends</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Daily Production</Text>
            <TouchableOpacity onPress={() => toggleChart('daily')} style={styles.eyeButton}>
              {hiddenCharts.has('daily') ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
          {!hiddenCharts.has('daily') && (
            <>
              {chartData.length === 0 ? (
                <View style={styles.chartEmptyState}>
                  <Egg size={24} color={colors.textMuted} />
                  <Text style={[styles.chartEmptyText, { color: colors.textMuted }]}>Log egg collections to unlock daily production insights.</Text>
                </View>
              ) : (
                <View style={styles.lineChartContainer}>
                  <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>Pinch to zoom · last 30 days highlighted</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Svg width={yAxisWidth} height={chartHeight} style={{ position: 'absolute', left: 0, zIndex: 1 }}>
                      {yAxisValues.map((value, index) => {
                        const y = chartPadding + ((chartHeight - chartPadding * 2) / yAxisSteps) * index;
                        return (
                          <SvgText
                            key={`yaxis-${index}`}
                            x={yAxisWidth - 8}
                            y={y + 4}
                            fill={colors.text}
                            fontSize={11}
                            fontWeight="600"
                            textAnchor="end"
                          >
                            {value}
                          </SvgText>
                        );
                      })}
                      <SvgLine
                        x1={yAxisWidth}
                        y1={chartPadding}
                        x2={yAxisWidth}
                        y2={chartHeight - chartPadding}
                        stroke={colors.border}
                        strokeWidth={1}
                        opacity={0.3}
                      />
                    </Svg>
                    <PinchGestureHandler onGestureEvent={handlePinchGesture} onHandlerStateChange={handlePinchStateChange}>
                      <ScrollView
                        ref={chartScrollRef}
                        horizontal
                        scrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.chartScrollContent, { width: chartContentWidth + chartPadding * 2, paddingLeft: yAxisWidth }]}
                      >
                        <Svg width={chartContentWidth + chartPadding * 2} height={chartHeight}>
                        {highlightWidth > 0 && (
                          <Rect
                            x={highlightX}
                            y={chartPadding}
                            width={highlightWidth}
                            height={chartHeight - chartPadding * 2}
                            fill={colors.primary}
                            opacity={0.08}
                            rx={12}
                          />
                        )}
                        {yAxisValues.map((_, index) => {
                          const y = chartPadding + ((chartHeight - chartPadding * 2) / yAxisSteps) * index;
                          return (
                            <SvgLine
                              key={`ygrid-${index}`}
                              x1={chartPadding}
                              y1={y}
                              x2={chartPadding + chartContentWidth}
                              y2={y}
                              stroke={colors.border}
                              strokeWidth={1}
                              opacity={0.1}
                            />
                          );
                        })}
                        {chartData.map((_, index) => {
                          if (index % gridInterval !== 0) return null;
                          const x = chartPadding + index * dayWidth + dayWidth / 2;
                          return (
                            <SvgLine
                              key={`grid-${index}`}
                              x1={x}
                              y1={chartPadding}
                              x2={x}
                              y2={chartHeight - chartPadding}
                              stroke={colors.border}
                              strokeWidth={1}
                              opacity={0.15}
                            />
                          );
                        })}
                        <SvgLine
                          x1={chartPadding}
                          y1={chartHeight - chartPadding}
                          x2={chartPadding + chartContentWidth}
                          y2={chartHeight - chartPadding}
                          stroke={colors.border}
                          strokeWidth={1}
                          opacity={0.3}
                        />
                        {linePoints.length > 0 && (
                          <Polyline points={linePoints} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                        )}
                        {chartData.map((day, index) => {
                          if (index < chartData.length - 30) return null;
                          const { x, y } = getPointCoordinates(day.total, index, chartMaxValue, dayWidth);
                          return <Circle key={`point-${day.date}`} cx={x} cy={y} r={3.5} fill={colors.surface} stroke={colors.primary} strokeWidth={2} />;
                        })}
                        {latestPointCoords && <Circle cx={latestPointCoords.x} cy={latestPointCoords.y} r={5.5} fill={colors.primary} stroke="#ffffff" strokeWidth={2} />}
                        {chartData.map((day, index) => {
                          if (index % 3 !== 0 && index !== chartData.length - 1) return null;
                          const x = chartPadding + index * dayWidth + dayWidth / 2;
                          const date = new Date(day.date + "T00:00:00");
                          const label = `${date.getMonth() + 1}/${date.getDate()}`;
                          return (
                            <SvgText key={`label-${day.date}`} x={x} y={chartHeight - chartPadding + 16} fill={colors.textMuted} fontSize={10} textAnchor="middle">
                              {label}
                            </SvgText>
                          );
                        })}
                      </Svg>
                    </ScrollView>
                  </PinchGestureHandler>
                  </View>
                  <View style={[styles.chartSummary, { borderTopColor: colors.border }]}>
                    <View style={styles.chartSummaryItem}>
                      <Text style={[styles.chartSummaryLabel, { color: colors.textMuted }]}>Last 30 days</Text>
                      <Text style={[styles.chartSummaryValue, { color: colors.text }]}>{last30DayTotal}</Text>
                    </View>
                    <View style={[styles.chartSummaryDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.chartSummaryItem}>
                      <Text style={[styles.chartSummaryLabel, { color: colors.textMuted }]}>Avg / day</Text>
                      <Text style={[styles.chartSummaryValue, { color: colors.text }]}>{last30DayAverage.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Eggs per Chicken per Month</Text>
            <TouchableOpacity onPress={() => toggleChart('perChicken')} style={styles.eyeButton}>
              {hiddenCharts.has('perChicken') ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
          {!hiddenCharts.has('perChicken') && (
            <>
              {Object.keys(analytics.monthlyEggsPerChicken).length === 0 ? (
                <View style={styles.chartEmptyState}>
                  <Egg size={24} color={colors.textMuted} />
                  <Text style={[styles.chartEmptyText, { color: colors.textMuted }]}>Log egg collections and chicken events to see per-chicken productivity.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.barChartContainer}>
                    <View style={styles.yAxis}>
                      <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>
                        {Math.round(analytics.maxMonthlyEggsPerChicken)}
                      </Text>
                      <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>
                        {Math.round(analytics.maxMonthlyEggsPerChicken / 2)}
                      </Text>
                      <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>0</Text>
                    </View>
                    <View style={styles.barChart}>
                      {analytics.months.map((month) => {
                        const yearData = analytics.monthlyEggsPerChicken[month] || {};

                        return (
                          <View key={month} style={styles.barContainer}>
                            <View style={styles.barWrapper}>
                              {analytics.sortedYears.map((year) => {
                                const perChicken = yearData[year] || 0;
                                if (perChicken === 0) return null;
                                const barHeight = (perChicken / analytics.maxMonthlyEggsPerChicken) * 120;
                                return (
                                  <View
                                    key={year}
                                    style={[
                                      styles.bar,
                                      {
                                        height: Math.max(4, barHeight),
                                        backgroundColor: analytics.yearColors[year],
                                      },
                                    ]}
                                  />
                                );
                              })}
                            </View>
                            <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                              {month}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
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
            </>
          )}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Production Comparison</Text>
            <TouchableOpacity onPress={() => toggleChart('production')} style={styles.eyeButton}>
              {hiddenCharts.has('production') ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
          {!hiddenCharts.has('production') && (
            <>
              <View style={styles.barChartContainer}>
                <View style={styles.yAxis}>
                  <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>
                    {Math.round(analytics.maxMonthlyEggs)}
                  </Text>
                  <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>
                    {Math.round(analytics.maxMonthlyEggs / 2)}
                  </Text>
                  <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>0</Text>
                </View>
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
                                    backgroundColor: analytics.yearColors[year],
                                  },
                                ]}
                              />
                            );
                          })}
                        </View>
                        <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                          {month}
                        </Text>
                      </View>
                    );
                  })}
                </View>
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
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{analytics.totalLaid}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Laid</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrendingUp size={20} color="#10b981" />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{analytics.avgEggsPerDay7d.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg/Day</Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>7 day</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrendingUp size={20} color="#3b82f6" />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{analytics.dozenPerWeek.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Doz/Wk</Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>4 wk avg</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{analytics.totalBroken}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Broken</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{analytics.totalDonated}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Donated</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{analytics.eggsConsumed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consumed</Text>
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
    flexShrink: 1,
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
    flexShrink: 1,
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
  chartSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  eyeButton: {
    padding: 4,
  },
  barChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  yAxis: {
    height: 150,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 4,
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 150,
    gap: 4,
    justifyContent: "space-between",
    flex: 1,
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
  lineChartContainer: {
    gap: 16,
  },
  chartScrollContent: {
    paddingBottom: 12,
  },
  chartSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chartSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  chartSummaryLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chartSummaryValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  chartSummaryDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  chartEmptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  chartEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
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


